# OmniTrack AI - Monitoring and Observability

This document describes the monitoring and observability setup for the OmniTrack AI platform.

## Overview

The OmniTrack AI platform implements comprehensive monitoring and observability using AWS CloudWatch, X-Ray, and SNS. The monitoring strategy includes:

- **Structured Logging**: JSON-formatted logs with correlation IDs and contextual information
- **Custom Metrics**: Business KPIs and operational metrics published to CloudWatch
- **Distributed Tracing**: X-Ray tracing for multi-agent workflows and API calls
- **Alerting**: Multi-tier alerting system with SNS topics for different severity levels
- **Dashboards**: CloudWatch dashboards for real-time system health visualization

## CloudWatch Dashboards

### Operations Dashboard

The main operations dashboard (`OmniTrack-Operations-Dashboard`) provides real-time visibility into:

#### API Gateway Metrics
- **Request Count**: Total API requests over time
- **Error Rates**: 4xx and 5xx error rates
- **Latency**: p50, p95, and p99 latency percentiles

#### Lambda Metrics
- **Invocations**: Function invocation counts
- **Errors & Throttles**: Error and throttle counts
- **Duration**: p50, p95, and p99 execution duration
- **Concurrent Executions**: Maximum concurrent executions

#### DynamoDB Metrics
- **Read/Write Capacity**: Consumed capacity units
- **Throttled Requests**: User errors (throttles)
- **Latency**: Average latency for GetItem operations

#### System Health Summary
- **API Health**: 5xx error rate indicator
- **Lambda Health**: Error rate indicator
- **DynamoDB Health**: Throttle count indicator

### Accessing the Dashboard

The dashboard URL is available in the CloudFormation stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name OmniTrackInfrastructureStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

## CloudWatch Alarms

### Critical Alarms (Page On-Call)

These alarms trigger immediate notifications to on-call engineers:

1. **API Error Rate Alarm** (`OmniTrack-API-5xx-Error-Rate`)
   - Threshold: 5% error rate
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Critical Alerts SNS topic

2. **Lambda Error Rate Alarm** (`OmniTrack-Lambda-Error-Rate`)
   - Threshold: 5% error rate
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Critical Alerts SNS topic

### Warning Alarms (Team Notifications)

These alarms trigger notifications to the team Slack channel:

1. **API Latency Alarm** (`OmniTrack-API-High-Latency`)
   - Threshold: 2 seconds (p95)
   - Evaluation: 2 out of 3 periods of 5 minutes
   - Action: Publish to Warning Alerts SNS topic

2. **DynamoDB Throttle Alarm** (`OmniTrack-DynamoDB-Read-Throttle`)
   - Threshold: 10 throttled requests
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Warning Alerts SNS topic

3. **Lambda Throttle Alarm** (`OmniTrack-Lambda-Throttle`)
   - Threshold: 5 throttled invocations
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: Publish to Warning Alerts SNS topic

### Configuring Alarm Actions

Update alarm email subscriptions via environment variables:
```bash
export CRITICAL_ALERT_EMAIL="oncall@yourcompany.com"
export TEAM_ALERT_EMAIL="team@yourcompany.com"
cdk deploy
```

## SNS Topics

### Critical Alerts Topic
- **Topic Name**: `omnitrack-critical-alerts`
- **Use Case**: Production incidents requiring immediate attention
- **Subscribers**: On-call engineers (PagerDuty, email, SMS)

### Warning Alerts Topic
- **Topic Name**: `omnitrack-warning-alerts`
- **Use Case**: Performance degradation or approaching thresholds
- **Subscribers**: Team Slack channel, email distribution list

### Info Alerts Topic
- **Topic Name**: `omnitrack-info-alerts`
- **Use Case**: General notifications and informational alerts
- **Subscribers**: Email distribution list

### Adding Subscriptions

Add additional SNS subscriptions via AWS Console or CLI:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:REGION:ACCOUNT:omnitrack-critical-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Structured Logging

### Logger Utility

All Lambda functions should use the structured logger utility (`infrastructure/lambda/utils/logger.ts`):

