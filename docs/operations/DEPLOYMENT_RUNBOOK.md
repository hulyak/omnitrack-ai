# OmniTrack AI - Deployment Runbook

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Procedures](#deployment-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

## Overview

This runbook provides step-by-step procedures for deploying the OmniTrack AI platform to AWS environments. It covers infrastructure deployment, application deployment, and verification procedures.

### Deployment Environments

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Deployment Architecture

```
GitHub Repository
       │
       ├─── Push to main branch
       │
       ▼
GitHub Actions CI/CD
       │
       ├─── Run tests
       ├─── Build artifacts
       ├─── Deploy infrastructure (CDK)
       ├─── Deploy frontend (Amplify)
       │
       ▼
AWS Environment
```

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.x or later)
   ```bash
   aws --version
   # Should output: aws-cli/2.x.x
   ```

2. **Node.js** (v20.x or later)
   ```bash
   node --version
   # Should output: v20.x.x
   ```

3. **AWS CDK** (v2.x or later)
   ```bash
   cdk --version
   # Should output: 2.x.x
   ```

4. **Git**
   ```bash
   git --version
   ```

### AWS Account Setup

1. **IAM Permissions Required**:
   - CloudFormation full access
   - Lambda full access
   - DynamoDB full access
   - S3 full access
   - API Gateway full access
   - Cognito full access
   - IoT full access
   - Step Functions full access
   - CloudWatch full access
   - IAM role creation

2. **AWS Profile Configuration**:
   ```bash
   aws configure --profile omnitrack-staging
   # Enter AWS Access Key ID
   # Enter AWS Secret Access Key
   # Enter Default region: us-east-1
   # Enter Default output format: json
   ```

3. **Verify AWS Credentials**:
   ```bash
   aws sts get-caller-identity --profile omnitrack-staging
   ```

### Repository Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/omnitrack-ai.git
   cd omnitrack-ai
   ```

2. **Install Dependencies**:
   ```bash
   # Install infrastructure dependencies
   cd infrastructure
   npm install
   
   # Install Lambda dependencies
   cd lambda
   npm install
   
   # Install frontend dependencies
   cd ../../frontend
   npm install
   ```

## Environment Setup

### Environment Variables

Create environment-specific configuration files:

#### Staging Environment (.env.staging)

**Infrastructure** (`infrastructure/.env.staging`):
```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ENVIRONMENT=staging
STACK_NAME=omnitrack-staging

# DynamoDB
DYNAMODB_TABLE_NAME=omnitrack-staging-main
DYNAMODB_BILLING_MODE=PAY_PER_REQUEST

# Cognito
COGNITO_USER_POOL_NAME=omnitrack-staging-users
COGNITO_DOMAIN_PREFIX=omnitrack-staging

# API Gateway
API_GATEWAY_STAGE=staging
API_THROTTLE_RATE_LIMIT=1000
API_THROTTLE_BURST_LIMIT=2000

# Lambda
LAMBDA_MEMORY_SIZE=1024
LAMBDA_TIMEOUT=30
LAMBDA_LOG_LEVEL=INFO

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION=us-east-1

# Monitoring
ENABLE_XRAY=true
LOG_RETENTION_DAYS=7

# Security
ENABLE_WAF=true
ENABLE_ENCRYPTION=true
```

**Frontend** (`frontend/.env.staging`):
```bash
NEXT_PUBLIC_API_URL=https://staging-api.omnitrack.ai/v1
NEXT_PUBLIC_WS_URL=wss://staging-api.omnitrack.ai/ws
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_REGION=us-east-1
NEXT_PUBLIC_ENVIRONMENT=staging
```

#### Production Environment (.env.production)

**Infrastructure** (`infrastructure/.env.production`):
```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ENVIRONMENT=production
STACK_NAME=omnitrack-production

# DynamoDB
DYNAMODB_TABLE_NAME=omnitrack-production-main
DYNAMODB_BILLING_MODE=PAY_PER_REQUEST

# Cognito
COGNITO_USER_POOL_NAME=omnitrack-production-users
COGNITO_DOMAIN_PREFIX=omnitrack-production

