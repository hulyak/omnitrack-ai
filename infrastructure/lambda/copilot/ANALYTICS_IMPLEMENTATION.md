# AI Copilot Analytics Implementation

## Overview

The analytics system tracks copilot usage patterns, popular commands, and error trends to provide insights into system performance and user behavior.

## Requirements

**Requirement 9.5**: As a system administrator, I want to monitor copilot usage, so that I can optimize performance and costs.

## Architecture

### Backend Components

1. **AnalyticsService** (`analytics-service.ts`)
   - Tracks user actions, commands, and errors
   - Stores analytics data in DynamoDB
   - Provides query methods for retrieving analytics

2. **AnalyticsHandler** (`analytics-handler.ts`)
   - API handlers for analytics endpoints
   - Supports dashboard summary, command stats, error patterns
   - Provides data export in JSON and CSV formats

3. **DynamoDB Table** (`omnitrack-copilot-analytics`)
   - Stores analytics events with 90-day TTL
   - GSIs for querying by date and event type
   - Supports efficient aggregation queries

### Frontend Components

1. **AnalyticsDashboard** (`analytics-dashboard.tsx`)
   - Displays usage statistics and performance metrics
   - Shows popular commands and error patterns
   - Supports date range filtering
   - Provides export functionality

2. **API Routes**
   - `/api/copilot/analytics/dashboard` - Dashboard summary
   - `/api/copilot/analytics/export` - Data export

## Data Model

### Analytics Event

```typescript
{
  PK: "EVENT#<eventType>",
  SK: "<userId>#<timestamp>#<randomId>",
  userId: string,
  conversationId?: string,
  connectionId?: string,
  eventType: AnalyticsEventType,
  timestamp: number,
  date: "YYYY-MM-DD",
  hour: "YYYY-MM-DDTHH",
  metadata: Record<string, any>,
  ttl: number
}
```

### Command Statistics

```typescript
{
  PK: "COMMAND#<commandName>",
  SK: "STATS#<date>",
  commandName: string,
  totalExecutions: number,
  successfulExecutions: number,
  failedExecutions: number,
  totalExecutionTime: number,
  lastExecuted: number
}
```

### Error Pattern

```typescript
{
  PK: "ERROR#<errorType>",
  SK: "PATTERN#<errorHash>",
  errorType: string,
  errorMessage: string,
  count: number,
  firstOccurrence: number,
  lastOccurrence: number,
  affectedUsers: string[]
}
```

## Event Types

- `MESSAGE_SENT` - User sends a message
- `INTENT_CLASSIFIED` - Intent classification completed
- `ACTION_EXECUTED` - Action executed successfully
- `ACTION_FAILED` - Action execution failed
- `CLARIFICATION_REQUESTED` - Clarification needed
- `STREAMING_STARTED` - Streaming response started
- `STREAMING_COMPLETED` - Streaming response completed
- `STREAMING_INTERRUPTED` - Streaming interrupted
- `MULTI_STEP_STARTED` - Multi-step execution started
- `MULTI_STEP_COMPLETED` - Multi-step execution completed
- `MULTI_STEP_FAILED` - Multi-step execution failed
- `ERROR_OCCURRED` - Error occurred
- `WEBSOCKET_CONNECTED` - WebSocket connected
- `WEBSOCKET_DISCONNECTED` - WebSocket disconnected

## Integration

### Tracking Events

The analytics service is integrated into the WebSocket handler to automatically track events:

```typescript
import { analyticsService, AnalyticsEventType } from './analytics-service';

// Track message sent
await analyticsService.trackEvent({
  eventType: AnalyticsEventType.MESSAGE_SENT,
  userId,
  conversationId,
  timestamp: Date.now(),
  metadata: { messageLength: message.length },
});

// Track command execution
await analyticsService.trackCommandExecution(
  userId,
  commandName,
  success,
  executionTime,
  conversationId
);

// Track error
await analyticsService.trackError(
  userId,
  'ActionExecutionError',
  errorMessage,
  conversationId,
  { actionName, parameters }
);
```

## API Endpoints

### Get Dashboard Summary

```
GET /analytics/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

Returns:
- Summary statistics (total executions, success rate, avg time, errors)
- Top 5 popular commands
- Top 5 error patterns

### Get Command Statistics

```
GET /analytics/commands/{commandName}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

Returns detailed statistics for a specific command.

### Get Popular Commands

```
GET /analytics/commands/popular?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
```

