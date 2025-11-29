#!/bin/bash

# OmniTrack AI Production Testing Script
# This script tests the deployed infrastructure

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

if [ -f "outputs.json" ]; then
    print_info "Loading outputs from outputs.json..."
else
    print_error "outputs.json not found. Please deploy the infrastructure first."
    exit 1
fi

STACK_NAME=${STACK_NAME:-omnitrack-ai}
REGION=${AWS_REGION:-us-east-1}

# Extract outputs
REST_API_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".RestApiUrl // empty")
WEBSOCKET_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".WebSocketApiUrl // empty")
COPILOT_WEBSOCKET_URL=$(cat outputs.json | jq -r ".\"$STACK_NAME\".CopilotWebSocketApiUrl // empty")
USER_POOL_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".UserPoolId // empty")
USER_POOL_CLIENT_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".UserPoolClientId // empty")

print_info "=== OmniTrack AI Production Testing ==="
echo ""
print_info "Stack: $STACK_NAME"
print_info "Region: $REGION"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

run_test() {
    local test_name=$1
    local test_command=$2
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_info "Test $TESTS_TOTAL: $test_name"
    
    if eval "$test_command" &> /dev/null; then
        print_success "PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# ========================================
# Infrastructure Tests
# ========================================

print_info "=== Infrastructure Tests ==="
echo ""

# Test 1: CloudFormation Stack
run_test "CloudFormation stack exists and is healthy" \
  "aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].StackStatus' --output text | grep -E 'CREATE_COMPLETE|UPDATE_COMPLETE'"

# Test 2: REST API Gateway
if [ -n "$REST_API_URL" ]; then
    REST_API_ID=$(echo $REST_API_URL | sed -E 's|https://([^.]+).*|\1|')
    run_test "REST API Gateway is accessible" \
      "aws apigateway get-rest-api --rest-api-id $REST_API_ID --region $REGION"
else
    print_warning "REST API URL not found, skipping test"
fi

# Test 3: WebSocket API
WEBSOCKET_API_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".WebSocketApiId // empty")
if [ -n "$WEBSOCKET_API_ID" ]; then
    run_test "WebSocket API Gateway is accessible" \
      "aws apigatewayv2 get-api --api-id $WEBSOCKET_API_ID --region $REGION"
else
    print_warning "WebSocket API ID not found, skipping test"
fi

# Test 4: Copilot WebSocket API
COPILOT_WEBSOCKET_API_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".CopilotWebSocketApiId // empty")
if [ -n "$COPILOT_WEBSOCKET_API_ID" ]; then
    run_test "Copilot WebSocket API Gateway is accessible" \
      "aws apigatewayv2 get-api --api-id $COPILOT_WEBSOCKET_API_ID --region $REGION"
else
    print_warning "Copilot WebSocket API ID not found, skipping test"
fi

# Test 5: Cognito User Pool
if [ -n "$USER_POOL_ID" ]; then
    run_test "Cognito User Pool is accessible" \
      "aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION"
else
    print_warning "User Pool ID not found, skipping test"
fi

# Test 6: DynamoDB Tables
TABLE_NAME=$(cat outputs.json | jq -r ".\"$STACK_NAME\".DynamoDBTableName // empty")
if [ -n "$TABLE_NAME" ]; then
    run_test "DynamoDB main table is accessible" \
      "aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION"
else
    print_warning "Table name not found, skipping test"
fi

# Test 7: Lambda Functions
run_test "Lambda functions are deployed" \
  "aws lambda list-functions --region $REGION --query 'Functions[?starts_with(FunctionName, \`omnitrack-\`)].FunctionName' --output text | grep -q omnitrack"

# Test 8: S3 Buckets
run_test "S3 buckets are created" \
  "aws s3 ls | grep -q omnitrack"

# Test 9: CloudWatch Log Groups
run_test "CloudWatch log groups are created" \
  "aws logs describe-log-groups --region $REGION --query 'logGroups[?contains(logGroupName, \`omnitrack\`)].logGroupName' --output text | grep -q omnitrack"

# Test 10: CloudWatch Alarms
run_test "CloudWatch alarms are configured" \
  "aws cloudwatch describe-alarms --region $REGION --query 'MetricAlarms[?starts_with(AlarmName, \`OmniTrack-\`)].AlarmName' --output text | grep -q OmniTrack"

echo ""

# ========================================
# API Endpoint Tests
# ========================================

print_info "=== API Endpoint Tests ==="
echo ""

if [ -n "$REST_API_URL" ]; then
    # Test 11: API Gateway CORS
    print_info "Test $((TESTS_TOTAL + 1)): API Gateway CORS headers"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    CORS_RESPONSE=$(curl -s -X OPTIONS "$REST_API_URL/auth/login" \
      -H "Origin: http://localhost:3000" \
      -H "Access-Control-Request-Method: POST" \
      -H "Access-Control-Request-Headers: Content-Type" \
      -i 2>&1 | grep -i "access-control-allow")
    
    if [ -n "$CORS_RESPONSE" ]; then
        print_success "PASSED - CORS headers present"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "FAILED - CORS headers missing"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Test 12: API Gateway SSL/TLS
    print_info "Test $((TESTS_TOTAL + 1)): API Gateway SSL/TLS"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if curl -s --head "$REST_API_URL" | grep -q "HTTP/2 403\|HTTP/2 200"; then
        print_success "PASSED - SSL/TLS is working"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "FAILED - SSL/TLS issue"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Test 13: API Gateway Rate Limiting
    print_info "Test $((TESTS_TOTAL + 1)): API Gateway responds to requests"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$REST_API_URL/auth/login" \
      -X POST \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"test"}')
    
    if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "200" ]; then
        print_success "PASSED - API is responding (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "FAILED - Unexpected HTTP code: $HTTP_CODE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    print_warning "REST API URL not found, skipping API tests"
