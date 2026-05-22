/**
 * Unit tests for Build Actions
 */

import { actionRegistry, SupplyChainContext } from '../action-registry';
import {
  addSupplierAction,
  addManufacturerAction,
  addWarehouseAction,
  addDistributorAction,
  addRetailerAction,
  removeNodeAction,
  connectNodesAction,
  disconnectNodesAction,
  updateNodeAction,
  optimizeLayoutAction,
  registerBuildActions
} from './index';

describe('Build Actions', () => {
  let context: SupplyChainContext;

  beforeEach(() => {
    // Clear the singleton registry before each test
    actionRegistry.clear();
    
    context = {
      userId: 'test-user-123',
      nodes: [],
      edges: [],
      configuration: {},
      recentActions: [],
      activeSimulations: []
    };
  });

  describe('Action Registration', () => {
    it('should register all build actions', () => {
      registerBuildActions();
      
      expect(actionRegistry.hasAction('add-supplier')).toBe(true);
      expect(actionRegistry.hasAction('add-manufacturer')).toBe(true);
      expect(actionRegistry.hasAction('add-warehouse')).toBe(true);
      expect(actionRegistry.hasAction('add-distributor')).toBe(true);
      expect(actionRegistry.hasAction('add-retailer')).toBe(true);
      expect(actionRegistry.hasAction('remove-node')).toBe(true);
      expect(actionRegistry.hasAction('connect-nodes')).toBe(true);
      expect(actionRegistry.hasAction('disconnect-nodes')).toBe(true);
      expect(actionRegistry.hasAction('update-node')).toBe(true);
      expect(actionRegistry.hasAction('optimize-layout')).toBe(true);
    });

    it('should categorize all actions as build', () => {
      registerBuildActions();
      
      const buildActions = actionRegistry.getByCategory('build');
      expect(buildActions.length).toBe(10);
    });
  });

  describe('Node Management Actions', () => {
    describe('addSupplierAction', () => {
      it('should validate required parameters', () => {
        const result = addSupplierAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: location');
        expect(result.errors).toContain('Missing required parameter: capacity');
      });

      it('should validate location structure', () => {
        const result = addSupplierAction.validate({
          location: { invalid: 'location' },
          capacity: 1000
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'location' failed validation");
      });

      it('should validate capacity is positive', () => {
        const result = addSupplierAction.validate({
          location: {
            latitude: 31.2304,
            longitude: 121.4737,
            address: '123 Main St',
            city: 'Shanghai',
            country: 'China'
          },
          capacity: -100
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'capacity' failed validation");
      });

      it('should accept valid parameters', () => {
        const result = addSupplierAction.validate({
          location: {
            latitude: 31.2304,
            longitude: 121.4737,
            address: '123 Main St',
            city: 'Shanghai',
            country: 'China'
          },
          capacity: 1000
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('removeNodeAction', () => {
      it('should validate nodeId parameter', () => {
        const result = removeNodeAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: nodeId');
      });

      it('should validate nodeId is not empty', () => {
        const result = removeNodeAction.validate({ nodeId: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'nodeId' failed validation");
      });

      it('should accept valid nodeId', () => {
        const result = removeNodeAction.validate({ nodeId: 'node-123' });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Connection Management Actions', () => {
    describe('connectNodesAction', () => {
      it('should validate required parameters', () => {
        const result = connectNodesAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: sourceNodeId');
        expect(result.errors).toContain('Missing required parameter: targetNodeId');
      });

      it('should accept valid parameters', () => {
        const result = connectNodesAction.validate({
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2'
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept optional bidirectional parameter', () => {
        const result = connectNodesAction.validate({
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          bidirectional: false
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('disconnectNodesAction', () => {
      it('should validate required parameters', () => {
        const result = disconnectNodesAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: sourceNodeId');
        expect(result.errors).toContain('Missing required parameter: targetNodeId');
      });

      it('should accept valid parameters', () => {
        const result = disconnectNodesAction.validate({
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2'
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('updateNodeAction', () => {
      it('should validate nodeId parameter', () => {
        const result = updateNodeAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: nodeId');
      });

      it('should accept valid capacity update', () => {
        const result = updateNodeAction.validate({
          nodeId: 'node-123',
          capacity: 2000
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate capacity is positive', () => {
        const result = updateNodeAction.validate({
          nodeId: 'node-123',
          capacity: -100
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'capacity' failed validation");
      });

      it('should validate status is valid enum', () => {
        const result = updateNodeAction.validate({
          nodeId: 'node-123',
          status: 'INVALID_STATUS'
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'status' failed validation");
      });

      it('should accept valid status', () => {
        const result = updateNodeAction.validate({
          nodeId: 'node-123',
          status: 'OPERATIONAL'
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('optimizeLayoutAction', () => {
      it('should accept no parameters', () => {
        const result = optimizeLayoutAction.validate({});
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate algorithm parameter', () => {
        const result = optimizeLayoutAction.validate({
          algorithm: 'invalid-algorithm'
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Parameter 'algorithm' failed validation");
      });

      it('should accept valid algorithms', () => {
        const algorithms = ['force-directed', 'hierarchical', 'circular'];
        
        algorithms.forEach(algorithm => {
          const result = optimizeLayoutAction.validate({ algorithm });
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });
    });
  });

  describe('Action Examples', () => {
    it('should have example phrases for each action', () => {
      const actions = [
        addSupplierAction,
        addManufacturerAction,
        addWarehouseAction,
        addDistributorAction,
        addRetailerAction,
        removeNodeAction,
        connectNodesAction,
        disconnectNodesAction,
        updateNodeAction,
        optimizeLayoutAction
      ];

      actions.forEach(action => {
        expect(action.examples).toBeDefined();
        expect(action.examples.length).toBeGreaterThan(0);
      });
    });
  });
});
