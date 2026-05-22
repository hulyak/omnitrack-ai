# Hackathon AWS Demo Setup - Quick Start

## Overview

This spec guides you through preparing and demonstrating OmniTrack AI's AWS integrations for the Kiroween hackathon. Your infrastructure is already deployed - this focuses on demo preparation, testing, and presentation materials.

## What You Already Have ✅

Your AWS infrastructure is production-ready with:
- **Lambda Functions**: 15+ functions for auth, agents, and APIs
- **DynamoDB**: Single-table design with GSIs
- **Cognito**: User pool with MFA and RBAC
- **API Gateway**: REST API with WAF protection
- **Step Functions**: Multi-agent orchestration
- **ElastiCache Redis**: Caching layer
- **IoT Core**: Sensor data ingestion
- **CloudWatch**: Logs, metrics, and dashboards
- **X-Ray**: Distributed tracing
- **KMS**: Encryption at rest

## What You Need to Do 🎯

### 1. Demo Preparation (Tasks 1-4)
- Create architecture diagram
- Write verification scripts
- Seed demo data
- Configure IoT simulator

### 2. Testing (Tasks 2-9)
- Property tests for performance
- Property tests for security
- Property tests for reliability
- Integration tests for workflows

### 3. Presentation Materials (Tasks 6, 11-13)
- 5-minute demo script
- Video recording
- Cost analysis
- Judge Q&A prep

## Quick Commands

### Verify Infrastructure
```bash
# Check all AWS resources
./scripts/verify-demo-setup.sh

# Test API endpoints
curl https://your-api-id.execute-api.region.amazonaws.com/prod/health
```

### Seed Demo Data
```bash
# Create sample data
npm run seed-demo-data

# Create test users
npm run create-test-users
```

### Run Tests
```bash
# Run all property tests
npm test -- --testPathPattern=property.test

# Run integration tests
npm test -- --testPathPattern=integration.test
```

### Start IoT Simulator
```bash
# Generate sensor data
npm run start-iot-simulator
```

## Demo Flow (5 Minutes)

**Minute 1**: Problem & Solution
- Show landing page
- Explain supply chain disruption problem
- Introduce multi-agent AI solution

**Minute 2**: Live Agent Workflow
- Trigger scenario from frontend
- Show API Gateway logs
- Display Lambda execution
- Highlight Step Functions parallel execution

**Minute 3**: AWS Services
- Show DynamoDB real-time data
- Display Bedrock API calls
- Demonstrate Redis caching
- Show IoT Core ingestion

**Minute 4**: Security & Monitoring
- Display Cognito authentication
- Show WAF protection rules
- Demonstrate CloudWatch dashboard
- Display X-Ray service map

**Minute 5**: Results & Benefits
- Show agent recommendations
- Highlight sustainability metrics
- Emphasize serverless benefits
- Call to action

## Key Metrics to Highlight

- **Response Time**: < 5 seconds for agent workflows
- **Query Performance**: < 100ms for DynamoDB queries
- **AI Response**: < 3 seconds for Bedrock API calls
- **Cost**: ~$235/month for production workload
- **Scalability**: Auto-scales to millions of requests

## AWS Console Screens to Show

1. Lambda Functions (code + metrics)
2. CloudWatch Logs (structured logs with correlation IDs)
3. CloudWatch Dashboard (real-time metrics)
4. X-Ray Service Map (distributed traces)
5. DynamoDB Tables (data + performance)
6. API Gateway (endpoints + authorizers)
7. Cognito User Pool (users + security)
8. Step Functions (visual workflow + execution)
9. IoT Core (rules + topics)
10. WAF (protection rules)

## Code Snippets to Highlight

### Lambda with Bedrock
```typescript
const bedrockResponse = await bedrockClient.invokeModel({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  body: JSON.stringify({
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### DynamoDB Single-Table
```typescript
await dynamodb.put({
  TableName: 'omnitrack-main',
  Item: {
    PK: 'USER#123',
    SK: 'PROFILE',
    ...userData
  }
});
```

### Step Functions Parallel
```json
{
  "Type": "Parallel",
  "Branches": [
    { "StartAt": "InfoAgent" },
    { "StartAt": "ScenarioAgent" },
    { "StartAt": "StrategyAgent" },
    { "StartAt": "ImpactAgent" }
  ]
}
```

## Judge Q&A Prep

**Scalability**: Lambda auto-scales, DynamoDB on-demand, API Gateway handles millions/sec

**Cold Starts**: Provisioned concurrency for critical paths, Redis caching reduces invocations

**Data Consistency**: DynamoDB transactions, optimistic locking, DynamoDB Streams

**Disaster Recovery**: Point-in-time recovery, S3 versioning, multi-AZ, IaC with CDK

**Monitoring**: CloudWatch Logs with correlation IDs, X-Ray tracing, custom dashboards, proactive alarms

**Security**: Cognito auth, JWT tokens, WAF protection, KMS encryption, VPC isolation

**Testing**: Unit tests (Jest), property tests (fast-check), integration tests, load testing

## Cost Comparison

**Serverless (OmniTrack)**:
- Lambda: $50
- DynamoDB: $25
- API Gateway: $35
- Bedrock: $100
- Redis: $15
- CloudWatch: $10
- **Total: $235/month**

**Traditional**:
- EC2 (3x t3.large): $150
- RDS (db.t3.medium): $100
- Load Balancer: $20
- **Total: $270/month**

**Savings**: 15% cost reduction + zero ops overhead + infinite scalability

## Next Steps

1. **Review Requirements**: Read `requirements.md` to understand all acceptance criteria
2. **Study Design**: Read `design.md` for architecture and implementation details
3. **Execute Tasks**: Open `tasks.md` and click "Start task" on task 1
4. **Run Demo**: Practice the 5-minute walkthrough multiple times
5. **Record Video**: Capture screen recording with narration
6. **Submit**: Upload video and documentation to hackathon platform

## Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Single-Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Step Functions Workflows](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

## Support

If you encounter issues:
1. Check CloudWatch Logs for errors
2. Verify IAM permissions
3. Test individual services in AWS Console
4. Review X-Ray traces for bottlenecks
5. Ask for help in the hackathon Discord

---

**Good luck with your hackathon submission! 🚀**
