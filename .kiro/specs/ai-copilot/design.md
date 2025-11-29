# AI Copilot Design Document

## Overview

The AI Copilot is a conversational interface that enables users to interact with OmniTrack AI using natural language. Built on Amazon Bedrock (Claude 3.5 Sonnet), the copilot understands user intent, executes actions, and provides intelligent responses. The system uses WebSocket for real-time bidirectional communication and maintains conversation context for natural interactions.

## Architecture

### High-Level Architecture

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

### Component Interaction Flow

1. **User sends message** → Frontend via WebSocket
2. **API Gateway** → Routes to Copilot Lambda
3. **Copilot Lambda** → Classifies intent using Bedrock
4. **Action Registry** → Executes matched action
5. **Supply Chain Services** → Performs operation
6. **Bedrock** → Generates natural language response
7. **WebSocket** → Streams response back to frontend

## Components and Interfaces

### 1. Frontend Components

#### CopilotChat Component
```typescript
interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  supplyChainContext: SupplyChainContext;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}
```

#### CopilotInput Component
```typescript
interface CopilotInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestions?: string[];
}
```

#### MessageList Component
```typescript
interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}
```

### 2. Backend Components

#### Copilot Lambda Handler
```typescript
interface CopilotRequest {
  action: 'message' | 'connect' | 'disconnect';
  connectionId: string;
  message?: string;
  context?: SupplyChainContext;
}

interface CopilotResponse {
  type: 'message' | 'error' | 'complete';
  content: string;
  metadata?: {
    intent: string;
    confidence: number;
    executionTime: number;
  };
}
```

#### Intent Classifier
```typescript
interface IntentClassification {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresClarification: boolean;
}
```

#### Action Registry
```typescript
interface Action {
  name: string;
  description: string;
  parameters: ParameterSchema[];
  execute: (params: any, context: SupplyChainContext) => Promise<ActionResult>;
  validate: (params: any) => ValidationResult;
}

interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
}
```

### 3. Amazon Bedrock Integration

#### Bedrock Service
```typescript
interface BedrockService {
  classifyIntent(message: string, history: Message[]): Promise<IntentClassification>;
  generateResponse(result: ActionResult, context: ConversationContext): Promise<string>;
  streamResponse(prompt: string): AsyncGenerator<string>;
}
```

### 4. WebSocket Manager

#### Connection Manager
```typescript
interface ConnectionManager {
  connect(connectionId: string, userId: string): Promise<void>;
  disconnect(connectionId: string): Promise<void>;
  sendMessage(connectionId: string, message: string): Promise<void>;
  broadcastToUser(userId: string, message: string): Promise<void>;
}
```

## Data Models

