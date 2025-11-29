# Context Size Management - Quick Start Guide

## Overview

The conversation service now automatically manages context size by summarizing older messages while keeping recent messages verbatim. This ensures conversations stay within token limits while preserving important context.

## Automatic Behavior

### When Does Summarization Happen?

Summarization automatically triggers:
- At 10 messages
- Every 10 messages after that (20, 30, 40, etc.)

### What Gets Summarized?

- **Summarized**: All messages except the last 5
- **Kept Verbatim**: Last 5 messages
- **Stored**: Summary saved to DynamoDB

## Usage Examples

### 1. Normal Conversation Flow

```typescript
import { ConversationService } from './conversation-service';

const conversationService = new ConversationService();

// Add messages normally - summarization happens automatically
await conversationService.addMessage(conversationId, {
  role: 'user',
  content: 'Add a supplier in New York',
});

// After 10 messages, older messages are automatically summarized
```

### 2. Get Conversation Context

```typescript
// Get context for intent classification
const context = await conversationService.getConversationContext(conversationId);

console.log(context.recentMessages); // Last 5 messages
console.log(context.summary); // Summary of older messages
console.log(context.supplyChainContext); // Supply chain state
```

### 3. Manual Summarization

```typescript
// Force summarization before automatic threshold
const summary = await conversationService.triggerSummarization(conversationId);

console.log('Summary:', summary);
```

### 4. Monitor Context Size

```typescript
// Check context size information
const info = await conversationService.getContextSizeInfo(conversationId);

console.log('Total messages:', info.totalMessages);
console.log('Recent messages:', info.recentMessages);
console.log('Has summary:', info.hasSummary);
console.log('Estimated tokens:', info.estimatedTokens);
console.log('Within limit:', info.withinLimit);
console.log('Max tokens:', info.maxTokens);
```

## Integration with Copilot Orchestrator

### Using Context in Intent Classification

```typescript
import { CopilotOrchestrator } from './copilot-orchestrator';

const orchestrator = new CopilotOrchestrator();

// The orchestrator automatically uses summarized context
const response = await orchestrator.processMessage({
  conversationId,
  message: 'What suppliers do we have?',
  userId: 'user123',
});

// Context includes:
// - Summary of messages 1-10 (if conversation has 15 messages)
// - Messages 11-15 verbatim
```

## Configuration

### Adjust Thresholds

Edit `conversation-service.ts`:

```typescript
const MAX_CONTEXT_TOKENS = 8000; // Maximum tokens allowed
const SUMMARIZATION_THRESHOLD = 10; // Messages before summarization
const RECENT_MESSAGE_COUNT = 5; // Messages to keep verbatim
```

### Custom Bedrock Configuration

```typescript
const bedrockService = new BedrockService({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  region: 'us-east-1',
  maxTokens: 200, // For summarization
  temperature: 0.5, // For summarization
});

const conversationService = new ConversationService(bedrockService);
```

## Monitoring

### CloudWatch Logs

Look for these log messages:

```json
{
  "message": "Triggering conversation summarization",
  "conversationId": "conv_user123_1234567890",
  "messageCount": 10
}

{
  "message": "Conversation summarized",
  "totalMessages": 15,
  "summarizedMessages": 10,
  "recentMessages": 5,
  "summaryLength": 150,
  "estimatedTokensSaved": 250
}

{
  "message": "Retrieved conversation context",
  "conversationId": "conv_user123_1234567890",
  "totalMessages": 15,
  "recentMessages": 5,
  "hasSummary": true,
  "estimatedTokens": 500,
  "withinLimit": true
}
```

### Metrics

Track these metrics in CloudWatch:
- `ConversationSummarizations` - Count of summarizations
- `ContextTokenCount` - Average token count per conversation
- `SummarizationDuration` - Time to summarize

## Error Handling

### Graceful Degradation

If summarization fails:
- Error is logged
- Empty string returned as summary
- Conversation continues normally
- No user-facing error

### Example Error Log

```json
{
  "level": "ERROR",
  "message": "Failed to summarize conversation",
  "error": {
    "name": "BedrockError",
    "message": "API timeout"
  }
}
```

## Best Practices

### 1. Monitor Context Size

```typescript
// Check before adding many messages
const info = await conversationService.getContextSizeInfo(conversationId);

if (!info.withinLimit) {
  // Force summarization
  await conversationService.triggerSummarization(conversationId);
}
```

### 2. Clear Old Conversations

```typescript
// Start fresh session
await conversationService.clearConversation(conversationId);
```

### 3. Use Context Efficiently

```typescript
// Get only what you need
const context = await conversationService.getConversationContext(conversationId);

// Use summary for general context
const generalContext = context.summary;

// Use recent messages for specific references
const recentContext = context.recentMessages;
```

## Testing

### Unit Tests

```typescript
import { ConversationService } from './conversation-service';

describe('Context Size Management', () => {
  it('should summarize after 10 messages', async () => {
    const service = new ConversationService(mockBedrockService);
    
    // Add 10 messages
    for (let i = 0; i < 10; i++) {
      await service.addMessage(conversationId, {
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      });
    }
    
    // Check summary was created
    const conversation = await service.getConversation(conversationId);
    expect(conversation.summary).toBeTruthy();
  });
});
```

## Troubleshooting

### Issue: Summarization Not Triggering

**Check**:
1. Message count >= 10?
2. BedrockService configured correctly?
3. DynamoDB permissions?

**Solution**:
```typescript
// Force summarization
await conversationService.triggerSummarization(conversationId);
```

### Issue: Context Too Large

**Check**:
```typescript
const info = await conversationService.getContextSizeInfo(conversationId);
console.log('Tokens:', info.estimatedTokens);
console.log('Limit:', info.maxTokens);
```

**Solution**:
```typescript
// Reduce threshold or increase max tokens
const MAX_CONTEXT_TOKENS = 10000; // Increase limit
const SUMMARIZATION_THRESHOLD = 5; // Summarize more frequently
```

### Issue: Summary Quality Poor

**Check**: Bedrock configuration

**Solution**:
```typescript
// Adjust temperature for better summaries
const bedrockService = new BedrockService({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  region: 'us-east-1',
  temperature: 0.3, // Lower = more focused
});
```

## API Reference

### ConversationService Methods

#### `addMessage(conversationId, message)`
Adds message and triggers automatic summarization if needed.

#### `getConversationContext(conversationId)`
Returns recent messages + summary for context.

#### `triggerSummarization(conversationId)`
Manually triggers summarization.

#### `getContextSizeInfo(conversationId)`
Returns detailed context size information.

#### `summarizeConversation(messages)`
Summarizes a list of messages (internal use).

#### `estimateTokenCount(messages)`
Estimates token count for messages.

#### `isContextSizeValid(messages)`
Checks if context is within limits.

## Related Documentation

- [Conversation Service Implementation](./conversation-service.ts)
- [Bedrock Service](./bedrock-service.ts)
- [Context Size Management Summary](./CONTEXT_SIZE_MANAGEMENT_SUMMARY.md)
- [AI Copilot Requirements](../../../.kiro/specs/ai-copilot/requirements.md)

---

**Last Updated**: November 28, 2025
**Feature**: AI Copilot - Context Size Management
