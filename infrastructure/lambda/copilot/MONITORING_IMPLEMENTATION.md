# AI Copilot Monitoring Implementation

This document describes the comprehensive monitoring and observability implementation for the AI Copilot feature.

## Overview

The AI Copilot monitoring system provides complete visibility into copilot operations, performance, and health through:

1. **Structured Logging** - Detailed logs with correlation IDs for all copilot interactions
2. **Custom Metrics** - Business and operational metrics published to CloudWatch
3. **CloudWatch Alarms** - Automated alerts for critical issues and performance degradation

## Components

### 1. Copilot Logger (`copilot-logger.ts`)

Specialized logger for AI Copilot that extends the base logger with copilot-specific logging methods.

**Key Features:**
- Logs all copilot interactions with correlation IDs
- Logs intent classifications with confidence scores
- Logs action executions with success/failure status
- Logs WebSocket connection events
- Logs streaming events
- Logs clarification requests
- Logs multi-step executions
- Logs Bedrock API calls with token usage
- Logs conversation events

**Usage:**
```typescript
import { createCopilotLogger } from './copilot-logger';

const copilotLogger = createCopilotLogger(event);
copilotLogger.setUserId(userId);

// Log interaction
copilotLogger.logInteraction({
  userId,
  conversationId,
  connectionId,
  message,
  messageLength: message.length,
  timestamp: Date.now(),
});

// Log intent classification
copilotLogger.logIntentClassification({
  intent: 'add-supplier',
  confidence: 0.95,
  parameters: { name: 'Acme Corp' },
  requiresClarification: false,
  classificationTime: 250,
});

// Log action execution
copilotLogger.logActionExecution({
  actionName: 'add-supplier',
  parameters: { name: 'Acme Corp' },
  success: true,
  executionTime: 150,
});
```

### 2. Copilot Metrics Publisher (`copilot-metrics.ts`)

Specialized metrics publisher for AI Copilot that publishes custom metrics to CloudWatch.

**Tracked Metrics:**

#### Message Metrics
- `MessagesReceived` - Count of messages received per minute
- `ResponseTime` - Average response time (p50, p95, p99)
- `ResponseCount` - Total responses generated

#### Intent Classification Metrics
- `IntentClassificationConfidence` - Confidence scores for classifications
- `IntentClassificationCount` - Count of classifications by intent
- `LowConfidenceClassifications` - Count of low confidence classifications

#### Action Execution Metrics
- `ActionExecutionDuration` - Time to execute actions
- `ActionExecutionCount` - Count of action executions
- `ActionSuccessRate` - Success rate by action
- `ActionFailures` - Count of failed actions

#### Bedrock Metrics
- `BedrockTokensUsed` - Token usage by operation (classify, generate, stream)
- `BedrockAPICallDuration` - API call duration by operation
- `BedrockAPICallCount` - Count of API calls by operation
- `BedrockTokensPerCall` - Average tokens per call

#### WebSocket Metrics
- `WebSocketConnections` - Active connection count
- `WebSocketConnectionsEstablished` - New connections
- `WebSocketConnectionsClosed` - Closed connections

#### Streaming Metrics
- `StreamingResponsesStarted` - Streaming sessions started
- `StreamingResponsesCompleted` - Streaming sessions completed
- `StreamingResponsesInterrupted` - Streaming sessions interrupted
- `StreamingTokenCount` - Tokens streamed per session
- `StreamingDuration` - Duration of streaming sessions

#### Clarification Metrics
- `ClarificationsRequested` - Count of clarification requests
- `ClarificationRate` - Rate of clarifications per message

#### Multi-Step Metrics
- `MultiStepRequestsStarted` - Multi-step requests started
- `MultiStepRequestsCompleted` - Multi-step requests completed
- `MultiStepRequestsFailed` - Multi-step requests failed
- `MultiStepCount` - Number of steps per request
- `MultiStepDuration` - Duration of multi-step requests

#### Conversation Metrics
- `ConversationsCreated` - New conversations created
- `MessagesAdded` - Messages added to conversations
- `ConversationsSummarized` - Conversations summarized
- `ConversationMessageCount` - Messages per conversation
- `ConversationTokenCount` - Tokens per conversation

#### Error Metrics
- `Errors` - Count of errors by type
- `ErrorRate` - Error rate by operation

