/**
 * Node Management Actions for AI Copilot
 * 
 * Implements actions for creating, updating, and removing supply chain nodes.
 * These actions handle the "Build" category of copilot operations.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { NodeRepository } from '../../repositories/node-repository';
import { NodeType, NodeStatus, Location } from '../../models/types';
import { logger } from '../../utils/logger';

const nodeRepository = new NodeRepository();

/**
 * Helper function to validate location parameters
 */
function validateLocation(location: any): boolean {
  if (!location || typeof location !== 'object') {
    return false;
  }
  
  const { latitude, longitude, address, city, country } = location;
  
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return false;
  }
  
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return false;
  }
  
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return false;
  }
  
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return false;
  }
  
  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    return false;
  }
  
  return true;
}

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
 * Add Supplier Node Action
 */
export const addSupplierAction: Action = {
  name: 'add-supplier',
  category: 'build',
  description: 'Add a new supplier node to the supply chain network',
  examples: [
    'Add a supplier in Shanghai',
    'Create a new supplier node',
    'Add supplier at location X'
  ],
  parameters: [
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the supplier (latitude, longitude, address, city, country)',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Production capacity of the supplier',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name for the supplier'
    }
  ],
  validate: createValidator([
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the supplier',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Production capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-supplier action', { userId: context.userId, params });
      
      const node = await nodeRepository.createNode({
        type: NodeType.SUPPLIER,
        location: params.location,
        capacity: params.capacity,
        status: NodeStatus.OPERATIONAL,
        connections: [],
        metrics: {
          currentInventory: 0,
          utilizationRate: 0,
          lastUpdateTimestamp: new Date().toISOString()
        }
      });
      
      logger.info('Supplier node created', { nodeId: node.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: node,
        suggestions: [
          'Connect this supplier to a manufacturer',
          'Set up shipping methods for this supplier',
          'Configure capacity alerts'
        ]
      };
    } catch (error) {
      logger.error('Failed to add supplier', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create supplier node. Please check the parameters and try again.'
      };
    }
  }
};

/**
 * Add Manufacturer Node Action
 */
export const addManufacturerAction: Action = {
  name: 'add-manufacturer',
  category: 'build',
  description: 'Add a new manufacturer node to the supply chain network',
  examples: [
    'Add a manufacturer in Detroit',
    'Create a new manufacturing facility',
    'Add manufacturer at location X'
  ],
  parameters: [
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the manufacturer (latitude, longitude, address, city, country)',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Production capacity of the manufacturer',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name for the manufacturer'
    }
  ],
  validate: createValidator([
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the manufacturer',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Production capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-manufacturer action', { userId: context.userId, params });
      
      const node = await nodeRepository.createNode({
        type: NodeType.MANUFACTURER,
        location: params.location,
        capacity: params.capacity,
        status: NodeStatus.OPERATIONAL,
        connections: [],
        metrics: {
          currentInventory: 0,
          utilizationRate: 0,
          lastUpdateTimestamp: new Date().toISOString()
        }
      });
      
      logger.info('Manufacturer node created', { nodeId: node.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: node,
        suggestions: [
          'Connect suppliers to this manufacturer',
          'Connect this manufacturer to warehouses',
          'Set production schedules'
        ]
      };
    } catch (error) {
      logger.error('Failed to add manufacturer', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create manufacturer node. Please check the parameters and try again.'
      };
    }
  }
};

/**
 * Add Warehouse Node Action
 */
export const addWarehouseAction: Action = {
  name: 'add-warehouse',
  category: 'build',
  description: 'Add a new warehouse node to the supply chain network',
  examples: [
    'Add a warehouse in Memphis',
    'Create a new storage facility',
    'Add warehouse at location X'
  ],
  parameters: [
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the warehouse (latitude, longitude, address, city, country)',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Storage capacity of the warehouse',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name for the warehouse'
    }
  ],
  validate: createValidator([
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the warehouse',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Storage capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-warehouse action', { userId: context.userId, params });
      
      const node = await nodeRepository.createNode({
        type: NodeType.WAREHOUSE,
        location: params.location,
        capacity: params.capacity,
        status: NodeStatus.OPERATIONAL,
        connections: [],
        metrics: {
          currentInventory: 0,
          utilizationRate: 0,
          lastUpdateTimestamp: new Date().toISOString()
        }
      });
      
      logger.info('Warehouse node created', { nodeId: node.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: node,
        suggestions: [
          'Connect manufacturers to this warehouse',
          'Connect this warehouse to distribution centers',
          'Set inventory thresholds'
        ]
      };
    } catch (error) {
      logger.error('Failed to add warehouse', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create warehouse node. Please check the parameters and try again.'
      };
    }
  }
};

