# Rate Limiting Quick Start Guide

## Overview

The AI Copilot now includes comprehensive rate limiting to prevent abuse and manage costs. This guide will help you get started quickly.

## What's Included

✅ **Message Rate Limiting**: 20 messages per minute per user (with 5 burst allowance)
✅ **Token Rate Limiting**: 100,000 Bedrock tokens per day per user
✅ **Request Queueing**: Excess requests are queued instead of rejected
✅ **Queue Notifications**: Users are notified of their queue position
✅ **Background Processing**: Queued requests are processed when capacity allows

## Quick Setup

### 1. DynamoDB Tables

Create two DynamoDB tables:

**Rate Limits Table**:
```bash
Table Name: omnitrack-copilot-rate-limits
Partition Key: userId (String)
TTL Attribute: ttl
```

**Queue Table**:
```bash
Table Name: omnitrack-copilot-queue
Partition Key: id (String)
TTL Attribute: ttl

GSI 1: UserIdStatusIndex
  - Partition Key: userId (String)
  - Sort Key: status (String)

GSI 2: StatusIndex
  - Partition Key: status (String)
```

### 2. Environment Variables

Add to your Lambda environment:

```bash
RATE_LIMIT_TABLE_NAME=omnitrack-copilot-rate-limits
QUEUE_TABLE_NAME=omnitrack-copilot-queue
WEBSOCKET_API_ENDPOINT=https://your-api-id.execute-api.region.amazonaws.com/stage
```

### 3. IAM Permissions

Add to your Lambda execution role:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query"
  ],
  "Resource": [
    "arn:aws:dynamodb:region:account:table/omnitrack-copilot-rate-limits",
    "arn:aws:dynamodb:region:account:table/omnitrack-copilot-rate-limits/index/*",
    "arn:aws:dynamodb:region:account:table/omnitrack-copilot-queue",
    "arn:aws:dynamodb:region:account:table/omnitrack-copilot-queue/index/*"
  ]
}
```

## Usage

### Basic Usage

The rate limiting is automatically applied to all WebSocket messages. No code changes needed!

```typescript
// In your WebSocket handler (already integrated)
import { rateLimiter } from './rate-limiter';
import { requestQueue } from './request-queue';

// Rate limiting happens automatically
// Requests are queued when limits exceeded
```

### Custom Rate Limits

To customize rate limits for specific users or tiers:

```typescript
import { RateLimiter } from './rate-limiter';

// Create custom limiter for premium users
const premiumLimiter = new RateLimiter({
  messagesPerMinute: 50,
  tokensPerDay: 500000,
  burstAllowance: 20,
});

// Check limits
const status = await premiumLimiter.checkMessageRateLimit(userId);
```

### Check User Status

Get current rate limit status for a user:

```typescript
import { rateLimiter } from './rate-limiter';

const status = await rateLimiter.getUserStatus(userId);

console.log(`Messages remaining: ${status.messagesRemaining}`);
console.log(`Tokens remaining: ${status.tokensRemaining}`);
console.log(`Message reset at: ${new Date(status.messageResetAt)}`);
console.log(`Token reset at: ${new Date(status.tokenResetAt)}`);
```

### Manual Queue Management

```typescript
import { requestQueue } from './request-queue';

// Get queue position
const position = await requestQueue.getQueuePosition(userId);
console.log(`Position ${position.position} of ${position.totalInQueue}`);
console.log(`Estimated wait: ${position.estimatedWaitTime} seconds`);

// Cancel queued request
await requestQueue.cancelRequest(requestId, userId);