**Usage:**
```typescript
import { copilotMetrics } from './copilot-metrics';

// Track message received
await copilotMetrics.publishMessageReceived(userId);

// Track response time
await copilotMetrics.publishResponseTime(1500, 'add-supplier');

// Track intent classification
await copilotMetrics.publishIntentClassification('add-supplier', 0.95, false);

// Track action execution
await copilotMetrics.publishActionExecution('add-supplier', true, 150);

// Track Bedrock token usage
await copilotMetrics.publishBedrockTokenUsage('classify', 250, 300);
```

### 3. CloudWatch Alarms (`copilot-alarms.ts`)

CDK construct that creates comprehensive CloudWatch alarms for monitoring copilot health.

**Alarms Created:**

#### Critical Alarms (Page On-Call)
1. **High Error Rate Alarm**
   - Threshold: 5% error rate
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Critical Alerts SNS topic

2. **Lambda Error Alarm**
   - Threshold: 5 errors in 5 minutes
   - Evaluation: 2 consecutive periods
   - Action: Publish to Critical Alerts SNS topic

#### Warning Alarms (Team Notifications)
1. **Slow Response Time Alarm**
   - Threshold: p95 > 2 seconds
   - Evaluation: 2 out of 3 periods of 5 minutes
   - Action: Publish to Warning Alerts SNS topic

2. **High Token Usage Alarm**
   - Threshold: 80% of hourly limit (~33,333 tokens/hour)
   - Evaluation: 2 consecutive periods of 1 hour
   - Action: Publish to Warning Alerts SNS topic

3. **Lambda Throttle Alarm**
   - Threshold: 5 throttles in 5 minutes
   - Evaluation: 2 consecutive periods
   - Action: Publish to Warning Alerts SNS topic

4. **Low Confidence Classification Alarm**
   - Threshold: 10 low confidence classifications in 15 minutes
   - Evaluation: 2 consecutive periods
   - Action: Publish to Warning Alerts SNS topic

5. **High Action Failure Rate Alarm**
   - Threshold: 10% failure rate
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Warning Alerts SNS topic

6. **Streaming Interruption Alarm**
   - Threshold: 10 interruptions in 10 minutes
   - Evaluation: 2 consecutive periods
   - Action: Publish to Warning Alerts SNS topic

**Usage in CDK:**
```typescript
import { CopilotAlarms } from './copilot-alarms';

const copilotAlarms = new CopilotAlarms(this, 'CopilotAlarms', {
  copilotFunction: copilotLambda,
  criticalAlertTopic: criticalAlertsTopic,
  warningAlertTopic: warningAlertsTopic,
  environment: 'production',
});

// Create composite health alarm
const healthAlarm = copilotAlarms.createCompositeHealthAlarm(
  criticalAlertsTopic,
  'production'
);
```

## Integration with WebSocket Handler

The WebSocket handler has been updated to use the copilot logger and metrics:

```typescript
import { createCopilotLogger } from './copilot-logger';

export const messageHandler = async (event: APIGatewayProxyEvent) => {
  const copilotLogger = createCopilotLogger(event);
  const startTime = Date.now();

  try {
    // Log interaction
    copilotLogger.logInteraction({
      userId,
      conversationId,
      connectionId,
      message,
      messageLength: message.length,
      timestamp: Date.now(),
    });

    // Classify intent
    const classifyStartTime = Date.now();
    const classification = await classifier.classify(message, history);
    const classifyDuration = Date.now() - classifyStartTime;

    // Log classification
    copilotLogger.logIntentClassification({
      intent: classification.intent,
      confidence: classification.confidence,
      parameters: classification.parameters,
      requiresClarification: classification.requiresClarification,
      classificationTime: classifyDuration,
    });

    // Execute action
    const actionStartTime = Date.now();
    const actionResult = await action.execute(params, context);
    const actionDuration = Date.now() - actionStartTime;

    // Log action execution
    copilotLogger.logActionExecution({
      actionName: classification.intent,
      parameters: classification.parameters,
      success: actionResult.success,
      executionTime: actionDuration,
      error: actionResult.error,
      resultData: actionResult.data,
    });

    // Log total processing time
    const totalDuration = Date.now() - startTime;
    copilotLogger.getLogger().metric('MessageProcessingTime', totalDuration, 'Milliseconds');

  } catch (error) {
    copilotLogger.logError('Failed to process message', error, { connectionId });
  }
};
```

