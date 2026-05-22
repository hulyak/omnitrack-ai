# Amazon Bedrock Integration Guide

## Overview

OmniTrack AI uses Amazon Bedrock to power its multi-agent AI system. This document provides comprehensive information about Bedrock integration, model configuration, and demo preparation.

## Model Configuration

### Available Models

| Model | Model ID | Use Case | Cost (per 1M tokens) |
|-------|----------|----------|---------------------|
| **Claude 3 Sonnet** | `anthropic.claude-3-sonnet-20240229-v1:0` | Balanced performance for complex reasoning | Input: $3.00, Output: $15.00 |
| **Claude 3 Haiku** | `anthropic.claude-3-haiku-20240307-v1:0` | Fast, cost-effective for simple tasks | Input: $0.25, Output: $1.25 |
| **Claude 3.5 Sonnet** | `anthropic.claude-3-5-sonnet-20240620-v1:0` | Latest model with enhanced capabilities | Input: $3.00, Output: $15.00 |

### Agent-Specific Parameters

#### Info Agent (Anomaly Detection)
```typescript
{
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  maxTokens: 1024,
  temperature: 0.3,  // Low for factual analysis
  topP: 0.9
}
```
**Purpose**: Detect anomalies and patterns in supply chain sensor data

#### Scenario Agent (Disruption Generation)
```typescript
{
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  maxTokens: 2000,
  temperature: 0.7,  // Higher for creative scenarios
  topP: 0.95
}
```
**Purpose**: Generate diverse disruption scenarios with creative variations

#### Strategy Agent (Mitigation Recommendations)
```typescript
{
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  maxTokens: 1500,
  temperature: 0.5,  // Balanced for strategic thinking
  topP: 0.9
}
```
**Purpose**: Recommend mitigation strategies with balanced reasoning

#### Impact Agent (Numerical Analysis)
```typescript
{
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  maxTokens: 1000,
  temperature: 0.2,  // Very low for deterministic calculations
  topP: 0.85
}
```
**Purpose**: Fast numerical analysis and impact calculations

## IAM Permissions Required

### Lambda Execution Role

The Lambda execution role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
      ]
    }
  ]
}
```

### Model Access

Before using Bedrock models, you must request access in the AWS Console:

1. Navigate to **AWS Console > Amazon Bedrock > Model access**
2. Click **Manage model access**
3. Select the following models:
   - Anthropic Claude 3 Sonnet
   - Anthropic Claude 3 Haiku
   - Anthropic Claude 3.5 Sonnet
4. Click **Request model access**
5. Wait for approval (usually instant for Claude models)

## Verification Script

Run the verification script to check Bedrock access:

```bash
cd infrastructure/lambda
npx ts-node demo/verify-bedrock-access.ts
```

The script will:
- ✅ Test model availability
- ✅ Verify IAM permissions
- ✅ Test API invocation
- ✅ Measure response times
- ✅ Document model parameters

## Demo Prompts

### Info Agent: Anomaly Detection

**Prompt Template**:
```
You are an expert supply chain analyst. Analyze the following sensor data for anomalies:

Sensor Data:
- Node: {nodeId}
- Type: {sensorType}
- Current Value: {value}
- Threshold: {threshold}
- Historical Average: {historicalAvg}
- Standard Deviation: {stdDev}

Identify any anomalies and provide:
1. Anomaly severity (low/medium/high/critical)
2. Potential root causes
3. Recommended immediate actions
4. Risk of cascading failures

Format your response as JSON.
```

**Example Input**:
```json
{
  "nodeId": "supplier-001",
  "sensorType": "temperature",
  "value": 45.2,
  "threshold": 25.0,
  "historicalAvg": 22.5,
  "stdDev": 2.1
}
```

**Expected Output**:
```json
{
  "anomalyDetected": true,
  "severity": "critical",
  "rootCauses": [
    "Equipment malfunction",
    "Cooling system failure",
    "External heat source"
  ],
  "immediateActions": [
    "Shut down affected equipment",
    "Inspect cooling systems",
    "Reroute sensitive inventory"
  ],
  "cascadingRisk": 0.85
}
```

### Scenario Agent: Disruption Generation

**Prompt Template**:
```
You are an expert supply chain analyst. Generate a detailed disruption scenario based on the following parameters:

Disruption Type: {type}
Location: {city}, {country} ({lat}, {lon})
Severity: {severity}
Duration: {duration} hours
Affected Nodes: {nodeCount} supply chain nodes

Please provide:
1. A detailed description of the disruption scenario (2-3 paragraphs)
2. Key risk factors and potential cascading effects
3. Estimated timeline of impact progression
4. Critical decision points for mitigation