# API Gateway
API_GATEWAY_STAGE=production
API_THROTTLE_RATE_LIMIT=5000
API_THROTTLE_BURST_LIMIT=10000

# Lambda
LAMBDA_MEMORY_SIZE=2048
LAMBDA_TIMEOUT=60
LAMBDA_LOG_LEVEL=WARN

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION=us-east-1

# Monitoring
ENABLE_XRAY=true
LOG_RETENTION_DAYS=30

# Security
ENABLE_WAF=true
ENABLE_ENCRYPTION=true
```

**Frontend** (`frontend/.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.omnitrack.ai/v1
NEXT_PUBLIC_WS_URL=wss://api.omnitrack.ai/ws
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_REGION=us-east-1
NEXT_PUBLIC_ENVIRONMENT=production
```

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] AWS credentials configured
- [ ] Backup of current production state taken
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed

### Step 1: Pre-Deployment Validation

```bash
# Run all tests
cd infrastructure/lambda
npm test

cd ../../frontend
npm test

# Verify CDK synthesis
cd ../infrastructure
cdk synth --profile omnitrack-staging
```

### Step 2: Deploy Infrastructure (Staging)

```bash
cd infrastructure

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/us-east-1 --profile omnitrack-staging

# Review changes
cdk diff --profile omnitrack-staging

# Deploy infrastructure
cdk deploy --all --profile omnitrack-staging --require-approval never

# Expected output:
# ✅  OmniTrackInfrastructureStack
# 
# Outputs:
# OmniTrackInfrastructureStack.ApiEndpoint = https://xxxxx.execute-api.us-east-1.amazonaws.com/staging
# OmniTrackInfrastructureStack.UserPoolId = us-east-1_XXXXXXXXX
# OmniTrackInfrastructureStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Deployment Time**: Approximately 15-20 minutes

### Step 3: Deploy Lambda Functions

Lambda functions are deployed as part of the CDK stack, but you can update individual functions:

```bash
# Build Lambda code
cd infrastructure/lambda
npm run build

# Update specific function (if needed)
aws lambda update-function-code \
  --function-name omnitrack-staging-info-agent \
  --zip-file fileb://dist/info-agent.zip \
  --profile omnitrack-staging
```

### Step 4: Deploy Frontend (Staging)

```bash
cd frontend

# Build frontend
npm run build

# Deploy to Amplify (automated via GitHub Actions)
# Or manual deployment:
aws amplify start-deployment \
  --app-id YOUR_APP_ID \
  --branch-name staging \
  --profile omnitrack-staging
```

**Deployment Time**: Approximately 5-10 minutes

### Step 5: Database Initialization

```bash
# Run database initialization script
cd infrastructure/scripts

# Create initial data (first deployment only)
node initialize-database.js --environment staging --profile omnitrack-staging

# Verify tables created
aws dynamodb list-tables --profile omnitrack-staging
```

### Step 6: Configure External Integrations

#### IoT Core Setup

```bash
# Create IoT thing type
aws iot create-thing-type \
  --thing-type-name SupplyChainSensor \
  --profile omnitrack-staging

# Create IoT policy
aws iot create-policy \
  --policy-name omnitrack-staging-sensor-policy \
  --policy-document file://iot-policy.json \
  --profile omnitrack-staging
```

#### SNS Topic Configuration

```bash
# Subscribe email to alert topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT-ID:omnitrack-staging-alerts \
  --protocol email \
  --notification-endpoint ops@omnitrack.ai \
  --profile omnitrack-staging
```

### Step 7: Production Deployment

**IMPORTANT**: Production deployments should only occur during scheduled maintenance windows.

```bash
# Switch to production profile
export AWS_PROFILE=omnitrack-production

# Review changes carefully
cd infrastructure
cdk diff --profile omnitrack-production

# Deploy with approval
cdk deploy --all --profile omnitrack-production

# Deploy frontend
cd ../frontend
npm run build
aws amplify start-deployment \
  --app-id YOUR_PROD_APP_ID \
  --branch-name main \
  --profile omnitrack-production
```

