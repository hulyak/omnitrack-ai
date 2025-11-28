# Deployment Scripts

This directory contains scripts for deploying and managing OmniTrack AI environments.

## Available Scripts

### `deploy-staging.sh`

Deploys the complete OmniTrack AI application to the staging environment.

**Usage:**
```bash
./scripts/deploy-staging.sh
```

**What it does:**
1. Validates AWS credentials and environment
2. Deploys infrastructure using AWS CDK
3. Extracts stack outputs (API URLs, Cognito config, etc.)
4. Builds frontend application with correct environment variables
5. Verifies deployment health

**Prerequisites:**
- AWS CLI configured with appropriate credentials
- Node.js 20.x or later
- AWS CDK installed globally
- jq (JSON processor)

**Environment Variables:**
- `AWS_REGION`: Target AWS region (default: us-east-1)
- `AWS_PROFILE`: AWS CLI profile to use (optional)

### `verify-staging.sh`

Verifies that all components of the staging deployment are working correctly.

**Usage:**
```bash
./scripts/verify-staging.sh
```

**What it checks:**
1. DynamoDB table status
2. Cognito User Pool configuration
3. API Gateway accessibility
4. WebSocket API availability
5. Lambda function deployment
6. S3 bucket creation
7. CloudWatch log groups

**Output:**
- ✓ Green checkmarks for successful checks
- ⚠ Yellow warnings for inconclusive checks
- ✗ Red errors for failed checks

## Deployment Workflow

### First-Time Deployment

```bash
# 1. Configure AWS credentials
export AWS_PROFILE=staging
export AWS_REGION=us-east-1

# 2. Update environment files
# Edit infrastructure/.env.staging
# Edit frontend/.env.staging

# 3. Run deployment
./scripts/deploy-staging.sh

# 4. Verify deployment
./scripts/verify-staging.sh

# 5. Run integration tests
cd infrastructure && npm run test:integration

# 6. Run E2E tests
cd frontend && npm run test:e2e
```

### Subsequent Deployments

```bash
# Quick deployment (assumes environment is already configured)
./scripts/deploy-staging.sh

# Verify changes
./scripts/verify-staging.sh
```

### Rollback

```bash
cd infrastructure
npx cdk destroy --all
```

## Script Details

### deploy-staging.sh

**Exit Codes:**
- `0`: Successful deployment
- `1`: Deployment failed (check error messages)

**Outputs:**
- `infrastructure/cdk-outputs.json`: CDK stack outputs
- `frontend/.env.local`: Frontend environment configuration

**Logs:**
- Console output with colored status messages
- CloudWatch Logs for detailed application logs

### verify-staging.sh

**Exit Codes:**
- `0`: All checks passed or warnings only
- `1`: One or more critical checks failed

**Checks Performed:**
1. **DynamoDB**: Table exists and is ACTIVE
2. **Cognito**: User Pool exists and is configured
3. **API Gateway**: REST API is accessible
4. **WebSocket**: WebSocket API exists
5. **Lambda**: Functions are deployed
6. **S3**: Buckets are created
7. **CloudWatch**: Log groups exist

## Troubleshooting

### Script Fails with "AWS CLI not installed"

Install AWS CLI:
```bash
# macOS
brew install awscli

# Linux
pip install awscli

# Windows
# Download from https://aws.amazon.com/cli/
```

### Script Fails with "jq not found"

Install jq:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
# Download from https://stedolan.github.io/jq/
```

### CDK Bootstrap Error

Run CDK bootstrap:
```bash
cd infrastructure
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

### Permission Denied

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Deployment Timeout

Increase timeout in CDK stack or check CloudWatch Logs for errors:
```bash
aws logs tail /aws/omnitrack/errors --follow
```

## Best Practices

1. **Always verify** after deployment
2. **Run tests** before promoting to production
3. **Monitor CloudWatch** during and after deployment
4. **Keep backups** of CDK outputs and environment files
5. **Document changes** in deployment notes
6. **Use version control** for all configuration changes

## Security Notes

- Never commit `.env` files with real credentials
- Use AWS Secrets Manager for sensitive data
- Rotate credentials regularly
- Enable MFA for AWS accounts
- Review IAM permissions periodically

## Additional Resources

- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Infrastructure README](../infrastructure/README.md)
- [Frontend README](../frontend/README.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
