# AI Copilot Infrastructure Setup - Task 1 Complete

## Summary

Successfully implemented Task 1: Set up AWS infrastructure for the AI Copilot. All required infrastructure components have been added to the CDK stack and are ready for deployment.

## What Was Implemented

### 1. DynamoDB Tables ✅

#### Copilot Conversations Table
- **Table Name:** `omnitrack-copilot-conversations`
- **Partition Key:** `conversationId` (STRING)
- **Sort Key:** `timestamp` (NUMBER)
- **Features:**
  - Point-in-time recovery enabled
  - KMS encryption with customer-managed key
  - TTL attribute for auto-deletion after 30 days
  - GSI: `UserIdIndex` (userId + timestamp) for querying by user
- **Purpose:** Stores conversation history for context and analysis

#### Copilot Connections Table
- **Table Name:** `omnitrack-copilot-connections`
- **Partition Key:** `connectionId` (STRING)
- **Features:**
  - KMS encryption with customer-managed key
  - TTL attribute for auto-cleanup of stale connections
  - GSI: `UserIdIndex` (userId) for querying by user
- **Purpose:** Tracks active WebSocket connections

### 2. WebSocket API Gateway ✅

- **API Name:** `omnitrack-copilot-websocket-api`
- **Protocol:** WebSocket
- **Stage:** `prod` with auto-deploy
- **Features:**
  - CloudWatch logging enabled
  - X-Ray tracing enabled
  - Throttling: 500 req/sec rate limit, 1000 burst limit
  - Access logs with structured JSON format
- **Routes:**
  - `$connect` - Connection establishment
  - `$disconnect` - Connection cleanup
  - `message` - Message processing
  - `$default` - Default message handler

### 3. Lambda Functions ✅

#### Copilot Connect Handler
- **Function Name:** `omnitrack-copilot-connect`
- **Runtime:** Node.js 20
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **Purpose:** Handles new WebSocket connections and stores connection info

#### Copilot Disconnect Handler
- **Function Name:** `omnitrack-copilot-disconnect`
- **Runtime:** Node.js 20
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **Purpose:** Handles disconnections and cleans up connection records

#### Copilot Message Handler
- **Function Name:** `omnitrack-copilot-message`
- **Runtime:** Node.js 20
- **Memory:** 1024 MB (for AI processing)
- **Timeout:** 60 seconds (for Bedrock API calls)
- **Purpose:** Processes incoming messages and orchestrates copilot logic

### 4. IAM Roles and Permissions ✅

#### Copilot Execution Role
Created dedicated IAM role with permissions for:
- **DynamoDB:** Read/Write on conversations, connections, and main tables
- **Bedrock:** InvokeModel and InvokeModelWithResponseStream
  - Model: `anthropic.claude-3-5-sonnet-20241022-v2:0`
  - Model: `anthropic.claude-3-5-sonnet-20240620-v1:0`
- **API Gateway:** ManageConnections for sending messages
- **KMS:** Decrypt for encrypted data
- **Secrets Manager:** Read for API keys
- **CloudWatch:** Logs and X-Ray tracing

### 5. Environment Variables ✅

All Lambda functions configured with:
```typescript
{
  USER_POOL_ID: string;              // Cognito User Pool ID
  USER_POOL_CLIENT_ID: string;       // Cognito Client ID
  TABLE_NAME: string;                // Main DynamoDB table
  CONVERSATIONS_TABLE_NAME: string;  // Conversations table
  CONNECTIONS_TABLE_NAME: string;    // Connections table
  SECRETS_ARN: string;               // Secrets Manager ARN
  KMS_KEY_ID: string;                // KMS key ID
  BEDROCK_MODEL_ID: string;          // Claude 3.5 Sonnet model ID
  BEDROCK_REGION: string;            // AWS region for Bedrock
  WEBSOCKET_API_ENDPOINT: string;    // WebSocket API endpoint
}
```

### 6. CloudFormation Outputs ✅

Added stack outputs for:
- `CopilotWebSocketApiId` - WebSocket API ID
- `CopilotWebSocketApiUrl` - WebSocket connection URL
- `CopilotConversationsTableName` - Conversations table name
- `CopilotConnectionsTableName` - Connections table name
- `CopilotMessageFunctionArn` - Message handler Lambda ARN

### 7. Lambda Handler Implementation ✅

Created `infrastructure/lambda/copilot/websocket-handler.ts` with:
- **connectHandler:** Stores connection info in DynamoDB
- **disconnectHandler:** Cleans up connection records
- **messageHandler:** Processes messages (placeholder for full implementation)

Features:
- Structured logging with correlation IDs
- Error handling with user-friendly messages
- WebSocket message sending capability
- Conversation history storage

## Files Created/Modified

### Created Files
1. `infrastructure/lambda/copilot/websocket-handler.ts` - WebSocket handlers
2. `infrastructure/lambda/copilot/README.md` - Documentation
3. `infrastructure/lambda/copilot/INFRASTRUCTURE_SETUP_SUMMARY.md` - This file