Returns the most frequently used commands.

### Get Error Patterns

```
GET /analytics/errors?errorType=ValidationError&limit=20
```

Returns error patterns, optionally filtered by error type.

### Get User Activity

```
GET /analytics/users/{userId}?startDate=timestamp&endDate=timestamp
```

Returns activity summary for a specific user.

### Export Analytics

```
GET /analytics/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|csv
```

Exports analytics data in JSON or CSV format.

## Dashboard Features

### Summary Cards

- **Total Executions**: Total number of actions executed
- **Success Rate**: Percentage of successful executions
- **Avg Response Time**: Average execution time in milliseconds
- **Total Errors**: Total number of errors with unique types

### Popular Commands Table

Shows:
- Command name
- Total executions
- Success rate
- Average execution time
- Last used timestamp

### Error Patterns

Shows:
- Error type and message
- Occurrence count
- First and last occurrence
- Number of affected users

### Export Functionality

- Export to JSON for programmatic analysis
- Export to CSV for spreadsheet analysis
- Includes all commands and error patterns

## Performance Considerations

### Data Retention

- Analytics events: 90 days TTL
- Automatic cleanup via DynamoDB TTL
- Reduces storage costs

### Query Optimization

- GSIs for efficient date-based queries
- GSIs for event type filtering
- Pre-aggregated command statistics

### Cost Optimization

- Pay-per-request billing mode
- Efficient query patterns
- Minimal data duplication

## Security

### Access Control

- Analytics endpoints require authentication
- Admin-only access to analytics dashboard
- User-specific data filtering

### Data Privacy

- No sensitive user data in analytics
- Message content not stored (only length)
- PII excluded from error logs

## Monitoring

### CloudWatch Metrics

Analytics tracking publishes metrics to CloudWatch:
- `AnalyticsEventsTracked` - Number of events tracked
- `AnalyticsQueryLatency` - Query response time
- `AnalyticsErrors` - Analytics system errors

### Alarms

- Alert on high error rates
- Alert on query latency spikes
- Alert on storage growth

## Future Enhancements

1. **Real-time Dashboard**
   - WebSocket updates for live data
   - Real-time charts and graphs

2. **Advanced Analytics**
   - User cohort analysis
   - Command correlation analysis
   - Predictive error detection

3. **Custom Reports**
   - Scheduled report generation
   - Email delivery
   - Custom date ranges and filters

4. **A/B Testing**
   - Track feature variants
   - Compare performance metrics
   - Statistical significance testing

5. **Cost Analysis**
   - Bedrock token cost tracking
   - Per-user cost breakdown
   - Budget alerts

## Testing

### Unit Tests

Test analytics service methods:
- Event tracking
- Command statistics aggregation
- Error pattern detection
- Query methods

### Integration Tests

Test end-to-end analytics flow:
- Event tracking from WebSocket handler
- Data retrieval via API
- Export functionality

## Deployment

### Infrastructure

The analytics table is created in the CDK stack:

```typescript
const copilotAnalyticsTable = new dynamodb.Table(this, 'CopilotAnalyticsTable', {
  tableName: 'omnitrack-copilot-analytics',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
  // ... GSIs and other configuration
});
```

### Environment Variables

```bash
ANALYTICS_TABLE_NAME=omnitrack-copilot-analytics
```

### Permissions

The copilot execution role needs:
- `dynamodb:PutItem` - Track events
- `dynamodb:UpdateItem` - Update statistics
- `dynamodb:Query` - Retrieve analytics
- `dynamodb:GetItem` - Get specific records

## Usage Example

### Accessing the Dashboard

Navigate to `/copilot-analytics` to view the analytics dashboard.

### Exporting Data

Click "Export JSON" or "Export CSV" to download analytics data.

### Filtering by Date

Use the date range selector to filter analytics by time period.

## Troubleshooting

### No Data Showing

- Check that analytics tracking is enabled
- Verify DynamoDB table exists
- Check IAM permissions
- Review CloudWatch logs for errors

### Slow Queries

- Check GSI usage
- Review query patterns
- Consider data aggregation
- Monitor DynamoDB metrics

### High Costs

- Review data retention policy
- Check for excessive tracking
- Optimize query patterns
- Consider sampling for high-volume events

## References

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [Analytics Design Patterns](https://aws.amazon.com/blogs/database/design-patterns-for-high-volume-time-series-data-in-amazon-dynamodb/)