## Integration with Bedrock Service

The Bedrock service has been updated to log token usage:

```typescript
async classifyIntent(message: string, history: Message[]): Promise<IntentClassification> {
  const startTime = Date.now();

  try {
    const response = await this.invokeModel(prompt, options);
    const classification = this.parseIntentClassification(response);

    const executionTime = Date.now() - startTime;
    const tokenCount = this.countTokens(prompt) + this.countTokens(response);
    
    // Log metrics
    logger.metric('BedrockIntentClassificationTime', executionTime, 'Milliseconds');
    logger.metric('BedrockIntentClassificationTokens', tokenCount, 'Count');

    return classification;
  } catch (error) {
    logger.error('Intent classification failed', { error, message });
    throw error;
  }
}
```

## Querying Logs

Use CloudWatch Logs Insights to query copilot logs:

### Find all interactions for a user
```sql
fields @timestamp, message, interaction.conversationId, interaction.messageLength
| filter component = "copilot" and message = "Copilot interaction"
| filter interaction.userId = "user-123"
| sort @timestamp desc
| limit 100
```

### Calculate average response time by intent
```sql
fields @timestamp, classification.intent, classification.classificationTime
| filter component = "copilot" and message = "Intent classified"
| stats avg(classification.classificationTime) as avgTime by classification.intent
| sort avgTime desc
```

### Find failed actions
```sql
fields @timestamp, action.name, error.message
| filter component = "copilot" and level = "ERROR" and message = "Action execution failed"
| sort @timestamp desc
| limit 50
```

### Track Bedrock token usage
```sql
fields @timestamp, bedrock.operation, bedrock.tokenCount
| filter component = "copilot" and message = "Bedrock API call"
| stats sum(bedrock.tokenCount) as totalTokens by bedrock.operation
```

## Viewing Metrics

Access metrics in CloudWatch Console:

1. Navigate to CloudWatch > Metrics
2. Select "OmniTrack/Copilot" namespace
3. View metrics by dimension:
   - By Intent
   - By ActionName
   - By Operation
   - By Success/Failure

## Viewing Alarms

Access alarms in CloudWatch Console:

1. Navigate to CloudWatch > Alarms
2. Filter by "Copilot" in alarm name
3. View alarm history and state changes
4. Configure SNS subscriptions for notifications

## Best Practices

1. **Always use correlation IDs** - Include correlation IDs in all logs for request tracing
2. **Log at appropriate levels** - Use DEBUG for detailed info, INFO for normal operations, ERROR for failures
3. **Publish metrics asynchronously** - Don't block request processing for metrics publishing
4. **Monitor alarm fatigue** - Adjust thresholds if alarms are too sensitive
5. **Review metrics regularly** - Use metrics to identify trends and optimize performance
6. **Set up dashboards** - Create CloudWatch dashboards for real-time monitoring
7. **Test alarms** - Regularly test alarm notifications to ensure they work
8. **Document runbooks** - Create runbooks for responding to alarms

## Cost Optimization

1. **Log retention** - Set appropriate retention periods (30 days for application logs)
2. **Metric resolution** - Use 5-minute periods for most metrics
3. **Alarm evaluation** - Use appropriate evaluation periods to reduce false positives
4. **Batch metrics** - Publish multiple metrics in a single API call when possible

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **9.1** - Log all copilot interactions with correlation IDs
- ✅ **9.1** - Log intent classifications
- ✅ **9.1** - Log action executions
- ✅ **9.2** - Track messages per minute
- ✅ **9.2** - Track average response time
- ✅ **9.2** - Track intent classification accuracy
- ✅ **9.2** - Track action success rate
- ✅ **9.2** - Track Bedrock token usage
- ✅ **9.3** - Add correlation IDs to all logs
- ✅ **9.4** - Alert on high error rate
- ✅ **9.4** - Alert on slow response times
- ✅ **9.4** - Alert on high token usage

## Next Steps

1. Deploy infrastructure with alarms
2. Configure SNS subscriptions for alerts
3. Create CloudWatch dashboards
4. Set up log retention policies
5. Test alarms with synthetic traffic
6. Create runbooks for common scenarios
7. Monitor costs and optimize as needed
