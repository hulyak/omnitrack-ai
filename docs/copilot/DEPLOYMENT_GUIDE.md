# AI Copilot Deployment Guide

Complete guide for deploying the OmniTrack AI Copilot to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment](#post-deployment)
6. [Environment Management](#environment-management)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

- **AWS Account** with appropriate permissions
- **AWS CLI** v2.x or higher
- **Node.js** v20.x or higher
- **npm** v10.x or higher
- **AWS CDK** v2.x or higher
- **Git** for version control

### AWS Permissions

Your AWS user/role needs these permissions:

- CloudFormation (full access)
- Lambda (full access)
- API Gateway (full access)
- DynamoDB (full access)
- IAM (create/update roles and policies)
- CloudWatch (logs and metrics)
- Bedrock (invoke model)

### Install Required Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install AWS CDK
npm install -g aws-cdk

# Verify installations
aws --version
node --version
npm --version
cdk --version
```

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/omnitrack-ai.git
cd omnitrack-ai
```

### 2. Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your default output format (json)
```

Verify configuration:

```bash
aws sts get-caller-identity
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd infrastructure
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```

Replace `ACCOUNT-ID` and `REGION` with your values.

## Configuration

### Environment Variables

Create `.env` file in `infrastructure/`:

```bash
# infrastructure/.env

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=omnitrack-copilot-conversations
DYNAMODB_CONNECTIONS_TABLE=omnitrack-copilot-connections

# API Gateway Configuration
WEBSOCKET_API_STAGE=production
WEBSOCKET_API_NAME=omnitrack-copilot-ws

# Lambda Configuration
LAMBDA_MEMORY_SIZE=1024
LAMBDA_TIMEOUT=30
LAMBDA_RUNTIME=nodejs20.x

# CloudWatch Configuration
LOG_RETENTION_DAYS=7
ENABLE_XRAY_TRACING=true

# Rate Limiting
RATE_LIMIT_MESSAGES_PER_MINUTE=60
RATE_LIMIT_TOKENS_PER_DAY=100000

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
ENABLE_RATE_LIMITING=true
```

### CDK Context

Edit `infrastructure/cdk.json`:

```json
{
  "app": "npx ts-node bin/infrastructure.ts",
  "context": {
    "environment": "production",
    "enableMonitoring": true,
    "enableAnalytics": true,
    "retainData": true
  }
}
```

### Frontend Configuration

Create `.env.production` in `frontend/`:

```bash
# frontend/.env.production

NEXT_PUBLIC_API_URL=https://api.omnitrack.ai
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.omnitrack.ai/copilot
NEXT_PUBLIC_REGION=us-east-1
```

## Deployment Steps

### Step 1: Build Backend

```bash
cd infrastructure
npm run build
```

This compiles TypeScript to JavaScript.

### Step 2: Run Tests

```bash
npm test
```

Ensure all tests pass before deploying.

### Step 3: Synthesize CloudFormation

```bash
cdk synth
```

This generates CloudFormation templates in `cdk.out/`.

### Step 4: Review Changes

```bash
cdk diff
```

Review what will be created/updated/deleted.

### Step 5: Deploy Infrastructure

```bash
cdk deploy --all
```

Or deploy specific stacks:

```bash
cdk deploy OmniTrackCopilotStack
```

Confirm deployment when prompted.

### Step 6: Note Outputs

After deployment, note the outputs:

```
Outputs:
OmniTrackCopilotStack.WebSocketURL = wss://abc123.execute-api.us-east-1.amazonaws.com/production
OmniTrackCopilotStack.RestAPIURL = https://abc123.execute-api.us-east-1.amazonaws.com/production
OmniTrackCopilotStack.ConversationsTableName = omnitrack-copilot-conversations
```

### Step 7: Configure CORS

```bash
./configure-cors.sh
```

This sets up CORS for your frontend domain.

### Step 8: Deploy Frontend

```bash
cd ../frontend
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to AWS Amplify
amplify publish
```

### Step 9: Verify Deployment

```bash
cd ../infrastructure
./verify-deployment.sh
```

This runs health checks on all endpoints.

## Post-Deployment

### 1. Test WebSocket Connection

```bash
# Using wscat
npm install -g wscat

wscat -c "wss://abc123.execute-api.us-east-1.amazonaws.com/production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Send a test message:

```json
{"action": "message", "message": "help"}
```

### 2. Test REST API

```bash
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/production/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "help"}'
```

### 3. Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/copilot-handler --follow
```

### 4. Verify Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace OmniTrack/Copilot \
  --metric-name MessagesPerMinute \
  --start-time 2025-11-29T00:00:00Z \
  --end-time 2025-11-29T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### 5. Set Up Alarms

Alarms are automatically created, but verify:

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix OmniTrack-Copilot
```

### 6. Configure Custom Domain (Optional)

```bash
# Create certificate in ACM
aws acm request-certificate \
  --domain-name copilot.omnitrack.ai \
  --validation-method DNS

# Update API Gateway custom domain
aws apigatewayv2 create-domain-name \
  --domain-name copilot.omnitrack.ai \
  --domain-name-configurations CertificateArn=arn:aws:acm:...
```

See `CUSTOM_DOMAIN_SETUP.md` for detailed instructions.

## Environment Management

### Development Environment

```bash
export CDK_ENV=development
cdk deploy --context environment=development
```

Configuration:
- Lower memory limits
- Shorter log retention
- No data retention
- Relaxed rate limits

### Staging Environment

```bash
export CDK_ENV=staging
cdk deploy --context environment=staging
```

Configuration:
- Production-like settings
- Extended log retention
- Data retention enabled
- Production rate limits

### Production Environment

```bash
export CDK_ENV=production
cdk deploy --context environment=production
```

Configuration:
- Maximum memory
- Long log retention
- Data retention enabled
- Strict rate limits
- Enhanced monitoring

### Environment-Specific Variables

Create separate `.env` files:

```bash
infrastructure/.env.development
infrastructure/.env.staging
infrastructure/.env.production
```

Load appropriate file:

```bash
export $(cat .env.production | xargs)
```

## Troubleshooting

### Deployment Fails

**Issue**: CDK deploy fails with permission error

**Solution**:
```bash
# Check IAM permissions
aws iam get-user

# Ensure CDK bootstrap is complete
cdk bootstrap --force
```

**Issue**: Lambda function fails to deploy

**Solution**:
```bash
# Check Lambda package size
cd infrastructure/lambda
du -sh .

# If too large, exclude node_modules
# Add to .npmignore
```

### WebSocket Connection Fails

**Issue**: Cannot connect to WebSocket

**Solution**:
```bash
# Check API Gateway deployment
aws apigatewayv2 get-apis

# Check Lambda function
aws lambda get-function --function-name copilot-handler

# Check CloudWatch logs
aws logs tail /aws/lambda/copilot-handler --follow
```

### Bedrock Access Denied

**Issue**: Lambda cannot invoke Bedrock

**Solution**:
```bash
# Check IAM role permissions
aws iam get-role-policy \
  --role-name copilot-lambda-role \
  --policy-name bedrock-access

# Add Bedrock permissions if missing
aws iam put-role-policy \
  --role-name copilot-lambda-role \
  --policy-name bedrock-access \
  --policy-document file://bedrock-policy.json
```

### High Latency

**Issue**: Responses are slow

**Solution**:
```bash
# Increase Lambda memory
aws lambda update-function-configuration \
  --function-name copilot-handler \
  --memory-size 2048

# Enable provisioned concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name copilot-handler \
  --provisioned-concurrent-executions 5
```

### Rate Limit Issues

**Issue**: Users hitting rate limits

**Solution**:
```bash
# Adjust rate limits in DynamoDB
aws dynamodb update-item \
  --table-name omnitrack-rate-limits \
  --key '{"userId": {"S": "user-123"}}' \
  --update-expression "SET messagesPerMinute = :limit" \
  --expression-attribute-values '{":limit": {"N": "100"}}'
```

## Rollback Procedures

### Rollback to Previous Version

```bash
# List stack history
aws cloudformation describe-stack-events \
  --stack-name OmniTrackCopilotStack

# Rollback
cdk deploy --rollback
```

### Manual Rollback

```bash
# Get previous stack template
aws cloudformation get-template \
  --stack-name OmniTrackCopilotStack \
  --template-stage Original

# Update stack with previous template
aws cloudformation update-stack \
  --stack-name OmniTrackCopilotStack \
  --template-body file://previous-template.json
```

### Lambda Function Rollback

```bash
# List function versions
aws lambda list-versions-by-function \
  --function-name copilot-handler

# Update alias to previous version
aws lambda update-alias \
  --function-name copilot-handler \
  --name production \
  --function-version 5
```

### Database Rollback

**Warning**: DynamoDB rollback requires point-in-time recovery.

```bash
# Enable point-in-time recovery (if not enabled)
aws dynamodb update-continuous-backups \
  --table-name omnitrack-copilot-conversations \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Restore to specific time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name omnitrack-copilot-conversations \
  --target-table-name omnitrack-copilot-conversations-restored \
  --restore-date-time 2025-11-29T10:00:00Z
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy-copilot.yml`:

```yaml
name: Deploy Copilot

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd infrastructure
          npm ci
      
      - name: Run tests
        run: |
          cd infrastructure
          npm test
      
      - name: Run linter
        run: |
          cd infrastructure
          npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd infrastructure
          npm ci
      
      - name: Deploy to AWS
        run: |
          cd infrastructure
          npm run build
          npx cdk deploy --require-approval never
      
      - name: Verify deployment
        run: |
          cd infrastructure
          ./verify-deployment.sh
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - deploy

test:
  stage: test
  image: node:20
  script:
    - cd infrastructure
    - npm ci
    - npm test
    - npm run lint

deploy:
  stage: deploy
  image: node:20
  only:
    - main
  script:
    - cd infrastructure
    - npm ci
    - npm run build
    - npx cdk deploy --require-approval never
  environment:
    name: production
```

## Monitoring Deployment

### CloudWatch Dashboard

Create a dashboard to monitor deployment:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name OmniTrack-Copilot \
  --dashboard-body file://dashboard.json
```

### Deployment Metrics

Track these metrics during deployment:

- Lambda invocation count
- Lambda error rate
- API Gateway 4xx/5xx errors
- DynamoDB throttles
- Bedrock invocation count

### Health Checks

Run automated health checks:

```bash
#!/bin/bash
# health-check.sh

echo "Checking WebSocket API..."
wscat -c "$WEBSOCKET_URL" -x '{"action":"message","message":"help"}' || exit 1

echo "Checking REST API..."
curl -f "$REST_API_URL/health" || exit 1

echo "Checking Lambda function..."
aws lambda invoke --function-name copilot-handler /dev/null || exit 1

echo "All health checks passed!"
```

## Security Checklist

Before deploying to production:

- [ ] Enable encryption at rest for DynamoDB
- [ ] Enable encryption in transit (TLS 1.3)
- [ ] Configure WAF rules
- [ ] Set up VPC endpoints (if using VPC)
- [ ] Enable CloudTrail logging
- [ ] Configure security groups
- [ ] Set up secrets in AWS Secrets Manager
- [ ] Enable GuardDuty
- [ ] Configure IAM least privilege
- [ ] Enable MFA for AWS account
- [ ] Set up backup and recovery
- [ ] Configure DDoS protection

## Cost Optimization

### Estimated Monthly Costs

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M invocations | $0.20 |
| API Gateway | 1M messages | $1.00 |
| DynamoDB | 1GB storage | $0.25 |
| Bedrock | 10M tokens | $30.00 |
| CloudWatch | Logs + Metrics | $5.00 |
| **Total** | | **~$36.45** |

### Cost Reduction Tips

1. **Use Reserved Capacity** for predictable workloads
2. **Enable Auto Scaling** for DynamoDB
3. **Optimize Lambda Memory** based on actual usage
4. **Use CloudWatch Logs Insights** instead of exporting logs
5. **Set Log Retention** to appropriate duration
6. **Use Bedrock Batch** for non-real-time requests

---

## Support

For deployment support:
- 📧 Email: devops@omnitrack.ai
- 💬 Slack: #copilot-deployment
- 📚 Wiki: https://wiki.omnitrack.ai/deployment

---

**Last Updated**: November 29, 2025  
**Version**: 1.0  
**Maintainer**: OmniTrack DevOps Team
