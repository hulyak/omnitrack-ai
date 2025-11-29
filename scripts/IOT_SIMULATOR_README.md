# IoT Simulator for OmniTrack AI Demo

## Overview

The IoT Simulator generates realistic sensor data for supply chain nodes and publishes it to AWS IoT Core. This enables live demonstrations of the OmniTrack AI platform without requiring physical IoT devices.

## Features

✅ **Realistic Sensor Data**
- Temperature sensors (18-25°C normal, >30°C critical)
- Delay sensors (0-2h normal, >24h critical)  
- Inventory sensors (100-1000 units normal, <75 critical)

✅ **Geographic Locations**
- 6 demo nodes across global supply chain
- Shanghai, Shenzhen, Singapore, Los Angeles, New York, London

✅ **Configurable Parameters**
- Data generation frequency
- Anomaly probability
- Enabled sensor types
- Active nodes

✅ **On-Demand Anomaly Injection**
- Inject specific anomalies for testing
- Useful for live demos and presentations

## Quick Start

### Prerequisites

1. AWS credentials configured
2. IoT Core endpoint configured in `.env`
3. Demo nodes seeded in DynamoDB

```bash
# Seed demo data first
npm run seed-demo-data

# Create test users
npm run create-test-users
```

### Basic Usage

```bash
# Start simulator with default settings
npm run start-iot-simulator

# Check status
npm run iot-simulator-status

# Stop simulator
npm run stop-iot-simulator
```

### Advanced Usage

```bash
# Start with custom interval (3 seconds)
cd scripts && npm run iot-simulator start -- --interval 3000

# Start with higher anomaly rate (15%)
cd scripts && npm run iot-simulator start -- --anomaly-rate 0.15

# Start with only temperature sensors
cd scripts && npm run iot-simulator start -- --sensors temperature

# Start for specific nodes
cd scripts && npm run iot-simulator start -- --nodes node-supplier-001,node-warehouse-001

# Inject a temperature anomaly for demo
cd scripts && npm run iot-simulator inject-anomaly node-supplier-001 temperature

# Inject an inventory anomaly
cd scripts && npm run iot-simulator inject-anomaly node-warehouse-001 inventory
```

## Configuration

### Environment Variables

Set these in `infrastructure/.env`:

```bash
AWS_REGION=us-east-1
IOT_ENDPOINT=your-iot-endpoint.iot.us-east-1.amazonaws.com
TABLE_NAME=omnitrack-main
```

### Sensor Types

| Sensor Type | Unit | Normal Range | Anomaly Range | Critical Threshold |
|-------------|------|--------------|---------------|-------------------|
| temperature | °C | 18-25 | -10 to 45 | >30 |
| delay | hours | 0-2 | 3-72 | >24 |
| inventory | units | 100-1000 | 0-50 | <75 |

### Demo Nodes

| Node ID | Name | Location |
|---------|------|----------|
| node-supplier-001 | Shanghai Manufacturing Hub | Shanghai, China |
| node-supplier-002 | Shenzhen Electronics Supplier | Shenzhen, China |
| node-warehouse-001 | Singapore Distribution Center | Singapore |
| node-warehouse-002 | Los Angeles Port Warehouse | Los Angeles, USA |
| node-retailer-001 | New York Distribution Hub | New York, USA |
| node-retailer-002 | London Fulfillment Center | London, UK |

## Demo Scenarios

### Scenario 1: Normal Operations

```bash
# Start with low anomaly rate
cd scripts && npm run iot-simulator start -- --anomaly-rate 0.02
```

Shows stable supply chain with occasional minor issues.

### Scenario 2: High Risk Environment

```bash
# Start with high anomaly rate
cd scripts && npm run iot-simulator start -- --anomaly-rate 0.20
```

Demonstrates platform handling multiple disruptions.

### Scenario 3: Specific Disruption

```bash
# Start simulator
npm run start-iot-simulator

# Wait a few seconds, then inject anomaly
cd scripts && npm run iot-simulator inject-anomaly node-supplier-001 temperature

# Show how system detects and responds
```

Perfect for live demos showing real-time detection.

### Scenario 4: Inventory Crisis

```bash
# Inject low inventory anomaly
cd scripts && npm run iot-simulator inject-anomaly node-warehouse-001 inventory

# System should trigger critical alerts
```

Demonstrates inventory monitoring and alerting.

## Data Flow

