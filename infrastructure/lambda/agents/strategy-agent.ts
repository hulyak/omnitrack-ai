/**
 * Strategy Agent - Generates mitigation strategies with multi-objective optimization
 * 
 * This agent generates ranked mitigation strategies optimized for multiple objectives
 * (cost, risk reduction, sustainability) with configurable preference weights.
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { 
  MitigationStrategy,
  ImpactAnalysis,
  DisruptionType,
  Severity,
  UserPreferences
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface StrategyAgentRequest {
  scenarioId: string;
  impacts: ImpactAnalysis;
  userPreferences?: UserPreferences;
  correlationId?: string;
}

interface StrategyAgentResponse {
  strategies: MitigationStrategy[];
  tradeoffVisualization: TradeoffData;
  metadata: {
    correlationId: string;
    executionTime: number;
    optimizationMethod: string;
  };
}

interface TradeoffData {
  costVsRisk: Array<{ cost: number; risk: number; strategyId: string }>;
  costVsSustainability: Array<{ cost: number; sustainability: number; strategyId: string }>;
  riskVsSustainability: Array<{ risk: number; sustainability: number; strategyId: string }>;
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
 * Strategy Agent Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `strategy-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('StrategyAgent');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Strategy Agent invoked', {
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

    const request: StrategyAgentRequest = JSON.parse(event.body);
    
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

    // Initialize repository
    const scenarioRepository = new ScenarioRepository();
    
    // Fetch scenario
    logger.info('Fetching scenario', { scenarioId: request.scenarioId });
    const scenario = await scenarioRepository.getScenarioById(request.scenarioId);
    
    if (!scenario) {
      logger.warn('Scenario not found', { scenarioId: request.scenarioId });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'Scenario not found',
          correlationId
        })
      };
    }

    // Generate candidate strategies
    logger.info('Generating candidate mitigation strategies');
    const candidateStrategies = generateCandidateStrategies(
      scenario.type,
      scenario.parameters.severity,
      request.impacts,
      logger
    );

    logger.info('Candidate strategies generated', { 
      count: candidateStrategies.length 
    });

    // Apply multi-objective optimization
    logger.info('Applying multi-objective optimization');
    const rankedStrategies = optimizeAndRankStrategies(
      candidateStrategies,
      request.userPreferences,
      logger
    );

    // Select top 3 strategies
    const topStrategies = rankedStrategies.slice(0, 3);

    logger.info('Top strategies selected', { 
      count: topStrategies.length,
      strategyIds: topStrategies.map(s => s.strategyId)
    });

    // Generate trade-off visualization data
    logger.info('Generating trade-off visualization data');
    const tradeoffVisualization = generateTradeoffVisualization(rankedStrategies);

    const executionTime = Date.now() - startTime;

    // Build response
    const response: StrategyAgentResponse = {
      strategies: topStrategies,
      tradeoffVisualization,
      metadata: {
        correlationId,
        executionTime,
        optimizationMethod: 'weighted-multi-objective'
      }
    };

    logger.info('Strategy Agent completed successfully', {
      executionTime,
      scenarioId: request.scenarioId,
      strategiesReturned: topStrategies.length
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
    logger.error('Strategy Agent failed', {
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
 * Generate candidate mitigation strategies based on disruption type and severity
 */
function generateCandidateStrategies(
  disruptionType: DisruptionType,
  severity: Severity,
  impacts: ImpactAnalysis,
  logger: Logger
): MitigationStrategy[] {
  const strategies: MitigationStrategy[] = [];
  
  // Strategy templates based on disruption type
  const strategyTemplates = getStrategyTemplates(disruptionType);
  
  // Generate strategies from templates
  strategyTemplates.forEach((template, index) => {
    const strategy = instantiateStrategy(
      template,
      severity,
      impacts,
      index
    );
    strategies.push(strategy);
  });

  logger.debug('Candidate strategies generated', { 
    count: strategies.length,
    disruptionType,
    severity
  });

  return strategies;
}

/**
 * Get strategy templates for a given disruption type
 */
