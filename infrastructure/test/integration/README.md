# AI Copilot Integration Tests

This directory contains integration tests for the AI Copilot system.

## Test Files

### 1. copilot-integration-mock.test.ts
**Purpose**: Integration tests with mocked dependencies  
**Use Case**: CI/CD pipelines, local development without AWS  
**Requirements**: None (all dependencies mocked)

**Run:**
```bash
npm test -- test/integration/copilot-integration-mock.test.ts
```

**Coverage:**
- Component integration
- Action registry functionality
- Error handling
- Basic orchestration logic
- Parameter validation

### 2. copilot-integration.test.ts
**Purpose**: Full integration tests with real AWS services  
**Use Case**: Staging/production validation  
**Requirements**: 
- AWS credentials configured
- DynamoDB tables deployed
- Bedrock access enabled
- WebSocket API deployed

**Run:**
```bash
# Ensure AWS credentials are set
export AWS_PROFILE=your-profile
# Or
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...

npm test -- test/integration/copilot-integration.test.ts
```

**Coverage:**
- End-to-end message flow
- All 40+ actions
- WebSocket connectivity
- Bedrock integration
- DynamoDB persistence
- Real-time streaming
- Performance under load

### 3. COPILOT_INTEGRATION_TEST_SUMMARY.md
**Purpose**: Comprehensive test documentation  
**Contents**:
- Test results and metrics
- Requirements validation
- Performance benchmarks
- Issues and resolutions
- Recommendations

## Quick Start

### Run All Integration Tests (Mocked)
```bash
cd infrastructure
npm test -- test/integration/copilot-integration-mock.test.ts
```

### Run Specific Test Suite
```bash
npm test -- test/integration/copilot-integration-mock.test.ts -t "End-to-End Message Flow"
```

### Run with Coverage
```bash
npm test -- test/integration/copilot-integration-mock.test.ts --coverage
```

### Run in Watch Mode
```bash
npm test -- test/integration/copilot-integration-mock.test.ts --watch
```

## Test Structure

### Mocked Tests
```
AI Copilot Integration Tests (Mocked)
├── Component Integration
│   ├── should integrate all components successfully
│   └── should have actions registered
├── End-to-End Message Flow
│   ├── should process a simple help message
│   ├── should process an add supplier message
│   └── should maintain conversation context
├── Action Execution
│   ├── should execute build actions
│   ├── should execute configuration actions
│   ├── should execute analysis actions
│   ├── should execute simulation actions
│   └── should execute query actions
├── Error Handling
│   ├── should handle empty message
│   ├── should handle missing userId
│   ├── should handle message too long
│   └── should handle unknown action gracefully
├── Multi-Step Requests
│   ├── should handle numbered list multi-step request
│   ├── should handle "and then" pattern
│   └── should stop on first failure
├── Performance
│   ├── should respond quickly for simple queries
│   └── should handle concurrent requests
├── Context Resolution
│   └── should resolve context references
└── Conversation Management
    └── should maintain conversation history
```

## Environment Variables

### Required for Full Integration Tests
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=your-profile

# DynamoDB Tables
CONVERSATIONS_TABLE=omnitrack-conversations
CONNECTIONS_TABLE=omnitrack-connections

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# WebSocket API
WEBSOCKET_API_ENDPOINT=wss://your-api-id.execute-api.us-east-1.amazonaws.com/production
```

### Optional for Mocked Tests
```bash
# None required - all dependencies are mocked
```

## Troubleshooting

### Tests Fail with "Connection not found"
**Cause**: DynamoDB table not accessible  
**Solution**: 
1. Check AWS credentials
2. Verify table exists
3. Check IAM permissions

### Tests Timeout
**Cause**: Bedrock API slow or unavailable  
**Solution**:
1. Increase timeout: `--testTimeout=60000`
2. Check Bedrock service status
3. Verify region configuration

### "Action not found" Errors
**Cause**: Actions not registered  
**Solution**:
1. Ensure `registerAllActions()` is called
2. Check action imports
3. Verify action registry initialization

### Mock Tests Fail
**Cause**: Mock implementation incomplete  
**Solution**:
1. Check mock service implementations
2. Verify test expectations
3. Update mocks as needed

## Performance Benchmarks

### Expected Performance (Mocked Tests)
- Component initialization: <100ms
- Simple query: <500ms
- Action execution: <200ms
- Multi-step request: <1s
- Concurrent requests (5): <2s

### Expected Performance (Full Tests)
- Simple query: <2s
- Intent classification: <500ms
- Action execution: <1s
- Response generation: <1s
- Total end-to-end: <2s
- Concurrent requests (5): <10s

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **End-to-End Tests**: All user workflows
- **Performance Tests**: All performance targets
- **Error Tests**: All error scenarios

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Integration Tests
  run: |
    cd infrastructure
    npm test -- test/integration/copilot-integration-mock.test.ts
```

### With AWS Services
```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Run Full Integration Tests
  run: |
    cd infrastructure
    npm test -- test/integration/copilot-integration.test.ts
```

## Best Practices

1. **Run mocked tests locally** before committing
2. **Run full tests in staging** before production deployment
3. **Monitor test execution time** and optimize slow tests
4. **Keep mocks up to date** with real service behavior
5. **Document test failures** and resolutions
6. **Review test coverage** regularly
7. **Update tests** when adding new features

## Resources

- [Jest Documentation](https://jestjs.io/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

## Support

For issues or questions:
1. Check test output for error messages
2. Review COPILOT_INTEGRATION_TEST_SUMMARY.md
3. Check CloudWatch logs (for full tests)
4. Review infrastructure deployment status

---

**Last Updated**: November 28, 2024  
**Test Status**: ✅ PASSING  
**Coverage**: Comprehensive
