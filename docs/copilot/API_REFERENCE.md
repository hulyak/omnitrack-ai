# AI Copilot API Reference

Complete API reference for the OmniTrack AI Copilot.

## Table of Contents

1. [WebSocket API](#websocket-api)
2. [REST API](#rest-api)
3. [Action Registry](#action-registry)
4. [Data Models](#data-models)
5. [Error Codes](#error-codes)
6. [Rate Limits](#rate-limits)

## WebSocket API

### Connection

**Endpoint**: `wss://api.omnitrack.ai/copilot`

**Protocol**: WebSocket (WSS)

**Authentication**: JWT token in connection header

```javascript
const ws = new WebSocket(
  'wss://api.omnitrack.ai/copilot',
  ['Authorization', `Bearer ${jwtToken}`]
);
```

### Connection Events

#### `connect`

Sent automatically when connection is established.

**Server Response**:
```json
{
  "type": "connected",
  "connectionId": "abc123",
  "timestamp": "2025-11-29T10:00:00Z"
}
```

#### `disconnect`

Sent when connection is closed.

**Client Request**:
```json
{
  "action": "disconnect"
}
```

### Message Events

#### Send Message

**Client Request**:
```json
{
  "action": "message",
  "message": "Add a supplier in Shanghai",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456",
    "conversationId": "conv-789"
  }
}
```

**Parameters**:
- `action` (string, required): Must be "message"
- `message` (string, required): User's message (max 2000 chars)
- `context` (object, optional): Additional context
  - `userId` (string): User identifier
  - `sessionId` (string): Session identifier
  - `conversationId` (string): Conversation identifier

**Server Response** (streaming):

```json
{
  "type": "stream",
  "token": "Created ",
  "isComplete": false,
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95
  }
}
```

**Final Response**:
```json
{
  "type": "complete",
  "content": "Created supplier in Shanghai with ID SUP-001",
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95,
    "executionTime": 1234,
    "tokensUsed": 150
  },
  "suggestions": [
    "Connect this supplier to a manufacturer",
    "Set supplier capacity and lead time"
  ]
}
```

#### Error Response

```json
{
  "type": "error",
  "error": "Unable to process request",
  "code": "INTENT_CLASSIFICATION_FAILED",
  "retryable": true,
  "correlationId": "abc-123-def-456"
}
```

### Heartbeat

The server sends periodic heartbeat messages:

```json
{
  "type": "ping",
  "timestamp": "2025-11-29T10:00:00Z"
}
```

Client should respond with:

```json
{
  "type": "pong",
  "timestamp": "2025-11-29T10:00:00Z"
}
```

## REST API

### Authentication

All REST API requests require authentication via JWT token:

```http
Authorization: Bearer <jwt_token>
```

### Endpoints

#### POST /api/copilot/message

Send a message to the copilot.

**Request**:
```http
POST /api/copilot/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Add a supplier in Shanghai",
  "conversationId": "conv-123",
  "stream": false
}
```

**Parameters**:
- `message` (string, required): User's message
- `conversationId` (string, optional): Existing conversation ID
- `stream` (boolean, optional): Enable streaming response (default: false)

**Response** (200 OK):
```json
{
  "response": "Created supplier in Shanghai with ID SUP-001",
  "intent": "add-supplier",
  "confidence": 0.95,
  "executionTime": 1234,
  "suggestions": [
    "Connect this supplier to a manufacturer"
  ],
  "conversationId": "conv-123",
  "messageId": "msg-456"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Invalid message format",
  "code": "INVALID_REQUEST",
  "details": {
    "field": "message",
    "issue": "Message exceeds maximum length"
  }
}
```

#### GET /api/copilot/conversations/{conversationId}

Retrieve conversation history.

**Request**:
```http
GET /api/copilot/conversations/conv-123
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": "conv-123",
  "userId": "user-456",
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:05:00Z",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Add a supplier in Shanghai",
      "timestamp": "2025-11-29T10:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Created supplier SUP-001",
      "timestamp": "2025-11-29T10:00:01Z",
      "metadata": {
        "intent": "add-supplier",
        "confidence": 0.95
      }
    }
  ],
  "metadata": {
    "totalMessages": 2,
    "totalTokens": 300
  }
}
```

#### GET /api/copilot/conversations

List user's conversations.

**Request**:
```http
GET /api/copilot/conversations?limit=10&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
- `limit` (number, optional): Max results (default: 10, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "createdAt": "2025-11-29T10:00:00Z",
      "lastMessage": "Created supplier SUP-001",
      "messageCount": 5
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

#### DELETE /api/copilot/conversations/{conversationId}

Delete a conversation.

**Request**:
```http
DELETE /api/copilot/conversations/conv-123
Authorization: Bearer <token>
```

**Response** (204 No Content)

#### GET /api/copilot/actions

List available actions.

**Request**:
```http
GET /api/copilot/actions
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "actions": [
    {
      "name": "add-supplier",
      "description": "Add a supplier node to the network",
      "category": "build",
      "examples": [
        "Add a supplier in Shanghai",
        "Create a supplier in Tokyo"
      ],
      "parameters": [
        {
          "name": "location",
          "type": "string",
          "required": true,
          "description": "Supplier location"
        }
      ]
    }
  ],
  "total": 45
}
```

#### GET /api/copilot/analytics

Get usage analytics.

**Request**:
```http
GET /api/copilot/analytics?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <token>
```

**Query Parameters**:
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)

**Response** (200 OK):
```json
{
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-30T23:59:59Z"
  },
  "metrics": {
    "totalMessages": 1250,
    "totalConversations": 85,
    "averageResponseTime": 1456,
    "intentAccuracy": 0.94,
    "actionSuccessRate": 0.97,
    "tokensUsed": 125000
  },
  "topIntents": [
    { "intent": "add-supplier", "count": 245 },
    { "intent": "scan-anomalies", "count": 189 }
  ],
  "topActions": [
    { "action": "add-supplier", "count": 245, "successRate": 0.98 }
  ]
}
```

## Action Registry

### Action Interface

```typescript
interface Action {
  name: string;
  description: string;
  category: 'build' | 'configure' | 'analyze' | 'simulate' | 'query';
  examples: string[];
  parameters: ParameterDefinition[];
  execute: (params: any, context: SupplyChainContext) => Promise<ActionResult>;
  validate?: (params: any) => ValidationResult;
}
```

### Available Actions

#### Build Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `add-supplier` | Add supplier node | `location`, `name?`, `capacity?` |
| `add-manufacturer` | Add manufacturer node | `location`, `name?`, `capacity?` |
| `add-warehouse` | Add warehouse node | `location`, `name?`, `capacity?` |
| `add-distributor` | Add distributor node | `location`, `name?` |
| `add-retailer` | Add retailer node | `location`, `name?` |
| `remove-node` | Remove any node | `nodeId` |
| `connect-nodes` | Create edge | `sourceId`, `targetId` |
| `disconnect-nodes` | Remove edge | `sourceId`, `targetId` |
| `update-node` | Modify node | `nodeId`, `updates` |
| `optimize-layout` | Auto-arrange nodes | - |

#### Configure Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `set-region` | Change region | `region` |
| `set-industry` | Change industry | `industry` |
| `set-currency` | Change currency | `currency` |
| `add-shipping-method` | Add shipping | `method` |
| `set-risk-profile` | Change risk | `profile` |

#### Analyze Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `scan-anomalies` | Find anomalies | - |
| `identify-risks` | Find risks | - |
| `find-bottlenecks` | Find bottlenecks | - |
| `calculate-utilization` | Compute metrics | - |
| `assess-resilience` | Evaluate robustness | - |
| `generate-report` | Create summary | `format?` |

#### Simulate Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `run-simulation` | Execute scenario | `scenarioType`, `parameters` |
| `what-if-port-closure` | Simulate port closure | `port`, `duration` |
| `what-if-supplier-failure` | Simulate failure | `supplierId` |
| `what-if-demand-spike` | Simulate demand | `percentage` |

#### Query Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `get-node-details` | Show node info | `nodeId` |
| `get-network-summary` | Summarize network | - |
| `get-recent-alerts` | Show alerts | `limit?` |
| `help` | List commands | - |

## Data Models

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    executionTime?: number;
    tokensUsed?: number;
  };
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  userId: string;
  connectionId?: string;
  messages: Message[];
  context: SupplyChainContext;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
  };
}
```

### IntentClassification

```typescript
interface IntentClassification {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresClarification: boolean;
  clarificationQuestion?: string;
}
```

### ActionResult

```typescript
interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
  metadata?: {
    executionTime: number;
    resourcesAffected: string[];
  };
}
```

### SupplyChainContext

```typescript
interface SupplyChainContext {
  nodes: SupplyChainNode[];
  edges: SupplyChainEdge[];
  configuration: SupplyChainConfig;
  recentActions: Action[];
  activeSimulations: Simulation[];
}
```

## Error Codes

### Client Errors (4xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Server Errors (5xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `BEDROCK_UNAVAILABLE` | 503 | Bedrock service unavailable |
| `TIMEOUT` | 504 | Request timeout |

### Application Errors

| Code | Description | Retryable |
|------|-------------|-----------|
| `INTENT_CLASSIFICATION_FAILED` | Unable to classify intent | Yes |
| `PARAMETER_VALIDATION_FAILED` | Invalid parameters | No |
| `ACTION_EXECUTION_FAILED` | Action failed to execute | Yes |
| `CONTEXT_SIZE_EXCEEDED` | Conversation too long | No |
| `TOKEN_LIMIT_EXCEEDED` | Token quota exceeded | No |

## Rate Limits

### Per User Limits

| Resource | Limit | Window |
|----------|-------|--------|
| Messages | 60 | 1 minute |
| Conversations | 100 | 1 day |
| Tokens | 100,000 | 1 day |
| WebSocket Connections | 5 | Concurrent |

### Response Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1638360000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30,
  "limit": 60,
  "window": "1 minute"
}
```

## Pagination

List endpoints support pagination:

**Request**:
```http
GET /api/copilot/conversations?limit=10&offset=20
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 20,
    "hasMore": true
  }
}
```

## Filtering

Some endpoints support filtering:

**Request**:
```http
GET /api/copilot/conversations?filter[category]=build&filter[date]=2025-11-29
```

## Sorting

List endpoints support sorting:

**Request**:
```http
GET /api/copilot/conversations?sort=-createdAt
```

Use `-` prefix for descending order.

## Versioning

API version is specified in the URL:

```
https://api.omnitrack.ai/v1/copilot/message
```

Current version: `v1`

## CORS

CORS is enabled for allowed origins:

```http
Access-Control-Allow-Origin: https://app.omnitrack.ai
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Webhooks

Subscribe to copilot events:

**Endpoint**: `POST /api/copilot/webhooks`

**Request**:
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["message.sent", "action.executed"],
  "secret": "your-webhook-secret"
}
```

**Webhook Payload**:
```json
{
  "event": "action.executed",
  "timestamp": "2025-11-29T10:00:00Z",
  "data": {
    "action": "add-supplier",
    "userId": "user-123",
    "success": true
  },
  "signature": "sha256=..."
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { CopilotClient } from '@omnitrack/copilot-sdk';

const client = new CopilotClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.omnitrack.ai'
});

// Send message
const response = await client.sendMessage('Add a supplier in Shanghai');

// Stream response
for await (const token of client.streamMessage('Scan for anomalies')) {
  console.log(token);
}

// Get conversation
const conversation = await client.getConversation('conv-123');
```

### Python

```python
from omnitrack import CopilotClient

client = CopilotClient(
    api_key='your-api-key',
    endpoint='https://api.omnitrack.ai'
)

# Send message
response = client.send_message('Add a supplier in Shanghai')

# Stream response
for token in client.stream_message('Scan for anomalies'):
    print(token)

# Get conversation
conversation = client.get_conversation('conv-123')
```

### cURL

```bash
# Send message
curl -X POST https://api.omnitrack.ai/v1/copilot/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a supplier in Shanghai"}'

# Get conversation
curl https://api.omnitrack.ai/v1/copilot/conversations/conv-123 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Support

For API support:
- 📧 Email: api-support@omnitrack.ai
- 📚 Documentation: https://docs.omnitrack.ai/api
- 💬 Discord: https://discord.gg/omnitrack

---

**API Version**: 1.0  
**Last Updated**: November 29, 2025  
**Base URL**: https://api.omnitrack.ai/v1