### Modified Files
1. `infrastructure/lib/infrastructure-stack.ts` - Added copilot infrastructure
2. `infrastructure/lambda/package.json` - Added API Gateway Management API SDK

## Deployment Instructions

### 1. Install Dependencies
```bash
cd infrastructure/lambda
npm install
```

### 2. Build Infrastructure
```bash
cd infrastructure
npm run build
```

### 3. Deploy Stack
```bash
cdk deploy
```

### 4. Verify Deployment
After deployment, check CloudFormation outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name InfrastructureStack \
  --query 'Stacks[0].Outputs' \
  --output table
```

Look for:
- `CopilotWebSocketApiUrl` - Use this URL for WebSocket connections
- `CopilotConversationsTableName` - Verify table exists
- `CopilotConnectionsTableName` - Verify table exists

## Testing the Infrastructure

### 1. Test WebSocket Connection
```javascript
const WebSocket = require('ws');

const ws = new WebSocket(
  'wss://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod?userId=test-user'
);

ws.on('open', () => {
  console.log('Connected to copilot');
  
  // Send a test message
  ws.send(JSON.stringify({
    action: 'message',
    message: 'Hello, copilot!',
    conversationId: 'test-conv-123'
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data.toString()));
});

ws.on('error', (error) => {
  console.error('Error:', error);
});
```

### 2. Verify DynamoDB Tables
```bash
# Check conversations table
aws dynamodb describe-table \
  --table-name omnitrack-copilot-conversations

# Check connections table
aws dynamodb describe-table \
  --table-name omnitrack-copilot-connections
```

### 3. Check Lambda Logs
```bash
# View connect handler logs
aws logs tail /aws/lambda/omnitrack-copilot-connect --follow

# View message handler logs
aws logs tail /aws/lambda/omnitrack-copilot-message --follow
```

## Security Considerations

### ✅ Implemented
- KMS encryption for all DynamoDB tables
- IAM role with least-privilege permissions
- Bedrock access restricted to specific model ARNs
- CloudWatch logging enabled for audit trail
- X-Ray tracing for request tracking
- TTL for automatic data cleanup

### 🔄 To Be Implemented (Future Tasks)
- JWT token validation on connection
- Per-user rate limiting
- Input sanitization and validation
- PII masking in logs
- Custom authorizer for WebSocket API

## Monitoring and Observability

### CloudWatch Logs
- `/aws/apigateway/omnitrack-copilot-websocket` - API Gateway logs
- `/aws/lambda/omnitrack-copilot-connect` - Connect handler logs
- `/aws/lambda/omnitrack-copilot-disconnect` - Disconnect handler logs
- `/aws/lambda/omnitrack-copilot-message` - Message handler logs

### Metrics to Monitor
- WebSocket connection count
- Message processing latency
- Lambda invocation count
- Lambda error rate
- DynamoDB read/write capacity
- Bedrock API call duration (future)

### Alarms to Set Up (Future)
- High error rate (> 5%)
- High latency (> 2s)
- Connection failures
- DynamoDB throttling

## Next Steps

With the infrastructure in place, the next tasks are:

### Task 2: Implement Bedrock Integration Service
- Create BedrockService class
- Implement intent classification
- Implement response generation
- Add streaming support

### Task 3: Build Action Registry System
- Create Action interface
- Implement ActionRegistry class
- Add parameter validation
- Register initial actions

### Task 4: Implement Core Copilot Actions
- Node management actions (add/remove/update)
- Connection management actions
- Configuration actions
- Analysis actions

## Cost Estimates

### Monthly Costs (Estimated)
- **DynamoDB:** ~$5-10 (on-demand pricing, depends on usage)
- **Lambda:** ~$10-20 (1M requests/month)
- **API Gateway:** ~$3-5 (1M messages/month)
- **Bedrock:** Variable (depends on token usage)
  - Claude 3.5 Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **CloudWatch Logs:** ~$5-10 (depends on log volume)

**Total Estimated:** $25-50/month (excluding Bedrock usage)

## Troubleshooting

### Issue: WebSocket connection fails
**Solution:** Check API Gateway logs and verify JWT token is valid

### Issue: Lambda timeout
**Solution:** Increase timeout in CDK stack (currently 60s for message handler)

### Issue: DynamoDB throttling
**Solution:** Tables use on-demand billing, should auto-scale. Check for hot partitions.

### Issue: Bedrock access denied
**Solution:** Verify IAM role has correct permissions and model ARN is correct

## References

- [Requirements Document](../../../.kiro/specs/ai-copilot/requirements.md)
- [Design Document](../../../.kiro/specs/ai-copilot/design.md)
- [Tasks Document](../../../.kiro/specs/ai-copilot/tasks.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [API Gateway WebSocket Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

**Task Status:** ✅ Complete
**Date:** November 28, 2025
**Next Task:** Task 2 - Implement Bedrock Integration Service
