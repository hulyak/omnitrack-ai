# OmniTrack AI Infrastructure Deployment Guide

This guide walks you through deploying the OmniTrack AI infrastructure to AWS using AWS CDK.

## Prerequisites

### Required Tools

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **AWS CDK** - Installed via npm (included in dependencies)
4. **jq** - JSON processor for parsing outputs (optional but recommended)

### AWS Account Setup

1. **AWS Account** - You need an AWS account with appropriate permissions
2. **IAM Permissions** - Your IAM user/role needs permissions to:
   - Create CloudFormation stacks
   - Create VPCs, subnets, security groups
   - Create DynamoDB tables
   - Create Lambda functions
   - Create API Gateway APIs
   - Create Cognito User Pools
   - Create S3 buckets
   - Create IAM roles and policies
   - Create CloudWatch logs and alarms
   - Create ElastiCache clusters
   - Create IoT rules
   - Create KMS keys
   - Create Secrets Manager secrets
   - Create WAF Web ACLs

3. **AWS Credentials** - Configure AWS CLI with your credentials:
   ```bash
   aws configure
   ```

## Configuration

### 1. Environment Variables

Copy the example environment file and configure it:

```bash
cd infrastructure
cp .env.example .env
```

Edit `.env` with your values:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=491056652484  # Your AWS account ID
AWS_REGION=us-east-1         # Your preferred region

# Environment
ENVIRONMENT=production        # production, staging, or development

# Stack Configuration
STACK_NAME=omnitrack-ai      # CloudFormation stack name

# DynamoDB Configuration
DYNAMODB_BILLING_MODE=PAY_PER_REQUEST

# Lambda Configuration
LAMBDA_MEMORY_SIZE=1024
LAMBDA_TIMEOUT=30

# API Gateway Configuration
API_THROTTLE_RATE_LIMIT=1000
API_THROTTLE_BURST_LIMIT=2000

# Alert Email Addresses (optional)
CRITICAL_ALERT_EMAIL=oncall@example.com
TEAM_ALERT_EMAIL=team@example.com
```

### 2. Verify Configuration

Check your AWS account and region:

```bash
aws sts get-caller-identity
aws configure get region
```

## Deployment Steps

### Step 1: Install Dependencies

```bash
cd infrastructure
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

### Step 3: Bootstrap CDK (First Time Only)

If this is your first time using CDK in this account/region:

```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION
```

Or use the automated script:

```bash
./deploy.sh
```

The script will automatically bootstrap if needed.

### Step 4: Review Changes

Preview what will be deployed:

```bash
npx cdk diff
```

### Step 5: Deploy Infrastructure

**Option A: Using the deployment script (Recommended)**

```bash
./deploy.sh
```

The script will:
- Validate environment variables
- Check AWS credentials
- Install dependencies
- Build TypeScript
- Bootstrap CDK if needed
- Show deployment diff
- Ask for confirmation
- Deploy the stack
- Save outputs to `.env.production`

**Option B: Manual deployment**

```bash
npx cdk deploy --require-approval never --outputs-file outputs.json
```

### Step 6: Verify Deployment

After deployment completes, verify the resources:

```bash
# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name omnitrack-ai --region us-east-1

# Check API Gateway
aws apigateway get-rest-apis --region us-east-1

# Check Lambda functions
aws lambda list-functions --region us-east-1 | grep omnitrack

# Check DynamoDB tables
aws dynamodb list-tables --region us-east-1 | grep omnitrack

# Check Cognito User Pool
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

## Post-Deployment Configuration

### 1. Update Frontend Environment Variables

Copy the generated `.env.production` values to your frontend:

```bash
cp .env.production ../frontend/.env.production
```

Or manually update `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-ws-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COPILOT_WEBSOCKET_URL=wss://your-copilot-ws-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Configure Bedrock Access

Ensure your AWS account has access to Amazon Bedrock:

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Request access to "Claude 3.5 Sonnet"
4. Wait for approval (usually instant)

### 3. Set Up Custom Domain (Optional)

If you want to use a custom domain:

1. Register a domain in Route 53 or use an existing domain
2. Create an ACM certificate for your domain
3. Update the CDK stack to add custom domain configuration
4. Redeploy the stack

### 4. Configure SNS Email Subscriptions

Confirm the SNS email subscriptions:

1. Check your email for subscription confirmation emails
2. Click the confirmation links
3. Verify subscriptions in AWS Console → SNS

### 5. Review CloudWatch Dashboard

Access the CloudWatch dashboard:

```bash
# Get dashboard URL from outputs
cat outputs.json | jq -r '.["omnitrack-ai"].DashboardUrl'
```

Or navigate to: AWS Console → CloudWatch → Dashboards → OmniTrack-Operations-Dashboard

## Testing the Deployment

### 1. Test REST API

```bash
# Get API URL
API_URL=$(cat outputs.json | jq -r '.["omnitrack-ai"].RestApiUrl')

# Test health endpoint (if implemented)
curl $API_URL/health

# Test authentication
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fullname": "Test User"
  }'
```

### 2. Test WebSocket Connection

