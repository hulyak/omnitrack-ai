# AI Copilot Task 1 - Testing Guide

## Overview

Task 1 involves setting up AWS infrastructure for the AI Copilot. This guide will help you verify that all infrastructure components are properly deployed and functioning.

## What Task 1 Includes

- ✅ API Gateway WebSocket API
- ✅ Lambda functions (connect, disconnect, message handlers)
- ✅ DynamoDB tables (conversations and connections)
- ✅ IAM roles with Bedrock access
- ✅ CloudWatch logging and monitoring

## Prerequisites

Before testing, ensure you have:
- AWS CLI configured
- Node.js 20+ installed
- Infrastructure deployed (`cdk deploy`)
- WebSocket URL from CloudFormation outputs

## Testing Checklist

### ✅ 1. Verify Infrastructure Deployment

Check that all resources were created:

```bash
# Get CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name InfrastructureStack \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Expected outputs:**
- `CopilotWebSocketApiUrl` - WebSocket endpoint URL
- `CopilotConversationsTableName` - Conversations table name
- `CopilotConnectionsTableName` - Connections table name
- `CopilotMessageFunctionArn` - Message handler Lambda ARN

### ✅ 2. Verify DynamoDB Tables

Check that both tables exist and are configured correctly:

```bash
# Check conversations table
aws dynamodb describe-table \
  --table-name omnitrack-copilot-conversations \
  --query 'Table.[TableName,TableStatus,KeySchema,GlobalSecondaryIndexes[0].IndexName]' \
  --output table

# Check connections table
aws dynamodb describe-table \
  --table-name omnitrack-copilot-connections \
  --query 'Table.[TableName,TableStatus,KeySchema,GlobalSecondaryIndexes[0].IndexName]' \
  --output table
```

**Expected results:**
- Both tables should have status: `ACTIVE`
- Conversations table should have GSI: `UserIdIndex`
- Connections table should have GSI: `UserIdIndex`
- Both tables should have encryption enabled

### ✅ 3. Verify Lambda Functions

Check that all three Lambda functions are deployed:

```bash
# List copilot Lambda functions
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `copilot`)].FunctionName' \
  --output table
```

**Expected functions:**
- `omnitrack-copilot-connect`
- `omnitrack-copilot-disconnect`
- `omnitrack-copilot-message`

Check function configuration:

```bash
# Check message handler configuration
aws lambda get-function-configuration \
  --function-name omnitrack-copilot-message \
  --query '[FunctionName,Runtime,MemorySize,Timeout,Environment.Variables]' \
  --output json
```

**Expected configuration:**
- Runtime: `nodejs20.x`
- Memory: `1024 MB`
- Timeout: `60 seconds`
- Environment variables should include:
  - `BEDROCK_MODEL_ID`
  - `BEDROCK_REGION`
  - `CONVERSATIONS_TABLE_NAME`
  - `CONNECTIONS_TABLE_NAME`
  - `WEBSOCKET_API_ENDPOINT`

### ✅ 4. Verify IAM Permissions

Check that the Lambda execution role has Bedrock access:

```bash
# Get the Lambda role ARN
ROLE_ARN=$(aws lambda get-function-configuration \
  --function-name omnitrack-copilot-message \
  --query 'Role' \
  --output text)

# Get role name from ARN
ROLE_NAME=$(echo $ROLE_ARN | cut -d'/' -f2)

# List attached policies
aws iam list-attached-role-policies \
  --role-name $ROLE_NAME \
  --output table
```

**Expected policies:**
- Should include policies for DynamoDB, Bedrock, API Gateway, CloudWatch

Check inline policies:

```bash
aws iam list-role-policies \
  --role-name $ROLE_NAME \
  --output table
```

### ✅ 5. Verify API Gateway WebSocket API

Check the WebSocket API configuration:

```bash
# Get API ID from the WebSocket URL
# URL format: wss://{api-id}.execute-api.{region}.amazonaws.com/prod
# Extract API ID manually or use:

aws apigatewayv2 get-apis \
  --query 'Items[?contains(Name, `copilot`)].{Name:Name,ApiId:ApiId,ApiEndpoint:ApiEndpoint}' \
  --output table
```

**Expected results:**
- API Name: `omnitrack-copilot-websocket-api`
- Protocol: `WEBSOCKET`
- Stage: `prod`

Check routes:

```bash
# Replace {api-id} with your actual API ID
API_ID="your-api-id"

aws apigatewayv2 get-routes \
  --api-id $API_ID \
  --query 'Items[].{RouteKey:RouteKey,Target:Target}' \
  --output table
```

**Expected routes:**
- `$connect`
- `$disconnect`
- `message`
- `$default`

### ✅ 6. Test WebSocket Connection

Create a test script to verify WebSocket connectivity:

```bash
# Create test file
cat > test-copilot-connection.js << 'EOF'
const WebSocket = require('ws');

// Replace with your actual WebSocket URL
const WEBSOCKET_URL = process.env.COPILOT_WS_URL || 'wss://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';

console.log('🔌 Connecting to:', WEBSOCKET_URL);

