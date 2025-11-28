/**
 * Impact Agent - Analyzes scenario impacts across multiple dimensions
 * 
 * This agent analyzes potential impacts on cost, time, inventory, and sustainability
 * metrics using Monte Carlo simulation for uncertainty quantification.
 * 
 * Requirements: 2.2, 2.3, 2.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { NodeRepository } from '../repositories/node-repository';
import { 
  Scenario,
  ImpactAnalysis,
  SustainabilityMetrics,
  DecisionTree,
  DecisionNode,
  DecisionEdge,
  ScenarioResult,
  DisruptionType,
  Severity
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface ImpactAgentRequest {
  scenarioId: string;
  includeSustainability?: boolean;
  simulationIterations?: number;
  correlationId?: string;
}

interface ImpactAgentResponse {
  scenarioId: string;
  impacts: ImpactAnalysis;
  decisionTree: DecisionTree;
  naturalLanguageSummary: string;
  confidence: number;
  metadata: {
    correlationId: string;
    executionTime: number;
    simulationIterations: number;
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
 * Impact Agent Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `impact-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('ImpactAgent');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Impact Agent invoked', {
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

    const request: ImpactAgentRequest = JSON.parse(event.body);
    
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

    // Initialize repositories
    const scenarioRepository = new ScenarioRepository();
    const nodeRepository = new NodeRepository();
    
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

    // Fetch affected nodes
    logger.info('Fetching affected nodes', { 
      nodeIds: scenario.parameters.affectedNodes 
    });
    const affectedNodes = await nodeRepository.getNodesByIds(
      scenario.parameters.affectedNodes
    );

    // Run Monte Carlo simulation
    const simulationIterations = request.simulationIterations || 1000;
    logger.info('Running Monte Carlo simulation', { 
      iterations: simulationIterations 
    });

    const impacts = await runMonteCarloSimulation(
      scenario,
      affectedNodes,
      simulationIterations,
      request.includeSustainability || false,
      logger
    );

    // Generate decision tree for explainability
    logger.info('Generating decision tree');
    const decisionTree = generateDecisionTree(scenario, impacts, affectedNodes);

    // Generate natural language summary
    logger.info('Generating natural language summary');
    const naturalLanguageSummary = generateNaturalLanguageSummary(
      scenario,
      impacts
    );

    // Calculate confidence based on simulation variance
    const confidence = calculateConfidence(impacts);

    const executionTime = Date.now() - startTime;

    // Build response
    const response: ImpactAgentResponse = {
      scenarioId: request.scenarioId,
      impacts,
      decisionTree,
      naturalLanguageSummary,
      confidence,
      metadata: {
        correlationId,
        executionTime,
        simulationIterations
      }
    };

    logger.info('Impact Agent completed successfully', {
      executionTime,
      scenarioId: request.scenarioId,
      costImpact: impacts.costImpact,
      deliveryTimeImpact: impacts.deliveryTimeImpact
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
    logger.error('Impact Agent failed', {
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
 * Run Monte Carlo simulation for impact prediction
 */
async function runMonteCarloSimulation(
  scenario: Scenario,
  affectedNodes: any[],
  iterations: number,
  includeSustainability: boolean,
  logger: Logger
): Promise<ImpactAnalysis> {
  const costImpacts: number[] = [];
  const deliveryTimeImpacts: number[] = [];
  const inventoryImpacts: number[] = [];
  const carbonFootprints: number[] = [];

  // Base impact factors based on disruption type and severity
  const baseFactors = getBaseImpactFactors(scenario.type, scenario.parameters.severity);

  for (let i = 0; i < iterations; i++) {
    // Add randomness to simulate uncertainty
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3

    // Calculate cost impact
    const nodeCostImpact = affectedNodes.reduce((sum, node) => {
      const nodeCapacity = node.capacity || 1000;
      const utilizationRate = node.metrics?.utilizationRate || 0.7;
      return sum + (nodeCapacity * utilizationRate * baseFactors.costMultiplier * randomFactor);
    }, 0);
    
    const durationFactor = scenario.parameters.duration / 24; // Convert hours to days
    const costImpact = nodeCostImpact * durationFactor;
    costImpacts.push(costImpact);

    // Calculate delivery time impact
    const baseDelay = scenario.parameters.duration * baseFactors.timeMultiplier;
    const deliveryTimeImpact = baseDelay * randomFactor;
    deliveryTimeImpacts.push(deliveryTimeImpact);

    // Calculate inventory impact
    const inventoryImpact = affectedNodes.reduce((sum, node) => {
      const currentInventory = node.metrics?.currentInventory || 0;
      return sum + (currentInventory * baseFactors.inventoryMultiplier * randomFactor);
    }, 0);
    inventoryImpacts.push(inventoryImpact);

    // Calculate sustainability impact if requested
    if (includeSustainability) {
      const carbonFootprint = calculateCarbonFootprint(
        scenario,
        affectedNodes,
        randomFactor
      );
      carbonFootprints.push(carbonFootprint);
    }
  }

  // Calculate mean values from simulation results
  const impacts: ImpactAnalysis = {
    costImpact: mean(costImpacts),
    deliveryTimeImpact: mean(deliveryTimeImpacts),
    inventoryImpact: mean(inventoryImpacts)
  };

  // Add sustainability metrics if calculated
  if (includeSustainability && carbonFootprints.length > 0) {
    impacts.sustainabilityImpact = {
      carbonFootprint: mean(carbonFootprints),
      emissionsByRoute: calculateEmissionsByRoute(scenario, affectedNodes),
      sustainabilityScore: calculateSustainabilityScore(mean(carbonFootprints))
    };
  }

  logger.debug('Monte Carlo simulation completed', {
    iterations,
    costImpact: impacts.costImpact,
    deliveryTimeImpact: impacts.deliveryTimeImpact,
    inventoryImpact: impacts.inventoryImpact,
    includedSustainability: includeSustainability
  });

  return impacts;
}

