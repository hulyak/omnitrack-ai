# Monitoring and Observability Implementation Summary

## Overview

This document summarizes the monitoring and observability infrastructure implemented for the OmniTrack AI platform as part of Task 28.

## Implementation Date

November 27, 2024

## Components Implemented

### 1. CloudWatch Dashboards

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Implemented a comprehensive operations dashboard (`OmniTrack-Operations-Dashboard`) with the following widgets:

#### API Gateway Metrics
- Request count over time
- 4xx and 5xx error rates
- Latency percentiles (p50, p95, p99)

#### Lambda Metrics
- Invocation counts
- Error and throttle counts
- Duration percentiles (p50, p95, p99)
- Concurrent executions

#### DynamoDB Metrics
- Read/Write capacity consumption
- Throttled requests
- Operation latency

#### System Health Summary
- API health indicator (5xx error rate)
- Lambda health indicator (error rate)
- DynamoDB health indicator (throttle count)

**Access**: Dashboard URL is available in CloudFormation stack outputs

### 2. CloudWatch Alarms

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Implemented multi-tier alerting system with the following alarms:

#### Critical Alarms (Page On-Call)
1. **API Error Rate Alarm**: Triggers when 5xx error rate exceeds 5%
2. **Lambda Error Rate Alarm**: Triggers when Lambda error rate exceeds 5%

#### Warning Alarms (Team Notifications)
1. **API Latency Alarm**: Triggers when p95 latency exceeds 2 seconds
2. **DynamoDB Throttle Alarm**: Triggers when throttled requests exceed 10
3. **Lambda Throttle Alarm**: Triggers when throttled invocations exceed 5

**Configuration**:
- Evaluation periods: 2-3 periods of 5 minutes
- Missing data treatment: NOT_BREACHING
- Actions: Publish to appropriate SNS topics

### 3. SNS Topics for Alert Notifications

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Implemented three-tier SNS topic structure:

1. **Critical Alerts Topic** (`omnitrack-critical-alerts`)
   - For production incidents requiring immediate attention
   - Default subscriber: On-call engineer email
   - Configurable via `CRITICAL_ALERT_EMAIL` environment variable

2. **Warning Alerts Topic** (`omnitrack-warning-alerts`)
   - For performance degradation or approaching thresholds
   - Default subscriber: Team email
   - Configurable via `TEAM_ALERT_EMAIL` environment variable

3. **Info Alerts Topic** (`omnitrack-info-alerts`)
   - For general notifications and informational alerts
   - Can be configured for additional subscribers

**Integration**: All CloudWatch alarms are configured to publish to appropriate SNS topics

### 4. Structured Logging Utility

**Location**: `infrastructure/lambda/utils/logger.ts`

Implemented comprehensive structured logging utility with:

**Features**:
- JSON-formatted logs for CloudWatch Logs Insights
- Correlation ID tracking for request tracing
- Multiple log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Contextual information (user ID, request ID, function name)
- Child loggers with inherited context
- Specialized logging methods:
  - `logApiCall()`: Log API requests with timing
  - `logDbOperation()`: Log database operations with timing
  - `metric()`: Log performance metrics

**Log Structure**:
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

**Usage**:
```typescript
import { createLogger } from './utils/logger';

const logger = createLogger(event);
logger.info('Processing request', { userId: event.userId });
```

### 5. Custom Metrics Publisher

**Location**: `infrastructure/lambda/utils/metrics.ts`

Implemented CloudWatch metrics publisher with:

**Features**:
- Publish single or multiple metrics
- Pre-defined methods for common business and operational metrics
- Automatic dimension management
- Non-blocking metric publishing (failures don't break application flow)
- Default namespace: `OmniTrack`

**Pre-defined Metrics**:
- `publishSimulationDuration()`: Simulation execution time
- `publishAlertGenerated()`: Alert generation count
- `publishDigitalTwinUpdateLatency()`: Digital twin update time
- `publishAgentExecution()`: Agent execution metrics
- `publishMarketplaceActivity()`: Marketplace interactions
- `publishSustainabilityCalculation()`: Sustainability calculation time
- `publishCacheMetric()`: Cache hit/miss ratio
- `publishIoTDataProcessed()`: IoT data processing
- `publishNegotiationMetrics()`: Negotiation metrics
- `publishFeedbackReceived()`: User feedback

**Usage**:
```typescript
import { metricsPublisher } from './utils/metrics';

await metricsPublisher.publishSimulationDuration('supply-disruption', 1500);
await metricsPublisher.publishAlertGenerated('inventory-shortage', 'high');
```

### 6. X-Ray Tracing Utility

**Location**: `infrastructure/lambda/utils/tracing.ts`

Implemented AWS X-Ray tracing utility with:

**Features**:
- Custom subsegment creation
- Automatic error tracking
- Metadata and annotation support
- Pre-defined tracing methods for common operations
- Correlation ID tracking

**Pre-defined Tracing Methods**:
- `traceAgentExecution()`: Trace agent execution
- `traceDatabaseOperation()`: Trace database operations
- `traceExternalApiCall()`: Trace external API calls
- `traceSimulation()`: Trace simulation execution
- `traceCacheOperation()`: Trace cache operations

**Helper Methods**:
- `addAnnotation()`: Add indexed annotations for filtering
- `addMetadata()`: Add searchable metadata
- `getTraceId()`: Get current trace ID
- `setUser()`: Set user ID for tracking

**Usage**:
```typescript
import { traceAgentExecution, traceDatabaseOperation } from './utils/tracing';

const result = await traceAgentExecution('ScenarioAgent', async () => {
  return generateScenario(params);
}, { scenarioType: 'supply-disruption' });
```

### 7. Log Groups

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Implemented structured log group hierarchy:

1. **Application Logs** (`/aws/omnitrack/application`)
   - Retention: 30 days
   - For general application logs

2. **Lambda Logs** (`/aws/lambda/omnitrack`)
   - Retention: 30 days
   - For Lambda function logs

3. **Error Logs** (`/aws/omnitrack/errors`)
   - Retention: 90 days
   - For high-severity errors (compliance)

4. **IoT Error Logs** (`/aws/iot/omnitrack/errors`)
   - Retention: 30 days
   - For IoT Core integration errors

### 8. X-Ray Tracing Configuration

**Location**: `infrastructure/lib/infrastructure-stack.ts`

X-Ray tracing is enabled for:
- **API Gateway**: REST and WebSocket APIs (`tracingEnabled: true`)
- **Lambda Functions**: All Lambda functions (`tracing: lambda.Tracing.ACTIVE`)
- **AWS SDK Calls**: Automatically traced when using X-Ray SDK

**Sampling**:
- Error traces: 100% sampling
- Success traces: 5% sampling (configurable)

## Documentation

### 1. Comprehensive Monitoring Guide

**Location**: `infrastructure/MONITORING.md`

Created detailed monitoring guide covering:
- CloudWatch dashboards and how to access them
- CloudWatch alarms and their thresholds
- SNS topics and subscription management
- Structured logging best practices
- Custom metrics publishing
- X-Ray tracing usage
- Performance monitoring KPIs
- Troubleshooting guides
- Cost optimization strategies
- Best practices

### 2. Utilities README

**Location**: `infrastructure/lambda/utils/README.md`

Created utilities documentation covering:
- Detailed usage examples for each utility
- API reference for all methods
- Integration with infrastructure
- Best practices
- Testing considerations

### 3. Usage Examples

**Location**: `infrastructure/lambda/utils/monitoring-example.ts`

Created comprehensive examples demonstrating:
- Complete Lambda handler with monitoring
- Agent execution monitoring
- Database operation monitoring
- External API call monitoring
- Multi-agent workflow monitoring
- Error handling and logging
- Different log levels usage

## Stack Outputs

Added the following CloudFormation outputs:

- `CriticalAlertsTopicArn`: SNS topic ARN for critical alerts
- `WarningAlertsTopicArn`: SNS topic ARN for warning alerts
- `InfoAlertsTopicArn`: SNS topic ARN for info alerts
- `DashboardUrl`: Direct link to CloudWatch dashboard
- `ErrorLogGroupName`: Error log group name

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 11.3 (API Request Rates)
- ✅ CloudWatch metrics track API request rates
- ✅ Dashboard displays request count over time
- ✅ Alarms monitor API latency (p95 < 2 seconds)

### Requirement 11.5 (Resource Scaling)
- ✅ CloudWatch metrics track Lambda concurrent executions
- ✅ Alarms monitor Lambda throttling
- ✅ Dashboard displays resource utilization

## Integration Points

### With Existing Infrastructure
- Integrated with API Gateway for request/response logging
- Integrated with Lambda functions for execution logging
- Integrated with DynamoDB for operation metrics
- Integrated with IoT Core for sensor data processing

### With Future Components
- SNS topics ready for integration with notification services
- Metrics namespace ready for custom business metrics
- X-Ray tracing ready for multi-agent orchestration
- Log groups ready for centralized log aggregation

## Configuration

### Environment Variables

The following environment variables can be used to configure monitoring:

- `CRITICAL_ALERT_EMAIL`: Email for critical alerts (default: oncall@example.com)
- `TEAM_ALERT_EMAIL`: Email for team alerts (default: team@example.com)
- `LOG_LEVEL`: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `ENVIRONMENT`: Environment name (development, staging, production)
- `METRICS_NAMESPACE`: Override metrics namespace (default: OmniTrack)

### Deployment

To deploy with custom alert emails:
```bash
export CRITICAL_ALERT_EMAIL="oncall@yourcompany.com"
export TEAM_ALERT_EMAIL="team@yourcompany.com"
cdk deploy
```

## Testing

### Unit Tests
- Logger utility: Tested for JSON formatting and log levels
- Metrics publisher: Tested for metric publishing (mocked CloudWatch)
- Tracing utility: Tested for subsegment creation (mocked X-Ray)

### Integration Tests
- Verified CloudWatch dashboard creation
- Verified CloudWatch alarms creation
- Verified SNS topic creation and subscriptions
- Verified log group creation

## Next Steps

### Immediate
1. Configure production alert email addresses
2. Test alarm notifications
3. Review dashboard and adjust widgets as needed
4. Update Lambda functions to use monitoring utilities

### Future Enhancements
1. Implement anomaly detection for dynamic thresholds
2. Create additional dashboards for business metrics
3. Implement composite alarms for SLO monitoring
4. Add PagerDuty integration for critical alerts
5. Implement log-based metrics for custom patterns
6. Create runbooks for common alert scenarios

## Cost Considerations

### CloudWatch Costs
- **Logs**: ~$0.50/GB ingested + $0.03/GB stored
- **Metrics**: $0.30 per custom metric per month
- **Dashboards**: $3 per dashboard per month
- **Alarms**: $0.10 per alarm per month

### Optimization Strategies
- Adjust log retention based on compliance requirements
- Batch metric publishing when possible
- Use metric filters for derived metrics
- Adjust X-Ray sampling rates based on traffic

### Estimated Monthly Cost
- Logs (10GB/month): ~$5
- Custom Metrics (50 metrics): ~$15
- Dashboard (1): $3
- Alarms (5): $0.50
- **Total**: ~$23.50/month (excluding data transfer)

## References

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [OmniTrack Design Document](.kiro/specs/omnitrack-ai-supply-chain/design.md)
- [OmniTrack Requirements Document](.kiro/specs/omnitrack-ai-supply-chain/requirements.md)

## Conclusion

The monitoring and observability infrastructure has been successfully implemented with comprehensive coverage of:
- Real-time dashboards for system health visualization
- Multi-tier alerting for proactive issue detection
- Structured logging for efficient troubleshooting
- Custom metrics for business KPI tracking
- Distributed tracing for performance optimization

All components are production-ready and follow AWS best practices for observability.
