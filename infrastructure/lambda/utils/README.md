# Lambda Utilities - Monitoring and Observability

This directory contains utility modules for implementing comprehensive monitoring and observability in OmniTrack Lambda functions.

## Available Utilities

### 1. Structured Logger (`logger.ts`)

Provides structured JSON logging with correlation IDs, log levels, and contextual information.

**Features:**
- JSON-formatted logs for CloudWatch Logs Insights
- Correlation ID tracking for request tracing
- Multiple log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Contextual information (user ID, request ID, function name)
- Child loggers with inherited context
- Specialized logging methods for API calls, database operations, and metrics

**Usage:**
```typescript
import { createLogger } from './utils/logger';

export const handler = async (event: any, context: Context) => {
  const logger = createLogger(event);
  
  logger.info('Processing request', { userId: event.userId });
  
  try {
    // Business logic
    logger.metric('RequestProcessed', 1);
  } catch (error) {
    logger.error('Request failed', error, { userId: event.userId });
    throw error;
  }
};
```

**Log Levels:**
- `DEBUG`: Detailed diagnostic information (not logged in production)
- `INFO`: General informational messages
- `WARNING`: Warning messages for potentially harmful situations
- `ERROR`: Error events that might still allow the application to continue
- `CRITICAL`: Critical errors requiring immediate attention

**Specialized Methods:**
- `logger.metric(name, value, unit, context)`: Log performance metrics
- `logger.logApiCall(method, path, statusCode, duration, context)`: Log API requests
- `logger.logDbOperation(operation, table, duration, success, context)`: Log database operations
- `logger.child(context)`: Create child logger with additional context

### 2. Metrics Publisher (`metrics.ts`)

Provides utilities for publishing custom CloudWatch metrics for business KPIs and operational metrics.