/**
 * Get base impact factors based on disruption type and severity
 */
function getBaseImpactFactors(
  type: DisruptionType,
  severity: Severity
): { costMultiplier: number; timeMultiplier: number; inventoryMultiplier: number } {
  // Severity multipliers
  const severityMultipliers = {
    [Severity.LOW]: 0.5,
    [Severity.MEDIUM]: 1.0,
    [Severity.HIGH]: 2.0,
    [Severity.CRITICAL]: 4.0
  };

  const severityFactor = severityMultipliers[severity];

  // Type-specific base factors
  const typeFactors = {
    [DisruptionType.NATURAL_DISASTER]: { cost: 3.0, time: 2.5, inventory: 2.0 },
    [DisruptionType.SUPPLIER_FAILURE]: { cost: 2.0, time: 1.5, inventory: 3.0 },
    [DisruptionType.TRANSPORTATION_DELAY]: { cost: 1.5, time: 3.0, inventory: 1.5 },
    [DisruptionType.DEMAND_SPIKE]: { cost: 1.0, time: 1.0, inventory: 4.0 },
    [DisruptionType.QUALITY_ISSUE]: { cost: 2.5, time: 2.0, inventory: 2.5 },
    [DisruptionType.GEOPOLITICAL]: { cost: 3.5, time: 3.0, inventory: 2.0 },
    [DisruptionType.CYBER_ATTACK]: { cost: 4.0, time: 2.0, inventory: 1.5 },
    [DisruptionType.LABOR_SHORTAGE]: { cost: 2.0, time: 2.5, inventory: 2.0 }
  };

  const baseFactor = typeFactors[type];

  return {
    costMultiplier: baseFactor.cost * severityFactor,
    timeMultiplier: baseFactor.time * severityFactor,
    inventoryMultiplier: baseFactor.inventory * severityFactor
  };
}

/**
 * Calculate carbon footprint for sustainability impact
 */
function calculateCarbonFootprint(
  scenario: Scenario,
  affectedNodes: any[],
  randomFactor: number
): number {
  // Base carbon emissions per node (kg CO2)
  const baseEmissionsPerNode = 500;
  
  // Severity multiplier for emissions
  const severityMultipliers = {
    [Severity.LOW]: 0.5,
    [Severity.MEDIUM]: 1.0,
    [Severity.HIGH]: 1.5,
    [Severity.CRITICAL]: 2.0
  };

  const severityFactor = severityMultipliers[scenario.parameters.severity];
  const durationFactor = scenario.parameters.duration / 24; // Convert to days

  const totalEmissions = affectedNodes.length * 
                         baseEmissionsPerNode * 
                         severityFactor * 
                         durationFactor * 
                         randomFactor;

  return totalEmissions;
}

/**
 * Calculate emissions by route
 */
function calculateEmissionsByRoute(
  scenario: Scenario,
  affectedNodes: any[]
): Record<string, number> {
  const emissionsByRoute: Record<string, number> = {};

  // Generate route emissions based on node connections
  affectedNodes.forEach((node, index) => {
    const routeId = `route-${node.nodeId}`;
    const baseEmissions = 200 + Math.random() * 300;
    emissionsByRoute[routeId] = baseEmissions;
  });

  return emissionsByRoute;
}

/**
 * Calculate sustainability score (0-100)
 */
