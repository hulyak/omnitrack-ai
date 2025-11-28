# Cache Service

This module provides a caching layer for OmniTrack AI using ElastiCache Redis.

## Features

- **Simulation Result Caching**: Cache simulation results with 1-hour TTL
- **Session Caching**: Cache user session data with 24-hour TTL
- **Digital Twin State Caching**: Cache digital twin snapshots with 5-minute TTL
- **Generic Cache Operations**: Support for custom key-value caching with configurable TTL

## Usage

### Initialize Cache Service

```typescript
import { initializeCacheService } from './cache-service';

const cacheService = await initializeCacheService();
```

### Cache Simulation Results

```typescript
// Cache simulation result
await cacheService.cacheSimulationResult(
  'scenario-123',
  'hash-abc',
  { cost: 1000, time: 5, inventory: 200 }
);

// Retrieve cached result
const result = await cacheService.getSimulationResult('scenario-123', 'hash-abc');
```

### Cache User Sessions

```typescript
// Cache session
await cacheService.cacheSession('session-456', {
  userId: 'user-789',
  preferences: { theme: 'dark' },
  activeScenarios: ['scenario-123'],
  lastActivity: Date.now()
});

// Retrieve session
const session = await cacheService.getSession('session-456');

// Update session activity
await cacheService.updateSessionActivity('session-456');

// Delete session
await cacheService.deleteSession('session-456');
```

### Cache Digital Twin State

```typescript
// Cache digital twin state
await cacheService.cacheDigitalTwinState(
  Date.now(),
  { nodes: [...], edges: [...] },
  'v1.0'
);

// Get latest digital twin state
const latestState = await cacheService.getLatestDigitalTwinState();

// Invalidate all digital twin caches
await cacheService.invalidateDigitalTwinCache();
```

### Generic Cache Operations

```typescript
// Set with custom TTL
await cacheService.set('custom:key', { data: 'value' }, 600); // 10 minutes

// Get value
const value = await cacheService.get('custom:key');

// Check if key exists
const exists = await cacheService.exists('custom:key');

// Get remaining TTL
const ttl = await cacheService.getTTL('custom:key');

// Delete key
await cacheService.delete('custom:key');
```

## TTL Policies

- **Simulation Results**: 1 hour (3600 seconds)
- **User Sessions**: 24 hours (86400 seconds)
- **Digital Twin State**: 5 minutes (300 seconds)
- **Custom Keys**: Configurable per operation

## Environment Variables

- `REDIS_HOST`: Redis cluster endpoint (required)
- `REDIS_PORT`: Redis port (default: 6379)

## Error Handling

The cache service throws errors when:
- Redis connection fails
- Operations are attempted before connection is established
- Network issues occur during operations

Always wrap cache operations in try-catch blocks and implement fallback logic for cache misses.

## Connection Management

The cache service uses a singleton pattern to maintain a single Redis connection across Lambda invocations. The connection is automatically reused when the Lambda execution context is warm.

```typescript
// Get existing instance or create new one
const cacheService = getCacheService();

// Connect if not already connected
await cacheService.connect();

// Check connection status
if (cacheService.isReady()) {
  // Perform cache operations
}

// Disconnect when done (optional, Lambda will handle cleanup)
await cacheService.disconnect();
```
