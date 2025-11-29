#!/bin/bash

# OmniTrack AI Infrastructure Deployment Script
# This script deploys the OmniTrack AI infrastructure using AWS CDK

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Please create a .env file with the following variables:"
    echo "  AWS_ACCOUNT_ID=your-account-id"
    echo "  AWS_REGION=us-east-1"
    echo "  ENVIRONMENT=production"
    echo "  STACK_NAME=omnitrack-ai"
    exit 1
fi

# Load environment variables
print_info "Loading environment variables from .env file..."
export $(cat .env | grep -v '^#' | xargs)

# Verify required environment variables
if [ -z "$AWS_ACCOUNT_ID" ]; then
    print_error "AWS_ACCOUNT_ID is not set in .env file"
    exit 1
fi

if [ -z "$AWS_REGION" ]; then
    print_error "AWS_REGION is not set in .env file"
    exit 1
fi

print_info "Deploying to AWS Account: $AWS_ACCOUNT_ID"
print_info "Region: $AWS_REGION"
print_info "Environment: ${ENVIRONMENT:-development}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured or invalid."
    print_info "Please run 'aws configure' to set up your credentials."
    exit 1
fi

CALLER_IDENTITY=$(aws sts get-caller-identity)
CURRENT_ACCOUNT=$(echo $CALLER_IDENTITY | jq -r '.Account')
CURRENT_USER=$(echo $CALLER_IDENTITY | jq -r '.Arn')

print_success "Authenticated as: $CURRENT_USER"
print_success "Account ID: $CURRENT_ACCOUNT"

if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    print_warning "Current AWS account ($CURRENT_ACCOUNT) does not match .env AWS_ACCOUNT_ID ($AWS_ACCOUNT_ID)"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20 or later."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
npm install

# Build TypeScript
print_info "Building TypeScript..."
npm run build

# Bootstrap CDK (if not already done)
print_info "Checking if CDK is bootstrapped..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION &> /dev/null; then
    print_warning "CDK is not bootstrapped in this account/region."
    print_info "Bootstrapping CDK..."
    npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
    print_success "CDK bootstrapped successfully!"
else
    print_success "CDK is already bootstrapped."
fi

# Synthesize CloudFormation template
print_info "Synthesizing CloudFormation template..."
npx cdk synth

# Show what will be deployed
print_info "Showing deployment diff..."
npx cdk diff

# Ask for confirmation
echo ""
print_warning "This will deploy the OmniTrack AI infrastructure to AWS."
print_warning "This may incur AWS charges."
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Deploy the stack
print_info "Deploying infrastructure..."
npx cdk deploy --require-approval never --outputs-file outputs.json

# Check if deployment was successful
if [ $? -eq 0 ]; then
    print_success "Infrastructure deployed successfully!"
    
    # Display outputs
    if [ -f "outputs.json" ]; then
        print_info "Stack outputs:"
        cat outputs.json | jq '.'
        
        # Extract important outputs
        STACK_NAME=${STACK_NAME:-omnitrack-ai}
        REST_API_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".RestApiUrl // empty")
        WEBSOCKET_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".WebSocketApiUrl // empty")
        COPILOT_WEBSOCKET_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".CopilotWebSocketApiUrl // empty")
        USER_POOL_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".UserPoolId // empty")
        USER_POOL_CLIENT_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".UserPoolClientId // empty")
        
        echo ""
        print_success "=== Deployment Summary ==="
        [ -n "$REST_API_URL" ] && echo "REST API URL: $REST_API_URL"
        [ -n "$WEBSOCKET_URL" ] && echo "WebSocket URL: $WEBSOCKET_URL"
        [ -n "$COPILOT_WEBSOCKET_URL" ] && echo "Copilot WebSocket URL: $COPILOT_WEBSOCKET_URL"
        [ -n "$USER_POOL_ID" ] && echo "User Pool ID: $USER_POOL_ID"
        [ -n "$USER_POOL_CLIENT_ID" ] && echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
        echo ""
        
        # Save outputs to .env.production
        print_info "Saving outputs to .env.production..."
        cat > .env.production << EOF
# Generated by deploy.sh on $(date)
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
AWS_REGION=$AWS_REGION
ENVIRONMENT=production

# API Endpoints
NEXT_PUBLIC_API_URL=$REST_API_URL
NEXT_PUBLIC_WEBSOCKET_URL=$WEBSOCKET_URL
NEXT_PUBLIC_COPILOT_WEBSOCKET_URL=$COPILOT_WEBSOCKET_URL

# Cognito
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
EOF
        print_success "Environment variables saved to .env.production"
    fi
    
    print_success "Deployment complete!"
    print_info "Next steps:"
    echo "  1. Update frontend/.env.production with the generated values"
    echo "  2. Deploy the frontend application"
    echo "  3. Test the deployment"
    echo "  4. Configure custom domain (optional)"
    echo "  5. Set up CloudWatch alarms and monitoring"
else
    print_error "Deployment failed!"
    exit 1
fi
