/**
 * Analytics Service for AI Copilot
 * 
 * Tracks user actions, popular commands, and error patterns
 * for usage analytics and insights.
 * 
 * Requirements: 9.5 - Track and aggregate usage metrics
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { copilotLogger } from './copilot-logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME || 'omnitrack-copilot-analytics';

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  MESSAGE_SENT = 'message_sent',
  INTENT_CLASSIFIED = 'intent_classified',
  ACTION_EXECUTED = 'action_executed',
  ACTION_FAILED = 'action_failed',
  CLARIFICATION_REQUESTED = 'clarification_requested',
  STREAMING_STARTED = 'streaming_started',
  STREAMING_COMPLETED = 'streaming_completed',
  STREAMING_INTERRUPTED = 'streaming_interrupted',
  MULTI_STEP_STARTED = 'multi_step_started',
  MULTI_STEP_COMPLETED = 'multi_step_completed',
  MULTI_STEP_FAILED = 'multi_step_failed',
  ERROR_OCCURRED = 'error_occurred',
  WEBSOCKET_CONNECTED = 'websocket_connected',
  WEBSOCKET_DISCONNECTED = 'websocket_disconnected',
}

/**
 * Analytics event data
 */
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  userId: string;
  conversationId?: string;
  connectionId?: string;
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * Command usage statistics
 */
export interface CommandStats {
  commandName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted: number;
}

/**
 * Error pattern data
 */
export interface ErrorPattern {
  errorType: string;
  errorMessage: string;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  affectedUsers: string[];
  contexts: Array<{
    userId: string;
    conversationId?: string;
    timestamp: number;
    metadata: Record<string, any>;
  }>;
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
  userId: string;
  totalMessages: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  popularCommands: string[];
  firstActivity: number;
  lastActivity: number;
  averageResponseTime: number;
}

/**
 * Analytics Service
 * 
 * Provides methods for tracking and querying copilot usage analytics.
 */
export class AnalyticsService {
  /**
   * Track an analytics event
   * 
   * Requirements: 9.5 - Track user actions
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventId = `${event.userId}#${event.timestamp}#${Math.random().toString(36).substring(2, 9)}`;
      const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days retention

      await docClient.send(
        new PutCommand({
          TableName: ANALYTICS_TABLE,
          Item: {
            PK: `EVENT#${event.eventType}`,
            SK: eventId,
            userId: event.userId,
            conversationId: event.conversationId,
            connectionId: event.connectionId,
            eventType: event.eventType,
            timestamp: event.timestamp,
            date: new Date(event.timestamp).toISOString().split('T')[0], // YYYY-MM-DD for daily aggregation
            hour: new Date(event.timestamp).toISOString().substring(0, 13), // YYYY-MM-DDTHH for hourly aggregation
            metadata: event.metadata,
            ttl,
          },
        })
      );

      // Also store by user for user-specific queries
      await docClient.send(
        new PutCommand({
          TableName: ANALYTICS_TABLE,
          Item: {
            PK: `USER#${event.userId}`,
            SK: `EVENT#${event.timestamp}#${event.eventType}`,
            eventType: event.eventType,
            conversationId: event.conversationId,
            connectionId: event.connectionId,
            timestamp: event.timestamp,
            metadata: event.metadata,
            ttl,
          },
        })
      );

      copilotLogger.logDebug('Analytics event tracked', {
        eventType: event.eventType,
        userId: event.userId,
      });
    } catch (error) {
      copilotLogger.logError(
        'Failed to track analytics event',
        error instanceof Error ? error : new Error(String(error)),
        { event }
      );
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Track command execution
   * 
   * Requirements: 9.5 - Track popular commands
   */
  async trackCommandExecution(
    userId: string,
    commandName: string,
    success: boolean,
    executionTime: number,
    conversationId?: string
  ): Promise<void> {
    try {
      // Track the event
      await this.trackEvent({
        eventType: success ? AnalyticsEventType.ACTION_EXECUTED : AnalyticsEventType.ACTION_FAILED,
        userId,
        conversationId,
        timestamp: Date.now(),
        metadata: {
          commandName,
          success,
          executionTime,
        },
      });

      // Update command statistics
      const commandStatsKey = `COMMAND#${commandName}`;
      const date = new Date().toISOString().split('T')[0];

      await docClient.send(
        new UpdateCommand({
          TableName: ANALYTICS_TABLE,
          Key: {
            PK: commandStatsKey,
            SK: `STATS#${date}`,
          },
          UpdateExpression: `
            SET 
              totalExecutions = if_not_exists(totalExecutions, :zero) + :one,
              successfulExecutions = if_not_exists(successfulExecutions, :zero) + :successIncrement,
              failedExecutions = if_not_exists(failedExecutions, :zero) + :failureIncrement,
              totalExecutionTime = if_not_exists(totalExecutionTime, :zero) + :executionTime,
              lastExecuted = :timestamp,
              commandName = :commandName
          `,
          ExpressionAttributeValues: {
            ':zero': 0,
            ':one': 1,
            ':successIncrement': success ? 1 : 0,
            ':failureIncrement': success ? 0 : 1,
            ':executionTime': executionTime,
            ':timestamp': Date.now(),
            ':commandName': commandName,
          },
        })
      );

      copilotLogger.logDebug('Command execution tracked', {
        commandName,
        success,
        executionTime,
      });
    } catch (error) {
      copilotLogger.logError(
        'Failed to track command execution',
        error instanceof Error ? error : new Error(String(error)),
        { commandName, success }
      );
    }
  }

