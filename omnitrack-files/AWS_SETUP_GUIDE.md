# AWS Bedrock & DynamoDB Setup Guide for OmniTrack AI

## Overview

This guide walks you through setting up AWS Bedrock and DynamoDB for the OmniTrack AI application. Follow these steps to get your backend infrastructure running.

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Node.js 20+ installed
- AWS CDK installed (`npm install -g aws-cdk`)

## Part 1: AWS Account Setup

### 1.1 Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Enter your credentials:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### 1.2 Set Environment Variables

```bash
# In infrastructure/.env
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1
ENVIRONMENT=development
```

## Part 2: Amazon Bedrock Setup

### 2.1 Bedrock Model Access (Automatic!)

🎉 **Great News!** AWS has simplified Bedrock access. The **model access page has been retired** because foundation models are now **automatically enabled** when you first use them across all AWS commercial regions.

**What This Means:**
- ✅ No manual model activation required
- ✅ Models auto-enable on first API call
- ✅ Works across all AWS regions
- ✅ Instant access - no waiting for approval

**For Anthropic Claude Models:**
- Some first-time users may need to submit use case details
- This happens automatically when you first invoke the model
- No manual approval process through the console needed

**Models Available:**
- **Anthropic Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
- **Anthropic Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
- **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)

**Check Available Models (Optional):**

```bash
# List all available Bedrock models
aws bedrock list-foundation-models --region us-east-1

# Filter for Anthropic models
aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic
```

### 2.2 Verify Bedrock Access

Run the verification script:

```bash
cd infrastructure/lambda
npx ts-node demo/verify-bedrock-access.ts
```

Expected output:
```
✅ Bedrock access verified
✅ Claude 3 Sonnet available
✅ Claude 3 Haiku available
✅ Response time: <3s
```

### 2.3 Configure IAM Permissions for Bedrock

The Lambda functions need permissions to invoke Bedrock models. This is already configured in the CDK stack, but here's what it includes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
      ]
    }
  ]
}
```

## Part 3: DynamoDB Setup

### 3.1 Understanding the Table Design

OmniTrack uses a **single-table design** with the following structure:

**Main Table: `omnitrack-main`**
- **Partition Key (PK)**: Primary identifier
- **Sort Key (SK)**: Secondary identifier for sorting
- **GSI1**: Query by type and timestamp
- **GSI2**: Query by status and priority

**Access Patterns:**

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| User | `USER#<userId>` | `PROFILE` | `USER` | `<timestamp>` |
| Node | `NODE#<nodeId>` | `METADATA` | `NODE#<type>` | `<timestamp>` |
| Alert | `ALERT#<alertId>` | `DETAILS` | `ALERT#<severity>` | `<timestamp>` |
| Scenario | `SCENARIO#<scenarioId>` | `METADATA` | `SCENARIO#<status>` | `<timestamp>` |

### 3.2 Deploy DynamoDB with CDK

```bash
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# Deploy the stack
cdk deploy

# Confirm deployment when prompted
```

This will create:
- ✅ DynamoDB table with encryption
- ✅ Global Secondary Indexes (GSI1, GSI2)
- ✅ Point-in-time recovery enabled
- ✅ DynamoDB Streams enabled
- ✅ KMS encryption key

### 3.3 Verify DynamoDB Table

```bash
# List tables
aws dynamodb list-tables --region us-east-1

# Describe the table
aws dynamodb describe-table \
  --table-name omnitrack-main \
  --region us-east-1

# Check table status
aws dynamodb describe-table \
  --table-name omnitrack-main \
  --query 'Table.TableStatus' \
  --region us-east-1
```

Expected output: `"ACTIVE"`

### 3.4 Seed Demo Data

```bash
cd scripts

# Install dependencies
npm install

# Seed demo data
npx ts-node seed-demo-data.ts
```

This will populate:
- 5 supply chain nodes
- 10 sample alerts
- 3 demo scenarios
- 2 test users

## Part 4: Connect Frontend to Backend

### 4.1 Update API Routes to Use Lambda

Currently, the Next.js API routes return demo data. To connect to real Lambda functions:

**Update `frontend/app/api/agents/info/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();
    
    // Get auth token from request
    const authToken = request.headers.get('authorization');
    
    // Call Lambda function via API Gateway
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/agents/info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken || '',
        },
        body: JSON.stringify({ action, params }),
      }
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Info agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process info agent request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

### 4.2 Add Environment Variables

**Create `frontend/.env.local`:**

```bash
# API Gateway URL (from CDK output)
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
```

Get these values from CDK output:

```bash
cd infrastructure
cdk deploy --outputs-file outputs.json
cat outputs.json
```

## Part 5: Testing the Integration

### 5.1 Test Bedrock Integration

```bash
# Test Info Agent
curl -X POST https://your-api-url/agents/info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "scan", "params": {}}'

# Expected: JSON response with anomalies
```

### 5.2 Test DynamoDB Integration

```bash
# Query nodes
aws dynamodb query \
  --table-name omnitrack-main \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"NODE#supplier-001"}}' \
  --region us-east-1

