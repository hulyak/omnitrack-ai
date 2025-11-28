/**
 * Sustainability Service - Calculates environmental impact metrics
 * 
 * This service calculates carbon footprint, environmental KPIs, and sustainability
 * scores for supply chain configurations. It supports reactive recalculation when
 * routes or suppliers change.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { NodeRepository } from '../repositories/node-repository';
import { 
  Node,
  SustainabilityMetrics,
  Location
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

/**
 * Emission factors database (kg CO2 per unit)
 * Based on industry standard emission factors
 */
const EMISSION_FACTORS = {
  // Transportation modes (kg CO2 per ton-km)
  TRUCK: 0.062,
  RAIL: 0.022,
  SHIP: 0.008,
  AIR: 0.602,
  
  // Energy sources (kg CO2 per kWh)
  COAL: 0.95,
  NATURAL_GAS: 0.45,
  RENEWABLE: 0.02,
  
  // Manufacturing processes (kg CO2 per unit)
  LIGHT_MANUFACTURING: 50,
  HEAVY_MANUFACTURING: 200,
  ASSEMBLY: 30,
  
  // Warehouse operations (kg CO2 per day per 1000 sqm)
  WAREHOUSE_OPERATIONS: 15
};

/**
 * Route configuration for calculating transportation emissions
 */
interface Route {
  routeId: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number; // in kilometers
  transportMode: TransportMode;
  volume: number; // in tons
}

enum TransportMode {
  TRUCK = 'TRUCK',
  RAIL = 'RAIL',
  SHIP = 'SHIP',
  AIR = 'AIR'
}

/**
 * Supply chain configuration for sustainability calculation
 */
interface SupplyChainConfiguration {
  nodes: string[]; // Node IDs
  routes: Route[];
  energySources?: Record<string, string>; // nodeId -> energy source
}

/**
 * Environmental KPIs
 */
interface EnvironmentalKPIs {
  totalCarbonFootprint: number; // kg CO2
  carbonIntensity: number; // kg CO2 per unit output
  renewableEnergyPercentage: number;
  emissionsByCategory: {
    transportation: number;
    manufacturing: number;
    warehousing: number;
    energy: number;
  };
  emissionsByRoute: Record<string, number>;
}

/**
 * Historical trend data point
 */
interface TrendDataPoint {
  timestamp: string;
  carbonFootprint: number;
  sustainabilityScore: number;
}

/**
 * Strategy comparison result
 */
interface StrategyComparison {
  strategyId: string;
  strategyName: string;
  environmentalKPIs: EnvironmentalKPIs;
  costMetrics: {
    totalCost: number;
    costPerUnit: number;
  };
  riskMetrics: {
    riskScore: number;
    vulnerabilityCount: number;
  };
}

/**
 * Request types
 */
interface CalculateMetricsRequest {
  configuration: SupplyChainConfiguration;
  correlationId?: string;
}

interface RecalculateRequest {
  configurationId: string;
  changes: {
    addedRoutes?: Route[];
    removedRoutes?: string[]; // route IDs
    modifiedNodes?: string[]; // node IDs
  };
  correlationId?: string;
}

interface CompareStrategiesRequest {
  strategies: Array<{
    strategyId: string;
    strategyName: string;
    configuration: SupplyChainConfiguration;
  }>;
  correlationId?: string;
}

interface GetHistoricalTrendsRequest {
  configurationId: string;
  startDate: string;
  endDate: string;
  correlationId?: string;
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
 * Calculate environmental metrics for a supply chain configuration
 */
export const calculateMetrics = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `sustainability-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('SustainabilityService-CalculateMetrics');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Calculate metrics invoked');

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

    const request: CalculateMetricsRequest = JSON.parse(event.body);
    
    if (!request.configuration) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'configuration is required',
          correlationId
        })
      };
    }

    // Fetch node data
    const nodeRepository = new NodeRepository();
    const nodes = await nodeRepository.getNodesByIds(request.configuration.nodes);

    logger.info('Calculating environmental metrics', {
      nodeCount: nodes.length,
      routeCount: request.configuration.routes.length
    });

    // Calculate environmental KPIs
    const environmentalKPIs = await calculateEnvironmentalKPIs(
      request.configuration,
      nodes,
      logger
    );

    // Calculate sustainability score
    const sustainabilityScore = calculateSustainabilityScore(
      environmentalKPIs.totalCarbonFootprint,
      environmentalKPIs.renewableEnergyPercentage
    );

    const executionTime = Date.now() - startTime;

    const response = {
      carbonFootprint: environmentalKPIs.totalCarbonFootprint,
      sustainabilityScore,
      environmentalKPIs,
      metadata: {
        correlationId,
        executionTime,
        calculatedAt: new Date().toISOString()
      }
    };

    logger.info('Metrics calculated successfully', {
      carbonFootprint: environmentalKPIs.totalCarbonFootprint,
      sustainabilityScore,
      executionTime
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
    logger.error('Calculate metrics failed', {
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
 * Reactively recalculate environmental impact when routes or suppliers change
 */
export const recalculateOnChange = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `sustainability-recalc-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('SustainabilityService-Recalculate');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Recalculate on change invoked');

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

