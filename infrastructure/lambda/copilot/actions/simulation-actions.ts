/**
 * Simulation Actions for AI Copilot
 * 
 * Implements actions for running simulations and what-if scenarios.
 * These actions handle the "Simulate" category of copilot operations.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { DisruptionType, Severity, Location } from '../../models/types';
import { logger } from '../../utils/logger';

/**
 * Helper function to create validation function for parameters
 */
function createValidator(parameters: ParameterSchema[]): (params: any) => ValidationResult {
  return (params: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!params || typeof params !== 'object') {
      return { valid: false, errors: ['Parameters must be an object'] };
    }
    
    for (const param of parameters) {
      const value = params[param.name];
      
      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }
      
      // Skip validation if parameter is optional and not provided
      if (!param.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== param.type) {
        errors.push(`Parameter '${param.name}' must be of type ${param.type}, got ${actualType}`);
        continue;
      }
      
      // Custom validation
      if (param.validation && !param.validation(value)) {
        errors.push(`Parameter '${param.name}' failed validation`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
}

/**
 * Helper function to invoke Scenario Agent
 */
async function invokeScenarioAgent(
  type: DisruptionType,
  location: Location,
  severity: Severity,
  duration: number,
  affectedNodes: string[],
  userId: string,
  customParameters?: Record<string, any>
): Promise<any> {
  try {
    // In production, this would make an HTTP request to the Scenario Agent API
    // For now, we'll simulate the response structure
    const scenarioAgentEndpoint = process.env.SCENARIO_AGENT_ENDPOINT || 'http://localhost:3000/api/agents/scenario';
    
    const requestBody = {
      type,
      location,
      severity,
      duration,
      affectedNodes,
      userId,
      customParameters,
      correlationId: `sim-${Date.now()}`
    };
    
    logger.info('Invoking Scenario Agent', { 
      endpoint: scenarioAgentEndpoint,
      type,
      severity 
    });
    
    // Simulate scenario agent response
    // In production, replace with actual HTTP call
    const response = {
      scenario: {
        scenarioId: `scenario-${Date.now()}`,
        type,
        parameters: {
          location,
          severity,
          duration,
          affectedNodes,
          customParameters
        },
        createdAt: new Date().toISOString(),
        createdBy: userId
      },
      metadata: {
        correlationId: requestBody.correlationId,
        executionTime: Math.floor(Math.random() * 2000) + 500,
        generationMethod: 'bedrock-llm'
      }
    };
    
    logger.info('Scenario Agent response received', { 
      scenarioId: response.scenario.scenarioId,
      executionTime: response.metadata.executionTime
    });
    
    return response;
  } catch (error) {
    logger.error('Failed to invoke Scenario Agent', error as Error, { type, severity });
    throw error;
  }
}

/**
 * Run Simulation Action
 * 
 * Executes a general simulation by calling the Scenario Agent
 */
export const runSimulationAction: Action = {
  name: 'run-simulation',
  category: 'simulate',
  description: 'Run a custom simulation scenario on the supply chain network',
  examples: [
    'Run a simulation',
    'Simulate a disruption',
    'Execute a scenario'
  ],
  parameters: [
    {
      name: 'type',
      type: 'string',
      required: true,
      description: 'Type of disruption to simulate',
      validation: (value: any) => Object.values(DisruptionType).includes(value as DisruptionType)
    },
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the disruption',
      validation: (value: any) => {
        return value && 
               typeof value.latitude === 'number' &&
               typeof value.longitude === 'number' &&
               typeof value.city === 'string' &&
               typeof value.country === 'string';
      }
    },
    {
      name: 'severity',
      type: 'string',
      required: true,
      description: 'Severity level of the disruption',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration of the disruption in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'affectedNodes',
      type: 'array',
      required: false,
      description: 'Array of node IDs affected by the disruption (defaults to all nodes)',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ],
  validate: createValidator([
    {
      name: 'type',
      type: 'string',
      required: true,
      description: 'Type of disruption',
      validation: (value: any) => Object.values(DisruptionType).includes(value as DisruptionType)
    },
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location object',
      validation: (value: any) => {
        return value && 
               typeof value.latitude === 'number' &&
               typeof value.longitude === 'number' &&
               typeof value.city === 'string' &&
               typeof value.country === 'string';
      }
    },
    {
      name: 'severity',
      type: 'string',
      required: true,
      description: 'Severity level',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'affectedNodes',
      type: 'array',
      required: false,
      description: 'Affected node IDs',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing run-simulation action', { userId: context.userId, params });
      
      // Get affected nodes (default to all nodes if not specified)
      const affectedNodes = params.affectedNodes || context.nodes?.map(n => n.nodeId) || [];
      
      if (affectedNodes.length === 0) {
        return {
          success: false,
          error: 'No nodes available to simulate. Please add nodes to your supply chain first.'
        };
      }
      
      // Invoke Scenario Agent
      const scenarioResponse = await invokeScenarioAgent(
        params.type,
        params.location,
        params.severity,
        params.duration,
        affectedNodes,
        context.userId
      );
      
      logger.info('Simulation completed', { 
        userId: context.userId,
        scenarioId: scenarioResponse.scenario.scenarioId
      });
      
      return {
        success: true,
        data: {
          scenario: scenarioResponse.scenario,
          affectedNodesCount: affectedNodes.length,
          estimatedImpact: calculateEstimatedImpact(params.severity, affectedNodes.length),
          executionTime: scenarioResponse.metadata.executionTime,
          timestamp: new Date().toISOString()
        },
        suggestions: [
          'Review the scenario results to understand potential impacts',
          'Compare with other scenarios to evaluate alternatives',
          'Use the insights to develop mitigation strategies'
        ]
      };
    } catch (error) {
      logger.error('Failed to run simulation', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to run simulation. Please try again.'
      };
    }
  }
};

/**
 * What-If Port Closure Action
 * 
 * Simulates the impact of a port closure
 */
export const whatIfPortClosureAction: Action = {
  name: 'what-if-port-closure',
  category: 'simulate',
  description: 'Simulate the impact of a port closure on the supply chain',
  examples: [
    'What if a port closes?',
    'Simulate port closure',
    'What happens if the port shuts down?'
  ],
  parameters: [
    {
      name: 'portLocation',
      type: 'object',
      required: true,
      description: 'Location of the port',
      validation: (value: any) => {
        return value && 
               typeof value.latitude === 'number' &&
               typeof value.longitude === 'number' &&
               typeof value.city === 'string' &&
               typeof value.country === 'string';
      }
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration of the closure in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'severity',
      type: 'string',
      required: false,
      description: 'Severity level (defaults to HIGH)',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    }
  ],
  validate: createValidator([
    {
      name: 'portLocation',
      type: 'object',
      required: true,
      description: 'Port location',
      validation: (value: any) => {
        return value && 
               typeof value.latitude === 'number' &&
               typeof value.longitude === 'number' &&
               typeof value.city === 'string' &&
               typeof value.country === 'string';
      }
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'severity',
      type: 'string',
      required: false,
      description: 'Severity level',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing what-if-port-closure action', { userId: context.userId, params });
      
      // Find nodes near the port location
      const affectedNodes = findNodesNearLocation(
        context.nodes || [],
        params.portLocation,
        200 // 200km radius
      );
      
      if (affectedNodes.length === 0) {
        return {
          success: false,
          error: 'No nodes found near the specified port location. Please check the location or add nodes in that area.'
        };
      }
      
      const severity = params.severity || Severity.HIGH;
      
      // Invoke Scenario Agent with port closure parameters
      const scenarioResponse = await invokeScenarioAgent(
        DisruptionType.TRANSPORTATION_DELAY,
        params.portLocation,
        severity,
        params.duration,
        affectedNodes,
        context.userId,
        {
          disruptionReason: 'port_closure',
          portName: params.portLocation.city
        }
      );
      
      logger.info('Port closure simulation completed', { 
        userId: context.userId,
        scenarioId: scenarioResponse.scenario.scenarioId,
        affectedNodesCount: affectedNodes.length
      });
      
      return {
        success: true,
        data: {
          scenario: scenarioResponse.scenario,
          portLocation: params.portLocation,
          affectedNodesCount: affectedNodes.length,
          affectedNodeIds: affectedNodes,
          estimatedImpact: calculateEstimatedImpact(severity, affectedNodes.length),
          alternativeRoutes: suggestAlternativeRoutes(context.nodes || [], affectedNodes),
          timestamp: new Date().toISOString()
        },
        suggestions: [
          `Port closure at ${params.portLocation.city} would affect ${affectedNodes.length} nodes`,
          'Consider alternative shipping routes',
          'Evaluate backup port options',
          'Review inventory levels at affected nodes'
        ]
      };
    } catch (error) {
      logger.error('Failed to simulate port closure', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to simulate port closure. Please try again.'
      };
    }
  }
};

/**
 * What-If Supplier Failure Action
 * 
 * Simulates the impact of a supplier failure
 */
export const whatIfSupplierFailureAction: Action = {
  name: 'what-if-supplier-failure',
  category: 'simulate',
  description: 'Simulate the impact of a supplier failure on the supply chain',
  examples: [
    'What if a supplier fails?',
    'Simulate supplier failure',
    'What happens if the supplier goes down?'
  ],
  parameters: [
    {
      name: 'supplierId',
      type: 'string',
      required: true,
      description: 'ID of the supplier node',
      validation: (value: any) => typeof value === 'string' && value.length > 0
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration of the failure in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'severity',
      type: 'string',
      required: false,
      description: 'Severity level (defaults to CRITICAL)',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    }
  ],
  validate: createValidator([
    {
      name: 'supplierId',
      type: 'string',
      required: true,
      description: 'Supplier node ID',
      validation: (value: any) => typeof value === 'string' && value.length > 0
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'severity',
      type: 'string',
      required: false,
      description: 'Severity level',
      validation: (value: any) => Object.values(Severity).includes(value as Severity)
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing what-if-supplier-failure action', { userId: context.userId, params });
      
      // Find the supplier node
      const supplierNode = context.nodes?.find(n => n.nodeId === params.supplierId);
      
      if (!supplierNode) {
        return {
          success: false,
          error: `Supplier node '${params.supplierId}' not found. Please check the supplier ID.`
        };
      }
      
      if (supplierNode.type !== 'supplier') {
        return {
          success: false,
          error: `Node '${params.supplierId}' is not a supplier node. Please specify a valid supplier.`
        };
      }
      
      // Find downstream nodes affected by this supplier
      const affectedNodes = findDownstreamNodes(context.nodes || [], params.supplierId);
      affectedNodes.unshift(params.supplierId); // Include the supplier itself
      
      const severity = params.severity || Severity.CRITICAL;
      
      // Invoke Scenario Agent with supplier failure parameters
      const scenarioResponse = await invokeScenarioAgent(
        DisruptionType.SUPPLIER_FAILURE,
        supplierNode.location || { 
          latitude: 0, 
          longitude: 0, 
          address: 'Unknown', 
          city: 'Unknown', 
          country: 'Unknown' 
        },
        severity,
        params.duration,
        affectedNodes,
        context.userId,
        {
          disruptionReason: 'supplier_failure',
          supplierName: supplierNode.name || params.supplierId
        }
      );
      
      logger.info('Supplier failure simulation completed', { 
        userId: context.userId,
        scenarioId: scenarioResponse.scenario.scenarioId,
        affectedNodesCount: affectedNodes.length
      });
      
      return {
        success: true,
        data: {
          scenario: scenarioResponse.scenario,
          supplierNode: {
            id: supplierNode.nodeId,
            name: supplierNode.name,
            location: supplierNode.location
          },
          affectedNodesCount: affectedNodes.length,
          affectedNodeIds: affectedNodes,
          estimatedImpact: calculateEstimatedImpact(severity, affectedNodes.length),
          alternativeSuppliers: findAlternativeSuppliers(context.nodes || [], params.supplierId),
          timestamp: new Date().toISOString()
        },
        suggestions: [
          `Supplier failure would cascade to ${affectedNodes.length - 1} downstream nodes`,
          'Identify alternative suppliers',
          'Review inventory buffers',
          'Consider dual-sourcing strategy'
        ]
      };
    } catch (error) {
      logger.error('Failed to simulate supplier failure', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to simulate supplier failure. Please try again.'
      };
    }
  }
};

/**
 * What-If Demand Spike Action
 * 
 * Simulates the impact of a sudden demand spike
 */
export const whatIfDemandSpikeAction: Action = {
  name: 'what-if-demand-spike',
  category: 'simulate',
  description: 'Simulate the impact of a sudden demand spike on the supply chain',
  examples: [
    'What if demand spikes?',
    'Simulate demand increase',
    'What happens if demand doubles?'
  ],
  parameters: [
    {
      name: 'demandIncrease',
      type: 'number',
      required: true,
      description: 'Percentage increase in demand (e.g., 50 for 50% increase)',
      validation: (value: any) => typeof value === 'number' && value > 0 && value <= 1000
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration of the demand spike in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'affectedRegion',
      type: 'object',
      required: false,
      description: 'Geographic region affected by demand spike (optional)',
      validation: (value: any) => {
        return !value || (
          typeof value.latitude === 'number' &&
          typeof value.longitude === 'number' &&
          typeof value.city === 'string' &&
          typeof value.country === 'string'
        );
      }
    }
  ],
  validate: createValidator([
    {
      name: 'demandIncrease',
      type: 'number',
      required: true,
      description: 'Demand increase percentage',
      validation: (value: any) => typeof value === 'number' && value > 0 && value <= 1000
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Duration in hours',
      validation: (value: any) => typeof value === 'number' && value > 0
    },
    {
      name: 'affectedRegion',
      type: 'object',
      required: false,
      description: 'Affected region',
      validation: (value: any) => {
        return !value || (
          typeof value.latitude === 'number' &&
          typeof value.longitude === 'number' &&
          typeof value.city === 'string' &&
          typeof value.country === 'string'
        );
      }
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing what-if-demand-spike action', { userId: context.userId, params });
      
      // Determine affected nodes
      let affectedNodes: string[];
      let location: Location;
      
      if (params.affectedRegion) {
        // Find nodes in the affected region
        affectedNodes = findNodesNearLocation(
          context.nodes || [],
          params.affectedRegion,
          300 // 300km radius
        );
        location = params.affectedRegion;
      } else {
        // Affect all retailer and distributor nodes
        affectedNodes = (context.nodes || [])
          .filter(n => n.type === 'retailer' || n.type === 'distributor')
          .map(n => n.nodeId);
        
        // Use a default location
        location = { 
          latitude: 0, 
          longitude: 0, 
          address: 'Global', 
          city: 'Global', 
          country: 'Multiple' 
        };
      }
      
      if (affectedNodes.length === 0) {
        return {
          success: false,
          error: 'No nodes available to simulate demand spike. Please add retailer or distributor nodes.'
        };
      }
      
      // Determine severity based on demand increase
      let severity: Severity;
      if (params.demandIncrease >= 100) {
        severity = Severity.CRITICAL;
      } else if (params.demandIncrease >= 50) {
        severity = Severity.HIGH;
      } else if (params.demandIncrease >= 25) {
        severity = Severity.MEDIUM;
      } else {
        severity = Severity.LOW;
      }
      
      // Invoke Scenario Agent with demand spike parameters
      const scenarioResponse = await invokeScenarioAgent(
        DisruptionType.DEMAND_SPIKE,
        location,
        severity,
        params.duration,
        affectedNodes,
        context.userId,
        {
          disruptionReason: 'demand_spike',
          demandIncreasePercentage: params.demandIncrease
        }
      );
      
      logger.info('Demand spike simulation completed', { 
        userId: context.userId,
        scenarioId: scenarioResponse.scenario.scenarioId,
        affectedNodesCount: affectedNodes.length
      });
      
      return {
        success: true,
        data: {
          scenario: scenarioResponse.scenario,
          demandIncrease: `${params.demandIncrease}%`,
          affectedNodesCount: affectedNodes.length,
          affectedNodeIds: affectedNodes,
          estimatedImpact: calculateEstimatedImpact(severity, affectedNodes.length),
          capacityGap: calculateCapacityGap(context.nodes || [], affectedNodes, params.demandIncrease),
          timestamp: new Date().toISOString()
        },
        suggestions: [
          `${params.demandIncrease}% demand increase would affect ${affectedNodes.length} nodes`,
          'Review inventory levels and safety stock',
          'Consider expedited shipping options',
          'Evaluate capacity expansion options',
          'Identify potential bottlenecks in the network'
        ]
      };
    } catch (error) {
      logger.error('Failed to simulate demand spike', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to simulate demand spike. Please try again.'
      };
    }
  }
};

/**
 * Helper function to find nodes near a location
 */
function findNodesNearLocation(nodes: any[], location: Location, radiusKm: number): string[] {
  return nodes
    .filter(node => {
      if (!node.location) return false;
      
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        node.location.latitude,
        node.location.longitude
      );
      
      return distance <= radiusKm;
    })
    .map(node => node.nodeId);
}

/**
 * Helper function to find downstream nodes
 */
function findDownstreamNodes(nodes: any[], startNodeId: string): string[] {
  const downstream: Set<string> = new Set();
  const visited: Set<string> = new Set();
  
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.nodeId === nodeId);
    if (!node || !node.connections) return;
    
    node.connections.forEach((connId: string) => {
      downstream.add(connId);
      traverse(connId);
    });
  }
  
  traverse(startNodeId);
  return Array.from(downstream);
}

/**
 * Helper function to find alternative suppliers
 */
function findAlternativeSuppliers(nodes: any[], excludeSupplierId: string): any[] {
  return nodes
    .filter(node => node.type === 'supplier' && node.nodeId !== excludeSupplierId)
    .map(node => ({
      id: node.nodeId,
      name: node.name,
      location: node.location,
      capacity: node.capacity
    }))
    .slice(0, 3); // Return top 3 alternatives
}

/**
 * Helper function to suggest alternative routes
 */
function suggestAlternativeRoutes(nodes: any[], affectedNodeIds: string[]): any[] {
  // Find nodes that are not affected and could serve as alternatives
  const unaffectedNodes = nodes.filter(node => !affectedNodeIds.includes(node.nodeId));
  
  return unaffectedNodes
    .filter(node => node.type === 'warehouse' || node.type === 'distributor')
    .map(node => ({
      id: node.nodeId,
      name: node.name,
      type: node.type,
      location: node.location
    }))
    .slice(0, 3); // Return top 3 alternatives
}

/**
 * Helper function to calculate estimated impact
 */
function calculateEstimatedImpact(severity: Severity, affectedNodesCount: number): string {
  const severityMultiplier = {
    [Severity.LOW]: 1,
    [Severity.MEDIUM]: 2,
    [Severity.HIGH]: 3,
    [Severity.CRITICAL]: 4
  };
  
  const impactScore = severityMultiplier[severity] * affectedNodesCount;
  
  if (impactScore >= 20) return 'Very High';
  if (impactScore >= 12) return 'High';
  if (impactScore >= 6) return 'Medium';
  return 'Low';
}

/**
 * Helper function to calculate capacity gap
 */
function calculateCapacityGap(nodes: any[], affectedNodeIds: string[], demandIncrease: number): any {
  const affectedNodes = nodes.filter(n => affectedNodeIds.includes(n.nodeId));
  
  let totalCapacity = 0;
  let totalCurrentLoad = 0;
  
  affectedNodes.forEach(node => {
    totalCapacity += node.capacity || 0;
    totalCurrentLoad += (node.metrics?.currentInventory || 0);
  });
  
  const currentUtilization = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) : 0;
  const projectedLoad = totalCurrentLoad * (1 + demandIncrease / 100);
  const projectedUtilization = totalCapacity > 0 ? (projectedLoad / totalCapacity) : 0;
  
  return {
    currentUtilization: (currentUtilization * 100).toFixed(1) + '%',
    projectedUtilization: (projectedUtilization * 100).toFixed(1) + '%',
    capacityGap: projectedUtilization > 1 ? ((projectedUtilization - 1) * 100).toFixed(1) + '%' : '0%',
    needsExpansion: projectedUtilization > 0.9
  };
}

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