Format your response as JSON with the following structure:
{
  "description": "detailed scenario description",
  "riskFactors": ["factor1", "factor2", ...],
  "timeline": "timeline description",
  "criticalDecisionPoints": ["point1", "point2", ...],
  "additionalParameters": {
    "estimatedCostImpact": number,
    "probabilityOfOccurrence": number (0-1)
  }
}
```

**Example Input**:
```json
{
  "type": "NATURAL_DISASTER",
  "location": {
    "city": "Shanghai",
    "country": "China",
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  "severity": "HIGH",
  "duration": 72,
  "affectedNodes": 15
}
```

### Strategy Agent: Mitigation Strategy

**Prompt Template**:
```
You are an expert supply chain strategist. Based on the following disruption scenario and impact analysis, recommend mitigation strategies:

Scenario: {scenarioDescription}
Cost Impact: ${costImpact}
Delivery Delay: {deliveryDelay} hours
Inventory Impact: {inventoryImpact} units

Provide 3-5 mitigation strategies, each with:
1. Strategy name and description
2. Estimated cost to implement
3. Expected risk reduction (0-1)
4. Implementation timeline
5. Key trade-offs

Optimize for: {userPreferences}

Format as JSON array of strategies.
```

**Example Input**:
```json
{
  "scenarioDescription": "Typhoon disrupting Shanghai port operations",
  "costImpact": 2500000,
  "deliveryDelay": 168,
  "inventoryImpact": 50000,
  "userPreferences": {
    "prioritizeCost": false,
    "prioritizeRisk": true,
    "prioritizeSustainability": false
  }
}
```

### Impact Agent: Sustainability Calculation

**Prompt Template**:
```
You are an expert in supply chain sustainability. Calculate the environmental impact of the following mitigation strategy:

Strategy: {strategyName}
Description: {strategyDescription}
Transportation Changes:
- Original Route: {originalRoute}
- New Route: {newRoute}
- Distance Change: {distanceChange} km
- Mode Change: {modeChange}

Calculate:
1. Carbon footprint increase/decrease (kg CO2)
2. Emissions by route segment
3. Overall sustainability score (0-100)
4. Recommendations for reducing environmental impact

Format as JSON.
```

## Best Practices

### 1. Temperature Selection

| Temperature | Use Case | Example |
|-------------|----------|---------|
| 0.1 - 0.3 | Deterministic, factual outputs | Impact calculations, data analysis |
| 0.4 - 0.6 | Balanced creativity and consistency | Strategy recommendations |
| 0.7 - 1.0 | Creative, diverse outputs | Scenario generation |

### 2. Token Management

- Set `max_tokens` based on expected response length
- Monitor token usage with CloudWatch metrics
- Use shorter prompts when possible
- Implement response caching for repeated queries

### 3. Error Handling

```typescript
try {
  const response = await bedrockClient.send(invokeCommand);
  // Process response
} catch (error) {
  if (error.name === 'ThrottlingException') {
    // Implement exponential backoff
    await delay(Math.pow(2, retryCount) * 1000);
    return retry();
  } else if (error.name === 'ValidationException') {
    // Check model access and parameters
    logger.error('Invalid request', { error });
  } else {
    // Fallback to rule-based generation
    return generateFallbackResponse();
  }
}
```

### 4. Cost Optimization

- Use Claude 3 Haiku for simple tasks (10x cheaper)
- Cache frequently requested analyses
- Batch similar requests when possible
- Monitor costs with AWS Cost Explorer
- Set CloudWatch alarms for unexpected usage

### 5. Response Time Optimization

- Use provisioned throughput for production workloads
- Implement parallel agent execution
- Cache common responses in Redis
- Use streaming responses for long outputs

## Monitoring

### CloudWatch Metrics

Monitor these Bedrock-specific metrics:

- `Invocations` - Number of model invocations
- `ModelInvocationLatency` - Response time
- `ModelInvocationClientErrors` - 4xx errors
- `ModelInvocationServerErrors` - 5xx errors
- `InputTokenCount` - Tokens in requests
- `OutputTokenCount` - Tokens in responses

### CloudWatch Alarms

Set up alarms for:

```typescript
{
  "AlarmName": "BedrockHighLatency",
  "MetricName": "ModelInvocationLatency",
  "Threshold": 3000, // 3 seconds
  "ComparisonOperator": "GreaterThanThreshold"
}

{
  "AlarmName": "BedrockHighErrorRate",
  "MetricName": "ModelInvocationClientErrors",
  "Threshold": 5, // 5% error rate
  "ComparisonOperator": "GreaterThanThreshold"
}
```

## Demo Talking Points

### For Judges

1. **AI-Powered Decision Making**
   - "We use Amazon Bedrock's Claude 3 models to power our multi-agent system"
   - "Each agent is optimized with specific temperature and token settings"
   - "Bedrock provides enterprise-grade AI with AWS security and compliance"

2. **Cost Efficiency**
   - "Pay-per-use pricing - only pay for tokens we actually use"
   - "Claude 3 Haiku for fast calculations costs 10x less than Sonnet"
   - "Estimated cost: $0.05 per complete agent workflow"

3. **Performance**
   - "Sub-3-second response times for AI-generated insights"
   - "Parallel agent execution for maximum throughput"
   - "Provisioned throughput available for production workloads"

4. **Scalability**
   - "Bedrock automatically scales to handle any request volume"
   - "No infrastructure to manage - fully serverless"
   - "Multi-region deployment for global availability"

## Troubleshooting

### Issue: "AccessDeniedException"

**Solution**: Request model access in AWS Console > Bedrock > Model access

### Issue: "ThrottlingException"

**Solution**: 
- Implement exponential backoff
- Request quota increase in Service Quotas
- Consider provisioned throughput

### Issue: "ValidationException"

**Solution**:
- Check model ID is correct
- Verify request format matches Anthropic API spec
- Ensure max_tokens is within limits

### Issue: High Latency

**Solution**:
- Use Claude 3 Haiku for faster responses
- Implement response caching
- Consider provisioned throughput
- Check network connectivity

## References

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic Claude API Reference](https://docs.anthropic.com/claude/reference)
- [AWS SDK for JavaScript v3 - Bedrock](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-bedrock-runtime/)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

## Next Steps

1. ✅ Verify Bedrock access with verification script
2. ✅ Document model parameters
3. ⏭️ Write property tests for Bedrock integration
4. ⏭️ Create demo prompts for each agent
5. ⏭️ Test end-to-end agent workflows
