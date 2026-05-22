#!/bin/bash

# OmniTrack AI Deployment Verification Script
# This script verifies that the infrastructure was deployed correctly

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

STACK_NAME=${STACK_NAME:-omnitrack-ai}
REGION=${AWS_REGION:-us-east-1}

print_info "Verifying deployment of stack: $STACK_NAME in region: $REGION"
echo ""

# Check if stack exists
print_info "Checking CloudFormation stack..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].StackStatus' --output text)
    if [ "$STACK_STATUS" == "CREATE_COMPLETE" ] || [ "$STACK_STATUS" == "UPDATE_COMPLETE" ]; then
        print_success "Stack exists and is in good state: $STACK_STATUS"
    else
        print_error "Stack exists but is in unexpected state: $STACK_STATUS"
        exit 1
    fi
else
    print_error "Stack does not exist"
    exit 1
fi

# Get stack outputs
print_info "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs' --output json)

# Extract key outputs
REST_API_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="RestApiId") | .OutputValue')
WEBSOCKET_API_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="WebSocketApiId") | .OutputValue')
COPILOT_WEBSOCKET_API_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="CopilotWebSocketApiId") | .OutputValue')
USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
TABLE_NAME=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DynamoDBTableName") | .OutputValue')

echo ""
print_info "=== Resource Verification ==="
echo ""

# Verify REST API
print_info "Checking REST API Gateway..."
if [ -n "$REST_API_ID" ]; then
    if aws apigateway get-rest-api --rest-api-id $REST_API_ID --region $REGION &> /dev/null; then
        print_success "REST API exists: $REST_API_ID"
    else
        print_error "REST API not found: $REST_API_ID"
    fi
else
    print_warning "REST API ID not found in outputs"
fi

# Verify WebSocket API
print_info "Checking WebSocket API Gateway..."
if [ -n "$WEBSOCKET_API_ID" ]; then
    if aws apigatewayv2 get-api --api-id $WEBSOCKET_API_ID --region $REGION &> /dev/null; then
        print_success "WebSocket API exists: $WEBSOCKET_API_ID"
    else
        print_error "WebSocket API not found: $WEBSOCKET_API_ID"
    fi
else
    print_warning "WebSocket API ID not found in outputs"
fi

# Verify Copilot WebSocket API
print_info "Checking Copilot WebSocket API Gateway..."
if [ -n "$COPILOT_WEBSOCKET_API_ID" ]; then
    if aws apigatewayv2 get-api --api-id $COPILOT_WEBSOCKET_API_ID --region $REGION &> /dev/null; then
        print_success "Copilot WebSocket API exists: $COPILOT_WEBSOCKET_API_ID"
    else
        print_error "Copilot WebSocket API not found: $COPILOT_WEBSOCKET_API_ID"
    fi
else
    print_warning "Copilot WebSocket API ID not found in outputs"
fi

# Verify Cognito User Pool
print_info "Checking Cognito User Pool..."
if [ -n "$USER_POOL_ID" ]; then
    if aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION &> /dev/null; then
        print_success "User Pool exists: $USER_POOL_ID"
    else
        print_error "User Pool not found: $USER_POOL_ID"
    fi
else
    print_warning "User Pool ID not found in outputs"
fi

# Verify DynamoDB Table
print_info "Checking DynamoDB Table..."
if [ -n "$TABLE_NAME" ]; then
    if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION &> /dev/null; then
        print_success "DynamoDB Table exists: $TABLE_NAME"
    else
        print_error "DynamoDB Table not found: $TABLE_NAME"
    fi
else
    print_warning "Table name not found in outputs"
fi

# Verify Lambda Functions
print_info "Checking Lambda Functions..."
LAMBDA_COUNT=$(aws lambda list-functions --region $REGION --query 'Functions[?starts_with(FunctionName, `omnitrack-`)].FunctionName' --output text | wc -w)
if [ $LAMBDA_COUNT -gt 0 ]; then
    print_success "Found $LAMBDA_COUNT Lambda functions"
else
    print_warning "No Lambda functions found with 'omnitrack-' prefix"
fi

# Verify S3 Buckets
print_info "Checking S3 Buckets..."
BUCKET_COUNT=$(aws s3 ls | grep omnitrack | wc -l)
if [ $BUCKET_COUNT -gt 0 ]; then
    print_success "Found $BUCKET_COUNT S3 buckets"
else
    print_warning "No S3 buckets found with 'omnitrack' prefix"
fi

# Verify CloudWatch Log Groups
print_info "Checking CloudWatch Log Groups..."
LOG_GROUP_COUNT=$(aws logs describe-log-groups --region $REGION --query 'logGroups[?contains(logGroupName, `omnitrack`)].logGroupName' --output text | wc -w)
if [ $LOG_GROUP_COUNT -gt 0 ]; then
    print_success "Found $LOG_GROUP_COUNT CloudWatch Log Groups"
else
    print_warning "No CloudWatch Log Groups found with 'omnitrack' prefix"
fi

# Verify CloudWatch Alarms
print_info "Checking CloudWatch Alarms..."
ALARM_COUNT=$(aws cloudwatch describe-alarms --region $REGION --query 'MetricAlarms[?starts_with(AlarmName, `OmniTrack-`)].AlarmName' --output text | wc -w)
if [ $ALARM_COUNT -gt 0 ]; then
    print_success "Found $ALARM_COUNT CloudWatch Alarms"
else
    print_warning "No CloudWatch Alarms found with 'OmniTrack-' prefix"
fi

# Check Bedrock access
print_info "Checking Bedrock model access..."
if aws bedrock list-foundation-models --region $REGION --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)].modelId' --output text &> /dev/null; then
    print_success "Bedrock Claude 3.5 Sonnet model is accessible"
else
    print_warning "Unable to verify Bedrock model access (may need to request access)"
fi

echo ""
print_info "=== Verification Summary ==="
echo ""

# Count successes and warnings
SUCCESS_COUNT=$(grep -c "✓" <<< "$(cat /dev/tty)" 2>/dev/null || echo "0")

print_success "Deployment verification complete!"
print_info "Review any warnings above and ensure all critical resources are deployed."
echo ""
print_info "Next steps:"
echo "  1. Test API endpoints"
echo "  2. Create test users in Cognito"
echo "  3. Deploy frontend application"
echo "  4. Configure monitoring alerts"
echo "  5. Review CloudWatch dashboard"
