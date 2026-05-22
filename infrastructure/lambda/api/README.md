# OmniTrack AI API Documentation

This directory contains the API handlers, middleware, and WebSocket implementations for the OmniTrack AI platform.

## Overview

The API layer provides:
- REST API endpoints for all frontend operations
- WebSocket handlers for real-time updates
- Request validation middleware
- Rate limiting per user
- CORS configuration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  REST API    │              │  WebSocket   │            │
│  │  (HTTP/S)    │              │     API      │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐            ┌─────────────────┐
│   Middleware    │            │   WebSocket     │
│   - Auth        │            │   Handlers      │
│   - Validation  │            │   - Connect     │
│   - Rate Limit  │            │   - Disconnect  │
└─────────────────┘            │   - Default     │
         │                     └─────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Handlers                             │
│  - Digital Twin    - Scenarios      - Alerts               │
│  - Marketplace     - Sustainability - Users                │
│  - Learning        - Audit          - Explainability       │
└─────────────────────────────────────────────────────────────┘
```

## REST API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### POST /auth/login
Authenticate and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600
}
```

#### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

#### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new-jwt-token",
  "expiresIn": 3600
}
```

### Digital Twin

#### GET /digital-twin/state
Get current digital twin state with all nodes.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "nodes": [...],
  "timestamp": "2024-01-01T00:00:00Z",
  "nodeCount": 42
}
```

#### GET /digital-twin/nodes/{id}
Get specific node details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "nodeId": "NODE#123",
  "type": "warehouse",
  "location": "New York, NY",
  "capacity": 10000,
  "status": "operational"
}
```

#### PUT /digital-twin/refresh
Trigger digital twin refresh from data sources.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Digital twin refresh initiated",
  "correlationId": "req-123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Scenarios

#### POST /scenarios/simulate
Run a scenario simulation.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "disruptionType": "supplier_failure",
  "location": "Shanghai, China",
  "severity": "high",
  "duration": 14,
  "affectedNodes": ["NODE#123", "NODE#456"]
}
```

**Response:** `200 OK`
```json
{
  "scenarioId": "SCENARIO#abc123",
  "scenario": {...},
  "impact": {
    "costImpact": 150000,
    "timeImpact": 7,
    "inventoryImpact": -500
  },
  "strategies": [...]
}
```

#### GET /scenarios/{id}
Get scenario details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

#### GET /scenarios/{id}/results
Get scenario simulation results.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Alerts

#### GET /alerts
List all alerts with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - Filter by status (active, acknowledged, resolved)
- `severity` - Filter by severity (low, medium, high, critical)

**Response:** `200 OK`
```json
{
  "alerts": [...],
  "count": 5
}
```

#### PUT /alerts/{id}/acknowledge
Acknowledge an alert.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "alertId": "ALERT#123",
  "status": "acknowledged",
  "acknowledgedBy": "user-id",
  "acknowledgedAt": "2024-01-01T00:00:00Z"
}
```

### Marketplace

#### GET /marketplace/scenarios
List all marketplace scenarios.

**Response:** `200 OK`
```json
{
  "scenarios": [...],
  "count": 25
}
```

#### POST /marketplace/scenarios
Publish a scenario to the marketplace.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "scenarioId": "SCENARIO#abc123",
  "title": "Supplier Failure in Asia",
  "description": "Simulates major supplier failure...",
  "tags": ["supplier", "asia", "manufacturing"],
  "industry": "electronics",
  "disruptionType": "supplier_failure",
  "geography": "asia"
}
```

**Response:** `200 OK`

#### GET /marketplace/scenarios/{id}
Get marketplace scenario details.

**Response:** `200 OK`

#### GET /marketplace/scenarios/search
Search marketplace scenarios with filters.

**Query Parameters:**
- `industry` - Filter by industry
- `disruptionType` - Filter by disruption type
- `geography` - Filter by geography
- `minRating` - Minimum rating (1-5)
- `tags` - Comma-separated tags

**Response:** `200 OK`

#### PUT /marketplace/scenarios/{id}/rating
Rate a marketplace scenario.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "rating": 5,
  "review": "Very helpful scenario!"
}
```

**Response:** `200 OK`

#### POST /marketplace/scenarios/{id}/fork
Fork and customize a marketplace scenario.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "modifications": {
    "severity": "critical",
    "duration": 30
  }
}
```

**Response:** `201 Created`

### Sustainability

#### GET /sustainability/metrics
Get sustainability metrics for current configuration.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "carbonFootprint": 12500,
  "emissionsByRoute": {...},
  "sustainabilityScore": 7.5
}
```

#### GET /sustainability/trends
Get historical sustainability trends.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)

**Response:** `200 OK`

#### POST /sustainability/comparison
Compare sustainability metrics across strategies.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "strategies": [...]
}
```

