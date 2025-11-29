#!/bin/bash

# Verify OmniTrack AI Demo Setup for Hackathon
# This script checks that all AWS resources are properly configured for the demo

set -e

echo "========================================="
echo "OmniTrack AI - Hackathon Demo Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track verification results
PASSED=0
FAILED=0
WARNINGS=0

# Function to print check result
check_result() {
    local status=$1
    local message=$2
    
    if [ "$status" == "pass" ]; then
        echo -e "${GREEN}✓ $message${NC}"
        ((PASSED++))
    elif [ "$status" == "fail" ]; then
        echo -e "${RED}✗ $message${NC}"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠ $message${NC}"
        ((WARNINGS++))
    fi
}

# Load CDK outputs
if [ ! -f infrastructure/cdk-outputs.json ]; then
    echo -e "${RED}Error: cdk-outputs.json not found. Please deploy infrastructure first.${NC}"
    echo "Run: cd infrastructure && npm run deploy"
    exit 1
fi

cd infrastructure

REST_API_URL=$(jq -r '.InfrastructureStack.RestApiUrl // empty' cdk-outputs.json)
WS_API_URL=$(jq -r '.InfrastructureStack.WebSocketApiUrl // empty' cdk-outputs.json)
USER_POOL_ID=$(jq -r '.InfrastructureStack.UserPoolId // empty' cdk-outputs.json)
USER_POOL_CLIENT_ID=$(jq -r '.InfrastructureStack.UserPoolClientId // empty' cdk-outputs.json)
TABLE_NAME=$(jq -r '.InfrastructureStack.DynamoDBTableName // empty' cdk-outputs.json)
REDIS_ENDPOINT=$(jq -r '.InfrastructureStack.RedisClusterEndpoint // empty' cdk-outputs.json)

cd ..

echo "Verifying demo components..."
echo ""

# ============================================
# Check 1: Lambda Functions
# ============================================
echo -e "${BLUE}[1/11] Checking Lambda Functions...${NC}"

# Key Lambda functions for demo
DEMO_FUNCTIONS=(
    "omnitrack-auth-login"
    "omnitrack-auth-register"
    "omnitrack-iot-processor"
    "omnitrack-ws-connect"
    "omnitrack-ws-disconnect"
    "omnitrack-ws-message"
)

LAMBDA_FOUND=0
for func in "${DEMO_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" &> /dev/null 2>&1; then
        check_result "pass" "Lambda function: $func"
        ((LAMBDA_FOUND++))
    else
        check_result "fail" "Lambda function not found: $func"
    fi
done

if [ "$LAMBDA_FOUND" -eq "${#DEMO_FUNCTIONS[@]}" ]; then
    echo -e "${GREEN}All ${#DEMO_FUNCTIONS[@]} key Lambda functions deployed${NC}"
else
    echo -e "${YELLOW}Only $LAMBDA_FOUND/${#DEMO_FUNCTIONS[@]} Lambda functions found${NC}"
fi
echo ""

# ============================================
# Check 2: DynamoDB Tables
# ============================================
echo -e "${BLUE}[2/11] Checking DynamoDB Tables...${NC}"

if [ -z "$TABLE_NAME" ]; then
    check_result "fail" "DynamoDB table name not found in CDK outputs"
else
    if aws dynamodb describe-table --table-name "$TABLE_NAME" &> /dev/null; then
        TABLE_STATUS=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.TableStatus' --output text)
        if [ "$TABLE_STATUS" == "ACTIVE" ]; then
            check_result "pass" "DynamoDB table '$TABLE_NAME' is ACTIVE"
            
            # Check for sample data
            ITEM_COUNT=$(aws dynamodb scan --table-name "$TABLE_NAME" --select "COUNT" --query 'Count' --output text 2>/dev/null || echo "0")
            if [ "$ITEM_COUNT" -gt 0 ]; then
                check_result "pass" "DynamoDB table contains $ITEM_COUNT items (sample data present)"
            else
                check_result "warn" "DynamoDB table is empty - run seed script to add demo data"
            fi
        else
            check_result "warn" "DynamoDB table status: $TABLE_STATUS (not ACTIVE)"
        fi
    else
        check_result "fail" "DynamoDB table '$TABLE_NAME' not found"
    fi
fi
echo ""

# ============================================
# Check 3: Cognito User Pool
# ============================================
echo -e "${BLUE}[3/11] Checking Cognito User Pool...${NC}"

