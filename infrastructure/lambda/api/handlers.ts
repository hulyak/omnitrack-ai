/**
 * Central API Handlers for OmniTrack AI
 * 
 * This module provides Lambda handlers for all REST API endpoints.
 * These handlers serve as API Gateway integration points and delegate
 * to the appropriate service Lambda functions or repositories.
 * 
 * Requirements: All (API layer)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withAuth, AuthenticatedUser } from '../auth/middleware';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'omnitrack-main';

// Import marketplace handlers
import * as marketplaceHandlers from '../marketplace/handlers';

// Import learning handlers
import * as learningHandlers from '../learning/feedback-handler';

// Import audit handlers
import * as auditHandlers from '../audit/handler';

// Import explainability handler
import { handler as explainabilityHandler } from '../explainability/handler';

/**
 * Helper to create standardized API responses
 */
function createResponse(
  statusCode: number,
  body: any,
  correlationId?: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-Id',
      'X-Correlation-Id': correlationId || '',
    },
    body: JSON.stringify(body),
  };
}

/**
 * Extract correlation ID from event
 */
function getCorrelationId(event: APIGatewayProxyEvent): string {
  return (
    event.headers?.['x-correlation-id'] ||
    event.headers?.['X-Correlation-Id'] ||
    event.requestContext?.requestId ||
    `req-${Date.now()}`
  );
}

/**
 * Extract user ID from authenticated event
 */
function getUserId(event: APIGatewayProxyEvent): string {
  return event.requestContext.authorizer?.claims?.sub || 'anonymous';
}

// ========================================
// Digital Twin Endpoints
// ========================================

/**
 * GET /digital-twin/state
 * Get current digital twin state
 */
export async function getDigitalTwinState(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    // Query all nodes from DynamoDB
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'NODE',
        },
      })
    );

    const nodes = result.Items || [];

    return createResponse(
      200,
      {
        nodes,
        timestamp: new Date().toISOString(),
        nodeCount: nodes.length,
      },
      correlationId
    );
  } catch (error: any) {
    console.error('Error getting digital twin state:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * GET /digital-twin/nodes/{id}
 * Get specific node details
 */
export async function getNodeDetails(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const nodeId = event.pathParameters?.id;
    if (!nodeId) {
      return createResponse(400, { error: 'Node ID is required' }, correlationId);
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `NODE#${nodeId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Node not found' }, correlationId);
    }

    return createResponse(200, result.Item, correlationId);
  } catch (error: any) {
    console.error('Error getting node details:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * PUT /digital-twin/refresh
 * Trigger digital twin refresh
 */
export async function refreshDigitalTwin(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    // Digital twin refresh would trigger data aggregation
    // For now, just acknowledge the request
    return createResponse(
      200,
      {
        message: 'Digital twin refresh initiated',
        correlationId,
        timestamp: new Date().toISOString(),
      },
      correlationId
    );
  } catch (error: any) {
    console.error('Error refreshing digital twin:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

// ========================================
// Scenario Endpoints
// ========================================

/**
 * POST /scenarios/simulate
 * Run scenario simulation
 */
export async function simulateScenario(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' }, correlationId);
    }

    const request = JSON.parse(event.body);

    // Validate required fields
    if (!request.disruptionType || !request.location || !request.severity) {
      return createResponse(
        400,
        { error: 'disruptionType, location, and severity are required' },
        correlationId
      );
    }

    // Create scenario ID
    const scenarioId = `SCENARIO#${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store scenario request
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: scenarioId,
          SK: 'DEFINITION',
          disruptionType: request.disruptionType,
          location: request.location,
          severity: request.severity,
          duration: request.duration,
          affectedNodes: request.affectedNodes,
          userId: getUserId(event),
          createdAt: new Date().toISOString(),
          status: 'pending',
          GSI1PK: 'SCENARIO',
          GSI1SK: new Date().toISOString(),
        },
      })
    );

    // In a real implementation, this would trigger Step Functions orchestration
    // For now, return the scenario ID
    return createResponse(
      202,
      {
        scenarioId,
        message: 'Scenario simulation initiated',
        status: 'pending',
        correlationId,
      },
      correlationId
    );
  } catch (error: any) {
    console.error('Error simulating scenario:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * GET /scenarios/{id}
 * Get scenario details
 */
export async function getScenario(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const scenarioId = event.pathParameters?.id;
    if (!scenarioId) {
      return createResponse(400, { error: 'Scenario ID is required' }, correlationId);
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: scenarioId,
          SK: 'DEFINITION',
        },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Scenario not found' }, correlationId);
    }

    return createResponse(200, result.Item, correlationId);
  } catch (error: any) {
    console.error('Error getting scenario:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * GET /scenarios/{id}/results
 * Get scenario simulation results
 */
export async function getScenarioResults(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const scenarioId = event.pathParameters?.id;
    if (!scenarioId) {
      return createResponse(400, { error: 'Scenario ID is required' }, correlationId);
    }

    // Query for latest result
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': scenarioId,
          ':sk': 'RESULT#',
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, { error: 'Results not found' }, correlationId);
    }

    return createResponse(200, result.Items[0], correlationId);
  } catch (error: any) {
    console.error('Error getting scenario results:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

// ========================================
// Alert Endpoints
// ========================================

/**
 * GET /alerts
 * List all alerts with optional filters
 */
export async function listAlerts(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const queryParams = event.queryStringParameters || {};

    let result;
    if (queryParams.status) {
      result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `ALERT#${queryParams.status}`,
          },
        })
      );
    } else if (queryParams.severity) {
      result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `ALERT#${queryParams.severity}`,
          },
        })
      );
    } else {
      result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'ALERT',
          },
        })
      );
    }

    const alerts = result.Items || [];

    return createResponse(
      200,
      {
        alerts,
        count: alerts.length,
      },
      correlationId
    );
  } catch (error: any) {
    console.error('Error listing alerts:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * PUT /alerts/{id}/acknowledge
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const alertId = event.pathParameters?.id;
    if (!alertId) {
      return createResponse(400, { error: 'Alert ID is required' }, correlationId);
    }

    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: alertId,
          SK: 'METADATA',
        },
      })
    );

    if (!getResult.Item) {
      return createResponse(404, { error: 'Alert not found' }, correlationId);
    }

    // Update alert status
    const updatedAlert = {
      ...getResult.Item,
      status: 'acknowledged',
      acknowledgedBy: getUserId(event),
      acknowledgedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedAlert,
      })
    );

    return createResponse(200, updatedAlert, correlationId);
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

