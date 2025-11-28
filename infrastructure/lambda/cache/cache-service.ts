/**
 * Cache Service for OmniTrack AI
 * Provides caching layer for simulation results, session data, and digital twin state
 */

import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  host: string;
  port: number;
  ttl?: number;
}

export interface SimulationCacheData {
  scenarioId: string;
  results: any;
  timestamp: number;
}

export interface SessionCacheData {
  userId: string;
  preferences: any;
  activeScenarios: string[];
  lastActivity: number;
}

export interface DigitalTwinCacheData {
  state: any;
  timestamp: number;
  version: string;
}

export class CacheService {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: 5000,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Check if connected to Redis
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Cache simulation results with 1-hour TTL
   */
  async cacheSimulationResult(
    scenarioId: string,
    hash: string,
    results: any
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `simulation:${scenarioId}:${hash}`;
    const data: SimulationCacheData = {
      scenarioId,
      results,
      timestamp: Date.now(),
    };

    const ttl = 3600; // 1 hour in seconds
    await this.client!.setEx(key, ttl, JSON.stringify(data));
  }

  /**
   * Retrieve cached simulation results
   */
  async getSimulationResult(
    scenarioId: string,
    hash: string
  ): Promise<any | null> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `simulation:${scenarioId}:${hash}`;
    const data = await this.client!.get(key);

    if (!data) {
      return null;
    }

    const cached: SimulationCacheData = JSON.parse(data);
    return cached.results;
  }

  /**
   * Cache user session with 24-hour TTL
   */
  async cacheSession(
    sessionId: string,
    sessionData: SessionCacheData
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `session:${sessionId}`;
    const ttl = 86400; // 24 hours in seconds
    await this.client!.setEx(key, ttl, JSON.stringify(sessionData));
  }

  /**
   * Retrieve cached session
   */
  async getSession(sessionId: string): Promise<SessionCacheData | null> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `session:${sessionId}`;
    const data = await this.client!.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Update session last activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      await this.cacheSession(sessionId, session);
    }
  }

  /**
   * Delete session from cache
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `session:${sessionId}`;
    await this.client!.del(key);
  }

  /**
   * Cache digital twin state with 5-minute TTL
   */
  async cacheDigitalTwinState(
    timestamp: number,
    state: any,
    version: string
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `dt:state:${timestamp}`;
    const data: DigitalTwinCacheData = {
      state,
      timestamp,
      version,
    };

    const ttl = 300; // 5 minutes in seconds
    await this.client!.setEx(key, ttl, JSON.stringify(data));
  }

  /**
   * Retrieve cached digital twin state
   */
  async getDigitalTwinState(timestamp: number): Promise<any | null> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const key = `dt:state:${timestamp}`;
    const data = await this.client!.get(key);

    if (!data) {
      return null;
    }

    const cached: DigitalTwinCacheData = JSON.parse(data);
    return cached.state;
  }

  /**
   * Get latest digital twin state from cache
   */
  async getLatestDigitalTwinState(): Promise<any | null> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    // Scan for all digital twin state keys
    const keys = await this.client!.keys('dt:state:*');
    
    if (keys.length === 0) {
      return null;
    }

    // Sort keys by timestamp (descending) and get the latest
    const sortedKeys = keys.sort((a, b) => {
      const timestampA = parseInt(a.split(':')[2]);
      const timestampB = parseInt(b.split(':')[2]);
      return timestampB - timestampA;
    });

    const latestKey = sortedKeys[0];
    const data = await this.client!.get(latestKey);

    if (!data) {
      return null;
    }

    const cached: DigitalTwinCacheData = JSON.parse(data);
    return cached.state;
  }

  /**
   * Invalidate all digital twin state caches
   */
  async invalidateDigitalTwinCache(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const keys = await this.client!.keys('dt:state:*');
    if (keys.length > 0) {
      await this.client!.del(keys);
    }
  }

  /**
   * Generic set operation with custom TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const serialized = JSON.stringify(value);
    
    if (ttlSeconds) {
      await this.client!.setEx(key, ttlSeconds, serialized);
    } else {
      await this.client!.set(key, serialized);
    }
  }

  /**
   * Generic get operation
   */
  async get(key: string): Promise<any | null> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const data = await this.client!.get(key);
    
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    await this.client!.del(key);
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    const result = await this.client!.exists(key);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    return await this.client!.ttl(key);
  }

  /**
   * Flush all cache data (use with caution)
   */
  async flushAll(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client not connected');
    }

    await this.client!.flushAll();
  }
}

/**
 * Create a singleton cache service instance
 */
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    const config: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
    cacheServiceInstance = new CacheService(config);
  }
  return cacheServiceInstance;
}

/**
 * Initialize cache service connection
 */
export async function initializeCacheService(): Promise<CacheService> {
  const service = getCacheService();
  await service.connect();
  return service;
}