if [ -z "$USER_POOL_ID" ]; then
    check_result "fail" "Cognito User Pool ID not found in CDK outputs"
else
    if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" &> /dev/null; then
        check_result "pass" "Cognito User Pool exists: $USER_POOL_ID"
        
        # Check for test users
        USER_COUNT=$(aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --query 'Users | length(@)' --output text 2>/dev/null || echo "0")
        if [ "$USER_COUNT" -gt 0 ]; then
            check_result "pass" "Cognito has $USER_COUNT test users"
        else
            check_result "warn" "No test users found - create demo users for presentation"
        fi
    else
        check_result "fail" "Cognito User Pool not accessible"
    fi
fi
echo ""

# ============================================
# Check 4: API Gateway Endpoints
# ============================================
echo -e "${BLUE}[4/11] Checking API Gateway Endpoints...${NC}"

if [ -z "$REST_API_URL" ]; then
    check_result "fail" "REST API URL not found in CDK outputs"
else
    # Test health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$REST_API_URL/health" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" == "200" ]; then
        check_result "pass" "REST API accessible: $REST_API_URL"
    elif [ "$HTTP_STATUS" == "403" ] || [ "$HTTP_STATUS" == "401" ]; then
        check_result "pass" "REST API responding (auth required): $REST_API_URL"
    else
        check_result "warn" "REST API returned HTTP $HTTP_STATUS"
    fi
fi

if [ -z "$WS_API_URL" ]; then
    check_result "warn" "WebSocket API URL not found in CDK outputs"
else
    check_result "pass" "WebSocket API configured: $WS_API_URL"
fi
echo ""

# ============================================
# Check 5: Amazon Bedrock Access
# ============================================
echo -e "${BLUE}[5/11] Checking Amazon Bedrock Access...${NC}"

# Check if Bedrock is available in the region
AWS_REGION=$(aws configure get region || echo "us-east-1")
if aws bedrock list-foundation-models --region "$AWS_REGION" &> /dev/null 2>&1; then
    check_result "pass" "Bedrock API accessible in region $AWS_REGION"
    
    # Check for Claude 3 Sonnet model
    if aws bedrock list-foundation-models --region "$AWS_REGION" --query "modelSummaries[?contains(modelId, 'claude-3-sonnet')].modelId" --output text | grep -q "claude"; then
        check_result "pass" "Claude 3 Sonnet model available"
    else
        check_result "warn" "Claude 3 Sonnet model not found - check model access"
    fi
else
    check_result "fail" "Bedrock API not accessible - check IAM permissions and region"
fi
echo ""

# ============================================
# Check 6: IoT Core Configuration
# ============================================
echo -e "${BLUE}[6/11] Checking AWS IoT Core...${NC}"

if aws iot describe-endpoint --endpoint-type iot:Data-ATS &> /dev/null 2>&1; then
    IOT_ENDPOINT=$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --query 'endpointAddress' --output text)
    check_result "pass" "IoT Core endpoint: $IOT_ENDPOINT"
    
    # Check for IoT rules
    IOT_RULES=$(aws iot list-topic-rules --query 'rules[?starts_with(ruleName, `omnitrack`)].ruleName' --output text | wc -w)
    if [ "$IOT_RULES" -gt 0 ]; then
        check_result "pass" "Found $IOT_RULES IoT rules configured"
    else
        check_result "warn" "No IoT rules found with 'omnitrack' prefix"
    fi
else
    check_result "warn" "IoT Core not configured or not accessible"
fi
echo ""

# ============================================
# Check 7: Step Functions State Machines
# ============================================
echo -e "${BLUE}[7/11] Checking Step Functions...${NC}"

STATE_MACHINES=$(aws stepfunctions list-state-machines --query "stateMachines[?contains(name, 'omnitrack')].name" --output text | wc -w)
if [ "$STATE_MACHINES" -gt 0 ]; then
    check_result "pass" "Found $STATE_MACHINES Step Functions state machines"
else
    check_result "warn" "No Step Functions state machines found"
fi
echo ""

# ============================================
# Check 8: ElastiCache Redis
# ============================================
echo -e "${BLUE}[8/11] Checking ElastiCache Redis...${NC}"

if [ -z "$REDIS_ENDPOINT" ]; then
    check_result "warn" "Redis endpoint not found in CDK outputs"
