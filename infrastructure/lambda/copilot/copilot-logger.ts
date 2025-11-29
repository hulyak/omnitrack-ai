/**
 * Copilot-specific logging utility
 * 
 * Extends the base logger with copilot-specific logging methods
 * for tracking interactions, intent classifications, and action executions.
 * 
 * Requirements: 9.1, 9.3 - Logging copilot interactions with correlation IDs
 */

import { Logger, createLogger } from '../utils/logger';
import { copilotMetrics } from './copilot-metrics';

/**
 * Copilot interaction log data
 */
export interface CopilotInteractionLog {
  userId: string;
  conversationId: string;
  connectionId?: string;
  message: string;
  messageLength: number;
  timestamp: number;
}

/**
 * Intent classification log data
 */
export interface IntentClassificationLog {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresClarification: boolean;
  classificationTime: number;
}

/**
 * Action execution log data
 */
export interface ActionExecutionLog {
  actionName: string;
  parameters: Record<string, any>;
  success: boolean;
  executionTime: number;
  error?: string;
  resultData?: any;
}

/**
 * Copilot Logger
 * 
 * Specialized logger for AI Copilot with methods for logging
 * copilot-specific events and metrics.
 */
export class CopilotLogger {
  private logger: Logger;

  constructor(correlationId?: string) {
    this.logger = new Logger({
      correlationId: correlationId || `copilot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      component: 'copilot',
    });
  }

  /**
   * Log copilot interaction (user message received)
   * 
   * Requirements: 9.1 - Log all copilot interactions
   * Requirements: 9.2 - Track messages per minute
   */
  logInteraction(data: CopilotInteractionLog): void {
    this.logger.info('Copilot interaction', {
      interaction: {
        userId: data.userId,
        conversationId: data.conversationId,
        connectionId: data.connectionId,
        messageLength: data.messageLength,
        timestamp: data.timestamp,
      },
      // Don't log full message content for privacy
      messagePreview: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
    });

    // Publish metrics
    copilotMetrics.publishMessageReceived(data.userId);
    copilotMetrics.publishUserActivity(data.userId, 'message_sent');
  }

  /**
   * Log intent classification result
   * 
   * Requirements: 9.1 - Log intent classifications
   * Requirements: 9.2 - Track intent classification accuracy
   */
  logIntentClassification(data: IntentClassificationLog): void {
    this.logger.info('Intent classified', {
      classification: {
        intent: data.intent,
        confidence: data.confidence,
        parameterCount: Object.keys(data.parameters).length,
        requiresClarification: data.requiresClarification,
        classificationTime: data.classificationTime,
      },
      parameters: data.parameters,
    });

    // Publish metrics
    copilotMetrics.publishIntentClassification(
      data.intent,
      data.confidence,
      data.requiresClarification
    );
  }

  /**
   * Log action execution
   * 
   * Requirements: 9.1 - Log action executions
   * Requirements: 9.2 - Track action success rate
   */
  logActionExecution(data: ActionExecutionLog): void {
    if (data.success) {
      this.logger.info('Action executed successfully', {
        action: {
          name: data.actionName,
          parameterCount: Object.keys(data.parameters).length,
          executionTime: data.executionTime,
        },
        parameters: data.parameters,
        resultSummary: this.summarizeResult(data.resultData),
      });
    } else {
      this.logger.error('Action execution failed', new Error(data.error || 'Unknown error'), {
        action: {
          name: data.actionName,
          parameterCount: Object.keys(data.parameters).length,
          executionTime: data.executionTime,
        },
        parameters: data.parameters,
      });
    }

    // Publish metrics
    copilotMetrics.publishActionExecution(
      data.actionName,
      data.success,
      data.executionTime
    );
  }

  /**
   * Log WebSocket connection event
   */
  logConnection(connectionId: string, userId: string, event: 'connect' | 'disconnect'): void {
    this.logger.info(`WebSocket ${event}`, {
      websocket: {
        connectionId,
        userId,
        event,
        timestamp: Date.now(),
      },
    });

    // Publish metrics
    copilotMetrics.publishWebSocketConnection(event);
  }

  /**
   * Log streaming event
   */
  logStreaming(event: 'start' | 'token' | 'complete' | 'interrupted', data?: any): void {
    this.logger.info(`Streaming ${event}`, {
      streaming: {
        event,
        timestamp: Date.now(),
        ...data,
      },
    });

    // Publish metrics
    if (event === 'start' || event === 'complete' || event === 'interrupted') {
      copilotMetrics.publishStreamingResponse(
        event,
        data?.tokenCount,
        data?.duration
      );
    }
  }

  /**
   * Log clarification request
   */
  logClarification(intent: string, question: string): void {
    this.logger.info('Clarification requested', {
      clarification: {
        intent,
        questionLength: question.length,
        timestamp: Date.now(),
      },
    });

    // Publish metrics
    copilotMetrics.publishClarificationRequest(intent);
  }

  /**
   * Log multi-step execution
   */
  logMultiStep(event: 'start' | 'step' | 'complete' | 'failed', data: any): void {
    this.logger.info(`Multi-step ${event}`, {
      multiStep: {
        event,
        ...data,
        timestamp: Date.now(),
      },
    });

    // Publish metrics
    if (event === 'start' || event === 'complete' || event === 'failed') {
      copilotMetrics.publishMultiStepExecution(
        event,
        data.stepsExecuted,
        data.duration
      );
    }
  }

  /**
   * Log Bedrock API call
   * 
   * Requirements: 9.2 - Track Bedrock token usage
   */
  logBedrockCall(operation: 'classify' | 'generate' | 'stream', duration: number, tokenCount?: number): void {
    this.logger.info('Bedrock API call', {
      bedrock: {
        operation,
        duration,
        tokenCount,
        timestamp: Date.now(),
      },
    });

    // Publish metrics
    if (tokenCount) {
      copilotMetrics.publishBedrockTokenUsage(operation, tokenCount, duration);
    }
  }

  /**
   * Log conversation event
   */
  logConversation(event: 'created' | 'message_added' | 'summarized', data: any): void {
    this.logger.info(`Conversation ${event}`, {
      conversation: {
        event,
        ...data,
        timestamp: Date.now(),
      },
    });

    // Publish metrics
    copilotMetrics.publishConversationEvent(event);
  }

  /**
   * Log error with context
   */
  logError(message: string, error: Error, context?: Record<string, any>): void {
    this.logger.error(message, error, context);
    
    // Publish metrics
    copilotMetrics.publishError(error.name, context?.operation as string);
  }

  /**
   * Log warning
   */
  logWarning(message: string, context?: Record<string, any>): void {
    this.logger.warning(message, context);
  }

  /**
   * Log debug information
   */
  logDebug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, context);
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(correlationId: string): void {
    this.logger.setCorrelationId(correlationId);
  }

  /**
   * Set user ID for audit logging
   */
  setUserId(userId: string): void {
    this.logger.setUserId(userId);
  }

  /**
   * Add additional context
   */
  addContext(context: Record<string, any>): void {
    this.logger.addContext(context);
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): CopilotLogger {
    const childLogger = new CopilotLogger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Get underlying logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Summarize result data for logging (avoid logging large objects)
   */
  private summarizeResult(data: any): any {
    if (!data) {
      return null;
    }

    if (typeof data === 'string') {
      return data.length > 100 ? `${data.substring(0, 100)}... (${data.length} chars)` : data;
    }

    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample: data.slice(0, 2),
      };
    }

    if (typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data).slice(0, 5),
        keyCount: Object.keys(data).length,
      };
    }

    return data;
  }
}

/**
 * Create copilot logger from Lambda event
 */
export function createCopilotLogger(event: any): CopilotLogger {
  const correlationId = event.requestContext?.requestId || 
                       event.headers?.['x-correlation-id'] ||
                       `copilot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new CopilotLogger(correlationId);
}

/**
 * Default copilot logger instance
 */
export const copilotLogger = new CopilotLogger();
