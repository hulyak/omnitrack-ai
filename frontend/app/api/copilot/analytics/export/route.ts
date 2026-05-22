/**
 * Analytics Export API Route
 * 
 * Exports analytics data in JSON or CSV format.
 * 
 * Requirements: 9.5 - Add export functionality
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();
    const format = searchParams.get('format') || 'json';

    // In production, this would call the Lambda function
    // For now, return mock data for development
    const data = {
      exportDate: new Date().toISOString(),
      period: {
        startDate,
        endDate,
      },
      commands: [
        {
          commandName: 'add-supplier',
          totalExecutions: 234,
          successfulExecutions: 228,
          failedExecutions: 6,
          averageExecutionTime: 287,
          lastExecuted: Date.now() - 3600000,
        },
        {
          commandName: 'run-simulation',
          totalExecutions: 189,
          successfulExecutions: 175,
          failedExecutions: 14,
          averageExecutionTime: 1245,
          lastExecuted: Date.now() - 7200000,
        },
      ],
      errors: [
        {
          errorType: 'ValidationError',
          errorMessage: 'Invalid node configuration: missing required field "location"',
          count: 23,
          firstOccurrence: Date.now() - 86400000 * 7,
          lastOccurrence: Date.now() - 3600000,
          affectedUsers: ['user1', 'user2', 'user3'],
        },
      ],
    };

    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.csv"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Commands section
  lines.push('COMMANDS');
  lines.push(
    'Command Name,Total Executions,Successful,Failed,Success Rate %,Average Execution Time (ms),Last Executed'
  );

  for (const cmd of data.commands) {
    const successRate =
      cmd.totalExecutions > 0
        ? ((cmd.successfulExecutions / cmd.totalExecutions) * 100).toFixed(2)
        : '0';
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

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}
