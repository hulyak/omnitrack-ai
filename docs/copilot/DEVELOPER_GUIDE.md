# AI Copilot Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Creating Custom Actions](#creating-custom-actions)
3. [API Reference](#api-reference)
4. [Deployment Guide](#deployment-guide)
5. [Testing](#testing)
6. [Monitoring and Debugging](#monitoring-and-debugging)
7. [Best Practices](#best-practices)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CopilotChat  │  │ MessageList  │  │ CopilotInput │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │ WebSocket Hook  │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │ WSS
                             │
┌────────────────────────────▼──────────────────────────────┐
│                    API Gateway                             │
│                  WebSocket API                             │
└────────────────────────────┬──────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────┐
│                  Copilot Lambda                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │           CopilotOrchestrator                     │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │    │
│  │  │  Intent    │  │  Action    │  │  Response  │ │    │
│  │  │ Classifier │  │  Registry  │  │ Generator  │ │    │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │    │
│  └────────┼───────────────┼───────────────┼────────┘    │
│           │               │               │              │
│  ┌────────▼───────┐  ┌───▼──────────┐  ┌─▼──────────┐  │
│  │ BedrockService │  │ 40+ Actions  │  │ Bedrock    │  │
│  └────────────────┘  └──────────────┘  └────────────┘  │
└────────────────────────────┬──────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   DynamoDB     │  │  Amazon Bedrock │  │   Supply    │
│ (Conversations)│  │  (Claude 3.5)   │  │   Chain     │
└────────────────┘  └─────────────────┘  └─────────────┘
```

### Key Components

#### 1. Frontend Components

**CopilotChat** (`frontend/components/copilot/copilot-chat.tsx`)
- Main container component
- Manages open/close state
- Handles WebSocket connection

**MessageList** (`frontend/components/copilot/message-list.tsx`)
- Displays conversation history
- Shows typing indicators
- Auto-scrolls to latest message

**CopilotInput** (`frontend/components/copilot/copilot-input.tsx`)
- Text input with auto-resize
- Send button and keyboard shortcuts
- Suggestion display

**WebSocket Hook** (`frontend/lib/websocket/copilot-websocket-hook.ts`)
- Manages WebSocket connection
- Handles reconnection logic
- Queues offline messages

#### 2. Backend Components

**CopilotOrchestrator** (`infrastructure/lambda/copilot/copilot-orchestrator.ts`)
- Main coordination logic
- Integrates all services
- Handles error recovery

**IntentClassifier** (`infrastructure/lambda/copilot/intent-classifier.ts`)
- Uses Bedrock to classify user intent
- Extracts parameters from messages
- Detects ambiguous requests

**ActionRegistry** (`infrastructure/lambda/copilot/action-registry.ts`)
- Registers all available actions
- Routes intents to actions
- Validates parameters

**BedrockService** (`infrastructure/lambda/copilot/bedrock-service.ts`)
- Interfaces with Amazon Bedrock
- Handles streaming responses
- Manages token counting

**ConversationService** (`infrastructure/lambda/copilot/conversation-service.ts`)
- Stores conversation history
- Manages context size
- Summarizes old messages

## Creating Custom Actions

### Action Structure

Every action follows this interface:

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

interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
}
```

### Step-by-Step: Creating a New Action

#### Step 1: Define the Action

Create a new file in `infrastructure/lambda/copilot/actions/`:

```typescript
// infrastructure/lambda/copilot/actions/my-custom-action.ts

import { Action, ActionResult, SupplyChainContext } from '../types';

export const myCustomAction: Action = {
  name: 'my-custom-action',
  description: 'Does something useful with the supply chain',
  category: 'analyze',
  examples: [
    'Do my custom thing',
    'Run my custom analysis',
    'Execute custom action'
  ],
  parameters: [
    {
      name: 'targetNode',
      type: 'string',
      required: true,
      description: 'The node to analyze'
    },
    {
      name: 'threshold',
      type: 'number',
      required: false,
      description: 'Analysis threshold (default: 0.8)',
      default: 0.8
    }
  ],
  execute: async (params, context) => {
    try {
      // Your action logic here
      const { targetNode, threshold = 0.8 } = params;
      
      // Access supply chain data
      const node = context.nodes.find(n => n.id === targetNode);
      if (!node) {
        return {
          success: false,
          error: `Node ${targetNode} not found`
        };
      }
      
      // Perform analysis
      const result = performAnalysis(node, threshold);
      
      return {
        success: true,
        data: result,
        suggestions: [
          'Consider running a simulation',
          'Check related nodes'
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  validate: (params) => {
    if (!params.targetNode) {
      return {
        valid: false,
        errors: ['targetNode is required']
      };
    }
    
    if (params.threshold && (params.threshold < 0 || params.threshold > 1)) {
      return {
        valid: false,
        errors: ['threshold must be between 0 and 1']
      };
    }
    
    return { valid: true };
  }
};

function performAnalysis(node: any, threshold: number) {
  // Your analysis logic
  return {
    nodeId: node.id,
    score: 0.85,
    passed: 0.85 > threshold
  };
}
```

#### Step 2: Register the Action

Add your action to the registry in `infrastructure/lambda/copilot/actions/index.ts`:

```typescript
import { myCustomAction } from './my-custom-action';

export const allActions = [
  // ... existing actions
  myCustomAction
];
```

#### Step 3: Update Intent Classification

The intent classifier automatically includes registered actions, but you can improve classification by adding examples to your action definition.

#### Step 4: Test the Action

Create a test file `infrastructure/lambda/copilot/actions/my-custom-action.test.ts`:

```typescript
import { myCustomAction } from './my-custom-action';

describe('myCustomAction', () => {
  it('should execute successfully with valid parameters', async () => {
    const context = {
      nodes: [
        { id: 'node-1', name: 'Test Node', type: 'supplier' }
      ],
      edges: [],
      configuration: {}
    };
    
    const result = await myCustomAction.execute(
      { targetNode: 'node-1', threshold: 0.7 },
      context
    );
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  it('should fail with invalid node', async () => {
    const context = { nodes: [], edges: [], configuration: {} };
    
    const result = await myCustomAction.execute(
      { targetNode: 'invalid' },
      context
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});
```

#### Step 5: Deploy

Deploy your changes:

```bash
cd infrastructure
npm run build
cdk deploy
```

### Action Best Practices

#### 1. Clear Naming

Use descriptive action names that match user intent:

✅ `calculate-carbon-footprint`  
❌ `calc-cf`

#### 2. Comprehensive Examples

Provide multiple example phrases:

```typescript
examples: [
  'Calculate carbon footprint',
  'Show me environmental impact',
  'What is my carbon emissions?',
  'Measure sustainability'
]
```

#### 3. Robust Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await externalService.call();
  return { success: true, data: result };
} catch (error) {
  logger.error('Action failed', { error, params });
  return {
    success: false,
    error: 'Unable to complete action. Please try again.'
  };
}
```

#### 4. Helpful Suggestions

Provide next steps:

```typescript
return {
  success: true,
  data: result,
  suggestions: [
    'Run a simulation to test this change',
    'Compare with previous results',
    'Export data for further analysis'
  ]
};
```

#### 5. Parameter Validation

Validate all inputs:

```typescript
validate: (params) => {
  const errors = [];
  
  if (!params.required_field) {
    errors.push('required_field is required');
  }
  
  if (params.number_field && params.number_field < 0) {
    errors.push('number_field must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## API Reference

### WebSocket API

#### Connection

**Endpoint**: `wss://api.omnitrack.ai/copilot`

**Authentication**: Include JWT token in connection request

```javascript
const ws = new WebSocket(
  'wss://api.omnitrack.ai/copilot',
  ['Authorization', jwtToken]
);
```

#### Message Format

**Client → Server**:

```json
{
  "action": "message",
  "message": "Add a supplier in Shanghai",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456"
  }
}
```

**Server → Client**:

```json
{
  "type": "message",
  "content": "Created supplier in Shanghai",
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95,
    "executionTime": 1234
  }
}
```

**Streaming Response**:

```json
{
  "type": "stream",
  "token": "Created ",
  "isComplete": false
}
```

**Error Response**:

```json
{
  "type": "error",
  "error": "Unable to process request",
  "retryable": true,
  "correlationId": "abc-123"
}
```

### REST API (Alternative)

#### Send Message

```http
POST /api/copilot/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Add a supplier in Shanghai",
  "conversationId": "conv-123"
}
```

**Response**:

```json
{
  "response": "Created supplier in Shanghai with ID SUP-001",
  "intent": "add-supplier",
  "confidence": 0.95,
  "suggestions": [
    "Connect this supplier to a manufacturer",
    "Set supplier capacity"
  ]
}
```

#### Get Conversation History

```http
GET /api/copilot/conversations/{conversationId}
Authorization: Bearer <token>
```

**Response**:

```json
{
  "id": "conv-123",
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
      "timestamp": "2025-11-29T10:00:01Z"
    }
  ]
}
```

### Action Registry API

#### Register Action

```typescript
import { actionRegistry } from './action-registry';

actionRegistry.register(myCustomAction);
```

#### Execute Action

```typescript
const result = await actionRegistry.execute(
  'my-custom-action',
  { targetNode: 'node-1' },
  context
);
```

#### List Actions

```typescript
const actions = actionRegistry.listActions();
// Returns array of all registered actions
```

### Bedrock Service API

#### Classify Intent

```typescript
import { bedrockService } from './bedrock-service';

const classification = await bedrockService.classifyIntent(
  'Add a supplier in Shanghai',
  conversationHistory
);

// Returns:
// {
//   intent: 'add-supplier',
//   confidence: 0.95,
//   parameters: { location: 'Shanghai', type: 'supplier' }
// }
```

#### Generate Response

```typescript
const response = await bedrockService.generateResponse(
  actionResult,
  conversationContext
);

// Returns natural language response string
```

#### Stream Response

```typescript
const stream = bedrockService.streamResponse(prompt);

for await (const token of stream) {
  console.log(token); // Each token as it arrives
}
```

## Deployment Guide

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 20+
- AWS CDK installed (`npm install -g aws-cdk`)

### Initial Setup

1. **Clone Repository**

```bash
git clone https://github.com/your-org/omnitrack-ai.git
cd omnitrack-ai
```

2. **Install Dependencies**

```bash
# Backend
cd infrastructure
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure Environment**

```bash
# infrastructure/.env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
DYNAMODB_TABLE_NAME=omnitrack-conversations
WEBSOCKET_API_STAGE=production
```

4. **Bootstrap CDK** (first time only)

```bash
cd infrastructure
cdk bootstrap
```

### Deployment Steps

#### 1. Deploy Infrastructure

```bash
cd infrastructure
npm run build
cdk deploy
```

This deploys:
- API Gateway WebSocket API
- Lambda functions
- DynamoDB tables
- IAM roles
- CloudWatch alarms

#### 2. Deploy Frontend

```bash
cd frontend
npm run build
# Deploy to your hosting service (Vercel, Amplify, etc.)
```

#### 3. Configure CORS

```bash
cd infrastructure
./configure-cors.sh
```

#### 4. Verify Deployment

```bash
./verify-deployment.sh
```

### Environment-Specific Deployments

#### Staging

```bash
export CDK_ENV=staging
cdk deploy --context environment=staging
```

#### Production

```bash
export CDK_ENV=production
cdk deploy --context environment=production
```

### Rollback

If deployment fails:

```bash
cdk deploy --rollback
```

To destroy stack:

```bash
cdk destroy
```

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Copilot

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd infrastructure
          npm install
      
      - name: Run tests
        run: |
          cd infrastructure
          npm test
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd infrastructure
          npm run build
          cdk deploy --require-approval never
```

## Testing

### Unit Tests

Test individual components:

```typescript
// infrastructure/lambda/copilot/intent-classifier.test.ts

import { IntentClassifier } from './intent-classifier';

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;
  
  beforeEach(() => {
    classifier = new IntentClassifier();
  });
  
  it('should classify add-supplier intent', async () => {
    const result = await classifier.classify(
      'Add a supplier in Shanghai'
    );
    
    expect(result.intent).toBe('add-supplier');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.parameters.location).toBe('Shanghai');
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
// infrastructure/lambda/copilot/action-registry.property.test.ts

import * as fc from 'fast-check';
import { ActionRegistry } from './action-registry';

// Feature: ai-copilot, Property 5: Action execution idempotency
describe('ActionRegistry Properties', () => {
  it('idempotent actions produce same result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nodeId: fc.string(),
          action: fc.constantFrom('get-node-details', 'get-network-summary')
        }),
        async ({ nodeId, action }) => {
          const registry = new ActionRegistry();
          const context = createTestContext();
          
          const result1 = await registry.execute(action, { nodeId }, context);
          const result2 = await registry.execute(action, { nodeId }, context);
          
          expect(result1).toEqual(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Test end-to-end flows:

```typescript
// infrastructure/test/integration/copilot-integration.test.ts

import WebSocket from 'ws';

describe('Copilot Integration', () => {
  it('should handle complete message flow', async () => {
    const ws = new WebSocket(process.env.WEBSOCKET_URL);
    
    await new Promise(resolve => ws.on('open', resolve));
    
    ws.send(JSON.stringify({
      action: 'message',
      message: 'Add a supplier in Shanghai'
    }));
    
    const response = await new Promise(resolve => {
      ws.on('message', data => resolve(JSON.parse(data)));
    });
    
    expect(response.type).toBe('message');
    expect(response.content).toContain('supplier');
    
    ws.close();
  });
});
```

### Load Testing

Test under load:

```bash
# Using artillery
artillery quick --count 100 --num 10 wss://api.omnitrack.ai/copilot
```

## Monitoring and Debugging

### CloudWatch Logs

View logs:

```bash
aws logs tail /aws/lambda/copilot-handler --follow
```

Filter by correlation ID:

```bash
aws logs filter-pattern /aws/lambda/copilot-handler \
  --filter-pattern "correlationId=abc-123"
```

### CloudWatch Metrics

Key metrics to monitor:

- **MessagesPerMinute**: Message throughput
- **AverageResponseTime**: Response latency
- **IntentClassificationAccuracy**: Classification success rate
- **ActionSuccessRate**: Action execution success
- **BedrockTokenUsage**: Token consumption
- **WebSocketConnections**: Active connections
- **ErrorRate**: Error percentage

### CloudWatch Alarms

Configured alarms:

- Response time > 3 seconds
- Error rate > 5%
- Token usage > 80% of limit
- WebSocket disconnections > 10/min

### X-Ray Tracing

Enable X-Ray for distributed tracing:

```typescript
import AWSXRay from 'aws-xray-sdk-core';

const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

View traces in AWS X-Ray console.

### Debugging Tips

#### 1. Enable Debug Logging

```typescript
process.env.LOG_LEVEL = 'DEBUG';
```

#### 2. Use Correlation IDs

Every request has a correlation ID for tracking:

```typescript
logger.info('Processing message', {
  correlationId: event.requestContext.requestId,
  userId: context.userId
});
```

#### 3. Test Locally

Run Lambda locally:

```bash
sam local start-api
```

#### 4. Inspect WebSocket Messages

Use browser DevTools:

```javascript
// In browser console
const ws = new WebSocket('wss://api.omnitrack.ai/copilot');
ws.onmessage = (event) => console.log('Received:', event.data);
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: 'Invalid input: ' + error.message
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.'
  };
}
```

### 2. Logging

Use structured logging:

```typescript
logger.info('Action executed', {
  correlationId,
  userId,
  action: 'add-supplier',
  parameters: { location: 'Shanghai' },
  executionTime: 1234,
  success: true
});
```

### 3. Performance

Optimize for speed:

- Cache common intent classifications
- Use parallel execution where possible
- Stream responses for better UX
- Implement connection pooling

### 4. Security

Follow security best practices:

- Validate all inputs
- Sanitize outputs
- Use IAM roles, not access keys
- Enable encryption at rest and in transit
- Implement rate limiting
- Log security events

### 5. Testing

Comprehensive testing:

- Unit tests for all functions
- Property tests for universal properties
- Integration tests for workflows
- Load tests for performance
- Security tests for vulnerabilities

### 6. Documentation

Keep documentation updated:

- Document all actions
- Provide usage examples
- Explain parameters
- Include error codes
- Maintain API reference

### 7. Monitoring

Monitor everything:

- Log all requests
- Track key metrics
- Set up alarms
- Use distributed tracing
- Review logs regularly

---

## Additional Resources

### Documentation

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [API Gateway WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

### Tools

- [AWS CLI](https://aws.amazon.com/cli/)
- [AWS SAM](https://aws.amazon.com/serverless/sam/)
- [Postman](https://www.postman.com/) - API testing
- [Artillery](https://artillery.io/) - Load testing

### Support

- 📧 Email: dev-support@omnitrack.ai
- 💬 Slack: #copilot-dev
- 📚 Wiki: https://wiki.omnitrack.ai/copilot
- 🐛 Issues: https://github.com/your-org/omnitrack-ai/issues

---

**Last Updated**: November 29, 2025  
**Version**: 1.0  
**Maintainer**: OmniTrack AI Development Team
