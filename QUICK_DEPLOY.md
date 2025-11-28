# Quick Deploy Reference

## Prerequisites Checklist

- [ ] AWS CLI installed and configured
- [ ] Node.js 20.x or later
- [ ] AWS CDK installed: `npm install -g aws-cdk`
- [ ] jq installed: `brew install jq` (macOS) or `sudo apt-get install jq` (Linux)
- [ ] AWS credentials configured for staging account

## One-Command Deploy

```bash
./scripts/deploy-staging.sh
```

## Step-by-Step Deploy

```bash
# 1. Set AWS credentials
export AWS_PROFILE=staging
export AWS_REGION=us-east-1

# 2. Update environment files
# Edit infrastructure/.env.staging (add your AWS account ID)
# Edit frontend/.env.staging (optional)

# 3. Deploy infrastructure
cd infrastructure
npm ci
npm run build
npx cdk bootstrap  # First time only
npx cdk deploy --all --require-approval never --outputs-file cdk-outputs.json

# 4. Build frontend
cd ../frontend
npm ci
npm run build

# 5. Verify
cd ..
./scripts/verify-staging.sh

# 6. Test
cd infrastructure && npm run test:integration
cd ../frontend && npm run test:e2e
```

## Quick Verify

```bash
./scripts/verify-staging.sh
```

## Quick Test

```bash
# Integration tests
cd infrastructure && npm run test:integration

# E2E tests
cd frontend && npm run test:e2e
```

## Quick Rollback

```bash
cd infrastructure
npx cdk destroy --all
```

## Troubleshooting

### AWS Credentials
```bash
aws sts get-caller-identity
```

### View Logs
```bash
aws logs tail /aws/omnitrack/application --follow
```

### Check Resources
```bash
# DynamoDB
aws dynamodb list-tables | grep omnitrack

# Lambda
aws lambda list-functions | grep omnitrack

# API Gateway
aws apigateway get-rest-apis
```

## Important URLs

After deployment, find these in `infrastructure/cdk-outputs.json`:

- REST API: `RestApiUrl`
- WebSocket: `WebSocketApiUrl`
- User Pool ID: `UserPoolId`
- Client ID: `UserPoolClientId`

## Quick Commands

```bash
# Extract API URL
jq -r '.InfrastructureStack.RestApiUrl' infrastructure/cdk-outputs.json

# Test API
curl $(jq -r '.InfrastructureStack.RestApiUrl' infrastructure/cdk-outputs.json)/marketplace/scenarios

# View dashboard
open $(jq -r '.InfrastructureStack.DashboardUrl' infrastructure/cdk-outputs.json)
```

## Support

- Full guide: `DEPLOYMENT_GUIDE.md`
- Status: `STAGING_DEPLOYMENT_STATUS.md`
- Summary: `TASK_31_SUMMARY.md`
- Scripts: `scripts/README.md`
