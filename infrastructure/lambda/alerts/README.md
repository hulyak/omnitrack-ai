# Alert Generation and Notification System

This module implements the alert generation and notification system for OmniTrack AI, providing real-time monitoring and multi-channel alert delivery.

## Components

### Alert Generator (`alert-generator.ts`)

Lambda function triggered by DynamoDB streams when digital twin nodes are updated. Detects anomalies and generates alerts based on configurable thresholds.

**Features:**
- Threshold detection for utilization rates and inventory levels
- Node status monitoring (DISRUPTED, OFFLINE)
- Alert prioritization based on severity and business criticality
- Structured logging with correlation IDs
- X-Ray tracing integration

**Thresholds:**
- Utilization Rate High: 85%
- Utilization Rate Critical: 95%
- Inventory Low: 20%
- Inventory Critical: 10%

**Requirements Validated:**
- 1.1: Alert generation within 30 seconds
- 1.3: Alert prioritization by severity and criticality

### Notification Service (`notification-service.ts`)

Lambda function triggered by SNS when alerts are generated. Delivers notifications through multiple channels with channel-specific formatting.

**Supported Channels:**
- Slack (with rich formatting and attachments)
- Microsoft Teams (with adaptive cards)
- Email (via SES)
- Mobile Push (via SNS Mobile Push)
- SMS (concise format)

**Features:**
- Multi-channel fan-out delivery
- Channel-specific message formatting
- User preference-based routing
- Acknowledgment notifications to team members
- Failure handling (failed channel doesn't block others)

**Requirements Validated:**
- 1.2: Multi-channel notification delivery
- 1.4: Alert acknowledgment notifications
- 3.4: Sustainability threshold alerts

## Alert Prioritization Algorithm

Alerts are prioritized using a weighted scoring system:

```typescript
priority = (severity_score * 0.7) + (business_criticality * 0.3)
```

**Severity Scores:**
- LOW: 2
- MEDIUM: 5
- HIGH: 8
- CRITICAL: 10

**Sorting Order:**
1. Priority (highest first)
2. Severity (CRITICAL > HIGH > MEDIUM > LOW)
3. Creation time (newest first)

## Property-Based Tests

### Alert Generator Tests (`alert-generator.property.test.ts`)

**Property 1: Alert generation timing**
- Validates that alert generation completes within 30 seconds for any valid anomaly data
- Tests with 100 random anomaly scenarios

**Property 3: Alert prioritization correctness**
- Validates that alerts are correctly ordered by priority and severity
- Tests with arrays of 2-20 random alerts
- Ensures CRITICAL alerts always appear before lower severity alerts with same priority

**Property 4: Alert state consistency**
- Validates that acknowledgment updates alert status correctly
- Ensures all metadata is preserved during acknowledgment
- Tests with 100 random alert/user combinations

### Notification Service Tests (`notification-service.property.test.ts`)

**Property 2: Multi-channel notification delivery**
- Validates that all configured channels receive notifications
- Tests notification completeness (all required fields present)
- Validates user preference-based channel selection
- Tests failure handling (one channel failure doesn't block others)
- Tests with 100 random alert/channel combinations

**Additional Properties:**
- Slack message formatting
- Email message formatting
- SMS message conciseness (≤160 characters)
- Mobile push notification data payload
- Acknowledgment notification delivery

## Usage

### Alert Generator

Deployed as a Lambda function with DynamoDB stream trigger:

```typescript
// Triggered automatically by DynamoDB streams
// No direct invocation needed
```

### Notification Service

Deployed as a Lambda function with SNS trigger:

```typescript
// Publish to SNS topic to trigger notifications
const payload = {
  alertId: 'alert-123',
  channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
  recipients: ['user-id-1', 'user-id-2']
};

await sns.publish({
  TopicArn: process.env.ALERT_TOPIC_ARN,
  Message: JSON.stringify(payload)
}).promise();
```

### Alert Prioritization

```typescript
import { prioritizeAlerts } from './alert-generator';

const alerts: Alert[] = [...]; // Array of alerts
const prioritized = prioritizeAlerts(alerts);
// Returns alerts sorted by priority, severity, and time
```

## Environment Variables

### Alert Generator
- `TABLE_NAME`: DynamoDB table name
- `AWS_XRAY_TRACING_NAME`: X-Ray service name

### Notification Service
- `TABLE_NAME`: DynamoDB table name
- `SLACK_TOPIC_ARN`: SNS topic for Slack integration
- `TEAMS_TOPIC_ARN`: SNS topic for Teams integration
- `EMAIL_TOPIC_ARN`: SNS topic for email delivery
- `MOBILE_TOPIC_ARN`: SNS topic for mobile push
- `SMS_TOPIC_ARN`: SNS topic for SMS delivery

## Testing

Run property-based tests:

```bash
npm test -- alert-generator.property.test.ts
npm test -- notification-service.property.test.ts
```

All tests run 100 iterations with randomized inputs to ensure correctness across a wide range of scenarios.

## Architecture

```
Digital Twin Update (DynamoDB Stream)
    ↓
Alert Generator Lambda
    ↓
Create Alert (DynamoDB)
    ↓
Publish to SNS Topic
    ↓
Notification Service Lambda
    ↓
Fan-out to Channels (Slack, Teams, Email, Mobile, SMS)
```

## Future Enhancements

- Machine learning-based anomaly detection
- Adaptive threshold adjustment based on historical patterns
- Alert correlation and deduplication
- Custom notification templates
- Webhook support for third-party integrations
