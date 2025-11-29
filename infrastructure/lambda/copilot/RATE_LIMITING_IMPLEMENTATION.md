# Rate Limiting Implementation for AI Copilot

## Overview

This document describes the rate limiting implementation for the AI Copilot, which prevents abuse and manages costs by limiting messages per user per minute and Bedrock tokens per user per day.

## Requirements

**Requirements 9.4**: Rate limiting and usage management
- Limit messages per user per minute
- Limit Bedrock tokens per user per day
- Queue excess requests
- Process queue in background
- Notify user of queue position

## Architecture

### Components

1. **RateLimiter** (`rate-limiter.ts`)
   - Tracks message rate limits (messages per minute)
   - Tracks token rate limits (tokens per day)
   - Records actual token usage
   - Stores data in DynamoDB

2. **RequestQueue** (`request-queue.ts`)
   - Queues requests when rate limits are exceeded
   - Tracks queue position
   - Manages request lifecycle (queued → processing → completed/failed)
   - Provides queue status to users

3. **QueueProcessor** (`queue-processor.ts`)
   - Background Lambda function to process queued requests
   - Checks rate limits before processing
   - Sends responses via WebSocket
   - Records token usage

4. **WebSocket Handler Integration** (`websocket-handler.ts`)
   - Checks rate limits before processing messages
   - Queues requests when limits exceeded
   - Notifies users of queue status

## Rate Limit Configuration

### Default Limits

```typescript
{
  messagesPerMinute: 20,    // 20 messages per minute
  tokensPerDay: 100000,     // 100k tokens per day
  burstAllowance: 5         // Allow 5 extra messages in burst
}
```

### Customization

Rate limits can be customized per environment:

```typescript
const rateLimiter = new RateLimiter({
  messagesPerMinute: 30,
  tokensPerDay: 200000,
  burstAllowance: 10,
});
```

## Data Storage

### Rate Limit Table

**Table**: `omnitrack-copilot-rate-limits`

**Schema**:
```typescript
{
  userId: string;              // Partition key
  messageCount: number;        // Messages in current window
  messageWindowStart: number;  // Window start timestamp
  lastMessageTime: number;     // Last message timestamp
  tokenCount: number;          // Tokens used today
  tokenWindowStart: number;    // Start of current day
  updatedAt: number;          // Last update timestamp
  ttl: number;                // DynamoDB TTL (7 days)
}
```

### Queue Table

**Table**: `omnitrack-copilot-queue`

**Schema**:
```typescript
{
  id: string;                 // Partition key (request ID)
  userId: string;             // User identifier
  connectionId: string;       // WebSocket connection ID
  conversationId?: string;    // Optional conversation ID
  message: string;            // User message
  timestamp: number;          // Original timestamp
  queuedAt: number;          // Queue timestamp
  status: string;            // queued | processing | completed | failed
  position?: number;         // Queue position
  estimatedProcessTime?: number;
  error?: string;            // Error message if failed
  retryCount: number;        // Retry attempts
  ttl: number;               // DynamoDB TTL (1 hour)
}
```

**Indexes**:
- `UserIdStatusIndex`: GSI on (userId, status) for user queries
- `StatusIndex`: GSI on (status) for queue management

## Flow Diagrams

### Message Rate Limiting Flow

```
User sends message
    ↓
Check message rate limit
    ↓
    ├─ Allowed → Process message
    │              ↓
    │          Record token usage
    │              ↓
    │          Send response
    │
    └─ Exceeded → Queue request
                     ↓
                 Notify user of queue position
                     ↓
                 Background processor picks up
                     ↓
                 Check rate limit again
                     ↓
                 Process if allowed
```

### Token Rate Limiting Flow

```
User sends message
    ↓
Estimate token usage (~1000 tokens)
    ↓
Check token rate limit
    ↓
    ├─ Allowed → Process message
    │              ↓
    │          Calculate actual tokens
    │              ↓
    │          Record token usage
    │
    └─ Exceeded → Queue request
                     ↓
                 Notify user of daily limit
```

## API

### RateLimiter

#### Check Message Rate Limit

```typescript
const status = await rateLimiter.checkMessageRateLimit(userId);

if (!status.allowed) {
  console.log(`Rate limit exceeded. Retry after ${status.retryAfter} seconds`);
}
```

#### Check Token Rate Limit

```typescript
const status = await rateLimiter.checkTokenRateLimit(userId, estimatedTokens);

if (!status.allowed) {
  console.log(`Token limit exceeded. Resets at ${new Date(status.resetAt)}`);
}
```

#### Record Token Usage

```typescript
await rateLimiter.recordTokenUsage(userId, actualTokens);
```

#### Get User Status

```typescript
const status = await rateLimiter.getUserStatus(userId);

console.log(`Messages remaining: ${status.messagesRemaining}`);
console.log(`Tokens remaining: ${status.tokensRemaining}`);
```

### RequestQueue

#### Enqueue Request

```typescript
const { request, position } = await requestQueue.enqueueRequest(
  userId,
  connectionId,
  message,
  conversationId
);

console.log(`Queued at position ${position.position}`);
console.log(`Estimated wait: ${position.estimatedWaitTime} seconds`);
```

#### Get Queue Position

```typescript
const position = await requestQueue.getQueuePosition(userId);

console.log(`Position: ${position.position} of ${position.totalInQueue}`);
```

#### Cancel Request

