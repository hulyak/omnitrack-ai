/**
 * Analysis Actions for AI Copilot
 * 
 * Implements actions for analyzing supply chain data and identifying issues.
 * These actions handle the "Analyze" category of copilot operations.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { NodeRepository } from '../../repositories/node-repository';
import { AlertRepository } from '../../repositories/alert-repository';
import { AlertStatus, Severity } from '../../models/types';
import { logger } from '../../utils/logger';

const nodeRepository = new NodeRepository();
const alertRepository = new AlertRepository();

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
 * Scan Anomalies Action
 * 
 * Calls the Info Agent to gather current supply chain data and identify anomalies
 */
export const scanAnomaliesAction: Action = {
  name: 'scan-anomalies',
  category: 'analyze',
  description: 'Scan the supply chain network for anomalies and unusual patterns',
  examples: [
    'Scan for anomalies',
    'Check for unusual activity',
    'Find anomalies in the network'
  ],
  parameters: [
    {
      name: 'nodeIds',
      type: 'array',
      required: false,
      description: 'Optional array of node IDs to scan (scans all nodes if not provided)',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ],
  validate: createValidator([
    {
      name: 'nodeIds',
      type: 'array',
      required: false,
      description: 'Optional array of node IDs',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing scan-anomalies action', { userId: context.userId, params });
      
      // Get nodes to analyze
      const nodeIds = params.nodeIds || context.nodes?.map(n => n.nodeId) || [];
      
      if (nodeIds.length === 0) {
        return {
          success: false,
          error: 'No nodes available to scan. Please add nodes to your supply chain first.'
        };
      }
      
      // Fetch nodes with current metrics
      const nodes = await nodeRepository.getNodesByIds(nodeIds);
      
      // Analyze nodes for anomalies
      const anomalies: any[] = [];
      
      for (const node of nodes) {
        // Check for high utilization
        if (node.metrics?.utilizationRate > 0.9) {
          anomalies.push({
            nodeId: node.nodeId,
            type: 'high-utilization',
            severity: 'high',
            message: `Node ${node.nodeId} is operating at ${(node.metrics.utilizationRate * 100).toFixed(1)}% capacity`,
            metric: node.metrics.utilizationRate
          });
        }
        
        // Check for low inventory
        if (node.metrics?.currentInventory < node.capacity * 0.1) {
          anomalies.push({
            nodeId: node.nodeId,
            type: 'low-inventory',
            severity: 'medium',
            message: `Node ${node.nodeId} has low inventory (${node.metrics.currentInventory} units)`,
            metric: node.metrics.currentInventory
          });
        }
        
        // Check for stale data
        const lastUpdate = new Date(node.metrics?.lastUpdateTimestamp || 0);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) {
          anomalies.push({
            nodeId: node.nodeId,
            type: 'stale-data',
            severity: 'low',
            message: `Node ${node.nodeId} has not been updated in ${hoursSinceUpdate.toFixed(1)} hours`,
            metric: hoursSinceUpdate
          });
        }
        
        // Check for disconnected nodes
        if (!node.connections || node.connections.length === 0) {
          anomalies.push({
            nodeId: node.nodeId,
            type: 'disconnected',
            severity: 'medium',
            message: `Node ${node.nodeId} has no connections to other nodes`,
            metric: 0
          });
        }
      }
      
      logger.info('Anomaly scan completed', { 
        userId: context.userId, 
        nodesScanned: nodes.length,
        anomaliesFound: anomalies.length 
      });
      
      return {
        success: true,
        data: {
          nodesScanned: nodes.length,
          anomaliesFound: anomalies.length,
          anomalies,
          timestamp: new Date().toISOString()
        },
        suggestions: anomalies.length > 0 ? [
          'Review high-severity anomalies first',
          'Run simulations to test mitigation strategies',
          'Set up alerts for critical thresholds'
        ] : [
          'No anomalies detected - network is operating normally',
          'Consider running stress tests',
          'Schedule regular anomaly scans'
        ]
      };
    } catch (error) {
      logger.error('Failed to scan anomalies', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to scan for anomalies. Please try again.'
      };
    }
  }
};

/**
 * Identify Risks Action
 * 
 * Analyzes the supply chain network to identify potential risk points
 */
export const identifyRisksAction: Action = {
  name: 'identify-risks',
  category: 'analyze',
  description: 'Identify potential risk points in the supply chain network',
  examples: [
    'Identify risks',
    'Find risk points',
    'What are the risks in my network?'
  ],
  parameters: [],
  validate: createValidator([]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing identify-risks action', { userId: context.userId });
      
      // Get all nodes
      const nodes = context.nodes || [];
      
      if (nodes.length === 0) {
        return {
          success: false,
          error: 'No nodes available to analyze. Please add nodes to your supply chain first.'
        };
      }
      
      // Analyze network for risks
      const risks: any[] = [];
      
      // Check for single points of failure
      const nodeConnectionCounts = new Map<string, number>();
      nodes.forEach(node => {
        node.connections?.forEach((connId: string) => {
          nodeConnectionCounts.set(connId, (nodeConnectionCounts.get(connId) || 0) + 1);
        });
      });
      
      nodes.forEach(node => {
        const incomingConnections = nodeConnectionCounts.get(node.nodeId) || 0;
        const outgoingConnections = node.connections?.length || 0;
        
        // Single point of failure - many nodes depend on this one
        if (incomingConnections > 5 && outgoingConnections < 2) {
          risks.push({
            nodeId: node.nodeId,
            type: 'single-point-of-failure',
            severity: 'critical',
            message: `Node ${node.nodeId} is a critical dependency with ${incomingConnections} dependent nodes`,
            impact: 'high',
            mitigation: 'Add redundant connections or backup nodes'
          });
        }
        
        // Geographic concentration risk
        if (node.location) {
          const nearbyNodes = nodes.filter(n => {
            if (!n.location || n.nodeId === node.nodeId) return false;
            const distance = calculateDistance(
              node.location.latitude,
              node.location.longitude,
              n.location.latitude,
              n.location.longitude
            );
            return distance < 100; // Within 100km
          });
          
          if (nearbyNodes.length > 3) {
            risks.push({
              nodeId: node.nodeId,
              type: 'geographic-concentration',
              severity: 'medium',
              message: `${nearbyNodes.length + 1} nodes are concentrated in the same geographic area`,
              impact: 'medium',
              mitigation: 'Diversify geographic distribution'
            });
          }
        }
        
        // Capacity risk
        if (node.metrics?.utilizationRate > 0.85) {
          risks.push({
            nodeId: node.nodeId,
            type: 'capacity-constraint',
            severity: 'high',
            message: `Node ${node.nodeId} is operating near maximum capacity`,
            impact: 'high',
            mitigation: 'Increase capacity or add parallel nodes'
          });
        }
      });
      
      // Check for active alerts
      const alertResult = await alertRepository.getAlertsByStatus(AlertStatus.ACTIVE);
      const criticalAlerts = alertResult.items.filter(
        alert => alert.severity === Severity.CRITICAL
      );
      
      if (criticalAlerts.length > 0) {
        risks.push({
          type: 'active-critical-alerts',
          severity: 'critical',
          message: `${criticalAlerts.length} critical alerts are currently active`,
          impact: 'high',
          mitigation: 'Address critical alerts immediately'
        });
      }
      
      logger.info('Risk identification completed', { 
        userId: context.userId, 
        risksFound: risks.length 
      });
      
      return {
        success: true,
        data: {
          totalRisks: risks.length,
          criticalRisks: risks.filter(r => r.severity === 'critical').length,
          highRisks: risks.filter(r => r.severity === 'high').length,
          mediumRisks: risks.filter(r => r.severity === 'medium').length,
          risks,
          timestamp: new Date().toISOString()
        },
        suggestions: risks.length > 0 ? [
          'Prioritize critical and high-severity risks',
          'Run what-if scenarios to test mitigation strategies',
          'Review network topology for redundancy'
        ] : [
          'No significant risks detected',
          'Continue monitoring for emerging risks',
          'Consider stress testing the network'
        ]
      };
    } catch (error) {
      logger.error('Failed to identify risks', error as Error, { userId: context.userId });
      return {
        success: false,
        error: 'Failed to identify risks. Please try again.'
      };
    }
  }
};

