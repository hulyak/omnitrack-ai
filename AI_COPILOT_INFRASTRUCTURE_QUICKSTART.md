# AI Copilot Infrastructure - Quick Start Guide

## Overview

This guide will help you deploy the AI Copilot infrastructure to AWS. The infrastructure includes:
- WebSocket API Gateway for real-time communication
- Lambda functions for message processing
- DynamoDB tables for conversations and connections
- IAM roles with Bedrock access for AI capabilities

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 20+ installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS account with Bedrock access enabled

## Step 1: Enable Amazon Bedrock Access

Before deploying, ensure you have access to Claude 3.5 Sonnet in Amazon Bedrock:

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access to:
   - Anthropic Claude 3.5 Sonnet v2
   - Anthropic Claude 3.5 Sonnet v1
5. Wait for access to be granted (usually instant)

## Step 2: Install Dependencies

```bash
# Install infrastructure dependencies
cd infrastructure
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..
```

## Step 3: Build the Project

```bash
# Build TypeScript code
npm run build
```

## Step 4: Bootstrap CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:

```bash
cdk bootstrap
```

## Step 5: Review Changes

Preview what will be deployed:

```bash
cdk diff
```

## Step 6: Deploy Infrastructure

Deploy the stack:

```bash
cdk deploy
```

When prompted, review the changes and type `y` to confirm.

## Step 7: Verify Deployment

After deployment completes, you'll see CloudFormation outputs including:

```
Outputs:
InfrastructureStack.CopilotWebSocketApiUrl = wss://abc123.execute-api.us-east-1.amazonaws.com/prod
InfrastructureStack.CopilotConversationsTableName = omnitrack-copilot-conversations
InfrastructureStack.CopilotConnectionsTableName = omnitrack-copilot-connections
```

Save the WebSocket URL - you'll need it for the frontend integration.

## Step 8: Test the Infrastructure

### Test WebSocket Connection

Create a test file `test-copilot.js`:

```javascript
const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';

const ws = new WebSocket(`${WEBSOCKET_URL}?userId=test-user`);

ws.on('open', () => {
  console.log('✅ Connected to AI Copilot');
  
  // Send a test message
  ws.send(JSON.stringify({
    action: 'message',
    message: 'Hello, copilot!',
    conversationId: 'test-conv-' + Date.now()
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  // Close after receiving response
  setTimeout(() => ws.close(), 1000);
});

ws.on('close', () => {
  console.log('👋 Disconnected');
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
});
```

Run the test:

```bash
node test-copilot.js
```

Expected output:
```
✅ Connected to AI Copilot
📨 Received: { type: 'acknowledgment', message: 'Message received. Processing...', timestamp: 1234567890 }
📨 Received: { type: 'message', content: 'Echo: Hello, copilot!', conversationId: 'test-conv-1234567890', timestamp: 1234567890 }
👋 Disconnected
```

### Verify DynamoDB Tables

```bash
# List tables
aws dynamodb list-tables | grep copilot

# Check conversations table
aws dynamodb describe-table --table-name omnitrack-copilot-conversations

# Check connections table
aws dynamodb describe-table --table-name omnitrack-copilot-connections
```

### Check Lambda Functions

```bash
# List copilot Lambda functions
aws lambda list-functions | grep copilot

# View logs
aws logs tail /aws/lambda/omnitrack-copilot-message --follow
```

## Step 9: Configure Frontend

Update your frontend environment variables with the WebSocket URL:

```bash
# frontend/.env.local
NEXT_PUBLIC_COPILOT_WEBSOCKET_URL=wss://abc123.execute-api.us-east-1.amazonaws.com/prod
```

## Troubleshooting

### Issue: CDK deploy fails with "Access Denied"

**Solution:** Ensure your AWS credentials have sufficient permissions:
- CloudFormation
- Lambda
- DynamoDB
- API Gateway
- IAM
- KMS
- CloudWatch Logs

### Issue: Bedrock access denied

**Solution:** 
1. Go to AWS Console → Amazon Bedrock → Model access
2. Enable access to Claude 3.5 Sonnet models
3. Wait a few minutes for access to propagate
4. Redeploy: `cdk deploy`

### Issue: WebSocket connection fails

**Solution:**
1. Check API Gateway logs:
   ```bash
   aws logs tail /aws/apigateway/omnitrack-copilot-websocket --follow
   ```
2. Verify Lambda function is deployed:
   ```bash
   aws lambda get-function --function-name omnitrack-copilot-connect
   ```

### Issue: Lambda timeout

**Solution:** The message handler has a 60-second timeout. If you need more time:
1. Edit `infrastructure/lib/infrastructure-stack.ts`
2. Increase timeout: `timeout: cdk.Duration.seconds(120)`
3. Redeploy: `cdk deploy`

## Monitoring

### CloudWatch Dashboards

View the OmniTrack Operations Dashboard:
```bash
aws cloudwatch get-dashboard --dashboard-name OmniTrack-Operations-Dashboard
```

### Key Metrics to Monitor

- **WebSocket Connections:** Active connection count
- **Message Processing:** Lambda invocation count and duration
- **Error Rate:** Lambda errors and API Gateway 5xx errors
- **DynamoDB:** Read/write capacity and throttling

### Set Up Alarms

Create CloudWatch alarms for:
- High error rate (> 5%)
- High latency (> 2s)
- Lambda throttling
- DynamoDB throttling

## Cost Optimization

### Development Environment

For development, you can reduce costs by:
1. Using smaller Lambda memory (256 MB instead of 1024 MB)
2. Reducing log retention (7 days instead of 30 days)
3. Using DynamoDB on-demand pricing (already configured)

### Production Environment

For production, consider:
1. Reserved capacity for DynamoDB if usage is predictable
2. Lambda provisioned concurrency for consistent performance
3. CloudWatch Logs Insights for log analysis
4. AWS Cost Explorer for cost tracking

## Next Steps

Now that the infrastructure is deployed, you can:

1. **Implement Bedrock Integration** (Task 2)
   - Create BedrockService class
   - Implement intent classification
   - Add streaming responses

2. **Build Action Registry** (Task 3)
   - Define action interfaces
   - Implement parameter validation
   - Register actions

3. **Implement Copilot Actions** (Task 4)
   - Node management actions
   - Configuration actions
   - Analysis actions

## Cleanup

To remove all infrastructure:

```bash
cd infrastructure
cdk destroy
```

**Warning:** This will delete all DynamoDB tables and their data. Make sure to backup any important data first.

## Support

For issues or questions:
- Check the [README](infrastructure/lambda/copilot/README.md)
- Review [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
- Check [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

---

**Status:** Infrastructure Ready ✅
**Next:** Implement Bedrock Integration (Task 2)
**Date:** November 28, 2025
