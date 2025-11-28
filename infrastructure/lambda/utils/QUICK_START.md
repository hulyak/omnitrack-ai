# Monitoring Utilities - Quick Start Guide

## 5-Minute Setup

### 1. Basic Logging

```typescript
import { createLogger } from './utils/logger';

export const handler = async (event: any, context: Context) => {
  const logger = createLogger(event);
  
  logger.info('Request received');
  
  try {
    // Your code here
    logger.info('Request completed');
  } catch (error) {
    logger.error('Request failed', error as Error);
    throw error;
  }
};
```

### 2. Add Metrics

```typescript
import { createLogger } from './utils/logger';
import { metricsPublisher } from './utils/metrics';

export const handler = async (event: any, context: Context) => {
  const logger = createLogger(event);
  const startTime = Date.now();
  
  try {
    // Your code here
    
    const duration = Date.now() - startTime;
    await metricsPublisher.publishMetric('RequestDuration', duration, MetricUnit.MILLISECONDS);
    
    logger.info('Request completed', { duration });
  } catch (error) {
    logger.error('Request failed', error as Error);
    throw error;
  }
};
```

### 3. Add Tracing

```typescript
import { createLogger } from './utils/logger';
import { metricsPublisher } from './utils/metrics';
import { traceAsync } from './utils/tracing';

export const handler = async (event: any, context: Context) => {
  const logger = createLogger(event);
  
  try {
    const result = await traceAsync('ProcessRequest', async () => {
      // Your code here
      return { success: true };
    });
    
    logger.info('Request completed');
    return result;
  } catch (error) {
    logger.error('Request failed', error as Error);
    throw error;
  }
};
```

## Common Patterns

### Pattern 1: Agent Execution

```typescript
import { createLogger } from './utils/logger';
import { metricsPublisher } from './utils/metrics';
import { traceAgentExecution } from './utils/tracing';

const result = await traceAgentExecution('MyAgent', async () => {
  const startTime = Date.now();
  
  try {
    const result = await executeAgent();
    const duration = Date.now() - startTime;
    
    await metricsPublisher.publishAgentExecution('MyAgent', duration, true);
    logger.info('Agent completed', { duration });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await metricsPublisher.publishAgentExecution('MyAgent', duration, false);
    throw error;
  }
});
```

### Pattern 2: Database Operation

```typescript
import { traceDatabaseOperation } from './utils/tracing';

const data = await traceDatabaseOperation('GetItem', 'omnitrack-main', async () => {
  logger.info('Fetching from DynamoDB');
  return await dynamodb.get(params).promise();
});
```

### Pattern 3: External API Call

```typescript
import { traceAsync } from './utils/tracing';

const response = await traceAsync('ExternalAPI', async (subsegment) => {
  const startTime = Date.now();
  
  const result = await fetch('https://api.example.com/data');
  const duration = Date.now() - startTime;
  
  subsegment?.addMetadata('duration', duration);
  subsegment?.addAnnotation('statusCode', result.status);
  
  return result.json();
});
```

## Viewing Your Data

### CloudWatch Logs Insights

Query your logs:
```sql
fields @timestamp, message, context.userId
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

### CloudWatch Metrics

View your metrics in the CloudWatch console:
1. Navigate to CloudWatch > Metrics
2. Select "OmniTrack" namespace
3. View your custom metrics

### X-Ray Traces

View your traces:
1. Navigate to X-Ray > Traces
2. Filter by annotation: `annotation.agentName = "MyAgent"`
3. View service map for dependencies

## Dashboard Access

Access the operations dashboard:
```bash
aws cloudformation describe-stacks \
  --stack-name OmniTrackInfrastructureStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

## Need More Help?

- Full documentation: [README.md](./README.md)
- Monitoring guide: [../../MONITORING.md](../../MONITORING.md)
- Examples: [monitoring-example.ts](./monitoring-example.ts)
