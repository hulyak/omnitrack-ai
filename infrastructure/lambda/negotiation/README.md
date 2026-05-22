# Cross-Agent Negotiation Module

This module implements the cross-agent negotiation system for OmniTrack AI, enabling multiple AI agents to collaborate and balance competing objectives (cost, risk, sustainability) when recommending mitigation strategies.

## Architecture

The negotiation system uses AWS Step Functions to orchestrate multiple agents in parallel, then aggregates their results and applies negotiation logic to produce balanced recommendations.

### Components

1. **Negotiation Orchestrator Lambda** (`negotiation-orchestrator.ts`)
   - Executes multi-objective optimization
   - Balances cost, risk, and sustainability objectives
   - Detects conflicts when agents cannot reach consensus
   - Generates trade-off visualizations
   - Logs decision rationale for audit trail

2. **Step Functions State Machine** (`state-machine-definition.json`)
   - Orchestrates parallel execution of Info, Scenario, Impact, and Strategy agents
   - Aggregates results from all agents
   - Invokes negotiation orchestrator
   - Handles conflict escalation
   - Provides retry and error handling

## Workflow

```
User Request
    ↓
Step Functions State Machine
    ↓
Parallel Agent Execution
    ├── Info Agent (supply chain data)
    ├── Scenario Agent (disruption scenarios)
    ├── Impact Agent (impact analysis)
    └── Strategy Agent (mitigation strategies)
    ↓
Aggregate Results
    ↓
Negotiation Orchestrator
    ├── Evaluate strategies against objectives
    ├── Apply user preference weights
    ├── Detect conflicts
    └── Generate trade-off visualizations
    ↓
Check for Conflicts
    ├── Yes → Escalate to User
    └── No → Return Balanced Strategies
    ↓
Log Decision Rationale (Audit Trail)
    ↓
Return Results to User
```

## Negotiation Algorithm

The negotiation orchestrator uses a weighted multi-objective optimization approach:

1. **Define Negotiation Parameters**
   - Extract user preferences (prioritize cost/risk/sustainability)
   - Set objective weights (default: 33% each, or 50%/25%/25% with preference)
   - Define acceptable thresholds

2. **Evaluate Strategies**
   - Normalize each metric to 0-1 scale
   - Calculate weighted composite score for each strategy
   - Check if strategies meet defined thresholds

3. **Detect Conflicts**
   - Check if no strategies meet all thresholds
   - Identify which objectives are violated
   - Check for ambiguous trade-offs (similar scores)

4. **Generate Visualizations**
   - Cost vs Risk trade-off chart
   - Cost vs Sustainability trade-off chart
   - Risk vs Sustainability trade-off chart
   - Mark optimal regions based on thresholds

5. **Select Top Strategies**
   - Return top 3 strategies by composite score
   - Include trade-off visualizations
   - Escalate conflicts if detected

## Conflict Escalation

Conflicts are escalated to users when:

1. **Threshold Violations**: No strategies satisfy all defined constraints
   - Example: All strategies exceed max cost threshold
   - System identifies which objectives are violated
   - Suggests adjusting constraints or accepting trade-offs

2. **Ambiguous Trade-offs**: Top strategies have very similar scores
   - Indicates objectives are in tension
   - Requires careful consideration of trade-offs
   - System provides detailed visualizations to aid decision

## Decision Audit Logging

All negotiation decisions are logged for audit trail:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "eventType": "negotiation_decision",
  "scenarioId": "scenario-123",
  "userId": "user-456",
  "correlationId": "negotiation-789",
  "selectedStrategies": [...],
  "negotiationParameters": {...},
  "conflictEscalated": false,
  "rationale": "Cross-agent negotiation completed. Consensus reached..."
}
```

## Requirements Validation

This module validates the following requirements:

- **Requirement 7.1**: Cross-agent negotiation execution for all mitigation strategy evaluations
- **Requirement 7.2**: Returns exactly 3 balanced strategies with trade-off visualizations
- **Requirement 7.3**: Applies user preference weights to negotiation outcomes
- **Requirement 7.4**: Escalates conflicts with explanation when consensus cannot be reached
- **Requirement 7.5**: Logs decision rationale for all negotiated strategies

## Usage

### Direct Lambda Invocation

```typescript
const request = {
  scenarioId: 'scenario-123',
  impacts: {
    costImpact: 50000,
    deliveryTimeImpact: 48,
    inventoryImpact: 1000,
    sustainabilityImpact: {
      carbonFootprint: 5000,
      emissionsByRoute: {...},
      sustainabilityScore: 75
    }
  },
  strategies: [...], // Array of mitigation strategies
  userPreferences: {
    prioritizeSustainability: true,
    maxCostImpact: 75000,
    minRiskReduction: 0.5
  },
  userId: 'user-456'
};

const response = await lambda.invoke({
  FunctionName: 'negotiation-orchestrator',
  Payload: JSON.stringify({ body: JSON.stringify(request) })
});
```

### Step Functions Execution

```typescript
const input = {
  scenarioId: 'scenario-123',
  userId: 'user-456',
  userPreferences: {...},
  infoAgentInput: {...},
  scenarioAgentInput: {...},
  impactAgentInput: {...},
  strategyAgentInput: {...},
  correlationId: 'negotiation-789'
};

const execution = await stepFunctions.startExecution({
  stateMachineArn: 'arn:aws:states:...:stateMachine:multi-agent-negotiation',
  input: JSON.stringify(input)
});
```

## Testing

Property-based tests validate:

1. **Negotiation Execution** (Property 26): All strategy evaluations trigger negotiation
2. **Conflict Escalation** (Property 29): Conflicts are escalated with explanations
3. **Decision Audit Logging** (Property 30): All decisions are logged with rationale

See `negotiation-orchestrator.property.test.ts` for test implementation.

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Invalid input parameters return 400 Bad Request
- **Agent Failures**: Individual agent failures are caught and logged
- **Negotiation Failures**: Retry logic with exponential backoff
- **Conflict Detection**: Graceful escalation to user with explanation

## Performance

- **Parallel Execution**: Agents run in parallel for optimal performance
- **Caching**: Results can be cached in ElastiCache for repeated queries
- **Timeout**: Step Functions execution timeout set to 5 minutes
- **Retry Logic**: Automatic retry for transient failures

## Security

- **Authentication**: All requests require valid JWT tokens
- **Authorization**: RBAC enforced for negotiation execution
- **Audit Logging**: All decisions logged to CloudWatch and DynamoDB
- **Data Encryption**: All data encrypted in transit and at rest