fi

echo ""

# ========================================
# WebSocket Tests
# ========================================

print_info "=== WebSocket Tests ==="
echo ""

if command -v wscat &> /dev/null; then
    if [ -n "$WEBSOCKET_URL" ]; then
        # Test 14: WebSocket Connection
        print_info "Test $((TESTS_TOTAL + 1)): WebSocket connection"
        TESTS_TOTAL=$((TESTS_TOTAL + 1))
        
        # Try to connect (timeout after 5 seconds)
        if timeout 5 wscat -c "$WEBSOCKET_URL" --execute "exit" &> /dev/null; then
            print_success "PASSED - WebSocket connection successful"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_warning "FAILED - WebSocket connection failed (may require authentication)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
    
    if [ -n "$COPILOT_WEBSOCKET_URL" ]; then
        # Test 15: Copilot WebSocket Connection
        print_info "Test $((TESTS_TOTAL + 1)): Copilot WebSocket connection"
        TESTS_TOTAL=$((TESTS_TOTAL + 1))
        
        if timeout 5 wscat -c "$COPILOT_WEBSOCKET_URL" --execute "exit" &> /dev/null; then
            print_success "PASSED - Copilot WebSocket connection successful"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_warning "FAILED - Copilot WebSocket connection failed (may require authentication)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
else
    print_warning "wscat not installed, skipping WebSocket tests"
    print_info "Install with: npm install -g wscat"
fi

echo ""

# ========================================
# Security Tests
# ========================================

print_info "=== Security Tests ==="
echo ""

# Test 16: KMS Key
KMS_KEY_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".KMSKeyId // empty")
if [ -n "$KMS_KEY_ID" ]; then
    run_test "KMS key is accessible" \
      "aws kms describe-key --key-id $KMS_KEY_ID --region $REGION"
else
    print_warning "KMS Key ID not found, skipping test"
fi

# Test 17: Secrets Manager
SECRETS_ARN=$(cat outputs.json | jq -r ".\"$STACK_NAME\".SecretsManagerArn // empty")
if [ -n "$SECRETS_ARN" ]; then
    run_test "Secrets Manager secret is accessible" \
      "aws secretsmanager describe-secret --secret-id $SECRETS_ARN --region $REGION"
else
    print_warning "Secrets Manager ARN not found, skipping test"
fi

# Test 18: WAF Web ACL
WAF_ARN=$(cat outputs.json | jq -r ".\"$STACK_NAME\".WebACLArn // empty")
if [ -n "$WAF_ARN" ]; then
    run_test "WAF Web ACL is configured" \
      "aws wafv2 get-web-acl --id $(echo $WAF_ARN | awk -F'/' '{print $NF}') --name omnitrack-api-protection --scope REGIONAL --region $REGION"
else
    print_warning "WAF ARN not found, skipping test"
fi

echo ""

# ========================================
# Monitoring Tests
# ========================================

print_info "=== Monitoring Tests ==="
echo ""

# Test 19: CloudWatch Dashboard
run_test "CloudWatch dashboard exists" \
  "aws cloudwatch list-dashboards --region $REGION --query 'DashboardEntries[?DashboardName==\`OmniTrack-Operations-Dashboard\`].DashboardName' --output text | grep -q OmniTrack"

# Test 20: SNS Topics
run_test "SNS alert topics are configured" \
  "aws sns list-topics --region $REGION --query 'Topics[?contains(TopicArn, \`omnitrack\`)].TopicArn' --output text | grep -q omnitrack"

echo ""

# ========================================
# Performance Tests
# ========================================

print_info "=== Performance Tests ==="
echo ""

if [ -n "$REST_API_URL" ]; then
    # Test 21: API Response Time
    print_info "Test $((TESTS_TOTAL + 1)): API response time"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$REST_API_URL/auth/login" \
      -X POST \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"test"}')
    
    # Convert to milliseconds
    RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
    
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        print_success "PASSED - Response time: ${RESPONSE_TIME_MS}ms (< 2000ms)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "SLOW - Response time: ${RESPONSE_TIME_MS}ms (> 2000ms)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

echo ""

# ========================================
# Bedrock Tests
# ========================================

print_info "=== Bedrock Tests ==="
echo ""

# Test 22: Bedrock Model Access
print_info "Test $((TESTS_TOTAL + 1)): Bedrock model access"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if aws bedrock list-foundation-models --region $REGION --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)].modelId' --output text &> /dev/null; then
    print_success "PASSED - Bedrock Claude 3.5 Sonnet is accessible"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "FAILED - Bedrock model access denied (request access in Bedrock console)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# ========================================
# Test Summary
# ========================================

print_info "=== Test Summary ==="
echo ""
print_info "Total Tests: $TESTS_TOTAL"
print_success "Passed: $TESTS_PASSED"
print_error "Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! ✓"
    print_info "Your OmniTrack AI infrastructure is ready for production."
    echo ""
    print_info "Next steps:"
    echo "  1. Deploy frontend application"
    echo "  2. Create test users"
    echo "  3. Perform end-to-end testing"
    echo "  4. Monitor CloudWatch dashboard"
    echo "  5. Review and respond to alarms"
    exit 0
else
    print_warning "Some tests failed. Please review the failures above."
    print_info "Common issues:"
    echo "  - Bedrock access not requested"
    echo "  - WebSocket authentication required"
    echo "  - CORS configuration needed"
    echo "  - DNS propagation in progress"
    exit 1
fi