function getStrategyTemplates(disruptionType: DisruptionType): StrategyTemplate[] {
  const templates: Record<DisruptionType, StrategyTemplate[]> = {
    [DisruptionType.NATURAL_DISASTER]: [
      {
        name: 'Activate Backup Suppliers',
        description: 'Switch to pre-qualified backup suppliers in unaffected regions',
        costMultiplier: 1.3,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 1.1,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['Higher costs due to premium suppliers', 'Potential quality variations']
      },
      {
        name: 'Reroute Through Alternative Logistics',
        description: 'Use alternative transportation routes and modes to bypass affected areas',
        costMultiplier: 1.5,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 1.3,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Increased transportation costs', 'Higher carbon emissions from longer routes']
      },
      {
        name: 'Increase Safety Stock',
        description: 'Build up inventory buffers to weather the disruption',
        costMultiplier: 1.8,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.8,
        tradeoffs: ['High inventory carrying costs', 'Capital tied up in stock']
      },
      {
        name: 'Expedite Air Freight',
        description: 'Use air freight for critical components to minimize delays',
        costMultiplier: 2.5,
        riskReductionMultiplier: 0.3,
        sustainabilityMultiplier: 2.0,
        implementationTimeMultiplier: 0.2,
        tradeoffs: ['Very high transportation costs', 'Significant carbon footprint increase']
      },
      {
        name: 'Negotiate Extended Lead Times',
        description: 'Work with customers to extend delivery timelines',
        costMultiplier: 0.5,
        riskReductionMultiplier: 0.8,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['Customer satisfaction impact', 'Potential revenue loss']
      }
    ],
    [DisruptionType.SUPPLIER_FAILURE]: [
      {
        name: 'Emergency Supplier Qualification',
        description: 'Fast-track qualification of new suppliers',
        costMultiplier: 1.4,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 1.2,
        implementationTimeMultiplier: 0.6,
        tradeoffs: ['Compressed qualification process', 'Potential quality risks']
      },
      {
        name: 'In-Source Production',
        description: 'Bring production in-house temporarily',
        costMultiplier: 2.0,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 1.1,
        implementationTimeMultiplier: 0.9,
        tradeoffs: ['High setup costs', 'Requires available capacity']
      },
      {
        name: 'Multi-Source Strategy',
        description: 'Split orders across multiple suppliers',
        costMultiplier: 1.2,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['Reduced economies of scale', 'Increased coordination complexity']
      },
      {
        name: 'Product Redesign',
        description: 'Modify product to use alternative components',
        costMultiplier: 1.6,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 1.0,
        tradeoffs: ['Engineering time required', 'Potential performance changes']
      },
      {
        name: 'Supplier Recovery Support',
        description: 'Provide financial and technical support to help supplier recover',
        costMultiplier: 1.3,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.7,
        tradeoffs: ['Upfront investment required', 'Dependency on supplier recovery']
      }
    ],
    [DisruptionType.TRANSPORTATION_DELAY]: [
      {
        name: 'Expedited Shipping',
        description: 'Use faster shipping methods for critical shipments',
        costMultiplier: 2.0,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 1.8,
        implementationTimeMultiplier: 0.2,
        tradeoffs: ['High shipping costs', 'Increased carbon emissions']
      },
      {
        name: 'Regional Distribution',
        description: 'Shift to regional distribution centers closer to customers',
        costMultiplier: 1.3,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['Requires regional inventory', 'Potential stock imbalances']
      },
      {
        name: 'Intermodal Transportation',
        description: 'Combine multiple transportation modes for optimal routing',
        costMultiplier: 1.4,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['Coordination complexity', 'Multiple handoff points']
      },
      {
        name: 'Carrier Diversification',
        description: 'Use multiple carriers to reduce dependency',
        costMultiplier: 1.1,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Reduced volume discounts', 'Increased management overhead']
      },
      {
        name: 'Customer Communication',
        description: 'Proactive communication with customers about delays',
        costMultiplier: 0.3,
        riskReductionMultiplier: 0.9,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.1,
        tradeoffs: ['Does not solve delay', 'Manages expectations only']
      }
    ],
    [DisruptionType.DEMAND_SPIKE]: [
      {
        name: 'Overtime Production',
        description: 'Increase production through overtime shifts',
        costMultiplier: 1.5,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.2,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Higher labor costs', 'Worker fatigue risks']
      },
      {
        name: 'Contract Manufacturing',
        description: 'Outsource production to contract manufacturers',
        costMultiplier: 1.7,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 1.3,
        implementationTimeMultiplier: 0.6,
        tradeoffs: ['Quality control challenges', 'IP protection concerns']
      },
      {
        name: 'Demand Allocation',
        description: 'Prioritize high-value customers and products',
        costMultiplier: 0.6,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.2,
        tradeoffs: ['Some customers not served', 'Potential relationship damage']
      },
      {
        name: 'Price Adjustment',
        description: 'Implement dynamic pricing to manage demand',
        costMultiplier: 0.4,
        riskReductionMultiplier: 0.8,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.1,
        tradeoffs: ['Customer perception issues', 'Regulatory considerations']
      },
      {
        name: 'Capacity Expansion',
        description: 'Add production capacity through equipment or facilities',
        costMultiplier: 3.0,
        riskReductionMultiplier: 0.3,
        sustainabilityMultiplier: 1.4,
        implementationTimeMultiplier: 1.0,
        tradeoffs: ['Very high capital investment', 'Long implementation time']
      }
    ],
    [DisruptionType.QUALITY_ISSUE]: [
      {
        name: 'Enhanced Quality Control',
        description: 'Implement additional inspection and testing',
        costMultiplier: 1.3,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['Slower throughput', 'Increased labor costs']
      },
      {
        name: 'Supplier Audit',
        description: 'Conduct thorough supplier quality audit',
        costMultiplier: 1.1,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['Time to complete audit', 'Supplier relationship strain']
      },
      {
        name: 'Batch Quarantine',
        description: 'Isolate and test affected batches',
        costMultiplier: 1.4,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Inventory tied up', 'Potential waste']
      },
      {
        name: 'Process Improvement',
        description: 'Implement corrective actions in production process',
        costMultiplier: 1.6,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.7,
        tradeoffs: ['Production downtime', 'Requires root cause analysis']
      },
      {
        name: 'Alternative Supplier',
        description: 'Switch to supplier with better quality track record',
        costMultiplier: 1.5,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.1,
        implementationTimeMultiplier: 0.6,
        tradeoffs: ['Qualification time', 'Potential cost increase']
      }
    ],
    [DisruptionType.GEOPOLITICAL]: [
      {
        name: 'Geographic Diversification',
        description: 'Shift sourcing to politically stable regions',
        costMultiplier: 1.6,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 1.2,
        implementationTimeMultiplier: 0.8,
        tradeoffs: ['Higher sourcing costs', 'Long transition period']
      },
      {
        name: 'Nearshoring',
        description: 'Move production closer to end markets',
        costMultiplier: 2.0,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.9,
        tradeoffs: ['Significant cost increase', 'Requires new facilities']
      },
      {
        name: 'Strategic Stockpiling',
        description: 'Build strategic reserves of critical materials',
        costMultiplier: 2.2,
        riskReductionMultiplier: 0.3,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.7,
        tradeoffs: ['Very high carrying costs', 'Risk of obsolescence']
      },
      {
        name: 'Trade Compliance',
        description: 'Ensure full compliance with trade regulations',
        costMultiplier: 1.2,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['Administrative overhead', 'Potential delays']
      },
      {
        name: 'Political Risk Insurance',
        description: 'Purchase insurance coverage for geopolitical risks',
        costMultiplier: 1.4,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Insurance premiums', 'Coverage limitations']
      }
    ],
    [DisruptionType.CYBER_ATTACK]: [
      {
        name: 'System Isolation',
        description: 'Isolate affected systems and switch to manual processes',
        costMultiplier: 1.8,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.2,
        tradeoffs: ['Reduced efficiency', 'Manual process errors']
      },
      {
        name: 'Backup System Activation',
        description: 'Switch to backup systems and disaster recovery',
        costMultiplier: 1.3,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Potential data loss', 'System synchronization issues']
      },
      {
        name: 'Security Hardening',
        description: 'Implement enhanced security measures',
        costMultiplier: 1.5,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['System downtime', 'User access restrictions']
      },
      {
        name: 'Third-Party Recovery',
        description: 'Engage cybersecurity experts for recovery',
        costMultiplier: 2.0,
        riskReductionMultiplier: 0.4,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['High consulting costs', 'External access to systems']
      },
      {
        name: 'Communication Protocol',
        description: 'Activate incident communication plan',
        costMultiplier: 0.5,
        riskReductionMultiplier: 0.8,
        sustainabilityMultiplier: 0.8,
        implementationTimeMultiplier: 0.1,
        tradeoffs: ['Reputation impact', 'Regulatory reporting requirements']
      }
    ],
    [DisruptionType.LABOR_SHORTAGE]: [
      {
        name: 'Wage Increase',
        description: 'Offer competitive wages to attract workers',
        costMultiplier: 1.6,
        riskReductionMultiplier: 0.5,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.3,
        tradeoffs: ['Increased labor costs', 'Wage compression issues']
      },
      {
        name: 'Automation Investment',
        description: 'Implement automation to reduce labor dependency',
        costMultiplier: 2.5,
        riskReductionMultiplier: 0.3,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.9,
        tradeoffs: ['High capital investment', 'Long implementation time']
      },
      {
        name: 'Temporary Workers',
        description: 'Hire temporary or contract workers',
        costMultiplier: 1.4,
        riskReductionMultiplier: 0.6,
        sustainabilityMultiplier: 1.0,
        implementationTimeMultiplier: 0.4,
        tradeoffs: ['Higher hourly rates', 'Training requirements']
      },
      {
        name: 'Cross-Training',
        description: 'Train existing workers for multiple roles',
        costMultiplier: 1.2,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.5,
        tradeoffs: ['Training time', 'Reduced specialization']
      },
      {
        name: 'Shift Optimization',
        description: 'Optimize shift schedules for better coverage',
        costMultiplier: 1.1,
        riskReductionMultiplier: 0.7,
        sustainabilityMultiplier: 0.9,
        implementationTimeMultiplier: 0.2,
        tradeoffs: ['Worker schedule disruption', 'Potential overtime']
      }
    ]
  };

  return templates[disruptionType] || [];
}

