# OmniTrack AI - Staging Deployment Guide

This guide provides step-by-step instructions for deploying OmniTrack AI to the staging environment.

## Prerequisites

Before deploying to staging, ensure you have:

1. **AWS Account**: Access to an AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Version 20.x or later
4. **npm**: Version 10.x or later
5. **AWS CDK**: Installed globally
   ```bash
   npm install -g aws-cdk
   ```
6. **jq**: JSON processor for parsing CDK outputs
   ```bash
   # macOS
   brew install jq
   
   # Linux
   sudo apt-get install jq
   ```

## Environment Setup

### 1. Configure AWS Credentials

Ensure your AWS credentials are configured for the staging account:

```bash
export AWS_PROFILE=staging  # If using named profiles
export AWS_REGION=us-east-1  # Or your preferred region
```

### 2. Update Environment Variables

Edit the environment configuration files:

**Infrastructure** (`infrastructure/.env.staging`):
- Update `AWS_ACCOUNT_ID` with your AWS account ID
- Update `AWS_REGION` with your target region
- Update email addresses for alert notifications

**Frontend** (`frontend/.env.staging`):
- These will be automatically populated after infrastructure deployment

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# Make script executable (if not already)
chmod +x scripts/deploy-staging.sh

# Run deployment
./scripts/deploy-staging.sh
```

The script will:
1. Deploy infrastructure using AWS CDK
2. Build the frontend application
3. Configure environment variables
4. Verify the deployment

### Option 2: Manual Deployment

#### Step 1: Deploy Infrastructure

```bash
cd infrastructure

# Install dependencies
npm ci

# Build TypeScript
npm run build

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy infrastructure
npx cdk deploy --all --require-approval never \
  --context environment=staging \
  --outputs-file cdk-outputs.json
```

#### Step 2: Extract Stack Outputs

```bash
# Extract important values from CDK outputs
REST_API_URL=$(jq -r '.InfrastructureStack.RestApiUrl' cdk-outputs.json)
WS_API_URL=$(jq -r '.InfrastructureStack.WebSocketApiUrl' cdk-outputs.json)
USER_POOL_ID=$(jq -r '.InfrastructureStack.UserPoolId' cdk-outputs.json)
USER_POOL_CLIENT_ID=$(jq -r '.InfrastructureStack.UserPoolClientId' cdk-outputs.json)

echo "REST API: $REST_API_URL"
echo "WebSocket: $WS_API_URL"
echo "User Pool: $USER_POOL_ID"
```

#### Step 3: Configure Frontend

```bash
cd ../frontend

# Create environment file
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
```

#### Step 4: Build Frontend

```bash
# Install dependencies
npm ci

# Build application
npm run build
```

## Verification

### Automated Verification

Run the verification script:

```bash
chmod +x scripts/verify-staging.sh
./scripts/verify-staging.sh
```

### Manual Verification

#### 1. Check Infrastructure Components

```bash
# DynamoDB Table
aws dynamodb describe-table --table-name omnitrack-main

# Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>

# Lambda Functions
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'omnitrack-')]"

# API Gateway
aws apigateway get-rest-apis --query "items[?name=='omnitrack-api']"
```

#### 2. Test API Endpoints

```bash
# Test public endpoint
curl -X GET $REST_API_URL/marketplace/scenarios

# Test authentication endpoint
curl -X POST $REST_API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"TestPassword123!"}'
```

#### 3. Check CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/omnitrack/application --follow

# View Lambda logs
aws logs tail /aws/lambda/omnitrack-auth-login --follow
```

## Running Tests

### Integration Tests

Test complete API workflows and multi-agent orchestration:

```bash
cd infrastructure
npm run test:integration
```

### End-to-End Tests

Test user workflows from frontend perspective:

```bash
cd frontend
npm run test:e2e
```

## Monitoring

### CloudWatch Dashboard

Access the operations dashboard:

```bash
# Get dashboard URL from CDK outputs
DASHBOARD_URL=$(jq -r '.InfrastructureStack.DashboardUrl' infrastructure/cdk-outputs.json)
echo "Dashboard: $DASHBOARD_URL"
```

Or navigate to:
- AWS Console → CloudWatch → Dashboards → OmniTrack-Operations-Dashboard

### Key Metrics to Monitor

1. **API Gateway**:
   - Request count
   - Error rates (4xx, 5xx)
   - Latency (p50, p95, p99)

