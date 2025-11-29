# Bedrock Service Implementation - Task 2 Complete

## Summary

Successfully implemented Task 2: Bedrock Integration Service for the AI Copilot. The service provides intent classification, response generation, and streaming capabilities using Amazon Bedrock (Claude 3.5 Sonnet).

## What Was Implemented

### 1. BedrockService Class ✅

Created `infrastructure/lambda/copilot/bedrock-service.ts` with:

#### Core Methods

**`classifyIntent(message, history)`**
- Classifies user intent from natural language
- Extracts parameters from message
- Returns confidence score and clarification needs
- Uses conversation history for context
- **Validates Property 1**: Intent classification accuracy

**`generateResponse(actionResult, context)`**
- Generates natural language responses from action results
- Includes conversation context
- Provides helpful insights and suggestions
- **Validates Property 2**: Response generation completeness

**`streamResponse(prompt)`**
- Streams responses token-by-token for real-time UX
- Uses AsyncGenerator for efficient streaming
- Handles stream interruptions gracefully
- **Validates Property 8**: Streaming response continuity

#### Utility Methods

**`countTokens(text)`**
- Approximates token count for text
- Used for context size management

**`summarizeHistory(messages)`**
- Summarizes conversation history to reduce tokens
- Maintains key context while reducing size

### 2. Error Handling & Retries ✅

Implemented robust error handling with exponential backoff:

**`withRetry(fn, operationName)`**
- Retries failed operations up to 3 times
- Exponential backoff: 1s → 2s → 4s
- Maximum delay capped at 10 seconds
- Comprehensive logging of retry attempts

**`isNonRetryableError(error)`**
- Identifies errors that shouldn't be retried
- Validation errors (invalid input)
- Access denied errors (permission issues)
- Resource not found errors (invalid model)

**`withTimeout(promise, timeoutMs)`**
- Adds 30-second timeout to all operations
- Prevents hanging requests
- Provides clear timeout error messages

### 3. Intent Classification System ✅

Built comprehensive intent classification with 40+ supported intents:

#### Build Actions (10)
- add-supplier, add-manufacturer, add-warehouse
- add-distributor, add-retailer
- remove-node, connect-nodes, disconnect-nodes
- update-node, optimize-layout

#### Configure Actions (10)
- set-region, set-industry, set-currency
- add-shipping-method, set-risk-profile
- And more...

#### Analyze Actions (10)
- scan-anomalies, identify-risks, find-bottlenecks
- calculate-utilization, assess-resilience
- And more...

#### Simulate Actions (10)
- run-simulation, what-if-port-closure
- what-if-supplier-failure, what-if-demand-spike
- And more...

#### Query Actions (5+)
- get-node-details, get-network-summary
- get-recent-alerts, help
- And more...

### 4. Configuration & Initialization ✅

**BedrockConfig Interface**
```typescript
{
  modelId: string;           // Claude 3.5 Sonnet model ID
  region: string;            // AWS region
  maxTokens?: number;        // Default: 2048
  temperature?: number;      // Default: 0.7
  topP?: number;            // Default: 0.9
}
```

**Factory Function**
```typescript
createBedrockService(): BedrockService
```
- Creates service from environment variables
- Uses sensible defaults
- Ready for Lambda integration

## Key Features

### 🎯 Intent Classification
- Analyzes user messages to determine intent
- Extracts parameters automatically
- Provides confidence scores
- Asks clarifying questions when needed
- Uses last 5 messages for context

### 💬 Response Generation
- Creates natural, helpful responses
- Explains action results clearly
- Provides relevant insights
- Suggests next steps
- Uses supply chain terminology appropriately

### 🌊 Streaming Support
- Real-time token-by-token delivery
- Efficient AsyncGenerator implementation
- Handles interruptions gracefully
- Provides progress feedback

### 🔄 Robust Error Handling
- Exponential backoff retry logic
- Smart error classification
- Comprehensive logging
- Timeout protection
- Graceful degradation

### 📊 Token Management
- Approximate token counting
- Conversation summarization
- Context size optimization
- Cost-effective API usage

## Technical Details

### Dependencies
```json
{
  "@aws-sdk/client-bedrock-runtime": "^3.x.x"
}
```

### Environment Variables
```bash
BEDROCK_MODEL_ID=anthropic.claude-3.5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
AWS_REGION=us-east-1
```

### Model Configuration
- **Model**: Claude 3.5 Sonnet v2
- **Max Tokens**: 2048 (configurable)
- **Temperature**: 0.7 for responses, 0.3 for classification
- **Top P**: 0.9
- **Timeout**: 30 seconds per request
- **Max Retries**: 3 with exponential backoff

## Usage Examples

### Basic Intent Classification
```typescript
const service = createBedrockService();

const classification = await service.classifyIntent(
  "Add a supplier in China",
  []
);

console.log(classification);
// {
//   intent: "add-supplier",
//   confidence: 0.95,
//   parameters: { location: "China" },
//   requiresClarification: false
// }
```