```typescript
import { createLogger } from '../utils/logger';

export const handler = async (event: any) => {
  const logger = createLogger(event);
  
  logger.info('Processing request', { userId: event.userId });
  
  try {
    // Business logic
    logger.metric('RequestProcessed', 1);
  } catch (error) {
    logger.error('Request processing failed', error, { userId: event.userId });
    throw error;
  }
};
```

### Log Levels

- **DEBUG**: Detailed diagnostic information (not logged in production)
- **INFO**: General informational messages
- **WARNING**: Warning messages for potentially harmful situations
- **ERROR**: Error events that might still allow the application to continue
- **CRITICAL**: Critical errors that require immediate attention

### Log Structure

All logs are written in JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Processing request",
  "context": {
    "correlationId": "abc-123-def",
    "userId": "user-456",
    "requestId": "req-789",
    "functionName": "omnitrack-api-handler"
  }
}
```

### Log Groups

- **Application Logs**: `/aws/omnitrack/application` (30-day retention)
- **Lambda Logs**: `/aws/lambda/omnitrack` (30-day retention)
- **Error Logs**: `/aws/omnitrack/errors` (90-day retention)
- **IoT Errors**: `/aws/iot/omnitrack/errors` (30-day retention)

### Querying Logs

Use CloudWatch Logs Insights to query structured logs:

```sql
-- Find all errors for a specific user
fields @timestamp, message, context.userId, error.message
| filter level = "ERROR" and context.userId = "user-123"
| sort @timestamp desc
| limit 100

-- Calculate average API latency
fields @timestamp, api.duration
| filter api.duration > 0
| stats avg(api.duration) as avgLatency by bin(5m)

-- Find slow database operations
fields @timestamp, database.operation, database.duration
| filter database.duration > 1000
| sort database.duration desc
| limit 50
```

## Custom Metrics

### Metrics Publisher Utility

Use the metrics publisher utility (`infrastructure/lambda/utils/metrics.ts`) to publish custom metrics:

```typescript
import { metricsPublisher, MetricUnit } from '../utils/metrics';

// Publish simulation duration
await metricsPublisher.publishSimulationDuration('supply-disruption', 1500);

// Publish alert generated
await metricsPublisher.publishAlertGenerated('inventory-shortage', 'high');

// Publish agent execution
await metricsPublisher.publishAgentExecution('ScenarioAgent', 2300, true);
```

### Available Metrics

#### Business Metrics
- **SimulationDuration**: Time to complete scenario simulations
- **AlertsGenerated**: Count of alerts by type and severity
- **MarketplaceActivity**: Marketplace interactions (publish, rate, fork)
- **FeedbackReceived**: User feedback count and ratings
- **StrategiesGenerated**: Number of mitigation strategies generated

#### Operational Metrics
- **DigitalTwinUpdateLatency**: Time to update digital twin state
- **AgentExecutionDuration**: Agent execution time by agent name
- **AgentExecutionCount**: Agent invocation count by success status
- **SustainabilityCalculationDuration**: Time for sustainability calculations
- **CacheHitRate**: Cache hit/miss ratio
- **IoTDataPointsProcessed**: IoT data points processed by sensor type
- **NegotiationDuration**: Cross-agent negotiation execution time
- **ConsensusReached**: Whether agent negotiation reached consensus

### Creating Custom Dashboards

Create custom dashboards for specific metrics:

```typescript
const customDashboard = new cloudwatch.Dashboard(this, 'BusinessMetricsDashboard', {
  dashboardName: 'OmniTrack-Business-Metrics',
});

customDashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Simulation Performance',
    left: [
      new cloudwatch.Metric({
        namespace: 'OmniTrack',
        metricName: 'SimulationDuration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
    ],
  })
);
```

## X-Ray Tracing

### Tracing Utility

Use the X-Ray tracing utility (`infrastructure/lambda/utils/tracing.ts`) for distributed tracing:

```typescript
import { traceAsync, traceAgentExecution, traceDatabaseOperation } from '../utils/tracing';