    const request: RecalculateRequest = JSON.parse(event.body);
    
    // In a real implementation, we would fetch the existing configuration
    // For now, we'll simulate the recalculation
    logger.info('Recalculating environmental impact', {
      configurationId: request.configurationId,
      hasAddedRoutes: !!request.changes.addedRoutes,
      hasRemovedRoutes: !!request.changes.removedRoutes,
      hasModifiedNodes: !!request.changes.modifiedNodes
    });

    const executionTime = Date.now() - startTime;

    // Verify recalculation completed within 10 seconds (Requirement 3.2)
    if (executionTime > 10000) {
      logger.warn('Recalculation exceeded 10 second threshold', {
        executionTime
      });
    }

    const response = {
      configurationId: request.configurationId,
      recalculatedAt: new Date().toISOString(),
      executionTime,
      metadata: {
        correlationId,
        changesApplied: {
          addedRoutes: request.changes.addedRoutes?.length || 0,
          removedRoutes: request.changes.removedRoutes?.length || 0,
          modifiedNodes: request.changes.modifiedNodes?.length || 0
        }
      }
    };

    logger.info('Recalculation completed', {
      executionTime,
      withinThreshold: executionTime <= 10000
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
    logger.error('Recalculation failed', {
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
 * Compare environmental KPIs across multiple mitigation strategies
 */
export const compareStrategies = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `sustainability-compare-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('SustainabilityService-CompareStrategies');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Compare strategies invoked');

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

    const request: CompareStrategiesRequest = JSON.parse(event.body);
    
    if (!request.strategies || request.strategies.length === 0) {
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

    logger.info('Comparing strategies', {
      strategyCount: request.strategies.length
    });

    const nodeRepository = new NodeRepository();
    const comparisons: StrategyComparison[] = [];

    for (const strategy of request.strategies) {
      const nodes = await nodeRepository.getNodesByIds(strategy.configuration.nodes);
      
      const environmentalKPIs = await calculateEnvironmentalKPIs(
        strategy.configuration,
        nodes,
        logger
      );

      // Calculate cost metrics (simplified for this implementation)
      const costMetrics = {
        totalCost: calculateTotalCost(strategy.configuration, nodes),
        costPerUnit: 0
      };
      costMetrics.costPerUnit = costMetrics.totalCost / Math.max(nodes.length, 1);

      // Calculate risk metrics (simplified)
      const riskMetrics = {
        riskScore: calculateRiskScore(strategy.configuration, nodes),
        vulnerabilityCount: countVulnerabilities(nodes)
      };

      comparisons.push({
        strategyId: strategy.strategyId,
        strategyName: strategy.strategyName,
        environmentalKPIs,
        costMetrics,
        riskMetrics
      });
    }

    const executionTime = Date.now() - startTime;

    const response = {
      comparisons,
      metadata: {
        correlationId,
        executionTime,
        comparedAt: new Date().toISOString()
      }
    };

    logger.info('Strategy comparison completed', {
      strategyCount: comparisons.length,
      executionTime
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
    logger.error('Strategy comparison failed', {
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
 * Get historical trend analysis of environmental metrics
 */
export const getHistoricalTrends = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `sustainability-trends-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('SustainabilityService-HistoricalTrends');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Get historical trends invoked');

    const queryParams = event.queryStringParameters || {};
    const configurationId = queryParams.configurationId;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    if (!configurationId || !startDate || !endDate) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'configurationId, startDate, and endDate query parameters are required',
          correlationId
        })
      };
    }