// Get user's queued requests
const requests = await requestQueue.getUserQueuedRequests(userId);
```

## Frontend Integration

### Handle Queue Notifications

Update your WebSocket client to handle queue notifications:

```typescript
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'request_queued':
      // Show queue notification to user
      showNotification(
        `Your request is queued at position ${data.position}. ` +
        `Estimated wait: ${data.estimatedWaitTime} seconds`
      );
      break;
      
    case 'queue_processing_started':
      // Show processing notification
      showNotification('Your queued request is now being processed...');
      break;
      
    case 'message':
      // Handle normal message
      if (data.metadata?.fromQueue) {
        // This response came from a queued request
        showNotification('Your queued request has been completed!');
      }
      displayMessage(data.content);
      break;
  }
};
```

### Display Rate Limit Status

Show users their current rate limit status:

```typescript
// Fetch status from API
const response = await fetch('/api/copilot/rate-limit-status');
const status = await response.json();

// Display to user
document.getElementById('messages-remaining').textContent = 
  `${status.messagesRemaining} messages remaining`;
  
document.getElementById('tokens-remaining').textContent = 
  `${status.tokensRemaining} tokens remaining`;
```

## Monitoring

### CloudWatch Metrics

Monitor these key metrics:

- `MessageRateLimitExceeded` - Users hitting message limits
- `TokenRateLimitExceeded` - Users hitting token limits
- `RequestsQueued` - Number of queued requests
- `QueueDepth` - Current queue size
- `QueueProcessingTime` - Time to process queued requests

### CloudWatch Alarms

Set up alarms for:

```bash
# High queue depth
Metric: QueueDepth
Threshold: > 100
Action: Alert operations team

# High rate limit violations
Metric: MessageRateLimitExceeded
Threshold: > 1000 per hour
Action: Review rate limits

# Slow queue processing
Metric: QueueProcessingTime
Threshold: > 10 seconds
Action: Scale up processing
```

## Testing

### Test Rate Limiting

```bash
# Send multiple messages rapidly
for i in {1..25}; do
  echo "Sending message $i"
  # Send WebSocket message
  # First 20 should succeed
  # Next 5 should succeed (burst)
  # After that, should be queued
done
```

### Test Queue Processing

```bash
# 1. Trigger rate limit by sending many messages
# 2. Wait for queue to process
# 3. Verify messages are processed in order
# 4. Check CloudWatch logs for queue processing
```

## Troubleshooting

### Users Complaining About Rate Limits

**Check their usage**:
```typescript
const status = await rateLimiter.getUserStatus(userId);
console.log(status);
```

**Reset if needed**:
```typescript
await rateLimiter.resetUserLimits(userId);
```

### Queue Not Processing

**Check CloudWatch Logs**:
- Look for errors in queue processor Lambda
- Verify WebSocket connections are active
- Check DynamoDB for stuck requests

**Manual cleanup**:
```typescript
await requestQueue.cleanupOldRequests();
```

### High Token Usage

**Review token estimation**:
- Check actual vs estimated tokens in logs
- Adjust estimation algorithm if needed
- Consider implementing more accurate token counting

## Best Practices

### For Development

1. **Use Lower Limits**: Test with lower limits to catch issues early
2. **Mock Rate Limiter**: Use mocks in unit tests
3. **Test Queue Flow**: Verify queue notifications work correctly

### For Production

1. **Monitor Metrics**: Set up CloudWatch dashboards
2. **Adjust Limits**: Review usage patterns monthly
3. **Alert on Anomalies**: Set up alerts for unusual patterns
4. **Document Limits**: Clearly communicate limits to users

### For Users

1. **Show Limits**: Display current limits in UI
2. **Provide Feedback**: Show clear messages when limited
3. **Offer Upgrades**: Suggest premium tiers for heavy users
4. **Batch Requests**: Encourage combining multiple questions

## Next Steps

1. ✅ Deploy DynamoDB tables
2. ✅ Update Lambda environment variables
3. ✅ Add IAM permissions
4. ✅ Deploy updated Lambda functions
5. ✅ Update frontend to handle queue notifications
6. ✅ Set up CloudWatch alarms
7. ✅ Test with real users
8. ✅ Monitor and adjust limits

## Support

For issues or questions:
- Check CloudWatch Logs for errors
- Review `RATE_LIMITING_IMPLEMENTATION.md` for details
- Contact the development team

---

**Last Updated**: November 2024
**Version**: 1.0
