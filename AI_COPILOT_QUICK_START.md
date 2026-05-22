# AI Copilot - Quick Start Guide

## Overview

The AI Copilot spec is complete and ready for implementation! This guide will help you get started.

## Spec Location

```
.kiro/specs/ai-copilot/
├── requirements.md  ✅ Complete
├── design.md        ✅ Complete
└── tasks.md         ✅ Complete
```

## What We're Building

A conversational AI assistant that lets users interact with OmniTrack AI using natural language:

- **"Add a warehouse in Los Angeles"** → Creates new warehouse node
- **"What happens if Shanghai port closes?"** → Runs simulation
- **"Show me all critical nodes"** → Analyzes and displays risks
- **"Change region to Europe"** → Updates configuration

## Key Features

1. **Real-Time Streaming** - Responses appear as they're generated
2. **40+ Actions** - Build, configure, analyze, simulate, query
3. **Context-Aware** - Remembers conversation history
4. **Smart Suggestions** - Helps users discover features
5. **Multi-Step Requests** - Handles complex workflows

## Technology Stack

- **Frontend**: React, WebSocket, Tailwind CSS
- **Backend**: AWS Lambda (Node.js 20), Amazon Bedrock (Claude 3.5 Sonnet)
- **Infrastructure**: API Gateway WebSocket, DynamoDB
- **Testing**: Jest, fast-check (property-based testing)

## Getting Started with Kiro

### Step 1: Review the Spec

Open the spec files in Kiro:
```
.kiro/specs/ai-copilot/requirements.md
.kiro/specs/ai-copilot/design.md
.kiro/specs/ai-copilot/tasks.md
```

### Step 2: Start with Task 1

In Kiro, navigate to `.kiro/specs/ai-copilot/tasks.md` and click "Start task" next to:

**Task 1: Set up AWS infrastructure for copilot**

This will:
- Create API Gateway WebSocket API
- Configure Lambda function
- Set up DynamoDB tables
- Configure Bedrock access

### Step 3: Ask Kiro to Implement

You can ask Kiro:
- "Implement task 1 from the AI copilot spec"
- "Create the AWS CDK code for the copilot infrastructure"
- "Set up the WebSocket API Gateway"

### Step 4: Continue Task by Task

Work through the tasks sequentially:
1. Infrastructure setup
2. Bedrock integration
3. Action registry
4. Core actions (build, configure, analyze, simulate)
5. Intent classifier
6. Conversation management
7. WebSocket handler
8. Frontend UI
9. Monitoring
10. Deployment

## Quick Implementation Path (MVP)

For the fastest path to a working copilot:

### Week 1: Backend Core
- [ ] Task 1: AWS infrastructure
- [ ] Task 2: Bedrock integration
- [ ] Task 3: Action registry
- [ ] Task 9: Intent classifier
- [ ] Task 11: WebSocket handler

### Week 2: Actions & Frontend
- [ ] Task 4: Build actions (add/remove nodes)
- [ ] Task 6: Analysis actions (scan anomalies)
- [ ] Task 13: Frontend UI
- [ ] Task 14: WebSocket client

### Week 3: Polish & Deploy
- [ ] Task 10: Conversation management
- [ ] Task 12: Orchestrator
- [ ] Task 16: Monitoring
- [ ] Task 21: Deploy to AWS

## Example Kiro Commands

### To Start Implementation

```
"Start implementing the AI copilot. Begin with task 1: setting up AWS infrastructure."
```

### To Create Specific Components

```
"Create the Bedrock service class with Claude 3.5 Sonnet integration"
"Implement the action registry with registration and lookup methods"
"Build the copilot chat UI component with message streaming"
```

### To Run Tests

```
"Run the property tests for the intent classifier"
"Test the WebSocket connection and message delivery"
```

## AWS Setup Requirements

Before starting, ensure you have:

1. **AWS Account** with Bedrock access
2. **Bedrock Model Access** - Request access to Claude 3.5 Sonnet in us-east-1
3. **AWS CLI** configured with credentials
4. **CDK** installed: `npm install -g aws-cdk`

### Enable Bedrock Access