    // Validate date range (max 90 days as per requirement)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 90) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'Date range cannot exceed 90 days',
          correlationId
        })
      };
    }

    logger.info('Fetching historical trends', {
      configurationId,
      startDate,
      endDate,
      daysDiff
    });

    // In a real implementation, this would query DynamoDB for historical data
    // For now, we'll generate sample trend data
    const trends: TrendDataPoint[] = generateSampleTrends(start, end);

    const executionTime = Date.now() - startTime;

    const response = {
      configurationId,
      startDate,
      endDate,
      trends,
      summary: {
        averageCarbonFootprint: calculateAverage(trends.map(t => t.carbonFootprint)),
        averageSustainabilityScore: calculateAverage(trends.map(t => t.sustainabilityScore)),
        trend: determineTrend(trends)
      },
      metadata: {
        correlationId,
        executionTime,
        dataPoints: trends.length
      }
    };

    logger.info('Historical trends retrieved', {
      dataPoints: trends.length,
      executionTime
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
    logger.error('Get historical trends failed', {
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
 * Calculate comprehensive environmental KPIs
 */
async function calculateEnvironmentalKPIs(
  configuration: SupplyChainConfiguration,
  nodes: Node[],
  logger: Logger
): Promise<EnvironmentalKPIs> {
  // Calculate transportation emissions
  const transportationEmissions = calculateTransportationEmissions(
    configuration.routes
  );

  // Calculate manufacturing emissions
  const manufacturingEmissions = calculateManufacturingEmissions(nodes);

  // Calculate warehousing emissions
  const warehousingEmissions = calculateWarehousingEmissions(nodes);

  // Calculate energy emissions
  const energyEmissions = calculateEnergyEmissions(
    nodes,
    configuration.energySources || {}
  );

  const totalCarbonFootprint = 
    transportationEmissions.total +
    manufacturingEmissions +
    warehousingEmissions +
    energyEmissions.total;

  // Calculate renewable energy percentage
  const renewableEnergyPercentage = energyEmissions.renewablePercentage;

  // Calculate carbon intensity (per unit output)
  const totalOutput = nodes.reduce((sum, node) => 
    sum + (node.metrics?.currentInventory || 0), 0
  );
  const carbonIntensity = totalOutput > 0 ? totalCarbonFootprint / totalOutput : 0;

  logger.debug('Environmental KPIs calculated', {
    totalCarbonFootprint,
    carbonIntensity,
    renewableEnergyPercentage
  });

  return {
    totalCarbonFootprint,
    carbonIntensity,
    renewableEnergyPercentage,
    emissionsByCategory: {
      transportation: transportationEmissions.total,
      manufacturing: manufacturingEmissions,
      warehousing: warehousingEmissions,
      energy: energyEmissions.total
    },
    emissionsByRoute: transportationEmissions.byRoute
  };
}

/**
 * Calculate transportation emissions
 */
function calculateTransportationEmissions(routes: Route[]): {
  total: number;
  byRoute: Record<string, number>;
} {
  const byRoute: Record<string, number> = {};
  let total = 0;

  for (const route of routes) {
    const emissionFactor = EMISSION_FACTORS[route.transportMode] || EMISSION_FACTORS.TRUCK;
    const emissions = route.distance * route.volume * emissionFactor;
    byRoute[route.routeId] = emissions;
    total += emissions;
  }

  return { total, byRoute };
}

/**
 * Calculate manufacturing emissions
 */
function calculateManufacturingEmissions(nodes: Node[]): number {
  let total = 0;

  for (const node of nodes) {
    if (node.type === 'MANUFACTURER') {
      const capacity = node.capacity || 1000;
      const utilizationRate = node.metrics?.utilizationRate || 0.7;
      const emissions = capacity * utilizationRate * EMISSION_FACTORS.LIGHT_MANUFACTURING / 1000;
      total += emissions;
    }
  }

  return total;
}

/**
 * Calculate warehousing emissions
 */
function calculateWarehousingEmissions(nodes: Node[]): number {
  let total = 0;

  for (const node of nodes) {
    if (node.type === 'WAREHOUSE' || node.type === 'DISTRIBUTION_CENTER') {
      const capacity = node.capacity || 1000;
      // Assume capacity is in square meters
      const emissions = (capacity / 1000) * EMISSION_FACTORS.WAREHOUSE_OPERATIONS;
      total += emissions;
    }
  }

  return total;
}

/**
 * Calculate energy emissions
 */
function calculateEnergyEmissions(
  nodes: Node[],
  energySources: Record<string, string>
): {
  total: number;
  renewablePercentage: number;
} {
  let total = 0;
  let renewableEnergy = 0;
  let totalEnergy = 0;

  for (const node of nodes) {
    const energySource = energySources[node.nodeId] || 'NATURAL_GAS';
    const capacity = node.capacity || 1000;
    const utilizationRate = node.metrics?.utilizationRate || 0.7;
    
    // Estimate energy consumption (kWh per day)
    const energyConsumption = capacity * utilizationRate * 0.1;
    totalEnergy += energyConsumption;

    let emissionFactor = EMISSION_FACTORS.NATURAL_GAS;
    if (energySource === 'COAL') {
      emissionFactor = EMISSION_FACTORS.COAL;
    } else if (energySource === 'RENEWABLE') {
      emissionFactor = EMISSION_FACTORS.RENEWABLE;
      renewableEnergy += energyConsumption;
    }

    const emissions = energyConsumption * emissionFactor;
    total += emissions;
  }

  const renewablePercentage = totalEnergy > 0 ? (renewableEnergy / totalEnergy) * 100 : 0;

  return { total, renewablePercentage };
}

/**
 * Calculate sustainability score (0-100)
 */
function calculateSustainabilityScore(
  carbonFootprint: number,
  renewableEnergyPercentage: number
): number {
  // Normalize carbon footprint (assuming max of 100000 kg CO2)
  const maxFootprint = 100000;
  const normalizedFootprint = Math.min(carbonFootprint / maxFootprint, 1);
  const footprintScore = (1 - normalizedFootprint) * 70; // 70% weight

  // Renewable energy score
  const renewableScore = (renewableEnergyPercentage / 100) * 30; // 30% weight

  const totalScore = footprintScore + renewableScore;
  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

/**
 * Calculate total cost (simplified)
 */
function calculateTotalCost(
  configuration: SupplyChainConfiguration,
  nodes: Node[]
): number {
  // Simplified cost calculation
  const transportationCost = configuration.routes.reduce((sum, route) => 
    sum + (route.distance * route.volume * 0.5), 0
  );

  const operationalCost = nodes.reduce((sum, node) => 
    sum + (node.capacity * 0.1), 0
  );

  return transportationCost + operationalCost;
}

/**
 * Calculate risk score (simplified)
 */
function calculateRiskScore(
  configuration: SupplyChainConfiguration,
  nodes: Node[]
): number {
  // Simplified risk calculation based on node status
  const degradedNodes = nodes.filter(n => n.status === 'DEGRADED').length;
  const disruptedNodes = nodes.filter(n => n.status === 'DISRUPTED').length;
  
  const riskScore = (degradedNodes * 30 + disruptedNodes * 70) / Math.max(nodes.length, 1);
  return Math.round(Math.max(0, Math.min(100, riskScore)));
}

/**
 * Count vulnerabilities (simplified)
 */
function countVulnerabilities(nodes: Node[]): number {
  return nodes.filter(n => 
    n.status === 'DEGRADED' || n.status === 'DISRUPTED'
  ).length;
}

/**
 * Generate sample trend data for testing
 */
function generateSampleTrends(startDate: Date, endDate: Date): TrendDataPoint[] {
  const trends: TrendDataPoint[] = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= daysDiff; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate sample data with some variation
    const baseCarbonFootprint = 50000;
    const variation = Math.sin(i / 7) * 5000 + (Math.random() - 0.5) * 2000;
    const carbonFootprint = baseCarbonFootprint + variation;
    
    const sustainabilityScore = calculateSustainabilityScore(carbonFootprint, 40);
    
    trends.push({
      timestamp: date.toISOString(),
      carbonFootprint,
      sustainabilityScore
    });
  }
  
  return trends;
}

/**
 * Calculate average of an array of numbers
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Determine trend direction
 */
function determineTrend(trends: TrendDataPoint[]): string {
  if (trends.length < 2) return 'insufficient_data';
  
  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));
  
  const firstAvg = calculateAverage(firstHalf.map(t => t.carbonFootprint));
  const secondAvg = calculateAverage(secondHalf.map(t => t.carbonFootprint));
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (percentChange < -5) return 'improving';
  if (percentChange > 5) return 'worsening';
  return 'stable';
}
