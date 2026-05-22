/**
 * Copilot-specific metrics publisher
 * 
 * Extends the base metrics publisher with copilot-specific metrics
 * for tracking messages, response times, intent accuracy, and token usage.
 * 
 * Requirements: 9.2 - Track copilot-specific metrics
 */

import { MetricsPublisher, MetricUnit, MetricData } from '../utils/metrics';

/**
 * Copilot Metrics Publisher
 * 
 * Specialized metrics publisher for AI Copilot with methods for publishing
 * copilot-specific metrics to CloudWatch.
 */
export class CopilotMetricsPublisher extends MetricsPublisher {
  constructor() {
    super('OmniTrack/Copilot', [
      { Name: 'Environment', Value: process.env.ENVIRONMENT || 'production' },
      { Name: 'Component', Value: 'copilot' },
    ]);
  }

  /**
   * Track messages per minute
   * 
   * Requirements: 9.2 - Track messages per minute
   */
  async publishMessageReceived(userId: string): Promise<void> {
    await this.publishMetric('MessagesReceived', 1, MetricUnit.COUNT, [
      { Name: 'UserId', Value: userId },
    ]);
  }

  /**
   * Track average response time
   * 
   * Requirements: 9.2 - Track average response time
   */
  async publishResponseTime(duration: number, intent?: string): Promise<void> {
    const dimensions = intent ? [{ Name: 'Intent', Value: intent }] : [];
    
    await this.publishMetrics([
      {
        MetricName: 'ResponseTime',
        Value: duration,
        Unit: MetricUnit.MILLISECONDS,
        Dimensions: dimensions,
      },
      {
        MetricName: 'ResponseCount',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: dimensions,
      },
    ]);
  }