else
    # Check if Redis cluster exists
    REDIS_CLUSTER_ID=$(echo "$REDIS_ENDPOINT" | cut -d'.' -f1)
    if aws elasticache describe-cache-clusters --cache-cluster-id "$REDIS_CLUSTER_ID" &> /dev/null 2>&1; then
        REDIS_STATUS=$(aws elasticache describe-cache-clusters --cache-cluster-id "$REDIS_CLUSTER_ID" --query 'CacheClusters[0].CacheClusterStatus' --output text)
        if [ "$REDIS_STATUS" == "available" ]; then
            check_result "pass" "Redis cluster available: $REDIS_ENDPOINT"
        else
            check_result "warn" "Redis cluster status: $REDIS_STATUS"
        fi
    else
        check_result "warn" "Redis cluster not found or not accessible"
    fi
fi
echo ""

# ============================================
# Check 9: CloudWatch Logs
# ============================================
echo -e "${BLUE}[9/11] Checking CloudWatch Logs...${NC}"

LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/omnitrack" --query 'logGroups[*].logGroupName' --output text | wc -w)
if [ "$LOG_GROUPS" -gt 0 ]; then
    check_result "pass" "Found $LOG_GROUPS CloudWatch log groups"
else
    check_result "warn" "No CloudWatch log groups found"
fi
echo ""

# ============================================
# Check 10: CloudWatch Dashboards
# ============================================
echo -e "${BLUE}[10/11] Checking CloudWatch Dashboards...${NC}"

DASHBOARDS=$(aws cloudwatch list-dashboards --query "DashboardEntries[?contains(DashboardName, 'omnitrack')].DashboardName" --output text | wc -w)
if [ "$DASHBOARDS" -gt 0 ]; then
    check_result "pass" "Found $DASHBOARDS CloudWatch dashboards"
else
    check_result "warn" "No CloudWatch dashboards found - create for demo"
fi
echo ""

# ============================================
# Check 11: X-Ray Tracing
# ============================================
echo -e "${BLUE}[11/11] Checking X-Ray Tracing...${NC}"

# Check if X-Ray is receiving traces
TRACE_COUNT=$(aws xray get-trace-summaries --start-time $(date -u -d '1 hour ago' +%s) --end-time $(date -u +%s) --query 'TraceSummaries | length(@)' --output text 2>/dev/null || echo "0")
if [ "$TRACE_COUNT" -gt 0 ]; then
    check_result "pass" "X-Ray receiving traces ($TRACE_COUNT in last hour)"
else
    check_result "warn" "No recent X-Ray traces - generate some traffic to test"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ Demo environment is ready!${NC}"
else
    echo -e "${RED}✗ Demo environment has $FAILED critical issues${NC}"
fi
echo ""

echo "Deployment Details:"
echo "  REST API: $REST_API_URL"
echo "  WebSocket: $WS_API_URL"
echo "  DynamoDB Table: $TABLE_NAME"
echo "  User Pool: $USER_POOL_ID"
if [ ! -z "$REDIS_ENDPOINT" ]; then
    echo "  Redis Endpoint: $REDIS_ENDPOINT"
fi
echo "  AWS Region: $AWS_REGION"
echo ""

if [ "$WARNINGS" -gt 0 ] || [ "$FAILED" -gt 0 ]; then
    echo "Recommended Actions:"
    if [ "$ITEM_COUNT" -eq 0 ] 2>/dev/null; then
        echo "  • Run seed script: npm run seed-demo-data"
    fi
    if [ "$USER_COUNT" -eq 0 ] 2>/dev/null; then
        echo "  • Create test users: npm run create-test-users"
    fi
    if [ "$DASHBOARDS" -eq 0 ]; then
        echo "  • Create CloudWatch dashboard for demo metrics"
    fi
    if [ "$TRACE_COUNT" -eq 0 ]; then
        echo "  • Generate test traffic to populate X-Ray traces"
    fi
    echo ""
fi

echo "Next Steps for Demo:"
echo "  1. Start IoT simulator: npm run start-iot-simulator"
echo "  2. Test agent workflow: npm run test-agent-workflow"
echo "  3. Review CloudWatch dashboard"
echo "  4. Practice demo walkthrough"
echo ""

# Exit with error if critical checks failed
if [ "$FAILED" -gt 0 ]; then
    exit 1
fi

exit 0
