/**
 * Query Actions for AI Copilot
 * 
 * Implements actions for querying supply chain information and getting help.
 * These actions handle the "Query" category of copilot operations.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { NodeRepository } from '../../repositories/node-repository';
import { AlertRepository } from '../../repositories/alert-repository';
import { AlertStatus } from '../../models/types';
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
 * Get Node Details Action
 * 
 * Retrieves detailed information about a specific node
 */
export const getNodeDetailsAction: Action = {
  name: 'get-node-details',
  category: 'query',
  description: 'Get detailed information about a specific supply chain node',
  examples: [
    'Show details for node abc123',
    'Get information about node X',
    'What are the details of this node?'
  ],
  parameters: [
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to query',
      validation: (value: string) => !!(value && value.trim().length > 0)
    }
  ],
  validate: createValidator([
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to query',
      validation: (value: string) => !!(value && value.trim().length > 0)
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing get-node-details action', { userId: context.userId, params });
      
      // Fetch the node
      const node = await nodeRepository.getNodeById(params.nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${params.nodeId} not found.`
        };
      }
      
      // Get connected nodes information
      const connectedNodes = node.connections && node.connections.length > 0
        ? await nodeRepository.getNodesByIds(node.connections)
        : [];
      
      // Build detailed response
      const details = {
        nodeId: node.nodeId,
        type: node.type,
        status: node.status,
        location: node.location,
        capacity: node.capacity,
        metrics: {
          currentInventory: node.metrics?.currentInventory || 0,
          utilizationRate: node.metrics?.utilizationRate || 0,
          utilizationPercentage: ((node.metrics?.utilizationRate || 0) * 100).toFixed(1) + '%',
          lastUpdate: node.metrics?.lastUpdateTimestamp || 'Never'
        },
        connections: {
          total: node.connections?.length || 0,
          connectedNodes: connectedNodes.map(cn => ({
            nodeId: cn.nodeId,
            type: cn.type,
            status: cn.status
          }))
        },
        metadata: {
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          version: node.version
        }
      };
      
      logger.info('Node details retrieved', { nodeId: params.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: details,
        suggestions: [
          'Update node properties',
          'Connect to other nodes',
          'Run analysis on this node',
          'Simulate scenarios affecting this node'
        ]
      };
    } catch (error) {
      logger.error('Failed to get node details', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to retrieve node details. Please try again.'
      };
    }
  }
};

/**
 * Get Network Summary Action
 * 
 * Provides a high-level summary of the entire supply chain network
 */
export const getNetworkSummaryAction: Action = {
  name: 'get-network-summary',
  category: 'query',
  description: 'Get a summary of the entire supply chain network',
  examples: [
    'Show network summary',
    'Give me an overview of my supply chain',
    'What does my network look like?'
  ],
  parameters: [],
  validate: createValidator([]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing get-network-summary action', { userId: context.userId });
      
      // Get all nodes
      const nodes = context.nodes || [];
      
      if (nodes.length === 0) {
        return {
          success: true,
          data: {
            message: 'Your supply chain network is empty. Start by adding nodes!',
            totalNodes: 0
          },
          suggestions: [
            'Add a supplier node',
            'Add a manufacturer node',
            'Add a warehouse node',
            'Import an existing configuration'
          ]
        };
      }
      
      // Calculate network statistics
      const nodesByType = nodes.reduce((acc: any, node: any) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {});
      
      const totalConnections = nodes.reduce((sum: number, node: any) => 
        sum + (node.connections?.length || 0), 0
      );
      
      const averageUtilization = nodes.reduce((sum: number, node: any) => 
        sum + (node.metrics?.utilizationRate || 0), 0
      ) / nodes.length;
      
      const totalCapacity = nodes.reduce((sum: number, node: any) => 
        sum + (node.capacity || 0), 0
      );
      
      const totalInventory = nodes.reduce((sum: number, node: any) => 
        sum + (node.metrics?.currentInventory || 0), 0
      );
      
      // Identify nodes by status
      const operationalNodes = nodes.filter((n: any) => n.status === 'operational').length;
      const degradedNodes = nodes.filter((n: any) => n.status === 'degraded').length;
      const offlineNodes = nodes.filter((n: any) => n.status === 'offline').length;
      
      // Get recent alerts
      const alertResult = await alertRepository.getAlertsByStatus(AlertStatus.ACTIVE);
      const activeAlerts = alertResult.items.length;
      
      const summary = {
        overview: {
          totalNodes: nodes.length,
          totalConnections,
          averageConnectionsPerNode: (totalConnections / nodes.length).toFixed(1),
          networkDensity: ((totalConnections / (nodes.length * (nodes.length - 1))) * 100).toFixed(1) + '%'
        },
        nodeDistribution: nodesByType,
        capacity: {
          totalCapacity,
          totalInventory,
          utilizationRate: (averageUtilization * 100).toFixed(1) + '%',
          availableCapacity: totalCapacity - totalInventory
        },
        health: {
          operational: operationalNodes,
          degraded: degradedNodes,
          offline: offlineNodes,
          healthScore: ((operationalNodes / nodes.length) * 100).toFixed(1) + '%'
        },
        alerts: {
          active: activeAlerts,
          status: activeAlerts === 0 ? 'All clear' : `${activeAlerts} active alert${activeAlerts > 1 ? 's' : ''}`
        },
        timestamp: new Date().toISOString()
      };
      
      logger.info('Network summary generated', { userId: context.userId, totalNodes: nodes.length });
      
      return {
        success: true,
        data: summary,
        suggestions: [
          averageUtilization > 0.8 ? 'Network is highly utilized - consider expansion' : 'Network utilization is healthy',
          activeAlerts > 0 ? 'Review active alerts' : 'No active alerts',
          'Run anomaly scan',
          'Identify potential risks',
          'Optimize network layout'
        ]
      };
    } catch (error) {
      logger.error('Failed to get network summary', error as Error, { userId: context.userId });
      return {
        success: false,
        error: 'Failed to generate network summary. Please try again.'
      };
    }
  }
};

/**
 * Get Recent Alerts Action
 * 
 * Retrieves recent alerts from the supply chain
 */
export const getRecentAlertsAction: Action = {
  name: 'get-recent-alerts',
  category: 'query',
  description: 'Get recent alerts from the supply chain network',
  examples: [
    'Show recent alerts',
    'What alerts do I have?',
    'Are there any active alerts?'
  ],
  parameters: [
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Maximum number of alerts to return (default: 10)',
      validation: (value: number) => value > 0 && value <= 100
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'Filter by alert status (active, acknowledged, resolved)',
      validation: (value: string) => ['active', 'acknowledged', 'resolved'].includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Maximum number of alerts',
      validation: (value: number) => value > 0 && value <= 100
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'Filter by status',
      validation: (value: string) => ['active', 'acknowledged', 'resolved'].includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing get-recent-alerts action', { userId: context.userId, params });
      
      const limit = params.limit || 10;
      const status = params.status?.toUpperCase() as AlertStatus || AlertStatus.ACTIVE;
      
      // Fetch alerts
      const alertResult = await alertRepository.getAlertsByStatus(status, limit);
      const alerts = alertResult.items;
      
      if (alerts.length === 0) {
        return {
          success: true,
          data: {
            message: status === AlertStatus.ACTIVE 
              ? 'No active alerts - your supply chain is running smoothly!'
              : `No ${status.toLowerCase()} alerts found.`,
            totalAlerts: 0,
            alerts: []
          },
          suggestions: [
            'Run anomaly scan to check for issues',
            'Review network health',
            'Check utilization metrics'
          ]
        };
      }
      
      // Group alerts by severity
      const alertsBySeverity = alerts.reduce((acc: any, alert: any) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {});
      
      // Format alerts for display
      const formattedAlerts = alerts.map(alert => ({
        alertId: alert.alertId,
        severity: alert.severity,
        type: alert.type,
        message: alert.message,
        nodeId: alert.nodeId,
        status: alert.status,
        createdAt: alert.createdAt,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      }));
      
      logger.info('Recent alerts retrieved', { 
        userId: context.userId, 
        alertCount: alerts.length,
        status 
      });
      
      return {
        success: true,
        data: {
          summary: {
            totalAlerts: alerts.length,
            status,
            bySeverity: alertsBySeverity
          },
          alerts: formattedAlerts,
          timestamp: new Date().toISOString()
        },
        suggestions: [
          alertsBySeverity.critical > 0 ? 'Address critical alerts immediately' : 'Review high-priority alerts',
          'Acknowledge alerts to track progress',
          'Run simulations to test mitigation strategies',
          'Set up automated responses for common alerts'
        ]
      };
    } catch (error) {
      logger.error('Failed to get recent alerts', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to retrieve alerts. Please try again.'
      };
    }
  }
};

/**
 * Help Action
 * 
 * Provides information about available commands and capabilities
 */
export const helpAction: Action = {
  name: 'help',
  category: 'query',
  description: 'Get help and list available commands',
  examples: [
    'help',
    'What can you do?',
    'Show me available commands'
  ],
  parameters: [
    {
      name: 'category',
      type: 'string',
      required: false,
      description: 'Filter commands by category (build, configure, analyze, simulate, query)',
      validation: (value: string) => ['build', 'configure', 'analyze', 'simulate', 'query'].includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'category',
      type: 'string',
      required: false,
      description: 'Filter by category',
      validation: (value: string) => ['build', 'configure', 'analyze', 'simulate', 'query'].includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing help action', { userId: context.userId, params });
      
      const category = params.category?.toLowerCase();
      
      // Define all available commands by category
      const commandsByCategory = {
        build: [
          { name: 'add-supplier', description: 'Add a new supplier node' },
          { name: 'add-manufacturer', description: 'Add a new manufacturer node' },
          { name: 'add-warehouse', description: 'Add a new warehouse node' },
          { name: 'add-distributor', description: 'Add a new distributor node' },
          { name: 'add-retailer', description: 'Add a new retailer node' },
          { name: 'remove-node', description: 'Remove a node from the network' },
          { name: 'connect-nodes', description: 'Create a connection between nodes' },
          { name: 'disconnect-nodes', description: 'Remove a connection between nodes' },
          { name: 'update-node', description: 'Update node properties' },
          { name: 'optimize-layout', description: 'Optimize network layout' }
        ],
        configure: [
          { name: 'set-region', description: 'Set the primary region' },
          { name: 'set-industry', description: 'Set the industry type' },
          { name: 'set-currency', description: 'Set the currency' },
          { name: 'add-shipping-method', description: 'Add a shipping method' },
          { name: 'set-risk-profile', description: 'Set the risk profile' }
        ],
        analyze: [
          { name: 'scan-anomalies', description: 'Scan for anomalies in the network' },
          { name: 'identify-risks', description: 'Identify potential risk points' },
          { name: 'find-bottlenecks', description: 'Find bottlenecks in the network' },
          { name: 'calculate-utilization', description: 'Calculate utilization metrics' }
        ],
        simulate: [
          { name: 'run-simulation', description: 'Run a custom simulation' },
          { name: 'what-if-port-closure', description: 'Simulate a port closure' },
          { name: 'what-if-supplier-failure', description: 'Simulate a supplier failure' },
          { name: 'what-if-demand-spike', description: 'Simulate a demand spike' }
        ],
        query: [
          { name: 'get-node-details', description: 'Get details about a specific node' },
          { name: 'get-network-summary', description: 'Get a summary of the network' },
          { name: 'get-recent-alerts', description: 'Get recent alerts' },
          { name: 'help', description: 'Show this help message' }
        ]
      };
      
      // Filter by category if specified
      const commands = category 
        ? { [category]: commandsByCategory[category as keyof typeof commandsByCategory] }
        : commandsByCategory;
      
      // Build help response
      const helpData = {
        introduction: 'I\'m your AI Copilot for supply chain management. I can help you build, configure, analyze, and simulate your supply chain network using natural language.',
        categories: Object.entries(commands).map(([cat, cmds]) => ({
          category: cat,
          description: getCategoryDescription(cat),
          commands: cmds
        })),
        examples: [
          'Add a supplier in Shanghai with capacity 1000',
          'Show me the network summary',
          'Scan for anomalies',
          'What if a major port closes?',
          'Get details for node abc123'
        ],
        tips: [
          'You can use natural language - I\'ll understand your intent',
          'Ask for clarification if you\'re not sure what to do',
          'Use "help [category]" to see commands in a specific category',
          'I can handle multi-step requests like "add a supplier and connect it to the manufacturer"'
        ]
      };
      
      logger.info('Help information provided', { userId: context.userId, category });
      
      return {
        success: true,
        data: helpData,
        suggestions: [
          'Try "get-network-summary" to see your current setup',
          'Use "scan-anomalies" to check for issues',
          'Ask me anything in natural language!'
        ]
      };
    } catch (error) {
      logger.error('Failed to provide help', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to provide help information. Please try again.'
      };
    }
  }
};

/**
 * Helper function to get category descriptions
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    build: 'Create and manage supply chain nodes and connections',
    configure: 'Configure supply chain settings and parameters',
    analyze: 'Analyze network performance and identify issues',
    simulate: 'Run what-if scenarios and simulations',
    query: 'Query information about your supply chain'
  };
  return descriptions[category] || 'Supply chain operations';
}
