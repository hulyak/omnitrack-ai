# AI Copilot Lambda Functions

This directory contains the Lambda functions that power the OmniTrack AI Copilot conversational interface.

## Overview

The AI Copilot provides a natural language interface for users to interact with the OmniTrack supply chain system. Users can ask questions, request actions, and receive intelligent responses powered by Amazon Bedrock (Claude 3.5 Sonnet).

## Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│                 │◄──────────────────────────►│                  │
│  Frontend       │                             │  API Gateway     │
│  Copilot UI     │                             │  WebSocket API   │
│                 │                             │                  │
└─────────────────┘                             └────────┬─────────┘
                                                         │
                                                         ▼
                                                ┌──────────────────┐
                                                │                  │
                                                │  Copilot Lambda  │
                                                │  (Handler)       │
                                                │                  │
                                                └────────┬─────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────┐
                        │                                │                        │
                        ▼                                ▼                        ▼
               ┌─────────────────┐            ┌──────────────────┐    ┌──────────────────┐
               │                 │            │                  │    │                  │
               │  Amazon Bedrock │            │  Action Registry │    │  DynamoDB        │
               │  (Claude 3.5)   │            │  (40+ Actions)   │    │  (Conversations) │
               │                 │            │                  │    │                  │
               └─────────────────┘            └──────────┬───────┘    └──────────────────┘
                                                         │
                                                         ▼
                                              ┌──────────────────────┐
                                              │                      │
                                              │  Supply Chain        │
                                              │  Services            │
                                              │  (Agents, Config)    │
                                              │                      │
                                              └──────────────────────┘
```

## Lambda Functions

### 1. websocket-handler.ts

Main handler for WebSocket connections and messages.

**Handlers:**
- `connectHandler` - Handles new WebSocket connections
- `disconnectHandler` - Handles WebSocket disconnections
- `messageHandler` - Processes incoming messages from users

**Environment Variables:**
- `USER_POOL_ID` - Cognito User Pool ID for authentication
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID
- `TABLE_NAME` - Main DynamoDB table name
- `CONVERSATIONS_TABLE_NAME` - Copilot conversations table name
- `CONNECTIONS_TABLE_NAME` - WebSocket connections table name
- `SECRETS_ARN` - Secrets Manager ARN for API keys
- `KMS_KEY_ID` - KMS key ID for encryption
- `BEDROCK_MODEL_ID` - Bedrock model ID (Claude 3.5 Sonnet)
- `BEDROCK_REGION` - AWS region for Bedrock
- `WEBSOCKET_API_ENDPOINT` - WebSocket API endpoint URL

**IAM Permissions:**
- DynamoDB: Read/Write on conversations and connections tables
- Bedrock: InvokeModel, InvokeModelWithResponseStream
- API Gateway: ManageConnections (for sending messages)
- KMS: Decrypt
- Secrets Manager: GetSecretValue

## DynamoDB Tables

### Conversations Table

Stores conversation history for context and analysis.

**Schema:**
```typescript
{
  conversationId: string;      // Partition key
  timestamp: number;           // Sort key
  userId: string;              // GSI partition key
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    executionTime?: number;
  };
  ttl: number;                 // Auto-delete after 30 days
}
```

**Indexes:**
- GSI1: `userId` (PK) + `timestamp` (SK) - Query conversations by user

### Connections Table

Tracks active WebSocket connections.

**Schema:**
```typescript
{
  connectionId: string;        // Partition key
  userId: string;              // GSI partition key
  connectedAt: number;
  ttl: number;                 // Auto-cleanup stale connections
}
```

**Indexes:**
- GSI1: `userId` (PK) - Query connections by user

## WebSocket API

### Connection

**Endpoint:** `wss://{api-id}.execute-api.{region}.amazonaws.com/prod`

**Query Parameters:**
- `userId` - User ID (optional, defaults to 'anonymous')
- `token` - JWT token from Cognito (for authentication)

**Example:**
```javascript
const ws = new WebSocket(
  'wss://abc123.execute-api.us-east-1.amazonaws.com/prod?userId=user123&token=eyJ...'
);
```

### Message Format

**Client → Server:**
```json
{
  "action": "message",
  "message": "Add a supplier in China",
  "conversationId": "conv-123456789"
}
```

**Server → Client:**
```json
{
  "type": "message",
  "content": "I've added a supplier node in China...",
  "conversationId": "conv-123456789",
  "timestamp": 1234567890,
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95
  }
}
```

**Error Response:**
```json
{
  "type": "error",
  "error": "Failed to process message",
  "timestamp": 1234567890
}
```

## Development

### Local Testing

To test the Lambda functions locally:

```bash
# Install dependencies
cd infrastructure/lambda
npm install

# Run tests
npm test

# Run specific test
npm test -- copilot/websocket-handler.test.ts
```

### Deployment

The Lambda functions are deployed automatically via AWS CDK:

```bash
cd infrastructure
npm run build
cdk deploy
```

## Implementation Status

### Task 1: Set up AWS infrastructure for copilot ✅
- [x] Create API Gateway WebSocket API
- [x] Configure Lambda function for copilot handler
- [x] Set up DynamoDB tables for conversations and connections
- [x] Configure IAM roles for Bedrock access

### Next Tasks
- [ ] Task 2: Implement Bedrock integration service
- [ ] Task 3: Build action registry system
- [ ] Task 4: Implement core copilot actions

## Security Considerations

### Authentication
- JWT tokens validated on connection
- User identity verified for all operations
- Connection tracking for audit trail

### Data Privacy
- Conversations auto-deleted after 30 days (TTL)
- All data encrypted at rest (KMS)
- All data encrypted in transit (TLS)
- PII masked in logs

### Rate Limiting
- WebSocket throttling: 500 req/sec
- Burst limit: 1000 requests
- Per-user rate limiting (to be implemented)

### Bedrock Security
- IAM role-based access
- Specific model ARN restrictions
- CloudWatch logging enabled
- X-Ray tracing enabled

## Monitoring

### CloudWatch Metrics
- WebSocket connection count
- Message processing latency
- Bedrock API call duration
- Error rates by type
- Token usage

### CloudWatch Logs
- All Lambda invocations logged
- Structured logging with correlation IDs
- Error logs with stack traces
- Bedrock API request/response logs

### Alarms
- High error rate (> 5%)
- High latency (> 2s)
- Connection failures
- Bedrock API throttling

## References

- [Requirements Document](../../../.kiro/specs/ai-copilot/requirements.md)
- [Design Document](../../../.kiro/specs/ai-copilot/design.md)
- [Tasks Document](../../../.kiro/specs/ai-copilot/tasks.md)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [API Gateway WebSocket Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

**Last Updated:** November 28, 2025
**Status:** Infrastructure setup complete, ready for Bedrock integration