```typescript
const cancelled = await requestQueue.cancelRequest(requestId, userId);
```

## WebSocket Messages

### Rate Limit Error (Legacy - now queues instead)

```json
{
  "type": "rate_limit_error",
  "error": "Message rate limit exceeded...",
  "retryAfter": 30,
  "messagesRemaining": 0,
  "tokensRemaining": 50000,
  "resetAt": 1234567890000,
  "timestamp": 1234567890000
}
```

### Request Queued

```json
{
  "type": "request_queued",
  "message": "Your request has been queued due to rate limiting.",
  "requestId": "req_user123_1234567890_abc123",
  "position": 5,
  "totalInQueue": 12,
  "estimatedWaitTime": 10,
  "timestamp": 1234567890000
}
```

### Queue Processing Started

```json
{
  "type": "queue_processing_started",
  "requestId": "req_user123_1234567890_abc123",
  "message": "Your queued request is now being processed.",
  "timestamp": 1234567890000
}
```

## Monitoring

### CloudWatch Metrics

The rate limiter emits the following metrics:

- `MessageRateLimitExceeded` - Count of message rate limit violations
- `TokenRateLimitExceeded` - Count of token rate limit violations
- `RequestsQueued` - Count of requests queued
- `QueueProcessingTime` - Time to process queued requests
- `QueueDepth` - Current number of queued requests

### CloudWatch Logs

All rate limiting events are logged with structured data:

```typescript
logger.warning('Message rate limit exceeded', {
  userId,
  messageCount,
  limit,
  retryAfter,
});
```

## Testing

### Unit Tests

Test rate limiting logic:

```typescript
describe('RateLimiter', () => {
  it('should allow messages within limit', async () => {
    const limiter = new RateLimiter({ messagesPerMinute: 5 });
    
    for (let i = 0; i < 5; i++) {
      const status = await limiter.checkMessageRateLimit('user123');
      expect(status.allowed).toBe(true);
    }
  });

  it('should reject messages exceeding limit', async () => {
    const limiter = new RateLimiter({ messagesPerMinute: 5 });
    
    // Send 5 messages (allowed)
    for (let i = 0; i < 5; i++) {
      await limiter.checkMessageRateLimit('user123');
    }
    
    // 6th message should be rejected
    const status = await limiter.checkMessageRateLimit('user123');
    expect(status.allowed).toBe(false);
  });
});
```

### Integration Tests

Test end-to-end flow:

```typescript
describe('Rate Limiting Integration', () => {
  it('should queue requests when rate limit exceeded', async () => {
    // Send messages until rate limited
    // Verify request is queued
    // Verify user receives queue notification
    // Verify background processor picks up request
  });
});
```

## Deployment

### Infrastructure Requirements

1. **DynamoDB Tables**:
   - `omnitrack-copilot-rate-limits` (with TTL enabled)
   - `omnitrack-copilot-queue` (with TTL enabled, GSIs)

2. **Lambda Functions**:
   - WebSocket handler (existing, updated)
   - Queue processor (new, triggered by CloudWatch Events or SQS)

3. **IAM Permissions**:
   - DynamoDB read/write for both tables
   - API Gateway Management API for WebSocket
   - CloudWatch Logs

### Environment Variables

```bash
# Rate Limit Table
RATE_LIMIT_TABLE_NAME=omnitrack-copilot-rate-limits

# Queue Table
QUEUE_TABLE_NAME=omnitrack-copilot-queue

# WebSocket API (for queue processor)
WEBSOCKET_API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/prod
```

## Best Practices

### For Users

1. **Monitor Usage**: Check remaining messages/tokens via status API
2. **Batch Requests**: Combine multiple questions into one message
3. **Off-Peak Usage**: Use during off-peak hours for better availability

### For Administrators

1. **Adjust Limits**: Monitor usage patterns and adjust limits accordingly
2. **Alert on Queues**: Set up alerts when queue depth exceeds threshold
3. **Review Patterns**: Analyze rate limit violations to identify abuse
4. **Cleanup**: Run periodic cleanup of old queue entries

## Future Enhancements

1. **SQS Integration**: Use SQS for more reliable queue processing
2. **Priority Queues**: Implement priority levels for different user tiers
3. **Dynamic Limits**: Adjust limits based on system load
4. **User Tiers**: Different limits for free/premium users
5. **Burst Credits**: Allow users to accumulate burst credits
6. **Rate Limit Dashboard**: UI for users to view their usage

## Troubleshooting

### High Queue Depth

**Symptom**: Many requests stuck in queue

**Solutions**:
- Increase rate limits temporarily
- Scale up queue processor Lambda concurrency
- Check for processing errors in CloudWatch Logs

### False Positives

**Symptom**: Users rate limited incorrectly

**Solutions**:
- Check DynamoDB for stale data
- Verify TTL is working correctly
- Reset user limits manually if needed

### Token Estimation Errors

**Symptom**: Users hitting token limits too quickly

**Solutions**:
- Improve token estimation algorithm
- Track actual vs estimated tokens
- Adjust estimation multiplier

## References

- Requirements: `.kiro/specs/ai-copilot/requirements.md` (9.4)
- Design: `.kiro/specs/ai-copilot/design.md`
- Tasks: `.kiro/specs/ai-copilot/tasks.md` (Task 18)

---

**Implementation Date**: November 2024
**Status**: Complete
**Version**: 1.0