**Features:**
- Publish single or multiple metrics
- Pre-defined methods for common metrics
- Automatic dimension management
- Non-blocking metric publishing (failures don't break application flow)

**Usage:**
```typescript
import { metricsPublisher, MetricUnit } from './utils/metrics';

// Publish simulation duration
await metricsPublisher.publishSimulationDuration('supply-disruption', 1500);

// Publish alert generated
await metricsPublisher.publishAlertGenerated('inventory-shortage', 'high');

// Publish custom metric
await metricsPublisher.publishMetric('CustomMetric', 42, MetricUnit.COUNT, [
  { Name: 'Dimension1', Value: 'value1' }
]);
```

**Pre-defined Metrics:**
- `publishSimulationDuration(scenarioType, duration)`: Simulation execution time
- `publishAlertGenerated(alertType, severity)`: Alert generation count
- `publishDigitalTwinUpdateLatency(duration)`: Digital twin update time
- `publishAgentExecution(agentName, duration, success)`: Agent execution metrics
- `publishMarketplaceActivity(activityType)`: Marketplace interactions
- `publishSustainabilityCalculation(duration)`: Sustainability calculation time
- `publishCacheMetric(hit)`: Cache hit/miss ratio
- `publishIoTDataProcessed(sensorType, dataPoints)`: IoT data processing
- `publishNegotiationMetrics(duration, strategies, consensus)`: Negotiation metrics
- `publishFeedbackReceived(scenarioType, rating)`: User feedback

### 3. X-Ray Tracing (`tracing.ts`)

Provides utilities for creating custom X-Ray segments and subsegments to trace distributed workflows.

**Features:**
- Custom subsegment creation
- Automatic error tracking
- Metadata and annotation support
- Pre-defined tracing methods for common operations
- Correlation ID tracking

**Usage:**
```typescript
import { traceAsync, traceAgentExecution, traceDatabaseOperation } from './utils/tracing';

// Trace agent execution
const result = await traceAgentExecution('ScenarioAgent', async () => {
  return generateScenario(params);
}, { scenarioType: 'supply-disruption' });

// Trace database operation
const data = await traceDatabaseOperation('GetItem', 'omnitrack-main', async () => {
  return await dynamodb.get(params).promise();
});

// Trace custom operation
const processed = await traceAsync('ProcessData', async (subsegment) => {
  subsegment.addAnnotation('dataSize', data.length);
  return processData(data);
}, { source: 'iot-sensor' }, { operation: 'process' });
```

**Pre-defined Tracing Methods:**
- `traceAgentExecution(agentName, fn, inputParams)`: Trace agent execution
- `traceDatabaseOperation(operation, table, fn)`: Trace database operations
- `traceExternalApiCall(serviceName, operation, fn)`: Trace external API calls
- `traceSimulation(scenarioType, scenarioId, fn)`: Trace simulation execution
- `traceCacheOperation(operation, key, fn)`: Trace cache operations

**Helper Methods:**
- `addAnnotation(key, value)`: Add annotation to current segment (indexed for filtering)
- `addMetadata(key, value, namespace)`: Add metadata to current segment (searchable)
- `getTraceId()`: Get current trace ID for correlation
- `setUser(userId)`: Set user ID for X-Ray user tracking

## Example: Complete Monitoring Implementation

See `monitoring-example.ts` for comprehensive examples of using all monitoring utilities together.

```typescript
import { createLogger } from './utils/logger';
import { metricsPublisher } from './utils/metrics';
import { traceAgentExecution, setUser } from './utils/tracing';

export const handler = async (event: any, context: Context) => {
  const logger = createLogger(event);
  
  try {
    // Set user for X-Ray tracking
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (userId) {
      logger.setUserId(userId);
      setUser(userId);
    }
    
    // Trace agent execution with metrics
    const result = await traceAgentExecution('ScenarioAgent', async () => {
      const startTime = Date.now();
      
      try {
        const scenario = await generateScenario();
        const duration = Date.now() - startTime;
        
        // Publish success metrics
        await metricsPublisher.publishAgentExecution('ScenarioAgent', duration, true);
        logger.info('Agent completed', { duration });
        
        return scenario;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Publish failure metrics
        await metricsPublisher.publishAgentExecution('ScenarioAgent', duration, false);
        throw error;
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result }),
    };
    
  } catch (error) {
    logger.error('Request failed', error as Error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

## Best Practices

1. **Always use structured logging**: Use the logger utility for consistent log format
2. **Add correlation IDs**: Include correlation IDs in all logs and traces for request tracking
3. **Publish custom metrics**: Track business KPIs alongside operational metrics
4. **Use X-Ray subsegments**: Create subsegments for major operations to identify bottlenecks
5. **Set appropriate log levels**: Use DEBUG for development, INFO for production
6. **Add context to logs**: Include relevant context (user ID, request ID, etc.) in all logs
7. **Don't block on metrics**: Metrics publishing is non-blocking and won't break application flow
8. **Use annotations for filtering**: Add X-Ray annotations for commonly filtered attributes
9. **Use metadata for details**: Add X-Ray metadata for detailed information
10. **Monitor costs**: Be mindful of CloudWatch costs when publishing high-volume metrics

## Integration with Infrastructure

These utilities are designed to work with the monitoring infrastructure defined in `infrastructure/lib/infrastructure-stack.ts`:

- **CloudWatch Logs**: Logs are automatically sent to CloudWatch Logs
- **CloudWatch Metrics**: Metrics are published to the `OmniTrack` namespace
- **X-Ray**: Traces are sent to AWS X-Ray (requires X-Ray daemon)
- **SNS Topics**: Critical errors can trigger SNS notifications

## Environment Variables

Configure monitoring behavior via environment variables:

- `LOG_LEVEL`: Set minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `ENVIRONMENT`: Set environment name (development, staging, production)
- `METRICS_NAMESPACE`: Override default metrics namespace (default: OmniTrack)

## Testing

When testing Lambda functions locally, monitoring utilities will:
- Log to stdout/stderr (can be captured by test frameworks)
- Attempt to publish metrics (may fail if AWS credentials not configured)
- Skip X-Ray tracing if X-Ray daemon not running

## References

- [CloudWatch Logs Documentation](https://docs.aws.amazon.com/cloudwatch/latest/logs/)
- [CloudWatch Metrics Documentation](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [OmniTrack Monitoring Guide](../../MONITORING.md)