1. Go to AWS Console → Bedrock
2. Navigate to "Model access"
3. Request access to "Claude 3.5 Sonnet"
4. Wait for approval (usually instant)

## Cost Estimates

### Development (Testing)
- **Bedrock**: ~$50-100/month (Claude 3.5 Sonnet)
- **Lambda**: ~$10/month
- **DynamoDB**: ~$5/month
- **API Gateway**: ~$5/month
- **Total**: ~$70-120/month

### Production (100 users)
- **Bedrock**: ~$500-800/month
- **Lambda**: ~$50/month
- **DynamoDB**: ~$50/month
- **API Gateway**: ~$30/month
- **Total**: ~$630-930/month

## Testing Strategy

### During Development

1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test component interactions
3. **Manual Testing** - Test in browser with real WebSocket

### Property-Based Tests (Optional)

Run with fast-check to verify universal properties:
```bash
npm test -- copilot.property.test.ts
```

## Monitoring

Once deployed, monitor these metrics:

- **Response Time** - Should be < 2s
- **Error Rate** - Should be < 5%
- **Token Usage** - Track Bedrock costs
- **Active Connections** - WebSocket connections
- **Messages/Minute** - Throughput

## Troubleshooting

### Bedrock Access Denied
- Verify model access in AWS Console
- Check IAM role permissions
- Ensure correct region (us-east-1)

### WebSocket Connection Fails
- Check API Gateway deployment
- Verify Lambda function is running
- Check CloudWatch logs

### Slow Responses
- Check Bedrock API latency
- Verify Lambda memory allocation (1024 MB)
- Check DynamoDB read/write capacity

## Next Steps After MVP

Once the basic copilot is working, enhance with:

1. **Voice Input** - Add speech-to-text
2. **Multi-Language** - Support other languages
3. **Proactive Suggestions** - AI suggests actions
4. **Learning** - Improve from user feedback
5. **Custom Actions** - Let users define actions

## Example Conversations

### Building Supply Chain

**User**: "Add a supplier in Shanghai"
**Copilot**: "I've added a new supplier node in Shanghai, China. The node has been configured with default capacity of 1000 units and is currently at 85% utilization. Would you like to connect it to any existing nodes?"

**User**: "Connect it to the Singapore manufacturer"
**Copilot**: "Done! I've created a connection from the Shanghai supplier to the Singapore Assembly Plant. The edge represents a supply relationship with an estimated lead time of 7-14 days."

### Running Analysis

**User**: "What are the biggest risks in my supply chain?"
**Copilot**: "I've scanned your supply chain and found 2 critical issues:

1. **East Coast Distribution Hub** - Critically low inventory (19% capacity). Recommendation: Expedite shipment immediately.

2. **Shenzhen Electronics Supply** - Below optimal utilization (45% capacity). Recommendation: Review supplier contract and demand forecast.

Would you like me to run a simulation to see how these risks might impact your network?"

### Simulating Scenarios

**User**: "What if the Shanghai port closes for a week?"
**Copilot**: "I've simulated a port closure scenario. Here's the impact:

**Delivery Delay**: 7-10 days
**Cost Increase**: $187,500
**Revenue Risk**: $675,000
**Affected Nodes**: 4 (LA Port Warehouse, East Coast Distribution Hub, UK Retail Network, Singapore Assembly Plant)

**Recommendations**:
1. Activate air freight routes to minimize delays
2. Increase safety stock at regional warehouses by 30%
3. Communicate delays to downstream partners

Would you like me to generate a detailed mitigation strategy?"

## Resources

- **Spec Files**: `.kiro/specs/ai-copilot/`
- **Roadmap**: `ROADMAP_TO_INTELLISUPPLY_LEVEL.md`
- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **WebSocket API Docs**: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html

## Support

If you encounter issues:
1. Check CloudWatch logs for errors
2. Review the design document for architecture details
3. Ask Kiro for help: "Help me debug the copilot WebSocket connection"

---

**Ready to start?** Open `.kiro/specs/ai-copilot/tasks.md` in Kiro and click "Start task" on Task 1!

🚀 Let's build an amazing AI copilot!
