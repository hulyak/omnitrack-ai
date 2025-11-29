#!/bin/bash

# OmniTrack AI CORS Configuration Script
# This script updates CORS settings for API Gateway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

STACK_NAME=${STACK_NAME:-omnitrack-ai}
REGION=${AWS_REGION:-us-east-1}

print_info "Configuring CORS for OmniTrack AI APIs"
echo ""

# Get API Gateway ID
print_info "Retrieving API Gateway ID..."
REST_API_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`RestApiId`].OutputValue' \
  --output text)

if [ -z "$REST_API_ID" ]; then
    print_error "Could not find REST API ID"
    exit 1
fi

print_success "Found REST API: $REST_API_ID"

# Prompt for allowed origins
echo ""
print_info "Enter allowed origins (comma-separated):"
print_info "Example: https://yourdomain.com,https://www.yourdomain.com,http://localhost:3000"
read -p "Origins: " ORIGINS_INPUT

# Convert comma-separated string to array
IFS=',' read -ra ORIGINS <<< "$ORIGINS_INPUT"

# Validate origins
for origin in "${ORIGINS[@]}"; do
    origin=$(echo "$origin" | xargs) # Trim whitespace
    if [[ ! $origin =~ ^https?:// ]]; then
        print_error "Invalid origin: $origin (must start with http:// or https://)"
        exit 1
    fi
done

print_success "Validated ${#ORIGINS[@]} origins"

# Get all resources
print_info "Retrieving API resources..."
RESOURCES=$(aws apigateway get-resources \
  --rest-api-id $REST_API_ID \
  --region $REGION \
  --query 'items[*].[id,path]' \
  --output text)

# Update CORS for each resource
print_info "Updating CORS configuration..."

while IFS=$'\t' read -r RESOURCE_ID RESOURCE_PATH; do
    print_info "Processing resource: $RESOURCE_PATH"
    
    # Check if OPTIONS method exists
    if aws apigateway get-method \
        --rest-api-id $REST_API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION &> /dev/null; then
        
        print_info "  Updating existing OPTIONS method..."
        
        # Update method response
        aws apigateway put-method-response \
          --rest-api-id $REST_API_ID \
          --resource-id $RESOURCE_ID \
          --http-method OPTIONS \
          --status-code 200 \
          --response-parameters \
            "method.response.header.Access-Control-Allow-Headers=true,\
method.response.header.Access-Control-Allow-Methods=true,\
method.response.header.Access-Control-Allow-Origin=true,\
method.response.header.Access-Control-Allow-Credentials=true" \
          --region $REGION &> /dev/null
        
        # Update integration response
        aws apigateway put-integration-response \
          --rest-api-id $REST_API_ID \
          --resource-id $RESOURCE_ID \
          --http-method OPTIONS \
          --status-code 200 \
          --response-parameters \
            "method.response.header.Access-Control-Allow-Headers='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',\
method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS',\
method.response.header.Access-Control-Allow-Origin='${ORIGINS[0]}',\
method.response.header.Access-Control-Allow-Credentials='true'" \
          --region $REGION &> /dev/null
        
        print_success "  Updated OPTIONS method"
    else
        print_info "  No OPTIONS method found, skipping..."
    fi
    
    # Update other methods (GET, POST, PUT, DELETE)
    for METHOD in GET POST PUT DELETE; do
        if aws apigateway get-method \
            --rest-api-id $REST_API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --region $REGION &> /dev/null; then
            
            print_info "  Updating $METHOD method response headers..."
            
            # Add CORS headers to method response
            aws apigateway put-method-response \
              --rest-api-id $REST_API_ID \
              --resource-id $RESOURCE_ID \
              --http-method $METHOD \
              --status-code 200 \
              --response-parameters \
                "method.response.header.Access-Control-Allow-Origin=true,\
method.response.header.Access-Control-Allow-Credentials=true" \
              --region $REGION &> /dev/null || true
            
            print_success "  Updated $METHOD method"
        fi
    done
    
done <<< "$RESOURCES"

# Create new deployment
print_info "Creating new deployment..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $REST_API_ID \
  --stage-name prod \
  --description "CORS configuration update" \
  --region $REGION \
  --query 'id' \
  --output text)

print_success "Created deployment: $DEPLOYMENT_ID"

echo ""
print_success "CORS configuration updated successfully!"
print_info "Allowed origins:"
for origin in "${ORIGINS[@]}"; do
    echo "  - $(echo $origin | xargs)"
done

echo ""
print_info "Testing CORS configuration..."
REST_API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`RestApiUrl`].OutputValue' \
  --output text)

if [ -n "$REST_API_URL" ]; then
    print_info "Testing preflight request..."
    curl -X OPTIONS "$REST_API_URL/auth/login" \
      -H "Origin: ${ORIGINS[0]}" \
      -H "Access-Control-Request-Method: POST" \
      -H "Access-Control-Request-Headers: Content-Type" \
      -v 2>&1 | grep -i "access-control" || true
fi

echo ""
print_info "CORS configuration complete!"
print_info "Note: Changes may take a few minutes to propagate."
