/**
 * Analytics Dashboard API Route
 * 
 * Provides analytics data for the copilot dashboard.
 * 
 * Requirements: 9.5 - Show usage statistics and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    // In production, this would call the Lambda function
    // For now, return mock data for development
    const mockData = {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalExecutions: 1247,
        totalSuccessful: 1189,
        totalFailed: 58,
        successRate: 95.35,
        averageExecutionTime: 342,
        totalErrors: 73,
        uniqueErrorTypes: 5,
      },
      popularCommands: [
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
        {
          commandName: 'scan-anomalies',
          totalExecutions: 156,
          successfulExecutions: 152,
          failedExecutions: 4,
          averageExecutionTime: 523,
          lastExecuted: Date.now() - 1800000,
        },
        {
          commandName: 'get-network-summary',
          totalExecutions: 143,
          successfulExecutions: 141,
          failedExecutions: 2,
          averageExecutionTime: 198,
          lastExecuted: Date.now() - 900000,
        },
        {
          commandName: 'identify-risks',
          totalExecutions: 127,
          successfulExecutions: 119,
          failedExecutions: 8,
          averageExecutionTime: 678,
          lastExecuted: Date.now() - 5400000,
        },
      ],
      topErrors: [
        {
          errorType: 'ValidationError',
          errorMessage: 'Invalid node configuration: missing required field "location"',
          count: 23,
          firstOccurrence: Date.now() - 86400000 * 7,
          lastOccurrence: Date.now() - 3600000,
          affectedUsers: ['user1', 'user2', 'user3'],
        },
        {
          errorType: 'BedrockError',
          errorMessage: 'Bedrock API rate limit exceeded',
          count: 18,
          firstOccurrence: Date.now() - 86400000 * 5,
          lastOccurrence: Date.now() - 7200000,
          affectedUsers: ['user4', 'user5'],
        },
        {
          errorType: 'ActionExecutionError',
          errorMessage: 'Failed to execute simulation: insufficient data',
          count: 15,
          firstOccurrence: Date.now() - 86400000 * 6,
          lastOccurrence: Date.now() - 10800000,
          affectedUsers: ['user6', 'user7', 'user8', 'user9'],
        },
        {
          errorType: 'IntentClassificationError',
          errorMessage: 'Unable to classify intent with sufficient confidence',
          count: 12,
          firstOccurrence: Date.now() - 86400000 * 4,
          lastOccurrence: Date.now() - 14400000,
          affectedUsers: ['user10', 'user11'],
        },
        {
          errorType: 'WebSocketError',
          errorMessage: 'Connection lost during streaming response',
          count: 5,
          firstOccurrence: Date.now() - 86400000 * 2,
          lastOccurrence: Date.now() - 21600000,
          affectedUsers: ['user12'],
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Failed to fetch analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}