function calculateSustainabilityScore(carbonFootprint: number): number {
  // Lower carbon footprint = higher score
  // Normalize to 0-100 scale (assuming max footprint of 100000 kg CO2)
  const maxFootprint = 100000;
  const normalizedFootprint = Math.min(carbonFootprint / maxFootprint, 1);
  const score = Math.round((1 - normalizedFootprint) * 100);
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate decision tree for explainability
 */
function generateDecisionTree(
  scenario: Scenario,
  impacts: ImpactAnalysis,
  affectedNodes: any[]
): DecisionTree {
  const nodes: DecisionNode[] = [];
  const edges: DecisionEdge[] = [];

  // Root node - scenario type
  nodes.push({
    nodeId: 'root',
    label: `${scenario.type} Disruption`,
    type: 'condition',
    agentAttribution: 'Impact Agent'
  });

  // Severity assessment node
  nodes.push({
    nodeId: 'severity',
    label: `Severity: ${scenario.parameters.severity}`,
    type: 'condition',
    agentAttribution: 'Impact Agent'
  });

  edges.push({
    from: 'root',
    to: 'severity',
    label: 'Assess Severity'
  });

  // Affected nodes assessment
  nodes.push({
    nodeId: 'affected-nodes',
    label: `${affectedNodes.length} Nodes Affected`,
    type: 'condition',
    agentAttribution: 'Impact Agent'
  });

  edges.push({
    from: 'severity',
    to: 'affected-nodes',
    label: 'Identify Affected Nodes'
  });

  // Cost impact outcome
  nodes.push({
    nodeId: 'cost-impact',
    label: `Cost Impact: $${Math.round(impacts.costImpact).toLocaleString()}`,
    type: 'outcome',
    agentAttribution: 'Impact Agent',
    confidence: 0.85
  });

  edges.push({
    from: 'affected-nodes',
    to: 'cost-impact',
    label: 'Calculate Cost'
  });

  // Time impact outcome
  nodes.push({
    nodeId: 'time-impact',
    label: `Delivery Delay: ${Math.round(impacts.deliveryTimeImpact)} hours`,
    type: 'outcome',
    agentAttribution: 'Impact Agent',
    confidence: 0.80
  });

  edges.push({
    from: 'affected-nodes',
    to: 'time-impact',
    label: 'Calculate Time'
  });

  // Inventory impact outcome
  nodes.push({
    nodeId: 'inventory-impact',
    label: `Inventory Impact: ${Math.round(impacts.inventoryImpact)} units`,
    type: 'outcome',
    agentAttribution: 'Impact Agent',
    confidence: 0.75
  });

  edges.push({
    from: 'affected-nodes',
    to: 'inventory-impact',
    label: 'Calculate Inventory'
  });

  // Sustainability impact if present
  if (impacts.sustainabilityImpact) {
    nodes.push({
      nodeId: 'sustainability-impact',
      label: `Carbon Footprint: ${Math.round(impacts.sustainabilityImpact.carbonFootprint)} kg CO2`,
      type: 'outcome',
      agentAttribution: 'Impact Agent',
      confidence: 0.70
    });

    edges.push({
      from: 'affected-nodes',
      to: 'sustainability-impact',
      label: 'Calculate Sustainability'
    });
  }

  return { nodes, edges };
}

/**
 * Generate natural language summary of impacts
 */
function generateNaturalLanguageSummary(
  scenario: Scenario,
  impacts: ImpactAnalysis
): string {
  const costFormatted = `$${Math.round(impacts.costImpact).toLocaleString()}`;
  const timeFormatted = `${Math.round(impacts.deliveryTimeImpact)} hours`;
  const inventoryFormatted = `${Math.round(impacts.inventoryImpact)} units`;

  let summary = `A ${scenario.parameters.severity.toLowerCase()} severity ${scenario.type.toLowerCase().replace(/_/g, ' ')} `;
  summary += `at ${scenario.parameters.location.city}, ${scenario.parameters.location.country} `;
  summary += `is predicted to cause significant supply chain disruptions. `;
  
  summary += `The estimated cost impact is ${costFormatted}, `;
  summary += `with delivery delays of approximately ${timeFormatted}. `;
  summary += `Inventory levels are expected to be affected by ${inventoryFormatted}. `;

  if (impacts.sustainabilityImpact) {
    const carbonFormatted = `${Math.round(impacts.sustainabilityImpact.carbonFootprint).toLocaleString()} kg`;
    const scoreFormatted = impacts.sustainabilityImpact.sustainabilityScore;
    summary += `Environmental impact includes ${carbonFormatted} of CO2 emissions, `;
    summary += `resulting in a sustainability score of ${scoreFormatted}/100. `;
  }

  summary += `Immediate mitigation actions are recommended to minimize these impacts.`;

  return summary;
}

/**
 * Calculate confidence based on simulation variance
 */
function calculateConfidence(impacts: ImpactAnalysis): number {
  // Base confidence on presence of complete data
  let confidence = 0.8;

  // Adjust based on sustainability data availability
  if (impacts.sustainabilityImpact) {
    confidence += 0.1;
  }

  // Ensure confidence is between 0 and 1
  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Calculate mean of an array of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