Use a WebSocket client or the frontend application to test WebSocket connectivity.

### 3. Test Copilot WebSocket

Connect to the Copilot WebSocket API and send a test message.

### 4. Monitor Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/omnitrack-copilot-message --follow

# View API Gateway logs
aws logs tail /aws/apigateway/omnitrack-copilot-websocket --follow
```

## Monitoring and Maintenance

### CloudWatch Alarms

The deployment creates several CloudWatch alarms:

- **API Error Rate** - Alerts when 5xx errors exceed 5%
- **API Latency** - Alerts when p95 latency exceeds 2 seconds
- **DynamoDB Throttles** - Alerts when read/write requests are throttled
- **Lambda Errors** - Alerts when Lambda error rate exceeds 5%
- **Lambda Throttles** - Alerts when Lambda functions are throttled

### CloudWatch Dashboard

Access the operations dashboard to monitor:

- API Gateway request count and error rates
- API Gateway latency (p50, p95, p99)
- Lambda invocations, errors, and throttles
- Lambda duration and concurrent executions
- DynamoDB read/write capacity and throttles
- System health summary

### Logs

Logs are organized in CloudWatch Log Groups:

- `/aws/lambda/omnitrack-*` - Lambda function logs
- `/aws/apigateway/*` - API Gateway access logs
- `/aws/omnitrack/application` - Application logs
- `/aws/omnitrack/errors` - Error logs
- `/aws/iot/omnitrack/errors` - IoT error logs

## Updating the Infrastructure

### Update Stack

After making changes to the CDK code:

```bash
# Build TypeScript
npm run build

# Preview changes
npx cdk diff

# Deploy updates
./deploy.sh
```

### Rollback

If deployment fails or you need to rollback:

```bash
# Rollback to previous version
aws cloudformation rollback-stack --stack-name omnitrack-ai --region us-east-1

# Or delete and redeploy
./destroy.sh
./deploy.sh
```

## Destroying the Infrastructure

**WARNING: This will permanently delete all data!**

```bash
./destroy.sh
```

The script will:
- Ask for confirmation (type "DELETE")
- Destroy all infrastructure
- Clean up generated files

## Cost Optimization

### Development Environment

For development, consider:

- Using smaller instance types (t3.micro for Redis)
- Reducing Lambda memory allocations
- Using on-demand billing for DynamoDB
- Reducing log retention periods
- Disabling unnecessary features

### Production Environment

For production, consider:

- Using provisioned capacity for DynamoDB (if predictable load)
- Enabling DynamoDB auto-scaling
- Using reserved capacity for ElastiCache
- Implementing S3 lifecycle policies
- Using CloudFront for static assets
- Enabling cost allocation tags

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Failed

**Error**: "CDK bootstrap failed"

**Solution**:
```bash
# Manually bootstrap with verbose output
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION --verbose
```

#### 2. Insufficient Permissions

**Error**: "User is not authorized to perform..."

**Solution**: Ensure your IAM user/role has the required permissions listed in Prerequisites.

#### 3. Resource Limit Exceeded

**Error**: "LimitExceededException"

**Solution**: Request a service quota increase in AWS Service Quotas.

#### 4. VPC Limit Reached

**Error**: "VPC limit exceeded"

**Solution**: Delete unused VPCs or request a limit increase.

#### 5. Bedrock Access Denied

**Error**: "Access denied to Bedrock model"

**Solution**: Request model access in Amazon Bedrock console.

#### 6. Stack Rollback

**Error**: Stack creation failed and rolled back

**Solution**:
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name omnitrack-ai --region us-east-1

# Delete failed stack
aws cloudformation delete-stack --stack-name omnitrack-ai --region us-east-1

# Retry deployment
./deploy.sh
```

### Getting Help

- Check CloudFormation events in AWS Console
- Review CloudWatch logs
- Check CDK documentation: https://docs.aws.amazon.com/cdk/
- Review AWS service limits
- Contact AWS Support

## Security Best Practices

1. **Rotate Credentials** - Regularly rotate AWS access keys and secrets
2. **Enable MFA** - Enable multi-factor authentication for AWS accounts
3. **Review IAM Policies** - Regularly review and audit IAM policies
4. **Enable CloudTrail** - Enable AWS CloudTrail for audit logging
5. **Encrypt Data** - Ensure all data is encrypted at rest and in transit
6. **Monitor Alerts** - Respond to CloudWatch alarms promptly
7. **Update Dependencies** - Keep CDK and dependencies up to date
8. **Backup Data** - Regularly backup DynamoDB tables and S3 buckets

## Next Steps

After successful deployment:

1. ✅ Deploy frontend application
2. ✅ Create test users in Cognito
3. ✅ Test all API endpoints
4. ✅ Configure custom domain
5. ✅ Set up CI/CD pipeline
6. ✅ Configure monitoring and alerting
7. ✅ Perform load testing
8. ✅ Document operational procedures
9. ✅ Train team on monitoring and troubleshooting
10. ✅ Plan disaster recovery procedures

## Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [OmniTrack AI Documentation](../docs/README.md)

---

**Last Updated**: November 28, 2024
**Version**: 1.0.0