**Response:** `200 OK`

### Learning

#### POST /learning/feedback
Submit feedback on scenario accuracy.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "scenarioId": "SCENARIO#abc123",
  "userId": "user-id",
  "actualOutcome": "Supplier recovered in 10 days...",
  "accuracy": 4,
  "comments": "Prediction was close but..."
}
```

**Response:** `201 Created`

#### GET /learning/metrics
Get model performance metrics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `scenarioType` - Scenario type

**Response:** `200 OK`

#### GET /learning/model-version
Get current model version.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `scenarioType` - Scenario type

**Response:** `200 OK`

### Audit

#### GET /audit/logs
Query audit logs with filters.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Requires `audit:read` permission

**Query Parameters:**
- `userIdentity` - Filter by user
- `eventType` - Filter by event type
- `resourceType` - Filter by resource type
- `resourceId` - Filter by resource ID
- `startDate` - Start date (max 90 days)
- `endDate` - End date
- `limit` - Result limit (default 100)

**Response:** `200 OK`
```json
{
  "results": [...],
  "count": 50,
  "queryTime": "125ms"
}
```

#### GET /audit/versions/{resourceType}/{resourceId}
Get version history for a resource.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Requires `audit:read` permission

**Response:** `200 OK`

### Explainability

#### POST /explainability/generate
Generate explanation for AI decision.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "scenarioId": "SCENARIO#abc123",
  "agentContributions": [...]
}
```

**Response:** `200 OK`

### Users

#### GET /users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

#### PUT /users/preferences
Update user preferences.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "notificationChannels": ["email", "slack"],
  "defaultView": "dashboard",
  "sustainabilityPriority": 0.7,
  "costPriority": 0.2,
  "riskPriority": 0.1
}
```

**Response:** `200 OK`

## WebSocket API

### Connection

Connect to WebSocket API:
```
wss://{api-id}.execute-api.{region}.amazonaws.com/prod?userId={userId}
```

### Routes

#### $connect
Automatically called when client connects.

#### $disconnect
Automatically called when client disconnects.

#### $default
Handles custom messages from clients.

### Client Messages

#### Subscribe to channels
```json
{
  "action": "subscribe",
  "channels": ["digital_twin_update", "alert_notification"]
}
```

#### Unsubscribe from channels
```json
{
  "action": "unsubscribe",
  "channels": ["scenario_progress"]
}
```

#### Ping (keep-alive)
```json
{
  "action": "ping"
}
```

**Response:**
```json
{
  "message": "pong",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Server Messages

#### Digital Twin Update
```json
{
  "channel": "digital_twin_update",
  "message": {
    "nodeId": "NODE#123",
    "status": "disrupted",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Alert Notification
```json
{
  "channel": "alert_notification",
  "message": {
    "alertId": "ALERT#456",
    "severity": "high",
    "message": "Supplier failure detected"
  }
}
```

#### Scenario Progress
```json
{
  "channel": "scenario_progress",
  "message": {
    "scenarioId": "SCENARIO#abc123",
    "progress": 75,
    "status": "analyzing_impact"
  }
}
```

## Middleware

### Authentication Middleware
All protected endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Validation Middleware
Request bodies are validated against schemas before processing. Validation errors return `400 Bad Request` with details.

### Rate Limiting Middleware
Rate limits are enforced per user/IP:
- Scenario simulation: 10 requests/minute
- Marketplace: 100 requests/minute
- Alerts: 60 requests/minute
- Sustainability: 30 requests/minute
- Default: 60 requests/minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

When exceeded, returns `429 Too Many Requests` with `Retry-After` header.

## Error Responses

### 400 Bad Request
Invalid request parameters or body.

### 401 Unauthorized
Missing or invalid authentication token.

### 403 Forbidden
Insufficient permissions for requested operation.

### 404 Not Found
Requested resource does not exist.

### 429 Too Many Requests
Rate limit exceeded.

### 500 Internal Server Error
Unexpected server error. Includes correlation ID for debugging.

### 502 Bad Gateway
External service failure (IoT, Bedrock, etc.).

### 504 Gateway Timeout
Request timeout.

## CORS Configuration

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Correlation-Id`
- `Access-Control-Allow-Credentials: true`

## Correlation IDs

All requests support `X-Correlation-Id` header for distributed tracing. If not provided, one is generated automatically.

## Logging

All API requests are logged with:
- Correlation ID
- User identity
- Request path and method
- Response status
- Execution time
- Error details (if applicable)

## Testing

See individual test files for unit and integration tests:
- `handlers.test.ts` - REST API handler tests
- `websocket-handlers.test.ts` - WebSocket handler tests
- `validation-middleware.test.ts` - Validation tests
- `rate-limiting-middleware.test.ts` - Rate limiting tests
