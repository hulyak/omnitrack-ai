#!/bin/bash

# Deploy OmniTrack AI to Staging Environment
# This script deploys both infrastructure and frontend to staging

set -e  # Exit on error

echo "========================================="
echo "OmniTrack AI - Staging Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}✓ AWS Account: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ AWS Region: $AWS_REGION${NC}"
echo ""

# Step 1: Deploy Infrastructure
echo "========================================="
echo "Step 1: Deploying Infrastructure"
echo "========================================="
echo ""

cd infrastructure

# Load staging environment variables
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi

# Install dependencies
echo -e "${YELLOW}Installing infrastructure dependencies...${NC}"
npm ci

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build

# Run CDK Bootstrap (if needed)
echo -e "${YELLOW}Bootstrapping CDK (if needed)...${NC}"
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION || true

# Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure stack...${NC}"
npx cdk deploy --all --require-approval never \
    --context environment=staging \
    --outputs-file cdk-outputs.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Infrastructure deployed successfully${NC}"
else
    echo -e "${RED}✗ Infrastructure deployment failed${NC}"
    exit 1
fi

# Extract outputs
if [ -f cdk-outputs.json ]; then
    echo -e "${YELLOW}Extracting stack outputs...${NC}"
    
    REST_API_URL=$(jq -r '.InfrastructureStack.RestApiUrl // empty' cdk-outputs.json)
    WS_API_URL=$(jq -r '.InfrastructureStack.WebSocketApiUrl // empty' cdk-outputs.json)
    USER_POOL_ID=$(jq -r '.InfrastructureStack.UserPoolId // empty' cdk-outputs.json)
    USER_POOL_CLIENT_ID=$(jq -r '.InfrastructureStack.UserPoolClientId // empty' cdk-outputs.json)
    
    echo -e "${GREEN}✓ REST API URL: $REST_API_URL${NC}"
    echo -e "${GREEN}✓ WebSocket URL: $WS_API_URL${NC}"
    echo -e "${GREEN}✓ User Pool ID: $USER_POOL_ID${NC}"
fi

cd ..
echo ""

# Step 2: Deploy Frontend
echo "========================================="
echo "Step 2: Deploying Frontend"
echo "========================================="
echo ""

cd frontend

# Create runtime environment file
echo -e "${YELLOW}Creating frontend environment configuration...${NC}"
cat > .env.local <<EOF
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_URL=$REST_API_URL
NEXT_PUBLIC_WS_URL=$WS_API_URL
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
NEXT_PUBLIC_ENABLE_AR_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_VOICE_INTERFACE=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
NEXT_PUBLIC_DEBUG_MODE=true
EOF

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm ci

# Build frontend
echo -e "${YELLOW}Building frontend application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..
echo ""

# Step 3: Verify Deployment
echo "========================================="
echo "Step 3: Verifying Deployment"
echo "========================================="
echo ""

echo -e "${YELLOW}Checking API Gateway health...${NC}"
if [ ! -z "$REST_API_URL" ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${REST_API_URL}auth/login" -X POST -H "Content-Type: application/json" -d '{}' || echo "000")
    if [ "$HTTP_STATUS" != "000" ]; then
        echo -e "${GREEN}✓ API Gateway is responding (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠ API Gateway health check inconclusive${NC}"
    fi
fi

echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Infrastructure deployed to staging${NC}"
echo -e "${GREEN}✓ Frontend built and ready${NC}"
echo ""
echo "Next Steps:"
echo "1. Update DNS records to point to API Gateway"
echo "2. Configure Amplify or hosting service for frontend"
echo "3. Run integration tests: npm run test:integration"
echo "4. Run E2E tests: npm run test:e2e"
echo ""
echo "API Endpoints:"
echo "  REST API: $REST_API_URL"
echo "  WebSocket: $WS_API_URL"
echo ""
echo "Cognito Configuration:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Client ID: $USER_POOL_CLIENT_ID"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