### Response Generation
```typescript
const response = await service.generateResponse(
  {
    success: true,
    data: { nodeId: "supplier-123", name: "China Supplier" }
  },
  {
    messages: [...],
    userId: "user-123"
  }
);

console.log(response);
// "I've added a new supplier node in China with ID supplier-123. 
//  Would you like to connect it to any existing nodes?"
```

### Streaming Response
```typescript
for await (const token of service.streamResponse(prompt)) {
  process.stdout.write(token);
}
```

## Testing

### Manual Testing
```bash
# Test intent classification
node -e "
const { createBedrockService } = require('./bedrock-service');
const service = createBedrockService();
service.classifyIntent('Add a warehouse in California')
  .then(console.log)
  .catch(console.error);
"
```

### Integration with WebSocket Handler
```typescript
import { createBedrockService } from './bedrock-service';

const bedrockService = createBedrockService();

// In message handler
const classification = await bedrockService.classifyIntent(
  message,
  conversationHistory
);

// Execute action based on intent
const result = await executeAction(classification);

// Generate response
const response = await bedrockService.generateResponse(
  result,
  context
);

// Send to user
await sendMessage(connectionId, response);
```

## Performance Metrics

### Expected Performance
- **Intent Classification**: < 500ms (target)
- **Response Generation**: < 1s (target)
- **Streaming First Token**: < 200ms (target)
- **Total End-to-End**: < 2s (target)

### Retry Behavior
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Multiplier**: 2x
- **Max Retries**: 3
- **Total Max Time**: ~15 seconds (with retries)

## Error Handling Examples

### Retryable Errors
- Network timeouts
- Throttling errors
- Temporary service unavailability
- **Action**: Retry with exponential backoff

### Non-Retryable Errors
- Invalid model ID
- Access denied
- Validation errors
- **Action**: Fail immediately with clear error

### Timeout Handling
- All operations have 30-second timeout
- Prevents hanging requests
- Clear timeout error messages

## Logging

All operations are logged with structured logging:

```typescript
logger.info('Intent classified', {
  intent: 'add-supplier',
  confidence: 0.95,
  executionTime: 450
});

logger.warn('Retrying invokeModel', {
  attempt: 2,
  maxRetries: 3,
  delayMs: 2000,
  error: 'ThrottlingException'
});

logger.error('All retries exhausted for invokeModel', {
  error: 'Service unavailable',
  attempts: 4
});
```

## Security Considerations

### IAM Permissions Required
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": [
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-*"
  ]
}
```

### Data Privacy
- No sensitive data logged
- Conversation history truncated in logs
- PII should be masked before sending to Bedrock
- Responses don't expose internal system details

## Cost Optimization

### Token Usage
- Approximate token counting for monitoring
- Conversation summarization to reduce tokens
- Lower temperature for classification (fewer tokens)
- Efficient prompt engineering

### API Call Optimization
- Retry only on transient errors
- Timeout prevents wasted API calls
- Batch similar requests when possible
- Cache common classifications (future enhancement)

## Next Steps

With Bedrock integration complete, the next tasks are:

### Task 3: Build Action Registry System
- Create Action interface
- Implement ActionRegistry class
- Add parameter validation
- Register initial actions

### Task 4: Implement Core Copilot Actions
- Node management actions
- Connection management actions
- Configuration actions
- Analysis actions

### Task 9: Build Intent Classifier
- Create IntentClassifier class
- Add clarification handling
- Implement context resolution

## Troubleshooting

### Issue: "Access Denied" errors

**Solution**:
1. Verify Bedrock model access is enabled in AWS Console
2. Check IAM role has correct permissions
3. Verify model ID is correct
4. Wait a few minutes for permissions to propagate

### Issue: Slow response times

**Solution**:
1. Check CloudWatch metrics for Bedrock API latency
2. Verify network connectivity
3. Consider using smaller max_tokens for faster responses
4. Check if retries are being triggered excessively

### Issue: Intent classification inaccurate

**Solution**:
1. Review prompt engineering in `buildIntentClassificationPrompt`
2. Add more examples to the prompt
3. Adjust temperature (lower = more deterministic)
4. Provide more conversation context

### Issue: Streaming interrupted

**Solution**:
1. Check WebSocket connection stability
2. Verify timeout settings
3. Review CloudWatch logs for errors
4. Test with smaller responses first

## References

- [Requirements Document](../../../.kiro/specs/ai-copilot/requirements.md)
- [Design Document](../../../.kiro/specs/ai-copilot/design.md)
- [Tasks Document](../../../.kiro/specs/ai-copilot/tasks.md)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3.5 Sonnet Model Card](https://www.anthropic.com/claude)

---

**Task Status:** ✅ Complete
**Date:** November 28, 2025
**Next Task:** Task 3 - Build Action Registry System