```
IoT Simulator
    ↓
AWS IoT Core (Topic: omnitrack/sensors/{nodeId}/data)
    ↓
IoT Rule (SQL: SELECT * FROM 'omnitrack/sensors/+/data')
    ↓
Lambda (iot-processor)
    ↓
DynamoDB (omnitrack-main table)
    ↓
DynamoDB Streams
    ↓
Agent Workflow (Info → Scenario → Strategy → Impact)
    ↓
Frontend Display
```

## Monitoring

### CloudWatch Logs

View simulator activity:
```bash
aws logs tail /aws/lambda/omnitrack-iot-processor --follow
```

### IoT Core Test Client

Monitor messages in AWS Console:
1. Go to AWS IoT Core
2. Click "Test" in left sidebar
3. Subscribe to topic: `omnitrack/sensors/+/data`
4. View incoming messages

### DynamoDB

Check stored data:
```bash
aws dynamodb scan \
  --table-name omnitrack-main \
  --filter-expression "begins_with(PK, :pk)" \
  --expression-attribute-values '{":pk":{"S":"SENSOR#"}}'
```

## Troubleshooting

### Simulator Won't Start

**Error**: "Simulator is already running"

**Solution**:
```bash
npm run stop-iot-simulator
npm run start-iot-simulator
```

### No Data in DynamoDB

**Check**:
1. IoT endpoint configured correctly
2. Lambda function deployed
3. IoT rule created and enabled
4. Lambda has DynamoDB write permissions

**Verify**:
```bash
# Check IoT endpoint
aws iot describe-endpoint --endpoint-type iot:Data-ATS

# Check Lambda function
aws lambda get-function --function-name omnitrack-iot-processor

# Check IoT rule
aws iot get-topic-rule --rule-name omnitrack_sensor_data_rule
```

### Nodes Not Found Warning

**Error**: "Warning: X configured nodes not found in DynamoDB"

**Solution**:
```bash
npm run seed-demo-data
```

### Permission Denied

**Error**: "Failed to publish to IoT Core"

**Solution**: Ensure AWS credentials have IoT publish permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "iot:Publish",
    "iot:Connect"
  ],
  "Resource": "*"
}
```

## Testing

### Manual Testing

1. Start simulator
2. Check CloudWatch logs for Lambda invocations
3. Query DynamoDB for new sensor data
4. Verify frontend displays updates

### Automated Testing

Property-based test validates IoT data persistence:
```bash
cd infrastructure/lambda
npm test -- demo/iot-data-persistence.property.test.ts
```

## Performance

### Recommended Settings

| Environment | Interval | Anomaly Rate | Nodes |
|-------------|----------|--------------|-------|
| Development | 10000ms | 0.05 | 2-3 nodes |
| Demo | 5000ms | 0.10 | All nodes |
| Load Test | 1000ms | 0.05 | All nodes |

### Scaling

The simulator can handle:
- Minimum interval: 1000ms (1 second)
- Maximum nodes: Limited by IoT Core quotas
- Messages per second: ~6 per node per sensor type

For high-volume testing, consider:
- Running multiple simulator instances
- Adjusting IoT Core quotas
- Using provisioned Lambda concurrency

## Architecture

### Components

1. **IoT Simulator** (`iot-simulator.ts`)
   - Core simulation logic
   - Sensor data generation
   - AWS IoT Core publishing

2. **Control Script** (`iot-simulator-control.ts`)
   - CLI interface
   - Process management
   - State tracking

3. **State File** (`.iot-simulator-state.json`)
   - Tracks running simulator
   - Stores configuration
   - Enables stop command

### Design Decisions

- **TypeScript**: Type safety and IDE support
- **Separate Process**: Allows background operation
- **State File**: Enables stop command from different terminal
- **Configurable**: Flexible for different demo scenarios
- **Realistic Data**: Uses actual supply chain geography

## Future Enhancements

Potential improvements:
- [ ] Web UI for simulator control
- [ ] Historical data replay
- [ ] Custom sensor types
- [ ] Scheduled anomaly patterns
- [ ] Multi-region support
- [ ] Batch data generation
- [ ] Performance metrics dashboard

## References

- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
- [OmniTrack AI Architecture](../docs/architecture/ARCHITECTURE.md)
- [Demo Setup Guide](./README_DEMO_SETUP.md)
- [Hackathon Demo Spec](../.kiro/specs/hackathon-aws-demo/design.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review CloudWatch logs
3. Verify AWS configuration
4. Check demo setup guide

---

**Requirements**: 2.1, 2.5  
**Last Updated**: November 28, 2025  
**Version**: 1.0.0