  /**
   * Track intent classification accuracy
   * 
   * Requirements: 9.2 - Track intent classification accuracy
   */
  async publishIntentClassification(
    intent: string,
    confidence: number,
    requiresClarification: boolean
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'IntentClassificationConfidence',
        Value: confidence,
        Unit: MetricUnit.NONE,
        Dimensions: [{ Name: 'Intent', Value: intent }],
      },
      {
        MetricName: 'IntentClassificationCount',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [
          { Name: 'Intent', Value: intent },
          { Name: 'RequiresClarification', Value: requiresClarification.toString() },
        ],
      },
    ]);

    // Track low confidence classifications separately
    if (confidence < 0.5) {
      await this.publishMetric('LowConfidenceClassifications', 1, MetricUnit.COUNT, [
        { Name: 'Intent', Value: intent },
      ]);
    }
  }

  /**
   * Track action success rate
   * 
   * Requirements: 9.2 - Track action success rate
   */
  async publishActionExecution(
    actionName: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'ActionExecutionDuration',
        Value: duration,
        Unit: MetricUnit.MILLISECONDS,
        Dimensions: [
          { Name: 'ActionName', Value: actionName },
          { Name: 'Success', Value: success.toString() },
        ],
      },
      {
        MetricName: 'ActionExecutionCount',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [
          { Name: 'ActionName', Value: actionName },
          { Name: 'Success', Value: success.toString() },
        ],
      },
      {
        MetricName: 'ActionSuccessRate',
        Value: success ? 1 : 0,
        Unit: MetricUnit.NONE,
        Dimensions: [{ Name: 'ActionName', Value: actionName }],
      },
    ]);

    // Track failures separately
    if (!success) {
      await this.publishMetric('ActionFailures', 1, MetricUnit.COUNT, [
        { Name: 'ActionName', Value: actionName },
      ]);
    }
  }

  /**
   * Track Bedrock token usage
   * 
   * Requirements: 9.2 - Track Bedrock token usage
   */
  async publishBedrockTokenUsage(
    operation: 'classify' | 'generate' | 'stream',
    tokenCount: number,
    duration: number
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'BedrockTokensUsed',
        Value: tokenCount,
        Unit: MetricUnit.COUNT,
        Dimensions: [{ Name: 'Operation', Value: operation }],
      },
      {
        MetricName: 'BedrockAPICallDuration',
        Value: duration,
        Unit: MetricUnit.MILLISECONDS,
        Dimensions: [{ Name: 'Operation', Value: operation }],
      },
      {
        MetricName: 'BedrockAPICallCount',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [{ Name: 'Operation', Value: operation }],
      },
    ]);

    // Track token usage per user (if available in context)
    // This helps with rate limiting and cost tracking
    await this.publishMetric('BedrockTokensPerCall', tokenCount, MetricUnit.COUNT, [
      { Name: 'Operation', Value: operation },
    ]);
  }

  /**
   * Track WebSocket connections
   */
  async publishWebSocketConnection(event: 'connect' | 'disconnect'): Promise<void> {
    await this.publishMetric('WebSocketConnections', event === 'connect' ? 1 : -1, MetricUnit.COUNT);
    
    if (event === 'connect') {
      await this.publishMetric('WebSocketConnectionsEstablished', 1, MetricUnit.COUNT);
    } else {
      await this.publishMetric('WebSocketConnectionsClosed', 1, MetricUnit.COUNT);
    }
  }

  /**
   * Track streaming responses
   */
  async publishStreamingResponse(
    event: 'start' | 'complete' | 'interrupted',
    tokenCount?: number,
    duration?: number
  ): Promise<void> {
    if (event === 'start') {
      await this.publishMetric('StreamingResponsesStarted', 1, MetricUnit.COUNT);
    } else if (event === 'complete') {
      await this.publishMetrics([
        {
          MetricName: 'StreamingResponsesCompleted',
          Value: 1,
          Unit: MetricUnit.COUNT,
        },
        ...(tokenCount ? [{
          MetricName: 'StreamingTokenCount',
          Value: tokenCount,
          Unit: MetricUnit.COUNT,
        }] : []),
        ...(duration ? [{
          MetricName: 'StreamingDuration',
          Value: duration,
          Unit: MetricUnit.MILLISECONDS,
        }] : []),
      ]);
    } else if (event === 'interrupted') {
      await this.publishMetric('StreamingResponsesInterrupted', 1, MetricUnit.COUNT);
    }
  }

  /**
   * Track clarification requests
   */
  async publishClarificationRequest(intent: string): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'ClarificationsRequested',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [{ Name: 'Intent', Value: intent }],
      },
      {
        MetricName: 'ClarificationRate',
        Value: 1,
        Unit: MetricUnit.NONE,
      },
    ]);
  }

  /**
   * Track multi-step executions
   */
  async publishMultiStepExecution(
    event: 'start' | 'complete' | 'failed',
    stepCount?: number,
    duration?: number
  ): Promise<void> {
    if (event === 'start') {
      await this.publishMetric('MultiStepRequestsStarted', 1, MetricUnit.COUNT);
    } else if (event === 'complete') {
      await this.publishMetrics([
        {
          MetricName: 'MultiStepRequestsCompleted',
          Value: 1,
          Unit: MetricUnit.COUNT,
        },
        ...(stepCount ? [{
          MetricName: 'MultiStepCount',
          Value: stepCount,
          Unit: MetricUnit.COUNT,
        }] : []),
        ...(duration ? [{
          MetricName: 'MultiStepDuration',
          Value: duration,
          Unit: MetricUnit.MILLISECONDS,
        }] : []),
      ]);
    } else if (event === 'failed') {
      await this.publishMetric('MultiStepRequestsFailed', 1, MetricUnit.COUNT);
    }
  }

  /**
   * Track conversation events
   */
  async publishConversationEvent(event: 'created' | 'message_added' | 'summarized'): Promise<void> {
    if (event === 'created') {
      await this.publishMetric('ConversationsCreated', 1, MetricUnit.COUNT);
    } else if (event === 'message_added') {
      await this.publishMetric('MessagesAdded', 1, MetricUnit.COUNT);
    } else if (event === 'summarized') {
      await this.publishMetric('ConversationsSummarized', 1, MetricUnit.COUNT);
    }
  }

  /**
   * Track errors
   */
  async publishError(errorType: string, operation?: string): Promise<void> {
    const dimensions = operation ? [{ Name: 'Operation', Value: operation }] : [];
    
    await this.publishMetrics([
      {
        MetricName: 'Errors',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [
          ...dimensions,
          { Name: 'ErrorType', Value: errorType },
        ],
      },
      {
        MetricName: 'ErrorRate',
        Value: 1,
        Unit: MetricUnit.NONE,
        Dimensions: dimensions,
      },
    ]);
  }

  /**
   * Track user activity
   */
  async publishUserActivity(userId: string, activityType: string): Promise<void> {
    await this.publishMetric('UserActivity', 1, MetricUnit.COUNT, [
      { Name: 'UserId', Value: userId },
      { Name: 'ActivityType', Value: activityType },
    ]);
  }

  /**
   * Track concurrent connections
   */
  async publishConcurrentConnections(count: number): Promise<void> {
    await this.publishMetric('ConcurrentConnections', count, MetricUnit.COUNT);
  }

  /**
   * Track message processing time breakdown
   */
  async publishMessageProcessingBreakdown(
    classificationTime: number,
    actionExecutionTime: number,
    responseGenerationTime: number,
    totalTime: number
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'ClassificationTime',
        Value: classificationTime,
        Unit: MetricUnit.MILLISECONDS,
      },
      {
        MetricName: 'ActionExecutionTime',
        Value: actionExecutionTime,
        Unit: MetricUnit.MILLISECONDS,
      },
      {
        MetricName: 'ResponseGenerationTime',
        Value: responseGenerationTime,
        Unit: MetricUnit.MILLISECONDS,
      },
      {
        MetricName: 'TotalProcessingTime',
        Value: totalTime,
        Unit: MetricUnit.MILLISECONDS,
      },
    ]);
  }

  /**
   * Track context size management
   */
  async publishContextSize(messageCount: number, tokenCount: number): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'ConversationMessageCount',
        Value: messageCount,
        Unit: MetricUnit.COUNT,
      },
      {
        MetricName: 'ConversationTokenCount',
        Value: tokenCount,
        Unit: MetricUnit.COUNT,
      },
    ]);
  }

  /**
   * Track rate limiting events
   */
  async publishRateLimitEvent(userId: string, limitType: 'messages' | 'tokens'): Promise<void> {
    await this.publishMetric('RateLimitExceeded', 1, MetricUnit.COUNT, [
      { Name: 'UserId', Value: userId },
      { Name: 'LimitType', Value: limitType },
    ]);
  }
}

/**
 * Default copilot metrics publisher instance
 */
export const copilotMetrics = new CopilotMetricsPublisher();