**Deployment Time**: Approximately 20-30 minutes

### Step 8: Smoke Tests

Run automated smoke tests after deployment:

```bash
cd infrastructure/test

# Run integration tests
npm run test:integration -- --environment staging

# Run E2E tests
cd ../../frontend
npm run test:e2e -- --environment staging
```

## Rollback Procedures

### Infrastructure Rollback

#### Option 1: CDK Rollback (Recommended)

```bash
cd infrastructure

# List stack history
aws cloudformation describe-stack-events \
  --stack-name omnitrack-staging \
  --profile omnitrack-staging

# Rollback to previous version
cdk deploy --rollback \
  --profile omnitrack-staging
```

#### Option 2: Manual CloudFormation Rollback

```bash
# Initiate rollback
aws cloudformation rollback-stack \
  --stack-name omnitrack-staging \
  --profile omnitrack-staging

# Monitor rollback progress
aws cloudformation describe-stack-events \
  --stack-name omnitrack-staging \
  --profile omnitrack-staging
```

### Lambda Function Rollback

```bash
# List function versions
aws lambda list-versions-by-function \
  --function-name omnitrack-staging-info-agent \
  --profile omnitrack-staging

# Update alias to previous version
aws lambda update-alias \
  --function-name omnitrack-staging-info-agent \
  --name live \
  --function-version PREVIOUS_VERSION \
  --profile omnitrack-staging
```

### Frontend Rollback

```bash
# Rollback Amplify deployment
aws amplify start-deployment \
  --app-id YOUR_APP_ID \
  --branch-name staging \
  --job-id PREVIOUS_JOB_ID \
  --profile omnitrack-staging
```

### Database Rollback

```bash
# Restore from point-in-time backup
aws dynamodb restore-table-to-point-in-time \
  --source-table-name omnitrack-staging-main \
  --target-table-name omnitrack-staging-main-restored \
  --restore-date-time 2024-01-01T12:00:00Z \
  --profile omnitrack-staging

# Swap table names (requires application downtime)
```

## Post-Deployment Verification

### Verification Checklist

- [ ] All CloudFormation stacks deployed successfully
- [ ] API Gateway endpoints responding
- [ ] Lambda functions executing without errors
- [ ] DynamoDB tables accessible
- [ ] Cognito user pool configured
- [ ] Frontend application loading
- [ ] WebSocket connections working
- [ ] IoT Core receiving data
- [ ] Alerts being generated
- [ ] Monitoring dashboards showing data

### Health Check Commands

```bash
# Check API health
curl https://staging-api.omnitrack.ai/v1/health

# Check Lambda function logs
aws logs tail /aws/lambda/omnitrack-staging-info-agent \
  --follow \
  --profile omnitrack-staging

# Check DynamoDB table status
aws dynamodb describe-table \
  --table-name omnitrack-staging-main \
  --profile omnitrack-staging

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix omnitrack-staging \
  --profile omnitrack-staging
```

### Performance Verification

```bash
# Run load test
cd infrastructure/test
npm run test:load -- --environment staging --duration 5m

# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=omnitrack-staging \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-staging
```

## Troubleshooting

### Common Issues

#### Issue 1: CDK Deployment Fails

**Symptoms**: CDK deploy command fails with CloudFormation error

**Diagnosis**:
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name omnitrack-staging \
  --profile omnitrack-staging \
  --max-items 20
```

**Resolution**:
1. Review error message in CloudFormation events
2. Check IAM permissions
3. Verify resource limits not exceeded
4. Delete failed stack and retry:
   ```bash
   cdk destroy --profile omnitrack-staging
   cdk deploy --profile omnitrack-staging
   ```

#### Issue 2: Lambda Function Timeout

**Symptoms**: Lambda functions timing out, 504 errors from API Gateway

**Diagnosis**:
```bash
# Check Lambda logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/omnitrack-staging-info-agent \
  --filter-pattern "Task timed out" \
  --profile omnitrack-staging
