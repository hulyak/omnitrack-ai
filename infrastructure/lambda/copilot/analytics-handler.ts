/**
 * Analytics API Handler
 * 
 * Provides API endpoints for querying copilot usage analytics.
 * 
 * Requirements: 9.5 - Show usage statistics and performance metrics
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { analyticsService } from './analytics-service';
import { copilotLogger } from './copilot-logger';

/**
 * Get command statistics
 * 
 * GET /analytics/commands/{commandName}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getCommandStatsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const commandName = event.pathParameters?.commandName;
    const startDate = event.queryStringParameters?.startDate || getDefaultStartDate();
    const endDate = event.queryStringParameters?.endDate || getDefaultEndDate();

    if (!commandName) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Command name is required' }),
      };
    }

    const stats = await analyticsService.getCommandStats(commandName, startDate, endDate);

    if (!stats) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'No statistics found for this command' }),
      };
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(stats),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to get command stats',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to retrieve command statistics' }),
    };
  }
};

/**
 * Get popular commands
 * 
 * GET /analytics/commands/popular?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
 */
export const getPopularCommandsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const startDate = event.queryStringParameters?.startDate || getDefaultStartDate();
    const endDate = event.queryStringParameters?.endDate || getDefaultEndDate();
    const limit = parseInt(event.queryStringParameters?.limit || '10', 10);

    const commands = await analyticsService.getPopularCommands(startDate, endDate, limit);

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        commands,
        period: {
          startDate,
          endDate,
        },
      }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to get popular commands',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to retrieve popular commands' }),
    };
  }
};

/**
 * Get error patterns
 * 
 * GET /analytics/errors?errorType=ValidationError&limit=20
 */
export const getErrorPatternsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const errorType = event.queryStringParameters?.errorType;
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);

    const patterns = await analyticsService.getErrorPatterns(errorType, limit);

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        patterns,
        errorType: errorType || 'all',
      }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to get error patterns',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to retrieve error patterns' }),
    };
  }
};

/**
 * Get user activity summary
 * 
 * GET /analytics/users/{userId}?startDate=timestamp&endDate=timestamp
 */
export const getUserActivityHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    const startDate = event.queryStringParameters?.startDate
      ? parseInt(event.queryStringParameters.startDate, 10)
      : undefined;
    const endDate = event.queryStringParameters?.endDate
      ? parseInt(event.queryStringParameters.endDate, 10)
      : undefined;

    if (!userId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const summary = await analyticsService.getUserActivitySummary(userId, startDate, endDate);

    if (!summary) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'No activity found for this user' }),
      };
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(summary),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to get user activity',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to retrieve user activity' }),
    };
  }
};

/**
 * Get analytics dashboard summary
 * 
 * GET /analytics/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getDashboardSummaryHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const startDate = event.queryStringParameters?.startDate || getDefaultStartDate();
    const endDate = event.queryStringParameters?.endDate || getDefaultEndDate();

    // Get popular commands
    const popularCommands = await analyticsService.getPopularCommands(startDate, endDate, 10);

    // Get error patterns
    const errorPatterns = await analyticsService.getErrorPatterns(undefined, 10);

    // Calculate summary statistics
    const totalExecutions = popularCommands.reduce((sum, cmd) => sum + cmd.totalExecutions, 0);
    const totalSuccessful = popularCommands.reduce((sum, cmd) => sum + cmd.successfulExecutions, 0);
    const totalFailed = popularCommands.reduce((sum, cmd) => sum + cmd.failedExecutions, 0);
    const averageExecutionTime =
      popularCommands.length > 0
        ? popularCommands.reduce((sum, cmd) => sum + cmd.averageExecutionTime, 0) /
          popularCommands.length
        : 0;

    const totalErrors = errorPatterns.reduce((sum, pattern) => sum + pattern.count, 0);
    const uniqueErrorTypes = new Set(errorPatterns.map((p) => p.errorType)).size;

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        period: {
          startDate,
          endDate,
        },
        summary: {
          totalExecutions,
          totalSuccessful,
          totalFailed,
          successRate: totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0,
          averageExecutionTime,
          totalErrors,
          uniqueErrorTypes,
        },
        popularCommands: popularCommands.slice(0, 5),
        topErrors: errorPatterns.slice(0, 5),
      }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to get dashboard summary',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to retrieve dashboard summary' }),
    };
  }
};

/**
 * Export analytics data
 * 
 * GET /analytics/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|csv
 */
export const exportAnalyticsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const startDate = event.queryStringParameters?.startDate || getDefaultStartDate();
    const endDate = event.queryStringParameters?.endDate || getDefaultEndDate();
    const format = event.queryStringParameters?.format || 'json';

    // Get all analytics data
    const popularCommands = await analyticsService.getPopularCommands(startDate, endDate, 50);
    const errorPatterns = await analyticsService.getErrorPatterns(undefined, 50);

    const data = {
      exportDate: new Date().toISOString(),
      period: {
        startDate,
        endDate,
      },
      commands: popularCommands,
      errors: errorPatterns,
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);

      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.csv"`,
        },
        body: csv,
      };
    } else {
      // Return JSON format
      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.json"`,
        },
        body: JSON.stringify(data, null, 2),
      };
    }
  } catch (error) {
    copilotLogger.logError(
      'Failed to export analytics',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Failed to export analytics data' }),
    };
  }
};

/**
 * Helper: Get default start date (30 days ago)
 */
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get default end date (today)
 */
function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper: Get CORS headers
 */
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };
}

/**
 * Helper: Convert analytics data to CSV format
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Commands section
  lines.push('COMMANDS');
  lines.push(
    'Command Name,Total Executions,Successful,Failed,Success Rate %,Average Execution Time (ms),Last Executed'
  );

  for (const cmd of data.commands) {
    const successRate =
      cmd.totalExecutions > 0 ? ((cmd.successfulExecutions / cmd.totalExecutions) * 100).toFixed(2) : '0';
    lines.push(
      `${cmd.commandName},${cmd.totalExecutions},${cmd.successfulExecutions},${cmd.failedExecutions},${successRate},${cmd.averageExecutionTime.toFixed(2)},${new Date(cmd.lastExecuted).toISOString()}`
    );
  }

  lines.push('');
  lines.push('ERRORS');
  lines.push('Error Type,Error Message,Count,First Occurrence,Last Occurrence,Affected Users');

  for (const err of data.errors) {
    const message = err.errorMessage.replace(/,/g, ';').replace(/\n/g, ' ');
    lines.push(
      `${err.errorType},"${message}",${err.count},${new Date(err.firstOccurrence).toISOString()},${new Date(err.lastOccurrence).toISOString()},${err.affectedUsers.length}`
    );
  }

  return lines.join('\n');
}
