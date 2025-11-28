/**
 * Lambda handler for audit log query API
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedUser } from '../auth/middleware';
import { hasPermission } from '../auth/rbac';
import {
  queryAuditLogs,
  getVersionHistory,
  AuditEventType,
} from './audit-service';

/**
 * Query audit logs with filters
 * GET /audit/logs?userIdentity=...&eventType=...&startDate=...&endDate=...&limit=...
 */
async function queryAuditLogsHandler(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  try {
    // Check permissions - only admins and security officers can query audit logs
    if (!hasPermission(user, 'audit:read')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const {
      userIdentity,
      eventType,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit,
    } = queryParams;

    // Validate date range (max 90 days)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays > 90) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Date range cannot exceed 90 days',
          }),
        };
      }
    }

    const filters: any = {};
    if (userIdentity) filters.userIdentity = userIdentity;
    if (eventType) filters.eventType = eventType as AuditEventType;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const limitNum = limit ? parseInt(limit, 10) : 100;

    const startTime = Date.now();
    const results = await queryAuditLogs(filters, limitNum);
    const queryTime = Date.now() - startTime;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        results,
        count: results.length,
        queryTime: `${queryTime}ms`,
      }),
    };
  } catch (error: any) {
    console.error('Query audit logs error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Failed to query audit logs',
      }),
    };
  }
}

/**
 * Get version history for a specific resource
 * GET /audit/versions/{resourceType}/{resourceId}
 */
async function getVersionHistoryHandler(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  try {
    // Check permissions
    if (!hasPermission(user, 'audit:read')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const { resourceType, resourceId } = event.pathParameters || {};

    if (!resourceType || !resourceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'resourceType and resourceId are required',
        }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;

    const history = await getVersionHistory(resourceType, resourceId, limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        resourceType,
        resourceId,
        versions: history,
        count: history.length,
      }),
    };
  } catch (error: any) {
    console.error('Get version history error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Failed to retrieve version history',
      }),
    };
  }
}

// Export wrapped handlers with authentication
export const queryLogs = withAuth(queryAuditLogsHandler);
export const getVersions = withAuth(getVersionHistoryHandler);
