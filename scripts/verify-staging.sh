#!/bin/bash

# Verify OmniTrack AI Staging Deployment
# This script checks that all services are running correctly

set -e

echo "========================================="
echo "OmniTrack AI - Staging Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load CDK outputs
if [ ! -f infrastructure/cdk-outputs.json ]; then
    echo -e "${RED}Error: cdk-outputs.json not found. Please deploy infrastructure first.${NC}"
    exit 1
fi

cd infrastructure

REST_API_URL=$(jq -r '.InfrastructureStack.RestApiUrl // empty' cdk-outputs.json)
WS_API_URL=$(jq -r '.InfrastructureStack.WebSocketApiUrl // empty' cdk-outputs.json)
USER_POOL_ID=$(jq -r '.InfrastructureStack.UserPoolId // empty' cdk-outputs.json)
TABLE_NAME=$(jq -r '.InfrastructureStack.DynamoDBTableName // empty' cdk-outputs.json)
REDIS_ENDPOINT=$(jq -r '.InfrastructureStack.RedisClusterEndpoint // empty' cdk-outputs.json)

cd ..

echo "Verifying deployment components..."
echo ""

# Check 1: DynamoDB Table
echo -e "${YELLOW}[1/7] Checking DynamoDB Table...${NC}"
if aws dynamodb describe-table --table-name "$TABLE_NAME" &> /dev/null; then
    TABLE_STATUS=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.TableStatus' --output text)
    if [ "$TABLE_STATUS" == "ACTIVE" ]; then
        echo -e "${GREEN}✓ DynamoDB table is ACTIVE${NC}"
    else
        echo -e "${YELLOW}⚠ DynamoDB table status: $TABLE_STATUS${NC}"
    fi
else
    echo -e "${RED}✗ DynamoDB table not found${NC}"
fi

# Check 2: Cognito User Pool
echo -e "${YELLOW}[2/7] Checking Cognito User Pool...${NC}"
if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" &> /dev/null; then
    POOL_STATUS=$(aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --query 'UserPool.Status' --output text)
    echo -e "${GREEN}✓ Cognito User Pool exists (Status: $POOL_STATUS)${NC}"
else
    echo -e "${RED}✗ Cognito User Pool not found${NC}"
fi

# Check 3: API Gateway REST API
echo -e "${YELLOW}[3/7] Checking API Gateway REST API...${NC}"
if [ ! -z "$REST_API_URL" ]; then
    # Test OPTIONS request (CORS preflight)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$REST_API_URL" || echo "000")
    if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "204" ]; then
        echo -e "${GREEN}✓ REST API is accessible (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠ REST API returned HTTP $HTTP_STATUS${NC}"
    fi
else
    echo -e "${RED}✗ REST API URL not found${NC}"
fi

# Check 4: WebSocket API
echo -e "${YELLOW}[4/7] Checking WebSocket API...${NC}"
if [ ! -z "$WS_API_URL" ]; then
    # Extract API ID from URL
    WS_API_ID=$(echo "$WS_API_URL" | sed -n 's/.*\/\/\([^.]*\).*/\1/p')
    if aws apigatewayv2 get-api --api-id "$WS_API_ID" &> /dev/null; then
        echo -e "${GREEN}✓ WebSocket API exists${NC}"
    else
        echo -e "${YELLOW}⚠ WebSocket API verification inconclusive${NC}"
    fi
else
    echo -e "${RED}✗ WebSocket API URL not found${NC}"
fi

# Check 5: Lambda Functions
echo -e "${YELLOW}[5/7] Checking Lambda Functions...${NC}"
LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'omnitrack-')].FunctionName" --output text | wc -w)
if [ "$LAMBDA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $LAMBDA_COUNT Lambda functions${NC}"
    
    # Check a few key functions
    KEY_FUNCTIONS=("omnitrack-auth-login" "omnitrack-iot-processor" "omnitrack-ws-connect")
    for func in "${KEY_FUNCTIONS[@]}"; do
        if aws lambda get-function --function-name "$func" &> /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ $func${NC}"
        else
            echo -e "${YELLOW}  ⚠ $func not found${NC}"
        fi
    done
else
    echo -e "${RED}✗ No Lambda functions found${NC}"
fi

# Check 6: S3 Buckets
echo -e "${YELLOW}[6/7] Checking S3 Buckets...${NC}"
BUCKET_COUNT=$(aws s3 ls | grep omnitrack | wc -l)
if [ "$BUCKET_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $BUCKET_COUNT S3 buckets${NC}"
else
    echo -e "${YELLOW}⚠ No S3 buckets found with 'omnitrack' prefix${NC}"
fi

# Check 7: CloudWatch Logs
echo -e "${YELLOW}[7/7] Checking CloudWatch Log Groups...${NC}"
LOG_GROUP_COUNT=$(aws logs describe-log-groups --log-group-name-prefix "/aws/omnitrack" --query 'logGroups[*].logGroupName' --output text | wc -w)
if [ "$LOG_GROUP_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $LOG_GROUP_COUNT CloudWatch log groups${NC}"
else
    echo -e "${YELLOW}⚠ No CloudWatch log groups found${NC}"
fi

echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo "Deployment Details:"
echo "  REST API: $REST_API_URL"
echo "  WebSocket: $WS_API_URL"
echo "  DynamoDB Table: $TABLE_NAME"
echo "  User Pool: $USER_POOL_ID"
if [ ! -z "$REDIS_ENDPOINT" ]; then
    echo "  Redis Endpoint: $REDIS_ENDPOINT"
fi
echo ""
echo -e "${GREEN}✓ Staging environment verification complete${NC}"
echo ""
echo "Next steps:"
echo "  1. Run integration tests: cd infrastructure && npm run test:integration"
echo "  2. Run E2E tests: cd frontend && npm run test:e2e"
echo "  3. Monitor CloudWatch Dashboard for metrics"
echo ""