/**
 * Find Bottlenecks Action
 * 
 * Identifies bottlenecks in the supply chain network
 */
export const findBottlenecksAction: Action = {
  name: 'find-bottlenecks',
  category: 'analyze',
  description: 'Find bottlenecks that may constrain supply chain flow',
  examples: [
    'Find bottlenecks',
    'Where are the bottlenecks?',
    'Identify flow constraints'
  ],
  parameters: [],
  validate: createValidator([]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing find-bottlenecks action', { userId: context.userId });
      
      // Get all nodes
      const nodes = context.nodes || [];
      
      if (nodes.length === 0) {
        return {
          success: false,
          error: 'No nodes available to analyze. Please add nodes to your supply chain first.'
        };
      }
      
      // Analyze network for bottlenecks
      const bottlenecks: any[] = [];
      
      // Build connection graph
      const nodeConnectionCounts = new Map<string, { incoming: number; outgoing: number }>();
      
      nodes.forEach(node => {
        if (!nodeConnectionCounts.has(node.nodeId)) {
          nodeConnectionCounts.set(node.nodeId, { incoming: 0, outgoing: 0 });
        }
        
        const counts = nodeConnectionCounts.get(node.nodeId)!;
        counts.outgoing = node.connections?.length || 0;
        
        node.connections?.forEach((connId: string) => {
          if (!nodeConnectionCounts.has(connId)) {
            nodeConnectionCounts.set(connId, { incoming: 0, outgoing: 0 });
          }
          nodeConnectionCounts.get(connId)!.incoming++;
        });
      });
      
      // Identify bottlenecks
      nodes.forEach(node => {
        const connections = nodeConnectionCounts.get(node.nodeId);
        if (!connections) return;
        
        // High utilization bottleneck
        if (node.metrics?.utilizationRate > 0.9) {
          bottlenecks.push({
            nodeId: node.nodeId,
            type: 'capacity-bottleneck',
            severity: 'high',
            message: `Node ${node.nodeId} is at ${(node.metrics.utilizationRate * 100).toFixed(1)}% capacity`,
            utilizationRate: node.metrics.utilizationRate,
            impact: 'Delays and reduced throughput'
          });
        }
        
        // Connection imbalance bottleneck
        if (connections.incoming > 5 && connections.outgoing < 2) {
          bottlenecks.push({
            nodeId: node.nodeId,
            type: 'connection-bottleneck',
            severity: 'medium',
            message: `Node ${node.nodeId} has ${connections.incoming} incoming connections but only ${connections.outgoing} outgoing`,
            incomingConnections: connections.incoming,
            outgoingConnections: connections.outgoing,
            impact: 'Flow concentration and potential congestion'
          });
        }
        
        // Inventory bottleneck
        if (node.metrics?.currentInventory > node.capacity * 0.95) {
          bottlenecks.push({
            nodeId: node.nodeId,
            type: 'inventory-bottleneck',
            severity: 'high',
            message: `Node ${node.nodeId} is at ${((node.metrics.currentInventory / node.capacity) * 100).toFixed(1)}% inventory capacity`,
            inventoryLevel: node.metrics.currentInventory,
            capacity: node.capacity,
            impact: 'Cannot accept additional inventory'
          });
        }
      });
      
      logger.info('Bottleneck analysis completed', { 
        userId: context.userId, 
        bottlenecksFound: bottlenecks.length 
      });
      
      return {
        success: true,
        data: {
          totalBottlenecks: bottlenecks.length,
          capacityBottlenecks: bottlenecks.filter(b => b.type === 'capacity-bottleneck').length,
          connectionBottlenecks: bottlenecks.filter(b => b.type === 'connection-bottleneck').length,
          inventoryBottlenecks: bottlenecks.filter(b => b.type === 'inventory-bottleneck').length,
          bottlenecks,
          timestamp: new Date().toISOString()
        },
        suggestions: bottlenecks.length > 0 ? [
          'Address capacity bottlenecks by increasing node capacity',
          'Balance connections to distribute flow',
          'Consider adding parallel paths',
          'Run simulations to test improvements'
        ] : [
          'No bottlenecks detected - flow is balanced',
          'Monitor utilization rates regularly',
          'Consider stress testing with increased demand'
        ]
      };
    } catch (error) {
      logger.error('Failed to find bottlenecks', error as Error, { userId: context.userId });
      return {
        success: false,
        error: 'Failed to find bottlenecks. Please try again.'
      };
    }
  }
};

