/**
 * Negotiation Orchestrator - Coordinates multi-agent negotiation for balanced strategies
 * 
 * This service orchestrates cross-agent negotiation to balance cost, risk, and sustainability
 * objectives. It aggregates results from multiple agents and applies negotiation logic.
 * 
 * Requirements: 7.1, 7.4, 7.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  MitigationStrategy,
  ImpactAnalysis,
  UserPreferences,
  NegotiationResult,
  ConflictEscalation
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface NegotiationRequest {
  scenarioId: string;
  impacts: ImpactAnalysis;
  strategies: MitigationStrategy[];
  userPreferences?: UserPreferences;
  userId: string;
  correlationId?: string;
}

interface NegotiationResponse {
  result: NegotiationResult;
  metadata: {
    correlationId: string;
    executionTime: number;
    negotiationMethod: string;
  };
}

/**
 * Structured logger with correlation ID support
 */
class Logger {
  private correlationId: string;
  private context: Context;

  constructor(correlationId: string, context: Context) {
    this.correlationId = correlationId;
    this.context = context;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      requestId: this.context.awsRequestId,
      functionName: this.context.functionName,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARNING', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }
}

/**
 * Negotiation Orchestrator Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `negotiation-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('NegotiationOrchestrator');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Negotiation Orchestrator invoked', {
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'Request body is required',
          correlationId
        })
      };
    }

    const request: NegotiationRequest = JSON.parse(event.body);
    
    logger.debug('Request parsed', { request });

    // Validate required fields
    if (!request.scenarioId) {
      logger.warn('Request validation failed: missing scenarioId');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'scenarioId is required',
          correlationId
        })
      };
    }

    if (!request.impacts) {
      logger.warn('Request validation failed: missing impacts');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'impacts is required',
          correlationId
        })
      };
    }

    if (!request.strategies || request.strategies.length === 0) {
      logger.warn('Request validation failed: missing or empty strategies');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'strategies array is required and must not be empty',
          correlationId
        })
      };
    }

    // Execute negotiation
    logger.info('Starting cross-agent negotiation', {
      scenarioId: request.scenarioId,
      strategyCount: request.strategies.length
    });

    const negotiationResult = await executeNegotiation(
      request,
      logger
    );

    // Log decision rationale for audit
    await logDecisionRationale(
      request.scenarioId,
      request.userId,
      negotiationResult,
      correlationId,
      logger
    );

    const executionTime = Date.now() - startTime;

    // Build response
    const response: NegotiationResponse = {
      result: negotiationResult,
      metadata: {
        correlationId,
        executionTime,
        negotiationMethod: 'multi-objective-weighted'
      }
    };

    logger.info('Negotiation Orchestrator completed successfully', {
      executionTime,
      scenarioId: request.scenarioId,
      balancedStrategiesCount: negotiationResult.balancedStrategies.length,
      consensusReached: !negotiationResult.conflictEscalation
    });

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    logger.error('Negotiation Orchestrator failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify({
        error: 'Internal server error',
        correlationId,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Execute cross-agent negotiation
 */
async function executeNegotiation(
  request: NegotiationRequest,
  logger: Logger
): Promise<NegotiationResult> {
  // Define negotiation parameters
  const negotiationParams = defineNegotiationParameters(request.userPreferences);
  
  logger.debug('Negotiation parameters defined', { negotiationParams });

  // Evaluate each strategy against negotiation criteria
  const evaluatedStrategies = evaluateStrategies(
    request.strategies,
    request.impacts,
    negotiationParams,
    logger
  );

  // Check for conflicts
  const conflict = detectConflicts(
    evaluatedStrategies,
    negotiationParams,
    logger
  );

  // If conflict detected, prepare escalation
  let conflictEscalation: ConflictEscalation | undefined;
  if (conflict) {
    logger.warn('Conflict detected in negotiation', { conflict });
    conflictEscalation = {
      reason: conflict.reason,
      conflictingObjectives: conflict.objectives,
      explanation: conflict.explanation,
      requiresUserInput: true
    };
  }

  // Select top 3 balanced strategies
  const balancedStrategies = evaluatedStrategies
    .sort((a, b) => b.negotiationScore - a.negotiationScore)
    .slice(0, 3)
    .map(es => es.strategy);

  logger.info('Balanced strategies selected', {
    count: balancedStrategies.length,
    topScore: evaluatedStrategies[0]?.negotiationScore
  });

  // Generate trade-off visualizations
  const tradeoffVisualizations = generateTradeoffVisualizations(
    balancedStrategies,
    negotiationParams
  );

  return {
    balancedStrategies,
    tradeoffVisualizations,
    conflictEscalation,
    negotiationParameters: negotiationParams
  };
}

/**
 * Define negotiation parameters based on user preferences
 */
function defineNegotiationParameters(
  userPreferences?: UserPreferences
): NegotiationParameters {
  // Default weights
  let costWeight = 0.33;
  let riskWeight = 0.33;
  let sustainabilityWeight = 0.34;

  // Adjust weights based on user preferences
  if (userPreferences) {
    if (userPreferences.prioritizeCost) {
      costWeight = 0.5;
      riskWeight = 0.25;
      sustainabilityWeight = 0.25;
    } else if (userPreferences.prioritizeRisk) {
      costWeight = 0.25;
      riskWeight = 0.5;
      sustainabilityWeight = 0.25;
    } else if (userPreferences.prioritizeSustainability) {
      costWeight = 0.25;
      riskWeight = 0.25;
      sustainabilityWeight = 0.5;
    }
  }

  // Define acceptable thresholds
  const thresholds = {
    maxCostImpact: userPreferences?.maxCostImpact || Infinity,
    minRiskReduction: userPreferences?.minRiskReduction || 0,
    maxSustainabilityImpact: userPreferences?.maxSustainabilityImpact || Infinity
  };

  return {
    costWeight,
    riskWeight,
    sustainabilityWeight,
    thresholds
  };
}

interface NegotiationParameters {
  costWeight: number;
  riskWeight: number;
  sustainabilityWeight: number;
  thresholds: {
    maxCostImpact: number;
    minRiskReduction: number;
    maxSustainabilityImpact: number;
  };
}

interface EvaluatedStrategy {
  strategy: MitigationStrategy;
  negotiationScore: number;
  costScore: number;
  riskScore: number;
  sustainabilityScore: number;
  meetsThresholds: boolean;
}

/**
 * Evaluate strategies against negotiation criteria
 */
function evaluateStrategies(
  strategies: MitigationStrategy[],
  impacts: ImpactAnalysis,
  params: NegotiationParameters,
  logger: Logger
): EvaluatedStrategy[] {
  // Find min/max values for normalization
  const costs = strategies.map(s => s.costImpact);
  const risks = strategies.map(s => s.riskReduction);
  const sustainabilities = strategies.map(s => s.sustainabilityImpact);

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minRisk = Math.min(...risks);
  const maxRisk = Math.max(...risks);
  const minSustainability = Math.min(...sustainabilities);
  const maxSustainability = Math.max(...sustainabilities);

  const evaluated = strategies.map(strategy => {
    // Normalize scores (0-1 scale)
    // Lower is better for cost and sustainability, higher is better for risk reduction
    const costScore = maxCost > minCost 
      ? 1 - ((strategy.costImpact - minCost) / (maxCost - minCost))
      : 0.5;

    const riskScore = maxRisk > minRisk
      ? (strategy.riskReduction - minRisk) / (maxRisk - minRisk)
      : 0.5;

    const sustainabilityScore = maxSustainability > minSustainability
      ? 1 - ((strategy.sustainabilityImpact - minSustainability) / (maxSustainability - minSustainability))
      : 0.5;

    // Calculate weighted negotiation score
    const negotiationScore = 
      (params.costWeight * costScore) +
      (params.riskWeight * riskScore) +
      (params.sustainabilityWeight * sustainabilityScore);

    // Check if strategy meets thresholds
    const meetsThresholds = 
      strategy.costImpact <= params.thresholds.maxCostImpact &&
      strategy.riskReduction >= params.thresholds.minRiskReduction &&
      strategy.sustainabilityImpact <= params.thresholds.maxSustainabilityImpact;

    return {
      strategy,
      negotiationScore,
      costScore,
      riskScore,
      sustainabilityScore,
      meetsThresholds
    };
  });

  logger.debug('Strategies evaluated', {
    totalStrategies: evaluated.length,
    meetingThresholds: evaluated.filter(e => e.meetsThresholds).length
  });

  return evaluated;
}

interface Conflict {
  reason: string;
  objectives: string[];
  explanation: string;
}

/**
 * Detect conflicts in negotiation
 */
function detectConflicts(
  evaluatedStrategies: EvaluatedStrategy[],
  params: NegotiationParameters,
  logger: Logger
): Conflict | null {
  // Check if no strategies meet thresholds
  const strategiesMeetingThresholds = evaluatedStrategies.filter(
    es => es.meetsThresholds
  );

  if (strategiesMeetingThresholds.length === 0) {
    logger.warn('No strategies meet defined thresholds');
    
    // Identify which thresholds are violated
    const violatedObjectives: string[] = [];
    let explanation = 'None of the available strategies satisfy all defined constraints. ';

    const allViolateCost = evaluatedStrategies.every(
      es => es.strategy.costImpact > params.thresholds.maxCostImpact
    );
    const allViolateRisk = evaluatedStrategies.every(
      es => es.strategy.riskReduction < params.thresholds.minRiskReduction
    );
    const allViolateSustainability = evaluatedStrategies.every(
      es => es.strategy.sustainabilityImpact > params.thresholds.maxSustainabilityImpact
    );

    if (allViolateCost) {
      violatedObjectives.push('cost');
      explanation += `All strategies exceed the maximum cost threshold of ${params.thresholds.maxCostImpact}. `;
    }
    if (allViolateRisk) {
      violatedObjectives.push('risk');
      explanation += `All strategies fail to meet the minimum risk reduction threshold of ${params.thresholds.minRiskReduction}. `;
    }
    if (allViolateSustainability) {
      violatedObjectives.push('sustainability');
      explanation += `All strategies exceed the maximum sustainability impact threshold of ${params.thresholds.maxSustainabilityImpact}. `;
    }

    explanation += 'Please consider adjusting your constraints or accepting a strategy with trade-offs.';

    return {
      reason: 'threshold_violations',
      objectives: violatedObjectives,
      explanation
    };
  }

  // Check for high variance in scores (indicating difficult trade-offs)
  const topScores = evaluatedStrategies
    .sort((a, b) => b.negotiationScore - a.negotiationScore)
    .slice(0, 3)
    .map(es => es.negotiationScore);

  if (topScores.length >= 2) {
    const scoreVariance = calculateVariance(topScores);
    
    // If variance is very low, strategies are too similar (potential conflict)
    if (scoreVariance < 0.001) {
      logger.warn('Strategies have very similar scores, indicating difficult trade-offs');
      
      return {
        reason: 'ambiguous_trade_offs',
        objectives: ['cost', 'risk', 'sustainability'],
        explanation: 'The top strategies have very similar overall scores, making it difficult to determine a clear winner. This suggests that the objectives are in tension and require careful consideration of trade-offs. Please review the detailed trade-off visualizations to make an informed decision.'
      };
    }
  }

  // No conflicts detected
  return null;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

/**
 * Generate trade-off visualizations
 */
function generateTradeoffVisualizations(
  strategies: MitigationStrategy[],
  params: NegotiationParameters
): TradeoffVisualization[] {
  const visualizations: TradeoffVisualization[] = [];

  // Cost vs Risk trade-off
  visualizations.push({
    type: 'cost_vs_risk',
    xAxis: 'Cost Impact',
    yAxis: 'Risk Reduction',
    dataPoints: strategies.map(s => ({
      x: s.costImpact,
      y: s.riskReduction,
      strategyId: s.strategyId,
      strategyName: s.name
    })),
    optimalRegion: {
      xMax: params.thresholds.maxCostImpact,
      yMin: params.thresholds.minRiskReduction
    }
  });

  // Cost vs Sustainability trade-off
  visualizations.push({
    type: 'cost_vs_sustainability',
    xAxis: 'Cost Impact',
    yAxis: 'Sustainability Impact',
    dataPoints: strategies.map(s => ({
      x: s.costImpact,
      y: s.sustainabilityImpact,
      strategyId: s.strategyId,
      strategyName: s.name
    })),
    optimalRegion: {
      xMax: params.thresholds.maxCostImpact,
      yMax: params.thresholds.maxSustainabilityImpact
    }
  });

  // Risk vs Sustainability trade-off
  visualizations.push({
    type: 'risk_vs_sustainability',
    xAxis: 'Risk Reduction',
    yAxis: 'Sustainability Impact',
    dataPoints: strategies.map(s => ({
      x: s.riskReduction,
      y: s.sustainabilityImpact,
      strategyId: s.strategyId,
      strategyName: s.name
    })),
    optimalRegion: {
      xMin: params.thresholds.minRiskReduction,
      yMax: params.thresholds.maxSustainabilityImpact
    }
  });

  return visualizations;
}

interface TradeoffVisualization {
  type: string;
  xAxis: string;
  yAxis: string;
  dataPoints: Array<{
    x: number;
    y: number;
    strategyId: string;
    strategyName: string;
  }>;
  optimalRegion: {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
  };
}

/**
 * Log decision rationale for audit trail
 */
async function logDecisionRationale(
  scenarioId: string,
  userId: string,
  result: NegotiationResult,
  correlationId: string,
  logger: Logger
): Promise<void> {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType: 'negotiation_decision',
    scenarioId,
    userId,
    correlationId,
    selectedStrategies: result.balancedStrategies.map(s => ({
      strategyId: s.strategyId,
      name: s.name,
      costImpact: s.costImpact,
      riskReduction: s.riskReduction,
      sustainabilityImpact: s.sustainabilityImpact
    })),
    negotiationParameters: result.negotiationParameters,
    conflictEscalated: !!result.conflictEscalation,
    conflictReason: result.conflictEscalation?.reason,
    rationale: generateDecisionRationale(result)
  };

  // Log to CloudWatch for audit trail
  logger.info('Decision rationale logged', { auditEntry });

  // In production, this would also write to DynamoDB audit table
  // await auditRepository.createAuditEntry(auditEntry);
}

/**
 * Generate human-readable decision rationale
 */
function generateDecisionRationale(result: NegotiationResult): string {
  let rationale = 'Cross-agent negotiation completed. ';

  if (result.conflictEscalation) {
    rationale += `Conflict detected: ${result.conflictEscalation.explanation} `;
  } else {
    rationale += `Consensus reached on ${result.balancedStrategies.length} balanced strategies. `;
  }

  rationale += `Negotiation weights applied: `;
  rationale += `Cost (${(result.negotiationParameters.costWeight * 100).toFixed(0)}%), `;
  rationale += `Risk (${(result.negotiationParameters.riskWeight * 100).toFixed(0)}%), `;
  rationale += `Sustainability (${(result.negotiationParameters.sustainabilityWeight * 100).toFixed(0)}%). `;

  if (result.balancedStrategies.length > 0) {
    const topStrategy = result.balancedStrategies[0];
    rationale += `Top recommended strategy: "${topStrategy.name}" `;
    rationale += `with cost impact of ${Math.round(topStrategy.costImpact).toLocaleString()}, `;
    rationale += `risk reduction of ${(topStrategy.riskReduction * 100).toFixed(0)}%, `;
    rationale += `and sustainability impact of ${Math.round(topStrategy.sustainabilityImpact).toLocaleString()} kg CO2.`;
  }

  return rationale;
}