# Expected: Node data returned
```

### 5.3 Test End-to-End Flow

1. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Visit:** http://localhost:3000

3. **Test flow:**
   - Click "Get Started"
   - Click "Demo Mode" (or signup/login)
   - Click "🔍 Scan for Anomalies"
   - Verify results appear

## Part 6: Monitoring & Troubleshooting

### 6.1 CloudWatch Logs

**View Lambda logs:**

```bash
# List log groups
aws logs describe-log-groups --region us-east-1

# Tail logs for Info Agent
aws logs tail /aws/lambda/omnitrack-info-agent --follow --region us-east-1
```

### 6.2 CloudWatch Metrics

**Monitor Bedrock usage:**

```bash
# Get Bedrock invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-3-sonnet-20240229-v1:0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

**Monitor DynamoDB:**

```bash
# Get read/write capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=omnitrack-main \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

### 6.3 Common Issues

**Issue: "AccessDeniedException" from Bedrock**

Solution:
1. Verify model access in Bedrock console
2. Check IAM permissions on Lambda role
3. Ensure correct region (us-east-1)

**Issue: "ResourceNotFoundException" from DynamoDB**

Solution:
1. Verify table exists: `aws dynamodb list-tables`
2. Check table name in environment variables
3. Ensure CDK deployment completed successfully

**Issue: "ThrottlingException" from Bedrock**

Solution:
1. Implement exponential backoff in code
2. Request quota increase in Service Quotas
3. Consider provisioned throughput

**Issue: High Bedrock costs**

Solution:
1. Use Claude 3 Haiku for simple tasks (10x cheaper)
2. Implement response caching
3. Set CloudWatch alarms for cost monitoring
4. Review token usage in CloudWatch metrics

## Part 7: Cost Optimization

### 7.1 Bedrock Costs

**Pricing (per 1M tokens):**
- Claude 3 Haiku: $0.25 input, $1.25 output
- Claude 3 Sonnet: $3.00 input, $15.00 output
- Claude 3.5 Sonnet: $3.00 input, $15.00 output

**Estimated costs per agent call:**
- Info Agent: ~$0.01 (1K tokens)
- Scenario Agent: ~$0.03 (2K tokens)
- Strategy Agent: ~$0.02 (1.5K tokens)
- Impact Agent: ~$0.005 (500 tokens with Haiku)

**Monthly estimate (1000 users, 10 calls/day):**
- Total calls: 300,000/month
- Estimated cost: $150-300/month

### 7.2 DynamoDB Costs

**On-Demand Pricing:**
- Write: $1.25 per million requests
- Read: $0.25 per million requests
- Storage: $0.25 per GB/month

**Estimated costs (1000 users):**
- Writes: ~$50/month
- Reads: ~$25/month
- Storage: ~$5/month
- **Total: ~$80/month**

### 7.3 Cost Monitoring

Set up billing alerts:

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts --region us-east-1

# Subscribe to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-bedrock-cost \
  --alarm-description "Alert when Bedrock costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT:billing-alerts \
  --region us-east-1
```

## Part 8: Production Deployment

### 8.1 Deploy to Production

```bash
cd infrastructure

# Set production environment
export ENVIRONMENT=production

# Deploy with production settings
cdk deploy --context environment=production

# Verify deployment
aws cloudformation describe-stacks \
  --stack-name omnitrack-ai-production \
  --region us-east-1
```

### 8.2 Configure Custom Domain

```bash
# Create certificate in ACM
aws acm request-certificate \
  --domain-name api.omnitrack.ai \
  --validation-method DNS \
  --region us-east-1

# Add custom domain to API Gateway
aws apigateway create-domain-name \
  --domain-name api.omnitrack.ai \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID \
  --region us-east-1
```

### 8.3 Enable Production Features

- ✅ Enable CloudWatch alarms
- ✅ Configure backup retention (30 days)
- ✅ Enable AWS WAF rules
- ✅ Set up CloudFront distribution
- ✅ Configure Route 53 DNS
- ✅ Enable AWS Shield Standard

## Quick Reference

### Useful Commands

```bash
# Check Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Query DynamoDB
aws dynamodb scan --table-name omnitrack-main --limit 10 --region us-east-1

# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow --region us-east-1

# Get API Gateway URL
aws apigateway get-rest-apis --region us-east-1

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name omnitrack-ai --region us-east-1
```

### Environment Variables Reference

```bash
# Infrastructure
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1
ENVIRONMENT=development

# Frontend
NEXT_PUBLIC_API_URL=https://api-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Next Steps

1. ✅ Complete AWS setup (Bedrock + DynamoDB)
2. ✅ Deploy infrastructure with CDK
3. ✅ Seed demo data
4. ⏭️ Connect frontend to Lambda functions
5. ⏭️ Test end-to-end flow
6. ⏭️ Deploy to production
7. ⏭️ Monitor costs and performance

## Support

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Bedrock Guide**: https://docs.aws.amazon.com/bedrock/
- **DynamoDB Guide**: https://docs.aws.amazon.com/dynamodb/
- **CDK Guide**: https://docs.aws.amazon.com/cdk/

---

**Last Updated**: November 28, 2025
**Status**: Ready for deployment
**Estimated Setup Time**: 30-45 minutes