/**
 * Calculate Utilization Action
 * 
 * Calculates utilization metrics for the supply chain network
 */
export const calculateUtilizationAction: Action = {
  name: 'calculate-utilization',
  category: 'analyze',
  description: 'Calculate utilization metrics for nodes in the supply chain',
  examples: [
    'Calculate utilization',
    'Show utilization metrics',
    'What is the network utilization?'
  ],
  parameters: [
    {
      name: 'nodeIds',
      type: 'array',
      required: false,
      description: 'Optional array of node IDs to calculate (calculates all nodes if not provided)',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ],
  validate: createValidator([
    {
      name: 'nodeIds',
      type: 'array',
      required: false,
      description: 'Optional array of node IDs',
      validation: (value: any) => Array.isArray(value) && value.every(id => typeof id === 'string')
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing calculate-utilization action', { userId: context.userId, params });
      
      // Get nodes to analyze
      const nodeIds = params.nodeIds || context.nodes?.map(n => n.nodeId) || [];
      
      if (nodeIds.length === 0) {
        return {
          success: false,
          error: 'No nodes available to analyze. Please add nodes to your supply chain first.'
        };
      }
      
      // Fetch nodes with current metrics
      const nodes = await nodeRepository.getNodesByIds(nodeIds);
      
      // Calculate utilization metrics
      const utilizationMetrics: any[] = [];
      let totalUtilization = 0;
      let totalCapacity = 0;
      let totalInventory = 0;
      
      nodes.forEach(node => {
        const utilizationRate = node.metrics?.utilizationRate || 0;
        const inventoryLevel = node.metrics?.currentInventory || 0;
        const capacity = node.capacity || 0;
        
        totalUtilization += utilizationRate;
        totalCapacity += capacity;
        totalInventory += inventoryLevel;
        
        utilizationMetrics.push({
          nodeId: node.nodeId,
          type: node.type,
          utilizationRate,
          utilizationPercentage: (utilizationRate * 100).toFixed(1),
          inventoryLevel,
          capacity,
          inventoryPercentage: capacity > 0 ? ((inventoryLevel / capacity) * 100).toFixed(1) : 0,
          status: utilizationRate > 0.9 ? 'critical' : utilizationRate > 0.7 ? 'warning' : 'normal'
        });
      });
      
      const averageUtilization = nodes.length > 0 ? totalUtilization / nodes.length : 0;
      const networkCapacityUsed = totalCapacity > 0 ? (totalInventory / totalCapacity) : 0;
      
      logger.info('Utilization calculation completed', { 
        userId: context.userId, 
        nodesAnalyzed: nodes.length,
        averageUtilization 
      });
      
      return {
        success: true,
        data: {
          summary: {
            nodesAnalyzed: nodes.length,
            averageUtilization: (averageUtilization * 100).toFixed(1) + '%',
            totalCapacity,
            totalInventory,
            networkCapacityUsed: (networkCapacityUsed * 100).toFixed(1) + '%'
          },
          nodeMetrics: utilizationMetrics,
          timestamp: new Date().toISOString()
        },
        suggestions: [
          averageUtilization > 0.8 ? 'Network is highly utilized - consider capacity expansion' : 'Utilization is within normal range',
          'Monitor nodes with critical status',
          'Balance load across underutilized nodes'
        ]
      };
    } catch (error) {
      logger.error('Failed to calculate utilization', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to calculate utilization. Please try again.'
      };
    }
  }
};

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
