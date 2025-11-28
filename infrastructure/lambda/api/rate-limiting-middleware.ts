/**
 * Rate Limiting Middleware
 * 
 * Implements per-user rate limiting using Redis/ElastiCache
 * to prevent API abuse and ensure fair resource allocation.
 * 
 * Requirements: All (API layer)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createClient, RedisClientType } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Default rate limits by endpoint pattern
const DEFAULT_RATE_LIMITS: { [pattern: string]: RateLimitConfig } = {
  '/scenarios/simulate': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 simulations per minute
  },
  '/marketplace/scenarios': {
    windowMs: 60 * 1000,
    maxRequests: 100, // 100 requests per minute
  },
  '/alerts': {
    windowMs: 60 * 1000,
    maxRequests: 60, // 60 requests per minute
  },
  '/sustainability': {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 requests per minute
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 60, // 60 requests per minute for other endpoints
  },
};

/**
 * Redis client singleton
 */
let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client
 */
async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Get rate limit configuration for endpoint
 */
function getRateLimitConfig(path: string): RateLimitConfig {
  // Find matching pattern
  for (const [pattern, config] of Object.entries(DEFAULT_RATE_LIMITS)) {
    if (path.startsWith(pattern)) {
      return config;
    }
  }

  return DEFAULT_RATE_LIMITS.default;
}

/**
 * Extract user identifier from event
 */
function getUserIdentifier(event: APIGatewayProxyEvent): string {
  // Try to get user ID from authorizer
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address for unauthenticated requests
  const ip = event.requestContext.identity?.sourceIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(
  userIdentifier: string,
  path: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  try {
    const client = await getRedisClient();
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Redis key for this user and endpoint
    const key = `ratelimit:${userIdentifier}:${path}`;

    // Use Redis sorted set to track requests in time window
    // Remove old requests outside the window
    await client.zRemRangeByScore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await client.zCard(key);

    // Check if limit exceeded
    if (requestCount >= config.maxRequests) {
      // Get oldest request timestamp to calculate reset time
      const oldestRequests = await client.zRange(key, 0, 0);

      const resetAt = oldestRequests.length > 0
        ? parseInt(oldestRequests[0], 10) + config.windowMs
        : now + config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    await client.zAdd(key, {
      score: now,
      value: `${now}`,
    });

    // Set expiration on key (cleanup)
    await client.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: now + config.windowMs,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: -1,
      resetAt: Date.now() + 60000,
    };
  }
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const path = event.path;
    const userIdentifier = getUserIdentifier(event);
    const config = getRateLimitConfig(path);

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userIdentifier, path, config);

    // Add rate limit headers to response
    const rateLimitHeaders = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
    };

    // If rate limit exceeded, return 429
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);

      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': retryAfter.toString(),
          ...rateLimitHeaders,
        },
        body: JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
      };
    }

    // Call handler if rate limit not exceeded
    const response = await handler(event);

    // Add rate limit headers to successful response
    return {
      ...response,
      headers: {
        ...response.headers,
        ...rateLimitHeaders,
      },
    };
  };
}

/**
 * Custom rate limit configuration
 */
export function withCustomRateLimit(
  config: RateLimitConfig,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const path = event.path;
    const userIdentifier = getUserIdentifier(event);

    // Check rate limit with custom config
    const rateLimitResult = await checkRateLimit(userIdentifier, path, config);

    // Add rate limit headers to response
    const rateLimitHeaders = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
    };

    // If rate limit exceeded, return 429
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);

      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': retryAfter.toString(),
          ...rateLimitHeaders,
        },
        body: JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
      };
    }

    // Call handler if rate limit not exceeded
    const response = await handler(event);

    // Add rate limit headers to successful response
    return {
      ...response,
      headers: {
        ...response.headers,
        ...rateLimitHeaders,
      },
    };
  };
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(
  userIdentifier: string,
  path?: string
): Promise<void> {
  try {
    const client = await getRedisClient();

    if (path) {
      // Reset specific endpoint
      const key = `ratelimit:${userIdentifier}:${path}`;
      await client.del(key);
    } else {
      // Reset all endpoints for user
      const keys = await client.keys(`ratelimit:${userIdentifier}:*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    throw error;
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  userIdentifier: string,
  path: string
): Promise<{
  requestCount: number;
  limit: number;
  remaining: number;
  resetAt: number;
}> {
  try {
    const client = await getRedisClient();
    const config = getRateLimitConfig(path);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const key = `ratelimit:${userIdentifier}:${path}`;

    // Remove old requests
    await client.zRemRangeByScore(key, 0, windowStart);

    // Count current requests
    const requestCount = await client.zCard(key);

    // Get oldest request for reset time
    const oldestRequests = await client.zRange(key, 0, 0);

    const resetAt = oldestRequests.length > 0
      ? parseInt(oldestRequests[0], 10) + config.windowMs
      : now + config.windowMs;

    return {
      requestCount,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - requestCount),
      resetAt,
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    throw error;
  }
}

/**
 * Cleanup function to close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
