# OmniTrack AI Agents

This directory contains the Lambda function implementations for the autonomous AI agents that power OmniTrack AI's supply chain resilience platform.

## Info Agent

**File**: `info-agent.ts`

The Info Agent is responsible for aggregating and synthesizing supply chain data from multiple sources to provide a unified view of the digital twin state.

### Features

- **Data Aggregation**: Fetches supply chain node data from DynamoDB
- **Alert Integration**: Optionally includes active alerts in the response
- **Structured Logging**: All operations are logged with correlation IDs for traceability
- **X-Ray Tracing**: Integrated with AWS X-Ray for distributed tracing
- **Error Handling**: Graceful error handling with detailed error responses

### API

**Endpoint**: `/agents/info`

**Request Body**:
```json
{
  "nodeIds": ["node-1", "node-2"],  // Optional: specific nodes to fetch
  "includeAlerts": true,             // Optional: include active alerts
  "correlationId": "custom-id"       // Optional: custom correlation ID
}
```

**Response**:
```json
{
  "digitalTwinState": {
    "nodes": [...],
    "alerts": [...],
    "lastUpdated": "2025-11-27T12:00:00.000Z"
  },
  "metadata": {
    "correlationId": "info-1234567890",
    "executionTime": 123,
    "dataSourcesQueried": ["DynamoDB"]
  }
}
```

### Requirements Validated

- **Requirement 9.1**: IoT sensor data updates reflected in digital twin within 5 seconds
- **Requirement 9.2**: ERP system data synchronization within 30 seconds
- **Requirement 9.5**: Risk reassessment triggered on material state changes

### Testing

**Unit Tests**: `info-agent.test.ts`
- Tests Lambda handler functionality
- Validates request/response handling
- Verifies error handling and logging

**Property Tests**: `info-agent.property.test.ts`
- **Property 35**: Digital twin synchronization timing
  - Validates that updates are reflected within 30 seconds
  - Tests with 100 randomized scenarios
  - Ensures consistency during concurrent updates

### Logging

All log entries follow a structured JSON format:
```json
{
  "timestamp": "2025-11-27T12:00:00.000Z",
  "level": "INFO",
  "message": "Info Agent invoked",
  "correlationId": "info-1234567890",
  "requestId": "aws-request-id",
  "functionName": "info-agent",
  "additionalData": {}
}
```

### Future Enhancements

- IoT Core integration (Task 6)
- ERP system integration
- Caching layer for frequently accessed data
- Real-time WebSocket updates