### Conversation
```typescript
interface Conversation {
  id: string;
  userId: string;
  connectionId: string;
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

### ActionDefinition
```typescript
interface ActionDefinition {
  name: string;
  category: 'build' | 'configure' | 'analyze' | 'simulate' | 'query';
  description: string;
  examples: string[];
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
    description: string;
    validation?: (value: any) => boolean;
  }[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Intent classification accuracy
*For any* valid user message, the intent classifier should return a valid intent from the action registry with confidence > 0.5
**Validates: Requirements 1.2**

### Property 2: Response generation completeness
*For any* action result, the response generator should produce a non-empty natural language response
**Validates: Requirements 1.5**

### Property 3: Message ordering preservation
*For any* sequence of messages, the conversation history should maintain chronological order
**Validates: Requirements 4.1**

### Property 4: Context reference resolution
*For any* message containing pronouns, if previous context exists, the system should resolve references correctly
**Validates: Requirements 4.3**

### Property 5: Action execution idempotency
*For any* action that doesn't modify state, executing it multiple times should produce the same result
**Validates: Requirements 7.4**

### Property 6: Parameter validation consistency
*For any* action with required parameters, the system should reject execution if parameters are missing or invalid
**Validates: Requirements 7.3**

### Property 7: WebSocket message delivery
*For any* message sent through WebSocket, it should be delivered to the correct connection within 2 seconds
**Validates: Requirements 2.1**

### Property 8: Streaming response continuity
*For any* streamed response, tokens should arrive in order without gaps or duplicates
**Validates: Requirements 2.2**

### Property 9: Error handling graceful degradation
*For any* action that fails, the system should return a user-friendly error message without exposing internal details
**Validates: Requirements 7.4**

### Property 10: Context size management
*For any* conversation exceeding 10 messages, the system should maintain context size below 8000 tokens
**Validates: Requirements 4.4**

### Property 11: Real-time data freshness
*For any* query about supply chain state, the response should reflect data no older than 5 seconds
**Validates: Requirements 6.1**

### Property 12: Multi-step execution atomicity
*For any* multi-step request, if one step fails, previous steps should be rolled back or clearly indicated
**Validates: Requirements 10.3**

## Error Handling

### Error Categories

1. **User Input Errors**
   - Invalid syntax
   - Ambiguous intent
   - Missing required parameters
   - Response: Ask for clarification

2. **System Errors**
   - Bedrock API failures
   - WebSocket disconnections
   - Database timeouts
   - Response: Retry with exponential backoff

3. **Business Logic Errors**
   - Invalid node operations
   - Configuration conflicts
   - Simulation failures
   - Response: Explain constraint and suggest alternatives

4. **Rate Limiting**
   - Too many requests
   - Token limit exceeded
   - Response: Queue request or ask user to wait

### Error Response Format

```typescript
interface ErrorResponse {
  type: 'user_error' | 'system_error' | 'business_error' | 'rate_limit';
  message: string;
  suggestions?: string[];
  retryable: boolean;
  correlationId: string;
}
```

## Testing Strategy

### Unit Testing

Test individual components in isolation:

1. **Intent Classifier Tests**
   - Test classification accuracy with known intents
   - Test handling of ambiguous messages
   - Test parameter extraction

2. **Action Registry Tests**
   - Test action registration
   - Test parameter validation
   - Test action execution

3. **Response Generator Tests**
   - Test response formatting
   - Test context inclusion
   - Test suggestion generation

### Property-Based Testing

Use fast-check to verify universal properties:

1. **Intent Classification Property Tests**
   - Generate random messages
   - Verify valid intent returned
   - Verify confidence scores in range [0, 1]

2. **Message Ordering Property Tests**
   - Generate random message sequences
   - Verify chronological ordering maintained
   - Verify no message loss

3. **Parameter Validation Property Tests**
   - Generate random parameter combinations
   - Verify validation rules enforced
   - Verify error messages clear

### Integration Testing

Test component interactions:

1. **End-to-End Message Flow**
   - Send message through WebSocket
   - Verify intent classification
   - Verify action execution
   - Verify response generation
   - Verify response delivery

2. **Bedrock Integration**
   - Test API connectivity
   - Test streaming responses
   - Test error handling
   - Test token counting

3. **WebSocket Connection Management**
   - Test connection establishment
   - Test message delivery
   - Test disconnection handling
   - Test reconnection logic

### Load Testing

Test system under load:

1. **Concurrent Users**
   - Simulate 100+ concurrent connections
   - Verify response times < 2s
   - Verify no message loss

2. **Message Throughput**
   - Send 1000+ messages/minute
   - Verify queue management
   - Verify rate limiting

3. **Bedrock API Limits**
   - Test token limit handling
   - Test request throttling
   - Test fallback strategies

## Performance Considerations

### Response Time Targets

- Intent classification: < 500ms
- Action execution: < 1s
- Response generation: < 1s
- Total end-to-end: < 2s

### Optimization Strategies

1. **Caching**
   - Cache common intent classifications
   - Cache action results for idempotent operations
   - Cache conversation summaries

2. **Parallel Processing**
   - Classify intent while fetching context
   - Execute independent actions in parallel
   - Stream response while generating

3. **Token Management**
   - Summarize old messages to reduce tokens
   - Use smaller models for simple intents
   - Batch similar requests

4. **Connection Pooling**
   - Reuse Bedrock connections
   - Pool database connections
   - Maintain WebSocket connections

## Security Considerations

### Authentication & Authorization

- Verify user identity on WebSocket connection
- Include JWT token in connection request
- Validate token on every message
- Enforce RBAC for sensitive actions

### Input Validation

- Sanitize all user inputs
- Validate message length (max 2000 chars)
- Check for injection attempts
- Rate limit per user

### Data Privacy

- Don't log sensitive supply chain data
- Mask PII in conversation logs
- Encrypt conversations at rest
- Auto-delete old conversations (30 days)

### Bedrock Security

- Use IAM roles for Bedrock access
- Enable CloudWatch logging
- Monitor for unusual patterns
- Set spending limits

## Deployment Architecture

### AWS Resources

1. **API Gateway WebSocket API**
   - Custom domain
   - Stage: production
   - Throttling: 1000 req/sec

2. **Lambda Functions**
   - Copilot Handler (Node.js 20)
   - Memory: 1024 MB
   - Timeout: 30s
   - Concurrency: 100

3. **DynamoDB Tables**
   - Conversations table
   - Connections table
   - TTL enabled (30 days)

4. **Amazon Bedrock**
   - Model: Claude 3.5 Sonnet
   - Region: us-east-1
   - Provisioned throughput

5. **CloudWatch**
   - Logs retention: 7 days
   - Metrics: custom metrics
   - Alarms: error rate, latency

### Monitoring & Observability

**Metrics to Track:**
- Messages per minute
- Average response time
- Intent classification accuracy
- Action success rate
- Bedrock token usage
- WebSocket connection count
- Error rate by type

**Alarms:**
- Response time > 3s
- Error rate > 5%
- Token usage > 80% of limit
- WebSocket disconnections > 10/min

## Action Registry

### Initial 40+ Actions

#### Build Actions (10)
1. `add-supplier` - Add supplier node
2. `add-manufacturer` - Add manufacturer node
3. `add-warehouse` - Add warehouse node
4. `add-distributor` - Add distributor node
5. `add-retailer` - Add retailer node
6. `remove-node` - Remove any node
7. `connect-nodes` - Create edge between nodes
8. `disconnect-nodes` - Remove edge
9. `update-node` - Modify node properties
10. `optimize-layout` - Auto-arrange nodes

#### Configure Actions (10)
11. `set-region` - Change primary region
12. `set-industry` - Change industry
13. `set-currency` - Change currency
14. `add-shipping-method` - Add shipping method
15. `remove-shipping-method` - Remove shipping method
16. `set-risk-profile` - Change risk profile
17. `set-node-count` - Adjust network size
18. `reset-configuration` - Reset to defaults
19. `save-configuration` - Save current config
20. `load-configuration` - Load saved config

#### Analyze Actions (10)
21. `scan-anomalies` - Run info agent
22. `identify-risks` - Find risk points
23. `find-bottlenecks` - Identify bottlenecks
24. `calculate-utilization` - Compute metrics
25. `assess-resilience` - Evaluate robustness
26. `compare-scenarios` - Compare options
27. `generate-report` - Create summary
28. `export-data` - Export to CSV/JSON
29. `visualize-flow` - Show material flow
30. `predict-disruption` - Forecast issues

#### Simulate Actions (10)
31. `run-simulation` - Execute scenario
32. `what-if-port-closure` - Simulate port closure
33. `what-if-supplier-failure` - Simulate supplier failure
34. `what-if-demand-spike` - Simulate demand increase
35. `what-if-weather-event` - Simulate weather disruption
36. `monte-carlo-simulation` - Run probabilistic sim
37. `stress-test` - Test extreme scenarios
38. `sensitivity-analysis` - Analyze parameters
39. `cascade-analysis` - Map failure propagation
40. `recovery-simulation` - Test recovery plans

#### Query Actions (5+)
41. `get-node-details` - Show node information
42. `get-network-summary` - Summarize network
43. `get-recent-alerts` - Show alerts
44. `get-performance-metrics` - Show KPIs
45. `help` - List available commands

## Future Enhancements

1. **Voice Input** - Integrate with Amazon Transcribe
2. **Multi-Language** - Support multiple languages
3. **Proactive Suggestions** - AI suggests actions before asked
4. **Learning from Feedback** - Improve based on user corrections
5. **Collaborative Sessions** - Multiple users in same conversation
6. **Action Macros** - Save and replay action sequences
7. **Custom Actions** - Users define their own actions
8. **Integration with External Tools** - Connect to ERP, WMS, etc.

---

**Design Status**: Ready for implementation
**Next Step**: Create implementation tasks