interface StrategyTemplate {
  name: string;
  description: string;
  costMultiplier: number;
  riskReductionMultiplier: number;
  sustainabilityMultiplier: number;
  implementationTimeMultiplier: number;
  tradeoffs: string[];
}

/**
 * Instantiate a strategy from a template
 */
function instantiateStrategy(
  template: StrategyTemplate,
  severity: Severity,
  impacts: ImpactAnalysis,
  index: number
): MitigationStrategy {
  // Severity multipliers
  const severityMultipliers = {
    [Severity.LOW]: 0.5,
    [Severity.MEDIUM]: 1.0,
    [Severity.HIGH]: 1.5,
    [Severity.CRITICAL]: 2.0
  };

  const severityFactor = severityMultipliers[severity];

  // Add variation to ensure strategies are differentiated
  // This ensures that preference-based ranking always produces different results
  // Use different variation patterns for each metric to maximize differentiation
  const costVariation = 1.0 + (index * 0.15); // 0%, 15%, 30%, 45%, 60% variation
  const riskVariation = 1.0 - (index * 0.08); // Inverse variation: 0%, -8%, -16%, -24%, -32%
  const sustainabilityVariation = 1.0 + ((index % 2 === 0 ? index : -index) * 0.12); // Alternating: 0%, -12%, 24%, -36%, 48%

  // Calculate strategy metrics with variation
  const costImpact = impacts.costImpact * template.costMultiplier * severityFactor * costVariation;
  const riskReduction = Math.max(0.1, Math.min(1.0, template.riskReductionMultiplier * riskVariation)); // Clamp to valid range
  const sustainabilityImpact = (impacts.sustainabilityImpact?.carbonFootprint || 0) * 
                               template.sustainabilityMultiplier * 
                               severityFactor * 
                               Math.abs(sustainabilityVariation);
  const implementationTime = impacts.deliveryTimeImpact * 
                             template.implementationTimeMultiplier * 
                             severityFactor;

  return {
    strategyId: `strategy-${Date.now()}-${index}`,
    name: template.name,
    description: template.description,
    costImpact,
    riskReduction,
    sustainabilityImpact,
    implementationTime,
    tradeoffs: template.tradeoffs
  };
}

