# Hackathon Demo Verification Tests

This directory contains property-based tests for verifying the OmniTrack AI system is ready for the hackathon demo presentation.

## Overview

These tests validate key performance and functionality requirements specified in the hackathon demo design document. They use property-based testing with fast-check to ensure the system meets requirements across a wide range of inputs.

## Test Files

### 1. agent-workflow-response-time.property.test.ts

**Property 1: Agent workflow response time**
- **Validates**: Requirements 1.3
- **Purpose**: Ensures the multi-agent workflow (Info, Scenario, Strategy, Impact) completes within 5 seconds

**Test Coverage**:
- Complete agent workflow execution time
- Parallel agent execution efficiency
- Response time consistency across different request types

**Run**: `npm test -- demo/agent-workflow-response-time.property.test.ts`

### 2. iot-data-persistence.property.test.ts

**Property 2: IoT data persistence**
- **Validates**: Requirements 2.1
- **Purpose**: Ensures IoT sensor data is correctly stored in DynamoDB with all required fields

**Test Coverage**:
- All sensor data fields are persisted
- Different sensor types (temperature, delay, inventory) are handled correctly
- Concurrent sensor writes maintain data integrity
- Invalid data is rejected
- Timestamp ordering is preserved for sequential readings

**Run**: `npm test -- demo/iot-data-persistence.property.test.ts`

### 3. dynamodb-query-performance.property.test.ts

**Property 3: DynamoDB query performance**
- **Validates**: Requirements 2.2
- **Purpose**: Ensures DynamoDB queries complete within 100ms for agent operations

**Test Coverage**:
- Node retrieval by ID
- Queries by node type
- Queries by node status
- Batch get operations
- Performance with varying data sizes
- Concurrent query handling
- Query result consistency

**Run**: `npm test -- demo/dynamodb-query-performance.property.test.ts`

## Running Tests

### Run All Demo Tests
```bash
cd infrastructure/lambda
npm test -- demo/
```

### Run Individual Test
```bash
cd infrastructure/lambda
npm test -- demo/agent-workflow-response-time.property.test.ts
npm test -- demo/iot-data-persistence.property.test.ts
npm test -- demo/dynamodb-query-performance.property.test.ts
```

### Run with Coverage
```bash
cd infrastructure/lambda
npm test -- demo/ --coverage
```

## Test Configuration

All property-based tests are configured with:
- **Iterations**: 100 runs per property (as specified in design document)
- **Timeout**: 30 seconds per test suite
- **Framework**: Jest + fast-check

## Deployment Verification Script

In addition to the property tests, a bash script is provided to verify the AWS infrastructure is properly deployed:

**Location**: `scripts/verify-demo-setup.sh`

**Usage**:
```bash
./scripts/verify-demo-setup.sh
```

**Checks**:
1. Lambda functions deployment
2. DynamoDB tables and sample data
3. Cognito User Pool and test users
4. API Gateway endpoints
5. Amazon Bedrock access
6. IoT Core configuration
7. Step Functions state machines
8. ElastiCache Redis
9. CloudWatch Logs
10. CloudWatch Dashboards
11. X-Ray tracing

## Integration with Demo Workflow

These tests should be run:
1. **Before the demo** - To verify all systems are operational
2. **During development** - To ensure changes don't break performance requirements
3. **After deployment** - To validate the production environment

## Expected Results

All tests should pass with:
- ✅ Agent workflows completing in < 5 seconds
- ✅ IoT data persisted with all required fields
- ✅ DynamoDB queries completing in < 100ms
- ✅ All AWS resources deployed and accessible

## Troubleshooting

### Tests Timing Out
- Check that mock implementations are efficient
- Verify no actual AWS calls are being made (mocks should be active)
- Reduce iteration count temporarily for debugging

### Property Test Failures
- Review the counterexample provided by fast-check
- Check if the failure reveals a real bug or test issue
- Verify generators are producing valid input data

### Deployment Script Failures
- Ensure AWS credentials are configured
- Verify CDK outputs file exists: `infrastructure/cdk-outputs.json`
- Check AWS region is correct
- Confirm all resources are deployed

## Related Documentation

- [Hackathon Demo Design](.kiro/specs/hackathon-aws-demo/design.md)
- [Hackathon Demo Requirements](.kiro/specs/hackathon-aws-demo/requirements.md)
- [Hackathon Demo Tasks](.kiro/specs/hackathon-aws-demo/tasks.md)
- [OmniTrack Conventions](.kiro/steering/omnitrack-conventions.md)

## Notes

- These tests use in-memory storage for fast execution
- Actual AWS integration tests are in `infrastructure/test/integration/`
- Property-based tests focus on universal properties, not specific examples
- All tests follow the project's property-based testing conventions