/**
 * Add Distributor Node Action
 */
export const addDistributorAction: Action = {
  name: 'add-distributor',
  category: 'build',
  description: 'Add a new distributor node to the supply chain network',
  examples: [
    'Add a distributor in Chicago',
    'Create a new distribution center',
    'Add distributor at location X'
  ],
  parameters: [
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the distributor (latitude, longitude, address, city, country)',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Distribution capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name for the distributor'
    }
  ],
  validate: createValidator([
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the distributor',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Distribution capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-distributor action', { userId: context.userId, params });
      
      const node = await nodeRepository.createNode({
        type: NodeType.DISTRIBUTION_CENTER,
        location: params.location,
        capacity: params.capacity,
        status: NodeStatus.OPERATIONAL,
        connections: [],
        metrics: {
          currentInventory: 0,
          utilizationRate: 0,
          lastUpdateTimestamp: new Date().toISOString()
        }
      });
      
      logger.info('Distributor node created', { nodeId: node.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: node,
        suggestions: [
          'Connect warehouses to this distributor',
          'Connect this distributor to retailers',
          'Set distribution routes'
        ]
      };
    } catch (error) {
      logger.error('Failed to add distributor', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create distributor node. Please check the parameters and try again.'
      };
    }
  }
};

/**
 * Add Retailer Node Action
 */
export const addRetailerAction: Action = {
  name: 'add-retailer',
  category: 'build',
  description: 'Add a new retailer node to the supply chain network',
  examples: [
    'Add a retailer in New York',
    'Create a new retail location',
    'Add retailer at location X'
  ],
  parameters: [
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the retailer (latitude, longitude, address, city, country)',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Sales capacity of the retailer',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name for the retailer'
    }
  ],
  validate: createValidator([
    {
      name: 'location',
      type: 'object',
      required: true,
      description: 'Location of the retailer',
      validation: validateLocation
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      description: 'Sales capacity',
      validation: (value: number) => value > 0
    },
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Optional name'
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-retailer action', { userId: context.userId, params });
      
      const node = await nodeRepository.createNode({
        type: NodeType.RETAILER,
        location: params.location,
        capacity: params.capacity,
        status: NodeStatus.OPERATIONAL,
        connections: [],
        metrics: {
          currentInventory: 0,
          utilizationRate: 0,
          lastUpdateTimestamp: new Date().toISOString()
        }
      });
      
      logger.info('Retailer node created', { nodeId: node.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: node,
        suggestions: [
          'Connect distributors to this retailer',
          'Set demand forecasts',
          'Configure inventory alerts'
        ]
      };
    } catch (error) {
      logger.error('Failed to add retailer', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to create retailer node. Please check the parameters and try again.'
      };
    }
  }
};

/**
 * Remove Node Action
 */
export const removeNodeAction: Action = {
  name: 'remove-node',
  category: 'build',
  description: 'Remove a node from the supply chain network and update connections',
  examples: [
    'Remove node with ID abc123',
    'Delete the supplier node',
    'Remove node X'
  ],
  parameters: [
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to remove',
      validation: (value: string) => !!(value && value.trim().length > 0)
    }
  ],
  validate: createValidator([
    {
      name: 'nodeId',
      type: 'string',
      required: true,
      description: 'ID of the node to remove',
      validation: (value: string) => !!(value && value.trim().length > 0)
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing remove-node action', { userId: context.userId, params });
      
      // First, get the node to check if it exists and get its connections
      const node = await nodeRepository.getNodeById(params.nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${params.nodeId} not found.`
        };
      }
      
      // Update connected nodes to remove references to this node
      if (node.connections && node.connections.length > 0) {
        const connectedNodes = await nodeRepository.getNodesByIds(node.connections);
        
        for (const connectedNode of connectedNodes) {
          const updatedConnections = connectedNode.connections.filter(id => id !== params.nodeId);
          await nodeRepository.updateNode(
            connectedNode.nodeId,
            { connections: updatedConnections },
            connectedNode.version
          );
        }
      }
      
      // Delete the node
      await nodeRepository.deleteNode(params.nodeId);
      
      logger.info('Node removed', { nodeId: params.nodeId, userId: context.userId });
      
      return {
        success: true,
        data: {
          removedNodeId: params.nodeId,
          nodeType: node.type,
          updatedConnections: node.connections.length
        },
        suggestions: [
          'Review network connectivity',
          'Check for isolated nodes',
          'Optimize remaining routes'
        ]
      };
    } catch (error) {
      logger.error('Failed to remove node', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to remove node. Please try again.'
      };
    }
  }
};