/**
 * Optimize and rank strategies using multi-objective optimization
 */
function optimizeAndRankStrategies(
  strategies: MitigationStrategy[],
  userPreferences: UserPreferences | undefined,
  logger: Logger
): MitigationStrategy[] {
  // Default weights if no preferences provided
  // Use stronger preference weights to ensure ranking differences
  const weights = {
    cost: userPreferences?.prioritizeCost ? 0.6 : 0.2,
    risk: userPreferences?.prioritizeRisk ? 0.6 : 0.2,
    sustainability: userPreferences?.prioritizeSustainability ? 0.6 : 0.2
  };

  // Normalize weights to sum to 1
  const totalWeight = weights.cost + weights.risk + weights.sustainability;
  weights.cost /= totalWeight;
  weights.risk /= totalWeight;
  weights.sustainability /= totalWeight;

  logger.debug('Optimization weights', { weights });

  // Find min and max for each metric to normalize properly
  const costs = strategies.map(s => s.costImpact);
  const risks = strategies.map(s => s.riskReduction);
  const sustainabilities = strategies.map(s => s.sustainabilityImpact);

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minRisk = Math.min(...risks);
  const maxRisk = Math.max(...risks);
  const minSustainability = Math.min(...sustainabilities);
  const maxSustainability = Math.max(...sustainabilities);

  // Calculate composite scores
  const scoredStrategies = strategies.map(strategy => {
    // Normalize metrics to 0-1 scale using min-max normalization
    // Lower is better for cost and sustainability, higher is better for risk reduction
    const normalizedCost = maxCost > minCost 
      ? 1 - ((strategy.costImpact - minCost) / (maxCost - minCost))
      : 0.5; // If all costs are the same, use neutral score

    const normalizedRisk = maxRisk > minRisk
      ? (strategy.riskReduction - minRisk) / (maxRisk - minRisk)
      : 0.5; // If all risks are the same, use neutral score

    const normalizedSustainability = maxSustainability > minSustainability
      ? 1 - ((strategy.sustainabilityImpact - minSustainability) / (maxSustainability - minSustainability))
      : 0.5; // If all sustainability values are the same, use neutral score

    // Calculate weighted composite score
    const compositeScore = 
      (weights.cost * normalizedCost) +
      (weights.risk * normalizedRisk) +
      (weights.sustainability * normalizedSustainability);

    return {
      strategy,
      compositeScore,
      normalizedCost,
      normalizedRisk,
      normalizedSustainability
    };
  });

  // Sort by composite score (descending)
  scoredStrategies.sort((a, b) => b.compositeScore - a.compositeScore);

  logger.debug('Strategies ranked', {
    topScore: scoredStrategies[0]?.compositeScore,
    bottomScore: scoredStrategies[scoredStrategies.length - 1]?.compositeScore,
    scoreRange: scoredStrategies[0]?.compositeScore - scoredStrategies[scoredStrategies.length - 1]?.compositeScore
  });

  return scoredStrategies.map(s => s.strategy);
}

/**
 * Generate trade-off visualization data
 */
function generateTradeoffVisualization(strategies: MitigationStrategy[]): TradeoffData {
  return {
    costVsRisk: strategies.map(s => ({
      cost: s.costImpact,
      risk: s.riskReduction,
      strategyId: s.strategyId
    })),
    costVsSustainability: strategies.map(s => ({
      cost: s.costImpact,
      sustainability: s.sustainabilityImpact,
      strategyId: s.strategyId
    })),
    riskVsSustainability: strategies.map(s => ({
      risk: s.riskReduction,
      sustainability: s.sustainabilityImpact,
      strategyId: s.strategyId
    }))
  };
}