```

**Resolution**:
1. Increase Lambda timeout in CDK stack
2. Optimize function code
3. Check external service dependencies
4. Review X-Ray traces for bottlenecks

#### Issue 3: DynamoDB Throttling

**Symptoms**: 400 errors with ProvisionedThroughputExceededException

**Diagnosis**:
```bash
# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=omnitrack-staging-main \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-staging
```

**Resolution**:
1. Switch to on-demand billing mode
2. Increase provisioned capacity
3. Implement exponential backoff in application
4. Review query patterns for optimization

#### Issue 4: Frontend Not Loading

**Symptoms**: Blank page or 404 errors

**Diagnosis**:
```bash
# Check Amplify deployment status
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name staging \
  --job-id JOB_ID \
  --profile omnitrack-staging

# Check CloudFront distribution
aws cloudfront get-distribution \
  --id DISTRIBUTION_ID \
  --profile omnitrack-staging
```

**Resolution**:
1. Verify build completed successfully
2. Check environment variables configured
3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id DISTRIBUTION_ID \
     --paths "/*" \
     --profile omnitrack-staging
   ```
4. Check browser console for errors

#### Issue 5: WebSocket Connection Failures

**Symptoms**: Real-time updates not working

**Diagnosis**:
```bash
# Check API Gateway WebSocket logs
aws logs tail /aws/apigateway/omnitrack-staging-ws \
  --follow \
  --profile omnitrack-staging
```

**Resolution**:
1. Verify WebSocket API deployed
2. Check connection Lambda function
3. Verify DynamoDB connection table exists
4. Test WebSocket connection manually:
   ```bash
   wscat -c wss://staging-api.omnitrack.ai/ws
   ```

### Emergency Contacts

- **On-Call Engineer**: oncall@omnitrack.ai
- **DevOps Lead**: devops-lead@omnitrack.ai
- **AWS Support**: [AWS Support Console](https://console.aws.amazon.com/support/)

### Escalation Procedure

1. **Level 1** (0-15 minutes): On-call engineer investigates
2. **Level 2** (15-30 minutes): DevOps lead engaged
3. **Level 3** (30+ minutes): AWS Support ticket opened, management notified

## Maintenance Windows

### Scheduled Maintenance

- **Staging**: Anytime (no user impact)
- **Production**: 
  - Primary: Sunday 2:00 AM - 4:00 AM EST
  - Secondary: Wednesday 2:00 AM - 4:00 AM EST

### Emergency Maintenance

For critical security patches or system failures, emergency maintenance may be performed with 1-hour notice to stakeholders.

## Monitoring and Alerts

### Key Metrics to Monitor

1. **API Gateway**:
   - Request count
   - 4xx/5xx error rates
   - Latency (p50, p95, p99)

2. **Lambda Functions**:
   - Invocation count
   - Error rate
   - Duration
   - Throttles

3. **DynamoDB**:
   - Read/write capacity utilization
   - Throttled requests
   - System errors

4. **Application**:
   - Active users
   - Scenario simulations per hour
   - Alert generation rate
   - Marketplace searches

### CloudWatch Dashboards

Access monitoring dashboards:
- Staging: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=omnitrack-staging
- Production: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=omnitrack-production

## Appendix

### Useful Commands Reference

```bash
# List all Lambda functions
aws lambda list-functions --profile omnitrack-staging

# Get API Gateway endpoint
aws apigateway get-rest-apis --profile omnitrack-staging

# List DynamoDB tables
aws dynamodb list-tables --profile omnitrack-staging

# View CloudWatch logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow --profile omnitrack-staging

# Check Step Functions executions
aws stepfunctions list-executions \
  --state-machine-arn STATE_MACHINE_ARN \
  --profile omnitrack-staging

# Export CloudFormation template
aws cloudformation get-template \
  --stack-name omnitrack-staging \
  --profile omnitrack-staging
```

### Related Documentation

- [Architecture Documentation](../architecture/ARCHITECTURE.md)
- [API Documentation](../api/openapi.yaml)
- [User Guide](../user-guide/USER_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Security Documentation](../../infrastructure/SECURITY.md)
- [Monitoring Documentation](../../infrastructure/MONITORING.md)
