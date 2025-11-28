# Explainability Service

This service provides explainability components for AI-driven decisions in the OmniTrack AI platform.

## Components

### explainability-service.ts
Main service that generates:
- Natural language summaries using Amazon Bedrock
- Decision tree structures for visualization
- Agent attribution tracking
- Uncertainty quantification for predictions

## Requirements

Validates:
- Requirement 6.1: Natural language summaries
- Requirement 6.2: Decision tree visualizations
- Requirement 6.3: Agent attribution
- Requirement 6.4: Uncertainty quantification

## Usage

```typescript
import { ExplainabilityService } from './explainability-service';

const service = new ExplainabilityService();

// Generate explanation for a scenario result
const explanation = await service.generateExplanation({
  scenarioId: 'scenario-123',
  impacts: impactAnalysis,
  strategies: mitigationStrategies,
  agentContributions: agentData
});
```

## Testing

Property-based tests ensure:
- All explanations include well-formed decision tree structures
- Agent attribution is complete for multi-agent workflows
- Uncertainty quantification is present for predictions
