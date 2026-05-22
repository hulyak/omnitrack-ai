/**
 * Lambda handlers for marketplace API endpoints
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MarketplaceService, PublishScenarioRequest, RateScenarioRequest, ForkScenarioRequest, SearchFilters } from './marketplace-service';

const marketplaceService = new MarketplaceService();

/**
 * Helper to create API Gateway response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}

/**
 * Helper to extract user ID from event
 */
function getUserId(event: APIGatewayProxyEvent): string {
  return event.requestContext.authorizer?.claims?.sub || 'anonymous';
}

/**
 * POST /marketplace/scenarios - Publish scenario to marketplace
 */
export async function publishScenario(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: PublishScenarioRequest = JSON.parse(event.body);
    const scenario = await marketplaceService.publishScenario(request);

    return createResponse(200, scenario);
  } catch (error: any) {
    console.error('Error publishing scenario:', error);
    return createResponse(error.message.includes('not found') ? 404 : 400, {
      error: error.message
    });
  }
}

/**
 * GET /marketplace/scenarios - List all marketplace scenarios
 */
export async function listMarketplaceScenarios(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scenarios = await marketplaceService.listMarketplaceScenarios();
    return createResponse(200, { scenarios, count: scenarios.length });
  } catch (error: any) {
    console.error('Error listing marketplace scenarios:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * GET /marketplace/scenarios/{id} - Get marketplace scenario by ID
 */
export async function getMarketplaceScenario(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scenarioId = event.pathParameters?.id;
    if (!scenarioId) {
      return createResponse(400, { error: 'Scenario ID is required' });
    }

    const scenario = await marketplaceService.getMarketplaceScenario(scenarioId);
    return createResponse(200, scenario);
  } catch (error: any) {
    console.error('Error getting marketplace scenario:', error);
    return createResponse(error.message.includes('not found') ? 404 : 500, {
      error: error.message
    });
  }
}

/**
 * GET /marketplace/scenarios/search - Search marketplace scenarios with filters
 */
export async function searchScenarios(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const filters: SearchFilters = {};

    if (event.queryStringParameters) {
      if (event.queryStringParameters.industry) {
        filters.industry = event.queryStringParameters.industry;
      }
      if (event.queryStringParameters.disruptionType) {
        filters.disruptionType = event.queryStringParameters.disruptionType;
      }
      if (event.queryStringParameters.geography) {
        filters.geography = event.queryStringParameters.geography;
      }
      if (event.queryStringParameters.minRating) {
        filters.minRating = parseFloat(event.queryStringParameters.minRating);
      }
      if (event.queryStringParameters.tags) {
        filters.tags = event.queryStringParameters.tags.split(',');
      }
    }

    const scenarios = await marketplaceService.searchScenarios(filters);
    return createResponse(200, { scenarios, count: scenarios.length });
  } catch (error: any) {
    console.error('Error searching scenarios:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * PUT /marketplace/scenarios/{id}/rating - Rate a marketplace scenario
 */
export async function rateScenario(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scenarioId = event.pathParameters?.id;
    if (!scenarioId) {
      return createResponse(400, { error: 'Scenario ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const body = JSON.parse(event.body);
    const userId = getUserId(event);

    const request: RateScenarioRequest = {
      scenarioId,
      userId,
      rating: body.rating,
      review: body.review
    };

    await marketplaceService.rateScenario(request);

    return createResponse(200, { message: 'Rating submitted successfully' });
  } catch (error: any) {
    console.error('Error rating scenario:', error);
    return createResponse(error.message.includes('not found') ? 404 : 400, {
      error: error.message
    });
  }
}

/**
 * POST /marketplace/scenarios/{id}/fork - Fork a marketplace scenario
 */
export async function forkScenario(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scenarioId = event.pathParameters?.id;
    if (!scenarioId) {
      return createResponse(400, { error: 'Scenario ID is required' });
    }

    const userId = getUserId(event);
    const modifications = event.body ? JSON.parse(event.body).modifications : undefined;

    const request: ForkScenarioRequest = {
      scenarioId,
      userId,
      modifications
    };

    const forkedScenario = await marketplaceService.forkScenario(request);

    return createResponse(201, forkedScenario);
  } catch (error: any) {
    console.error('Error forking scenario:', error);
    return createResponse(error.message.includes('not found') ? 404 : 500, {
      error: error.message
    });
  }
}