// ========================================
// Sustainability Endpoints
// ========================================

/**
 * GET /sustainability/metrics
 * Get sustainability metrics for current configuration
 */
export async function getSustainabilityMetrics(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    // Return placeholder metrics
    // In a real implementation, this would call the sustainability service
    const metrics = {
      carbonFootprint: 0,
      emissionsByRoute: {},
      sustainabilityScore: 0,
      timestamp: new Date().toISOString(),
    };

    return createResponse(200, metrics, correlationId);
  } catch (error: any) {
    console.error('Error getting sustainability metrics:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * GET /sustainability/trends
 * Get historical sustainability trends
 */
export async function getSustainabilityTrends(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = queryParams.endDate || new Date().toISOString();

    // Return placeholder trends
    const trends = {
      data: [],
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
    };

    return createResponse(200, trends, correlationId);
  } catch (error: any) {
    console.error('Error getting sustainability trends:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * GET /sustainability/comparison
 * Compare sustainability metrics across strategies
 */
export async function compareSustainability(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' }, correlationId);
    }

    const request = JSON.parse(event.body);

    if (!request.strategies || !Array.isArray(request.strategies)) {
      return createResponse(
        400,
        { error: 'strategies array is required' },
        correlationId
      );
    }

    // Return placeholder comparison
    const comparison = {
      strategies: request.strategies,
      comparison: [],
      timestamp: new Date().toISOString(),
    };

    return createResponse(200, comparison, correlationId);
  } catch (error: any) {
    console.error('Error comparing sustainability:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

// ========================================
// User Profile Endpoints
// ========================================

/**
 * GET /users/profile
 * Get current user profile
 */
export async function getUserProfile(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    const userId = getUserId(event);
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'User profile not found' }, correlationId);
    }

    return createResponse(200, result.Item, correlationId);
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

/**
 * PUT /users/preferences
 * Update user preferences
 */
export async function updateUserPreferences(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const correlationId = getCorrelationId(event);

  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' }, correlationId);
    }

    const preferences = JSON.parse(event.body);

    const userId = getUserId(event);
    
    // Get current profile
    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!getResult.Item) {
      return createResponse(404, { error: 'User profile not found' }, correlationId);
    }

    // Update preferences
    const updatedUser = {
      ...getResult.Item,
      preferences,
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedUser,
      })
    );

    return createResponse(200, updatedUser, correlationId);
  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    return createResponse(
      500,
      { error: 'Internal server error', message: error.message },
      correlationId
    );
  }
}

// ========================================
// Export wrapped handlers with authentication
// ========================================

// Digital Twin
export const getDigitalTwinStateHandler = withAuth(getDigitalTwinState);
export const getNodeDetailsHandler = withAuth(getNodeDetails);
export const refreshDigitalTwinHandler = withAuth(refreshDigitalTwin);

// Scenarios
export const simulateScenarioHandler = withAuth(simulateScenario);
export const getScenarioHandler = withAuth(getScenario);
export const getScenarioResultsHandler = withAuth(getScenarioResults);

// Alerts
export const listAlertsHandler = withAuth(listAlerts);
export const acknowledgeAlertHandler = withAuth(acknowledgeAlert);

// Sustainability
export const getSustainabilityMetricsHandler = withAuth(getSustainabilityMetrics);
export const getSustainabilityTrendsHandler = withAuth(getSustainabilityTrends);
export const compareSustainabilityHandler = withAuth(compareSustainability);

// Users
export const getUserProfileHandler = withAuth(getUserProfile);
export const updateUserPreferencesHandler = withAuth(updateUserPreferences);

// Re-export marketplace handlers
export const publishScenarioHandler = marketplaceHandlers.publishScenario;
export const listMarketplaceScenariosHandler = marketplaceHandlers.listMarketplaceScenarios;
export const getMarketplaceScenarioHandler = marketplaceHandlers.getMarketplaceScenario;
export const searchScenariosHandler = marketplaceHandlers.searchScenarios;
export const rateScenarioHandler = marketplaceHandlers.rateScenario;
export const forkScenarioHandler = marketplaceHandlers.forkScenario;

// Re-export learning handlers
export const collectFeedbackHandler = learningHandlers.collectFeedbackHandler;
export const getModelMetricsHandler = learningHandlers.getModelMetricsHandler;
export const getCurrentModelVersionHandler = learningHandlers.getCurrentModelVersionHandler;

// Re-export audit handlers
export const queryAuditLogsHandler = auditHandlers.queryLogs;
export const getVersionHistoryHandler = auditHandlers.getVersions;

// Re-export explainability handler
export const generateExplanationHandler = explainabilityHandler;