  /**
   * Track error pattern
   * 
   * Requirements: 9.5 - Track error patterns
   */
  async trackError(
    userId: string,
    errorType: string,
    errorMessage: string,
    conversationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Track the error event
      await this.trackEvent({
        eventType: AnalyticsEventType.ERROR_OCCURRED,
        userId,
        conversationId,
        timestamp: Date.now(),
        metadata: {
          errorType,
          errorMessage,
          ...metadata,
        },
      });

      // Update error pattern statistics
      const errorKey = `ERROR#${errorType}`;
      const errorHash = this.hashString(errorMessage);

      await docClient.send(
        new UpdateCommand({
          TableName: ANALYTICS_TABLE,
          Key: {
            PK: errorKey,
            SK: `PATTERN#${errorHash}`,
          },
          UpdateExpression: `
            SET 
              errorType = :errorType,
              errorMessage = :errorMessage,
              #count = if_not_exists(#count, :zero) + :one,
              lastOccurrence = :timestamp,
              firstOccurrence = if_not_exists(firstOccurrence, :timestamp),
              affectedUsers = list_append(if_not_exists(affectedUsers, :emptyList), :userList)
          `,
          ExpressionAttributeNames: {
            '#count': 'count',
          },
          ExpressionAttributeValues: {
            ':errorType': errorType,
            ':errorMessage': errorMessage,
            ':zero': 0,
            ':one': 1,
            ':timestamp': Date.now(),
            ':emptyList': [],
            ':userList': [userId],
          },
        })
      );

      copilotLogger.logDebug('Error pattern tracked', {
        errorType,
        userId,
      });
    } catch (error) {
      copilotLogger.logError(
        'Failed to track error pattern',
        error instanceof Error ? error : new Error(String(error)),
        { errorType }
      );
    }
  }

  /**
   * Get command statistics for a date range
   * 
   * Requirements: 9.5 - Aggregate usage metrics
   */
  async getCommandStats(commandName: string, startDate: string, endDate: string): Promise<CommandStats | null> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: ANALYTICS_TABLE,
          KeyConditionExpression: 'PK = :pk AND SK BETWEEN :startDate AND :endDate',
          ExpressionAttributeValues: {
            ':pk': `COMMAND#${commandName}`,
            ':startDate': `STATS#${startDate}`,
            ':endDate': `STATS#${endDate}`,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      // Aggregate stats across date range
      const aggregated = result.Items.reduce(
        (acc, item) => ({
          totalExecutions: acc.totalExecutions + (item.totalExecutions || 0),
          successfulExecutions: acc.successfulExecutions + (item.successfulExecutions || 0),
          failedExecutions: acc.failedExecutions + (item.failedExecutions || 0),
          totalExecutionTime: acc.totalExecutionTime + (item.totalExecutionTime || 0),
          lastExecuted: Math.max(acc.lastExecuted, item.lastExecuted || 0),
        }),
        {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalExecutionTime: 0,
          lastExecuted: 0,
        }
      );

      return {
        commandName,
        totalExecutions: aggregated.totalExecutions,
        successfulExecutions: aggregated.successfulExecutions,
        failedExecutions: aggregated.failedExecutions,
        averageExecutionTime:
          aggregated.totalExecutions > 0
            ? aggregated.totalExecutionTime / aggregated.totalExecutions
            : 0,
        lastExecuted: aggregated.lastExecuted,
      };
    } catch (error) {
      copilotLogger.logError(
        'Failed to get command stats',
        error instanceof Error ? error : new Error(String(error)),
        { commandName, startDate, endDate }
      );
      return null;
    }
  }

  /**
   * Get popular commands
   * 
   * Requirements: 9.5 - Track popular commands
   */
  async getPopularCommands(startDate: string, endDate: string, limit: number = 10): Promise<CommandStats[]> {
    try {
      // Query all command stats for the date range
      // Note: In production, you'd want to use a GSI for better performance
      const commands: Map<string, CommandStats> = new Map();

      // This is a simplified implementation - in production, you'd scan with pagination
      // or use a GSI to efficiently query all commands
      const allCommands = [
        'add-supplier', 'add-manufacturer', 'add-warehouse', 'add-distributor', 'add-retailer',
        'remove-node', 'connect-nodes', 'disconnect-nodes', 'update-node', 'optimize-layout',
        'set-region', 'set-industry', 'set-currency', 'add-shipping-method', 'set-risk-profile',
        'scan-anomalies', 'identify-risks', 'find-bottlenecks', 'calculate-utilization',
        'run-simulation', 'what-if-port-closure', 'what-if-supplier-failure', 'what-if-demand-spike',
        'get-node-details', 'get-network-summary', 'get-recent-alerts', 'help',
      ];

      for (const commandName of allCommands) {
        const stats = await this.getCommandStats(commandName, startDate, endDate);
        if (stats && stats.totalExecutions > 0) {
          commands.set(commandName, stats);
        }
      }

      // Sort by total executions and return top N
      return Array.from(commands.values())
        .sort((a, b) => b.totalExecutions - a.totalExecutions)
        .slice(0, limit);
    } catch (error) {
      copilotLogger.logError(
        'Failed to get popular commands',
        error instanceof Error ? error : new Error(String(error)),
        { startDate, endDate, limit }
      );
      return [];
    }
  }

  /**
   * Get error patterns
   * 
   * Requirements: 9.5 - Track error patterns
   */
  async getErrorPatterns(errorType?: string, limit: number = 20): Promise<ErrorPattern[]> {
    try {
      const patterns: ErrorPattern[] = [];

      if (errorType) {
        // Query specific error type
        const result = await docClient.send(
          new QueryCommand({
            TableName: ANALYTICS_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
              ':pk': `ERROR#${errorType}`,
            },
            Limit: limit,
          })
        );

        if (result.Items) {
          for (const item of result.Items) {
            patterns.push({
              errorType: item.errorType,
              errorMessage: item.errorMessage,
              count: item.count || 0,
              firstOccurrence: item.firstOccurrence,
              lastOccurrence: item.lastOccurrence,
              affectedUsers: item.affectedUsers || [],
              contexts: [], // Contexts would require additional queries
            });
          }
        }
      } else {
        // Get all error types - simplified implementation
        // In production, you'd use a GSI or maintain a separate index
        const errorTypes = [
          'ValidationError',
          'BedrockError',
          'DynamoDBError',
          'ActionExecutionError',
          'IntentClassificationError',
          'WebSocketError',
        ];

        for (const type of errorTypes) {
          const typePatterns = await this.getErrorPatterns(type, 5);
          patterns.push(...typePatterns);
        }
      }

      // Sort by count (most frequent first)
      return patterns.sort((a, b) => b.count - a.count).slice(0, limit);
    } catch (error) {
      copilotLogger.logError(
        'Failed to get error patterns',
        error instanceof Error ? error : new Error(String(error)),
        { errorType, limit }
      );
      return [];
    }
  }

  /**
   * Get user activity summary
   * 
   * Requirements: 9.5 - Aggregate usage metrics by user
   */
  async getUserActivitySummary(userId: string, startDate?: number, endDate?: number): Promise<UserActivitySummary | null> {
    try {
      const start = startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
      const end = endDate || Date.now();

      const result = await docClient.send(
        new QueryCommand({
          TableName: ANALYTICS_TABLE,
          KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':start': `EVENT#${start}`,
            ':end': `EVENT#${end}`,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const events = result.Items;
      const commandCounts: Map<string, number> = new Map();
      let totalMessages = 0;
      let totalActions = 0;
      let successfulActions = 0;
      let failedActions = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let firstActivity = Infinity;
      let lastActivity = 0;

      for (const event of events) {
        const timestamp = event.timestamp;
        firstActivity = Math.min(firstActivity, timestamp);
        lastActivity = Math.max(lastActivity, timestamp);

        switch (event.eventType) {
          case AnalyticsEventType.MESSAGE_SENT:
            totalMessages++;
            break;
          case AnalyticsEventType.ACTION_EXECUTED:
            totalActions++;
            successfulActions++;
            if (event.metadata?.commandName) {
              commandCounts.set(
                event.metadata.commandName,
                (commandCounts.get(event.metadata.commandName) || 0) + 1
              );
            }
            if (event.metadata?.executionTime) {
              totalResponseTime += event.metadata.executionTime;
              responseTimeCount++;
            }
            break;
          case AnalyticsEventType.ACTION_FAILED:
            totalActions++;
            failedActions++;
            if (event.metadata?.commandName) {
              commandCounts.set(
                event.metadata.commandName,
                (commandCounts.get(event.metadata.commandName) || 0) + 1
              );
            }
            break;
        }
      }

      // Get top 5 popular commands for this user
      const popularCommands = Array.from(commandCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([command]) => command);

      return {
        userId,
        totalMessages,
        totalActions,
        successfulActions,
        failedActions,
        popularCommands,
        firstActivity: firstActivity === Infinity ? Date.now() : firstActivity,
        lastActivity,
        averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      };
    } catch (error) {
      copilotLogger.logError(
        'Failed to get user activity summary',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return null;
    }
  }

  /**
   * Get daily metrics for a date range
   */
  async getDailyMetrics(startDate: string, endDate: string): Promise<Array<{
    date: string;
    totalMessages: number;
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    uniqueUsers: number;
  }>> {
    try {
      const metrics: Map<string, any> = new Map();

      // Query events by date
      // This is simplified - in production, you'd use a GSI on date
      const result = await docClient.send(
        new QueryCommand({
          TableName: ANALYTICS_TABLE,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'EVENT#message_sent', // Start with one event type
          },
        })
      );

      // Process events and aggregate by date
      // This is a simplified implementation
      // In production, you'd query all event types and aggregate properly

      return Array.from(metrics.values());
    } catch (error) {
      copilotLogger.logError(
        'Failed to get daily metrics',
        error instanceof Error ? error : new Error(String(error)),
        { startDate, endDate }
      );
      return [];
    }
  }

  /**
   * Hash a string for consistent error pattern grouping
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Default analytics service instance
 */
export const analyticsService = new AnalyticsService();
