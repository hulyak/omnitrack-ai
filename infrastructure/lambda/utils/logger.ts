/**
 * Structured Logger Utility for OmniTrack Lambda Functions
 * 
 * Provides structured JSON logging with correlation IDs, log levels,
 * and contextual information for CloudWatch Logs integration.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  functionName?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext = {}, minLevel: LogLevel = LogLevel.INFO) {
    this.context = {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      ...context,
    };
    this.minLevel = minLevel;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(correlationId: string): void {
    this.context.correlationId = correlationId;
  }

  /**
   * Set user ID for audit logging
   */
  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  /**
   * Add additional context to all log entries
   */
  addContext(additionalContext: Record<string, any>): void {
    this.context = { ...this.context, ...additionalContext };
  }

  /**
   * Log a debug message
   */
  debug(message: string, additionalContext?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, additionalContext);
  }

  /**
   * Log an info message
   */
  info(message: string, additionalContext?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, additionalContext);
  }

  /**
   * Log a warning message
   */
  warning(message: string, additionalContext?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, additionalContext);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, additionalContext?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.write(logEntry);
  }

  /**
   * Log a critical error message
   */
  critical(message: string, error?: Error, additionalContext?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.write(logEntry);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, additionalContext?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
    };

    this.write(logEntry);
  }

  /**
   * Check if log level should be written
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Write log entry to stdout (CloudWatch Logs)
   */
  private write(logEntry: LogEntry): void {
    // Write to stdout for CloudWatch Logs
    console.log(JSON.stringify(logEntry));

    // For ERROR and CRITICAL, also write to stderr
    if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.CRITICAL) {
      console.error(JSON.stringify(logEntry));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...additionalContext }, this.minLevel);
  }

  /**
   * Log performance metrics
   */
  metric(metricName: string, value: number, unit: string = 'Count', additionalContext?: Record<string, any>): void {
    this.info(`Metric: ${metricName}`, {
      metric: {
        name: metricName,
        value,
        unit,
      },
      ...additionalContext,
    });
  }

  /**
   * Log API request/response
   */
  logApiCall(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    additionalContext?: Record<string, any>
  ): void {
    this.info('API Call', {
      api: {
        method,
        path,
        statusCode,
        duration,
      },
      ...additionalContext,
    });
  }

  /**
   * Log database operation
   */
  logDbOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    additionalContext?: Record<string, any>
  ): void {
    this.info('Database Operation', {
      database: {
        operation,
        table,
        duration,
        success,
      },
      ...additionalContext,
    });
  }
}

/**
 * Create a logger instance with correlation ID from Lambda event
 */
export function createLogger(event: any, minLevel?: LogLevel): Logger {
  const context: LogContext = {
    requestId: event.requestContext?.requestId || event.requestId,
    correlationId: event.headers?.['x-correlation-id'] || event.requestContext?.requestId,
  };

  return new Logger(context, minLevel);
}

/**
 * Default logger instance
 */
export const logger = new Logger();