const ws = new WebSocket(`${WEBSOCKET_URL}?userId=test-user-${Date.now()}`);

let testsPassed = 0;
let testsFailed = 0;

ws.on('open', () => {
  console.log('✅ Test 1: WebSocket connection established');
  testsPassed++;
  
  // Test sending a message
  const testMessage = {
    action: 'message',
    message: 'Hello, copilot! This is a test.',
    conversationId: `test-conv-${Date.now()}`
  };
  
  console.log('📤 Sending test message:', testMessage.message);
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received message:', message);
    
    if (message.type === 'acknowledgment') {
      console.log('✅ Test 2: Received acknowledgment');
      testsPassed++;
    } else if (message.type === 'message') {
      console.log('✅ Test 3: Received response message');
      testsPassed++;
      
      // Close connection after receiving response
      setTimeout(() => {
        ws.close();
      }, 1000);
    }
  } catch (error) {
    console.error('❌ Failed to parse message:', error);
    testsFailed++;
  }
});

ws.on('close', () => {
  console.log('👋 WebSocket connection closed');
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${testsPassed}`);
  console.log(`   Failed: ${testsFailed}`);
  
  if (testsPassed >= 2 && testsFailed === 0) {
    console.log('\n🎉 All tests passed! Infrastructure is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check CloudWatch logs for details.');
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  testsFailed++;
  
  console.log('\n💡 Troubleshooting tips:');
  console.log('   1. Verify the WebSocket URL is correct');
  console.log('   2. Check that the infrastructure is deployed');
  console.log('   3. Review Lambda function logs in CloudWatch');
  console.log('   4. Ensure IAM permissions are configured correctly');
  
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout - closing connection');
  ws.close();
  process.exit(1);
}, 30000);
EOF

# Install ws package if needed
npm install ws

# Run the test (replace with your actual WebSocket URL)
export COPILOT_WS_URL="wss://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"
node test-copilot-connection.js
```

**Expected output:**
```
🔌 Connecting to: wss://abc123.execute-api.us-east-1.amazonaws.com/prod
✅ Test 1: WebSocket connection established
📤 Sending test message: Hello, copilot! This is a test.
📨 Received message: { type: 'acknowledgment', message: 'Message received. Processing...', timestamp: 1234567890 }
✅ Test 2: Received acknowledgment
📨 Received message: { type: 'message', content: 'Echo: Hello, copilot! This is a test.', conversationId: 'test-conv-1234567890', timestamp: 1234567890 }
✅ Test 3: Received response message
👋 WebSocket connection closed

📊 Test Results:
   Passed: 3
   Failed: 0

🎉 All tests passed! Infrastructure is working correctly.
```

### ✅ 7. Verify Data Persistence

Check that messages are being stored in DynamoDB:

```bash
# Scan conversations table (limit to recent items)
aws dynamodb scan \
  --table-name omnitrack-copilot-conversations \
  --limit 5 \
  --query 'Items[].{ConversationId:conversationId.S,Role:role.S,Content:content.S,Timestamp:timestamp.N}' \
  --output table

# Scan connections table
aws dynamodb scan \
  --table-name omnitrack-copilot-connections \
  --limit 5 \
  --query 'Items[].{ConnectionId:connectionId.S,UserId:userId.S,ConnectedAt:connectedAt.N}' \
  --output table
```

**Expected results:**
- Conversations table should contain test messages
- Connections table should show recent connections (may be empty if all connections closed)

### ✅ 8. Check CloudWatch Logs

Verify that Lambda functions are logging correctly:

```bash
# View connect handler logs
aws logs tail /aws/lambda/omnitrack-copilot-connect --since 10m

# View disconnect handler logs
aws logs tail /aws/lambda/omnitrack-copilot-disconnect --since 10m

# View message handler logs
aws logs tail /aws/lambda/omnitrack-copilot-message --since 10m

# View API Gateway logs
aws logs tail /aws/apigateway/omnitrack-copilot-websocket --since 10m
```

**Expected log entries:**
- Connection establishment logs
- Message processing logs
- Structured logging with correlation IDs
- No error messages (unless testing error scenarios)

### ✅ 9. Verify Bedrock Access

Check that the Lambda function can access Bedrock:

```bash
# Test Bedrock access from Lambda
aws lambda invoke \
  --function-name omnitrack-copilot-message \
  --payload '{"requestContext":{"connectionId":"test","routeKey":"message"},"body":"{\"action\":\"message\",\"message\":\"test\"}"}' \
  --cli-binary-format raw-in-base64-out \
  response.json

# Check response
cat response.json
```

**Note:** This test will fail if Bedrock integration (Task 2) is not yet implemented. That's expected for Task 1.

### ✅ 10. Performance Testing

Test WebSocket connection under load:

```bash
# Create load test script
cat > test-copilot-load.js << 'EOF'
const WebSocket = require('ws');

const WEBSOCKET_URL = process.env.COPILOT_WS_URL;
const NUM_CONNECTIONS = 10;
const MESSAGES_PER_CONNECTION = 5;

let successfulConnections = 0;
let failedConnections = 0;
let messagesSent = 0;
let messagesReceived = 0;

console.log(`🚀 Starting load test: ${NUM_CONNECTIONS} connections, ${MESSAGES_PER_CONNECTION} messages each`);

for (let i = 0; i < NUM_CONNECTIONS; i++) {
  const ws = new WebSocket(`${WEBSOCKET_URL}?userId=load-test-${i}`);
  
  ws.on('open', () => {
    successfulConnections++;
    
    // Send multiple messages
    for (let j = 0; j < MESSAGES_PER_CONNECTION; j++) {
      ws.send(JSON.stringify({
        action: 'message',
        message: `Test message ${j} from connection ${i}`,
        conversationId: `load-test-${i}-${j}`
      }));
      messagesSent++;
    }
    
    // Close after 5 seconds
    setTimeout(() => ws.close(), 5000);
  });
  
  ws.on('message', () => {
    messagesReceived++;
  });
  
  ws.on('error', () => {
    failedConnections++;
  });
}

// Report results after 10 seconds
setTimeout(() => {
  console.log('\n📊 Load Test Results:');
  console.log(`   Successful connections: ${successfulConnections}/${NUM_CONNECTIONS}`);
  console.log(`   Failed connections: ${failedConnections}`);
  console.log(`   Messages sent: ${messagesSent}`);
  console.log(`   Messages received: ${messagesReceived}`);
  
  if (successfulConnections === NUM_CONNECTIONS && failedConnections === 0) {
    console.log('\n✅ Load test passed!');
  } else {
    console.log('\n⚠️  Some connections failed. Check CloudWatch logs.');
  }
  
  process.exit(0);
}, 10000);
EOF

# Run load test
node test-copilot-load.js
```

## Troubleshooting

### Issue: WebSocket connection fails

**Symptoms:**
- Connection timeout
- Error: "WebSocket connection failed"

**Solutions:**
1. Verify the WebSocket URL is correct:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name InfrastructureStack \
     --query 'Stacks[0].Outputs[?OutputKey==`CopilotWebSocketApiUrl`].OutputValue' \
     --output text
   ```

2. Check API Gateway logs:
   ```bash
   aws logs tail /aws/apigateway/omnitrack-copilot-websocket --follow
   ```

3. Verify Lambda function is deployed:
   ```bash
   aws lambda get-function --function-name omnitrack-copilot-connect
   ```

### Issue: Messages not being stored in DynamoDB

**Symptoms:**
- Conversations table is empty
- No data in connections table

**Solutions:**
1. Check Lambda function permissions:
   ```bash
   aws lambda get-function-configuration \
     --function-name omnitrack-copilot-message \
     --query 'Role'
   ```

2. Review Lambda logs for errors:
   ```bash
   aws logs tail /aws/lambda/omnitrack-copilot-message --follow
   ```

3. Verify table names in environment variables:
   ```bash
   aws lambda get-function-configuration \
     --function-name omnitrack-copilot-message \
     --query 'Environment.Variables'
   ```

### Issue: Lambda timeout

**Symptoms:**
- Error: "Task timed out after 60.00 seconds"

**Solutions:**
1. Check Lambda timeout setting:
   ```bash
   aws lambda get-function-configuration \
     --function-name omnitrack-copilot-message \
     --query 'Timeout'
   ```

2. Increase timeout in CDK stack if needed:
   ```typescript
   // infrastructure/lib/infrastructure-stack.ts
   timeout: cdk.Duration.seconds(120)
   ```

3. Redeploy:
   ```bash
   cdk deploy
   ```

### Issue: Bedrock access denied

**Symptoms:**
- Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solutions:**
1. Enable Bedrock model access:
   - Go to AWS Console → Amazon Bedrock → Model access
   - Enable Claude 3.5 Sonnet models

2. Verify IAM permissions:
   ```bash
   aws iam get-role-policy \
     --role-name YOUR_LAMBDA_ROLE \
     --policy-name BedrockAccessPolicy
   ```

3. Wait a few minutes for permissions to propagate

## Success Criteria

Task 1 is successfully completed when:

- ✅ All infrastructure resources are deployed
- ✅ WebSocket connections can be established
- ✅ Messages can be sent and received
- ✅ Data is persisted in DynamoDB tables
- ✅ Lambda functions execute without errors
- ✅ CloudWatch logs show proper logging
- ✅ IAM roles have correct permissions
- ✅ No security vulnerabilities detected

## Next Steps

Once Task 1 testing is complete, proceed to:

**Task 2: Implement Bedrock Integration Service**
- Create BedrockService class
- Implement intent classification
- Add streaming response support
- Test with real AI responses

## Additional Resources

- [WebSocket Handler Code](infrastructure/lambda/copilot/websocket-handler.ts)
- [Infrastructure Stack](infrastructure/lib/infrastructure-stack.ts)
- [Requirements Document](.kiro/specs/ai-copilot/requirements.md)
- [Design Document](.kiro/specs/ai-copilot/design.md)
- [AWS WebSocket API Docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

**Testing Status:** Ready for Task 1 verification ✅
**Date:** November 28, 2025
**Next:** Task 2 - Bedrock Integration