// Trace agent execution
const result = await traceAgentExecution('ScenarioAgent', async () => {
  // Agent logic
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
}, { source: 'iot-sensor' });
```

### X-Ray Configuration

X-Ray tracing is enabled for:
- **API Gateway**: All REST and WebSocket APIs
- **Lambda Functions**: All Lambda functions have `tracing: lambda.Tracing.ACTIVE`
- **AWS SDK Calls**: Automatically traced when using X-Ray SDK

### Viewing Traces

Access X-Ray traces in the AWS Console:
1. Navigate to AWS X-Ray Console
2. Select "Service Map" to view service dependencies
3. Select "Traces" to view individual request traces
4. Use filters to find specific traces:
   - By annotation: `annotation.agentName = "ScenarioAgent"`
   - By error: `error = true`
   - By latency: `responsetime > 2`

### Trace Sampling

- **Error Traces**: 100% sampling (all errors are traced)
- **Success Traces**: 5% sampling (configurable in X-Ray sampling rules)

## Performance Monitoring

### Key Performance Indicators (KPIs)

Monitor these KPIs to ensure system health:

1. **API Response Time**: p95 < 2 seconds
2. **Simulation Completion Time**: p95 < 60 seconds
3. **Digital Twin Update Latency**: p95 < 30 seconds
4. **Alert Generation Time**: p95 < 30 seconds
5. **Error Rate**: < 1% for all services
6. **Availability**: > 99.9% uptime

### Setting Up Alerts for KPIs

Create composite alarms for SLO monitoring:

```typescript
const sloAlarm = new cloudwatch.CompositeAlarm(this, 'SLOViolation', {
  alarmName: 'OmniTrack-SLO-Violation',
  alarmDescription: 'Alert when multiple SLOs are violated',
  compositeAlarmRule: cloudwatch.AlarmRule.anyOf(
    apiErrorAlarm,
    apiLatencyAlarm,
    lambdaErrorAlarm
  ),
});
```

## Troubleshooting

### High API Latency

1. Check CloudWatch dashboard for latency spikes
2. Review X-Ray traces to identify slow operations
3. Check DynamoDB throttling metrics
4. Review Lambda cold start metrics
5. Check ElastiCache hit rate

### High Error Rate

1. Query error logs in CloudWatch Logs Insights
2. Review X-Ray traces for failed requests
3. Check Lambda function logs for exceptions
4. Review DynamoDB capacity and throttling
5. Check external service integrations (IoT, Bedrock)

### Missing Metrics

1. Verify metrics publisher is being called
2. Check Lambda function IAM permissions for CloudWatch
3. Review Lambda function logs for metric publishing errors
4. Verify metric namespace and dimensions

### Alarm Fatigue

1. Review alarm thresholds and adjust if too sensitive
2. Implement composite alarms for related metrics
3. Use anomaly detection for dynamic thresholds
4. Implement alarm suppression during maintenance windows

## Best Practices

1. **Always use structured logging**: Use the logger utility for consistent log format
2. **Add correlation IDs**: Include correlation IDs in all logs and traces
3. **Publish custom metrics**: Track business KPIs alongside operational metrics
4. **Use X-Ray subsegments**: Create subsegments for major operations
5. **Set appropriate log retention**: Balance cost and compliance requirements
6. **Monitor costs**: Review CloudWatch costs regularly and optimize log retention
7. **Test alarms**: Regularly test alarm notifications to ensure they work
8. **Document runbooks**: Create runbooks for common alert scenarios
9. **Review dashboards**: Regularly review and update dashboards based on team needs
10. **Implement SLOs**: Define and monitor Service Level Objectives

## Cost Optimization

### Log Retention

Adjust log retention based on compliance requirements:
- Application logs: 30 days (default)
- Error logs: 90 days (compliance)
- Debug logs: 7 days (development only)

### Metric Publishing

- Batch metric publishing when possible
- Use metric filters for derived metrics
- Avoid high-cardinality dimensions

### X-Ray Sampling

- Use sampling rules to reduce trace volume
- Sample 100% of errors, 5% of successes
- Adjust sampling based on traffic patterns

## References

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