2. **Lambda Functions**:
   - Invocations
   - Errors and throttles
   - Duration
   - Concurrent executions

3. **DynamoDB**:
   - Read/write capacity
   - Throttled requests
   - Latency

4. **System Health**:
   - API 5xx error rate
   - Lambda error rate
   - DynamoDB throttles

### CloudWatch Alarms

The following alarms are configured:

- **Critical Alarms** (sent to oncall email):
  - API Gateway 5xx error rate > 5%
  - Lambda error rate > 5%

- **Warning Alarms** (sent to team email):
  - API Gateway p95 latency > 2 seconds
  - DynamoDB read throttles
  - Lambda throttles

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Error

```bash
Error: This stack uses assets, so the toolkit stack must be deployed
```

**Solution**: Run CDK bootstrap:
```bash
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

#### 2. Lambda Function Timeout

```bash
Error: Task timed out after 30.00 seconds
```

**Solution**: Increase Lambda timeout in `infrastructure-stack.ts`:
```typescript
timeout: cdk.Duration.seconds(60)
```

#### 3. DynamoDB Throttling

```bash
ProvisionedThroughputExceededException
```

**Solution**: DynamoDB is configured with PAY_PER_REQUEST billing mode, which should auto-scale. Check for hot partitions or inefficient queries.

#### 4. API Gateway 403 Errors

```bash
{"message":"Forbidden"}
```

**Solution**: Check:
- Cognito token is valid
- User has appropriate permissions
- WAF rules are not blocking requests

#### 5. Frontend Build Errors

```bash
Error: Environment variable NEXT_PUBLIC_API_URL is not defined
```

**Solution**: Ensure `.env.local` is created with correct values from CDK outputs.

### Viewing Logs

```bash
# Application logs
aws logs tail /aws/omnitrack/application --follow

# Lambda function logs
aws logs tail /aws/lambda/omnitrack-<function-name> --follow

# API Gateway logs
aws logs tail /aws/apigateway/omnitrack-api --follow

# Error logs
aws logs tail /aws/omnitrack/errors --follow
```

### Debugging Lambda Functions

```bash
# Invoke function directly
aws lambda invoke \
  --function-name omnitrack-auth-login \
  --payload '{"body":"{\"username\":\"test@example.com\",\"password\":\"Test123!\"}"}' \
  response.json

# View response
cat response.json
```

## Rollback

If deployment fails or issues are discovered:

### Rollback Infrastructure

```bash
cd infrastructure

# Destroy the stack
npx cdk destroy --all

# Or rollback to previous version
npx cdk deploy --all --rollback
```

### Rollback Frontend

```bash
cd frontend

# Revert to previous build
git checkout <previous-commit>
npm run build
```

## Post-Deployment Tasks

After successful deployment:

1. **Update DNS Records**: Point domain to API Gateway and CloudFront
2. **Configure SSL Certificates**: Set up ACM certificates for custom domains
3. **Set Up Monitoring Alerts**: Verify SNS subscriptions are confirmed
4. **Create Test Users**: Register test accounts in Cognito
5. **Seed Test Data**: Populate DynamoDB with sample scenarios
6. **Run Smoke Tests**: Execute integration and E2E tests
7. **Document API Endpoints**: Update API documentation with actual URLs
8. **Notify Team**: Share staging environment details with team

## Security Checklist

- [ ] AWS WAF rules are enabled
- [ ] KMS encryption is configured for sensitive data
- [ ] Secrets Manager contains all API keys
- [ ] VPC security groups follow least-privilege principle
- [ ] Cognito MFA is enabled
- [ ] CloudWatch Logs retention is configured
- [ ] S3 buckets have public access blocked
- [ ] API Gateway has rate limiting enabled
- [ ] Lambda functions have appropriate IAM roles
- [ ] DynamoDB has point-in-time recovery enabled

## Support

For issues or questions:

1. Check CloudWatch Logs for error details
2. Review CloudWatch Alarms for system health
3. Consult the troubleshooting section above
4. Contact the DevOps team

## Next Steps

After staging deployment is verified:

1. Run full test suite
2. Perform load testing
3. Conduct security audit
4. Plan production deployment
5. Set up CI/CD pipeline for automated deployments

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Project README](./README.md)
- [Infrastructure Documentation](./infrastructure/README.md)
- [Frontend Documentation](./frontend/README.md)
