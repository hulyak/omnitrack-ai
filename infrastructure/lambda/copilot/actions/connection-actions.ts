/**
 * Connection Management Actions for AI Copilot
 * 
 * Implements actions for managing connections between supply chain nodes.
 * These actions handle connecting, disconnecting, updating, and optimizing node layouts.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { NodeRepository } from '../../repositories/node-repository';
import { logger } from '../../utils/logger';

const nodeRepository = new NodeRepository();

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
 * Connect Nodes Action
 */
export const connectNodesAction: Action = {
  name: 'connect-nodes',
  category: 'build',
  description: 'Create a connection (edge) between two supply chain nodes',
  examples: [
    'Connect supplier A to manufacturer B',
    'Link node X to node Y',
    'Create connection between nodes'
  ],
  parameters: [
    {
      name: 'sourceNodeId',
      type: 'string',
      required: true,
      description: 'ID of the source node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'targetNodeId',
      type: 'string',
      required: true,
      description: 'ID of the target node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'bidirectional',
      type: 'boolean',
      required: false,
      description: 'Whether the connection is bidirectional (default: true)',
      defaultValue: true
    }
  ],
  validate: createValidator([
    {
      name: 'sourceNodeId',
      type: 'string',
      required: true,
      description: 'ID of the source node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'targetNodeId',
      type: 'string',
      required: true,
      description: 'ID of the target node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'bidirectional',
      type: 'boolean',
      required: false,
      description: 'Whether the connection is bidirectional'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing connect-nodes action', { userId: context.userId, params });
      
      const { sourceNodeId, targetNodeId, bidirectional = true } = params;
      
      // Validate that nodes are different
      if (sourceNodeId === targetNodeId) {
        return {
          success: false,
          error: 'Cannot connect a node to itself.'
        };
      }
      
      // Get both nodes
      const [sourceNode, targetNode] = await Promise.all([
        nodeRepository.getNodeById(sourceNodeId),
        nodeRepository.getNodeById(targetNodeId)
      ]);
      
      if (!sourceNode) {
        return {
          success: false,
          error: `Source node with ID ${sourceNodeId} not found.`
        };
      }
      
      if (!targetNode) {
        return {
          success: false,
          error: `Target node with ID ${targetNodeId} not found.`
        };
      }
      
      // Check if connection already exists
      if (sourceNode.connections.includes(targetNodeId)) {
        return {
          success: false,
          error: 'Connection already exists between these nodes.'
        };
      }
      
      // Add connection from source to target
      const updatedSourceConnections = [...sourceNode.connections, targetNodeId];
      await nodeRepository.updateNode(
        sourceNodeId,
        { connections: updatedSourceConnections },
        sourceNode.version
      );
      
      // Add bidirectional connection if requested
      if (bidirectional && !targetNode.connections.includes(sourceNodeId)) {
        const updatedTargetConnections = [...targetNode.connections, sourceNodeId];
        await nodeRepository.updateNode(
          targetNodeId,
          { connections: updatedTargetConnections },
          targetNode.version
        );
      }
      
      logger.info('Nodes connected', {
        sourceNodeId,
        targetNodeId,
        bidirectional,
        userId: context.userId
      });
      
      return {
        success: true,
        data: {
          sourceNodeId,
          targetNodeId,
          bidirectional,
          sourceNodeType: sourceNode.type,
          targetNodeType: targetNode.type
        },
        suggestions: [
          'Set shipping methods for this connection',
          'Configure capacity constraints',
          'Add cost parameters'
        ]
      };
    } catch (error) {
      logger.error('Failed to connect nodes', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create connection. Please try again.'
      };
    }
  }
};

/**
 * Disconnect Nodes Action
 */
export const disconnectNodesAction: Action = {
  name: 'disconnect-nodes',
  category: 'build',
  description: 'Remove a connection (edge) between two supply chain nodes',
  examples: [
    'Disconnect supplier A from manufacturer B',
    'Remove link between node X and node Y',
    'Break connection between nodes'
  ],
  parameters: [
    {
      name: 'sourceNodeId',
      type: 'string',
      required: true,
      description: 'ID of the source node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'targetNodeId',
      type: 'string',
      required: true,
      description: 'ID of the target node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'bidirectional',
      type: 'boolean',
      required: false,
      description: 'Whether to remove connection in both directions (default: true)',
      defaultValue: true
    }
  ],
  validate: createValidator([
    {
      name: 'sourceNodeId',
      type: 'string',
      required: true,
      description: 'ID of the source node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'targetNodeId',
      type: 'string',
      required: true,
      description: 'ID of the target node',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'bidirectional',
      type: 'boolean',
      required: false,
      description: 'Whether to remove connection in both directions'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing disconnect-nodes action', { userId: context.userId, params });
      
      const { sourceNodeId, targetNodeId, bidirectional = true } = params;
      
      // Get both nodes
      const [sourceNode, targetNode] = await Promise.all([
        nodeRepository.getNodeById(sourceNodeId),
        nodeRepository.getNodeById(targetNodeId)
      ]);
      
      if (!sourceNode) {
        return {
          success: false,
          error: `Source node with ID ${sourceNodeId} not found.`
        };
      }
      
      if (!targetNode) {
        return {
          success: false,
          error: `Target node with ID ${targetNodeId} not found.`
        };
      }
      
      // Check if connection exists
      if (!sourceNode.connections.includes(targetNodeId)) {
        return {
          success: false,
          error: 'No connection exists between these nodes.'
        };
      }
      
      // Remove connection from source to target
      const updatedSourceConnections = sourceNode.connections.filter(id => id !== targetNodeId);
      await nodeRepository.updateNode(
        sourceNodeId,
        { connections: updatedSourceConnections },
        sourceNode.version
      );
      
      // Remove bidirectional connection if requested
      if (bidirectional && targetNode.connections.includes(sourceNodeId)) {
        const updatedTargetConnections = targetNode.connections.filter(id => id !== sourceNodeId);
        await nodeRepository.updateNode(
          targetNodeId,
          { connections: updatedTargetConnections },
          targetNode.version
        );
      }
      
      logger.info('Nodes disconnected', {
        sourceNodeId,
        targetNodeId,
        bidirectional,
        userId: context.userId
      });
      
      return {
        success: true,
        data: {
          sourceNodeId,
          targetNodeId,
          bidirectional
        },
        suggestions: [
          'Check for isolated nodes',
          'Review alternative routes',
          'Verify network connectivity'
        ]
      };
    } catch (error) {
      logger.error('Failed to disconnect nodes', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to remove connection. Please try again.'
      };
    }
  }
};

/**
 * Update Node Action
 */
export const updateNodeAction: Action = {
  name: 'update-node',
  category: 'build',
  description: 'Update properties of a supply chain node',
  examples: [
    'Update node capacity',
    'Change node status',
    'Modify node properties'
  ],
  parameters: [
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to update',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'capacity',
      type: 'number',
      required: false,
      description: 'New capacity value',
      validation: (value: number) => value > 0
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'New status (OPERATIONAL, DEGRADED, DISRUPTED, OFFLINE)',
      validation: (value: string) => ['OPERATIONAL', 'DEGRADED', 'DISRUPTED', 'OFFLINE'].includes(value)
    },
    {
      name: 'location',
      type: 'object',
      required: false,
      description: 'New location (latitude, longitude, address, city, country)'
    }
  ],
  validate: createValidator([
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to update',
      validation: (value: string) => !!(value && value.trim().length > 0)
    },
    {
      name: 'capacity',
      type: 'number',
      required: false,
      description: 'New capacity value',
      validation: (value: number) => value > 0
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'New status',
      validation: (value: string) => ['OPERATIONAL', 'DEGRADED', 'DISRUPTED', 'OFFLINE'].includes(value)
    },
    {
      name: 'location',
      type: 'object',
      required: false,
      description: 'New location'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing update-node action', { userId: context.userId, params });
      
      const { nodeId, ...updates } = params;
      
      // Get the node
      const node = await nodeRepository.getNodeById(nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found.`
        };
      }
      
      // Validate that at least one update is provided
      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'No updates provided. Please specify at least one property to update.'
        };
      }
      
      // Update the node
      const updatedNode = await nodeRepository.updateNode(nodeId, updates, node.version);
      
      logger.info('Node updated', { nodeId, updates, userId: context.userId });
      
      return {
        success: true,
        data: updatedNode,
        suggestions: [
          'Review impact on connected nodes',
          'Update capacity planning',
          'Check for alerts'
        ]
      };
    } catch (error) {
      logger.error('Failed to update node', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to update node. Please try again.'
      };
    }
  }
};

/**
 * Optimize Layout Action
 */
export const optimizeLayoutAction: Action = {
  name: 'optimize-layout',
  category: 'build',
  description: 'Automatically arrange nodes in the supply chain network for optimal visualization',
  examples: [
    'Optimize network layout',
    'Auto-arrange nodes',
    'Organize supply chain visualization'
  ],
  parameters: [
    {
      name: 'algorithm',
      type: 'string',
      required: false,
      description: 'Layout algorithm to use (force-directed, hierarchical, circular)',
      defaultValue: 'force-directed',
      validation: (value: string) => ['force-directed', 'hierarchical', 'circular'].includes(value)
    }
  ],
  validate: createValidator([
    {
      name: 'algorithm',
      type: 'string',
      required: false,
      description: 'Layout algorithm to use',
      validation: (value: string) => ['force-directed', 'hierarchical', 'circular'].includes(value)
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing optimize-layout action', { userId: context.userId, params });
      
      const algorithm = params.algorithm || 'force-directed';
      
      // Get all nodes from context
      const nodes = context.nodes || [];
      
      if (nodes.length === 0) {
        return {
          success: false,
          error: 'No nodes found in the supply chain network.'
        };
      }
      
      // Calculate optimal positions based on algorithm
      // This is a simplified implementation - in production, you'd use a proper graph layout algorithm
      let layoutData: any;
      
      switch (algorithm) {
        case 'hierarchical':
          layoutData = calculateHierarchicalLayout(nodes);
          break;
        case 'circular':
          layoutData = calculateCircularLayout(nodes);
          break;
        case 'force-directed':
        default:
          layoutData = calculateForceDirectedLayout(nodes);
          break;
      }
      
      logger.info('Layout optimized', { algorithm, nodeCount: nodes.length, userId: context.userId });
      
      return {
        success: true,
        data: {
          algorithm,
          nodeCount: nodes.length,
          layout: layoutData
        },
        suggestions: [
          'Save this layout configuration',
          'Adjust node positions manually if needed',
          'Export visualization'
        ]
      };
    } catch (error) {
      logger.error('Failed to optimize layout', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to optimize layout. Please try again.'
      };
    }
  }
};

/**
 * Calculate force-directed layout positions
 */
function calculateForceDirectedLayout(nodes: any[]): any {
  // Simplified force-directed layout
  // In production, use a library like d3-force
  const positions: Record<string, { x: number; y: number }> = {};
  
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    const radius = 300;
    positions[node.nodeId] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
  
  return {
    type: 'force-directed',
    positions
  };
}

/**
 * Calculate hierarchical layout positions
 */
function calculateHierarchicalLayout(nodes: any[]): any {
  // Simplified hierarchical layout
  // Group nodes by type and arrange in layers
  const layers: Record<string, any[]> = {};
  
  nodes.forEach(node => {
    const type = node.type || 'UNKNOWN';
    if (!layers[type]) {
      layers[type] = [];
    }
    layers[type].push(node);
  });
  
  const positions: Record<string, { x: number; y: number }> = {};
  const layerOrder = ['SUPPLIER', 'MANUFACTURER', 'WAREHOUSE', 'DISTRIBUTION_CENTER', 'RETAILER'];
  
  let yOffset = 0;
  layerOrder.forEach(layerType => {
    const layerNodes = layers[layerType] || [];
    layerNodes.forEach((node, index) => {
      const xSpacing = 200;
      const ySpacing = 150;
      positions[node.nodeId] = {
        x: (index - layerNodes.length / 2) * xSpacing,
        y: yOffset
      };
    });
    if (layerNodes.length > 0) {
      yOffset += 150;
    }
  });
  
  return {
    type: 'hierarchical',
    positions
  };
}

/**
 * Calculate circular layout positions
 */
function calculateCircularLayout(nodes: any[]): any {
  // Arrange nodes in a circle
  const positions: Record<string, { x: number; y: number }> = {};
  const radius = 300;
  
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    positions[node.nodeId] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
  
  return {
    type: 'circular',
    positions
  };
}
