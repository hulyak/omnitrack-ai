/**
 * Example Lambda function demonstrating cache service usage
 * This can be used as a template for integrating caching into other Lambda functions
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { initializeCacheService, getCacheService } from './cache-service';

/**
 * Example: Caching simulation results
 */
export async function cacheSimulationExample(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Initialize cache service
    const cacheService = await initializeCacheService();

    const scenarioId = event.pathParameters?.scenarioId || 'default';
    const hash = event.queryStringParameters?.hash || 'default-hash';

    // Try to get cached result first
    const cachedResult = await cacheService.getSimulationResult(scenarioId, hash);

    if (cachedResult) {
      console.log('Cache hit for simulation:', scenarioId);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
        body: JSON.stringify({
          source: 'cache',
          data: cachedResult,
        }),
      };
    }

    // Cache miss - perform expensive simulation
    console.log('Cache miss for simulation:', scenarioId);
    const simulationResult = await performSimulation(scenarioId);

    // Cache the result
    await cacheService.cacheSimulationResult(scenarioId, hash, simulationResult);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
      body: JSON.stringify({
        source: 'computed',
        data: simulationResult,
      }),
    };
  } catch (error) {
    console.error('Error in cache simulation example:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Example: Session management with caching
 */
export async function sessionManagementExample(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const cacheService = await initializeCacheService();

    const sessionId = event.headers['x-session-id'] || 'default-session';
    const action = event.queryStringParameters?.action || 'get';

    switch (action) {
      case 'get':
        // Retrieve session
        const session = await cacheService.getSession(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(session),
        };

      case 'create':
        // Create new session
        const body = JSON.parse(event.body || '{}');
        await cacheService.cacheSession(sessionId, {
          userId: body.userId,
          preferences: body.preferences || {},
          activeScenarios: [],
          lastActivity: Date.now(),
        });
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Session created', sessionId }),
        };

      case 'update':
        // Update session activity
        await cacheService.updateSessionActivity(sessionId);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Session updated' }),
        };

      case 'delete':
        // Delete session
        await cacheService.deleteSession(sessionId);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Session deleted' }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error in session management example:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Example: Digital twin state caching
 */
export async function digitalTwinCacheExample(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const cacheService = await initializeCacheService();

    const action = event.queryStringParameters?.action || 'get';

    switch (action) {
      case 'get':
        // Get latest digital twin state
        const latestState = await cacheService.getLatestDigitalTwinState();
        if (!latestState) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No cached digital twin state found' }),
          };
        }
        return {
          statusCode: 200,
          headers: { 'X-Cache': 'HIT' },
          body: JSON.stringify(latestState),
        };

      case 'cache':
        // Cache current digital twin state
        const body = JSON.parse(event.body || '{}');
        await cacheService.cacheDigitalTwinState(
          Date.now(),
          body.state,
          body.version || 'v1.0'
        );
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Digital twin state cached' }),
        };

      case 'invalidate':
        // Invalidate all digital twin caches
        await cacheService.invalidateDigitalTwinCache();
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Digital twin cache invalidated' }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error in digital twin cache example:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Mock simulation function for demonstration
 */
async function performSimulation(scenarioId: string): Promise<any> {
  // Simulate expensive computation
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    scenarioId,
    cost: Math.random() * 10000,
    time: Math.random() * 100,
    inventory: Math.random() * 1000,
    timestamp: Date.now(),
  };
}

/**
 * Lambda handler with cache service lifecycle management
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const path = event.path;

  try {
    if (path.includes('/simulation')) {
      return await cacheSimulationExample(event);
    } else if (path.includes('/session')) {
      return await sessionManagementExample(event);
    } else if (path.includes('/digital-twin')) {
      return await digitalTwinCacheExample(event);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' }),
      };
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  } finally {
    // Optional: Disconnect from Redis if needed
    // In Lambda, it's often better to keep the connection alive for reuse
    // const cacheService = getCacheService();
    // if (cacheService.isReady()) {
    //   await cacheService.disconnect();
    // }
  }
}
