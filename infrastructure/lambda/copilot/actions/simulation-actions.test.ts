/**
 * Unit tests for simulation actions
 */

import {
  runSimulationAction,
  whatIfPortClosureAction,
  whatIfSupplierFailureAction,
  whatIfDemandSpikeAction
} from './simulation-actions';
import { SupplyChainContext } from '../action-registry';
import { DisruptionType, Severity, NodeType } from '../../models/types';

describe('Simulation Actions', () => {
  // Mock context with sample nodes
  const mockContext: SupplyChainContext = {
    userId: 'test-user-123',
    nodes: [
      {
        nodeId: 'supplier-1',
        type: 'supplier',
        name: 'Test Supplier',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        },
        capacity: 1000,
        connections: ['manufacturer-1'],
        metrics: {
          currentInventory: 500,
          utilizationRate: 0.5,
          lastUpdateTimestamp: new Date().toISOString()
        }
      },
      {
        nodeId: 'manufacturer-1',
        type: 'manufacturer',
        name: 'Test Manufacturer',
        location: {
          latitude: 40.7580,
          longitude: -73.9855,
          address: '456 Factory Ave',
          city: 'New York',
          country: 'USA'
        },
        capacity: 2000,
        connections: ['warehouse-1'],
        metrics: {
          currentInventory: 1000,
          utilizationRate: 0.5,
          lastUpdateTimestamp: new Date().toISOString()
        }
      },
      {
        nodeId: 'warehouse-1',
        type: 'warehouse',
        name: 'Test Warehouse',
        location: {
          latitude: 40.7489,
          longitude: -73.9680,
          address: '789 Storage Rd',
          city: 'New York',
          country: 'USA'
        },
        capacity: 5000,
        connections: ['retailer-1'],
        metrics: {
          currentInventory: 2500,
          utilizationRate: 0.5,
          lastUpdateTimestamp: new Date().toISOString()
        }
      },
      {
        nodeId: 'retailer-1',
        type: 'retailer',
        name: 'Test Retailer',
        location: {
          latitude: 40.7614,
          longitude: -73.9776,
          address: '321 Store St',
          city: 'New York',
          country: 'USA'
        },
        capacity: 1000,
        connections: [],
        metrics: {
          currentInventory: 500,
          utilizationRate: 0.5,
          lastUpdateTimestamp: new Date().toISOString()
        }
      }
    ],
    edges: [],
    configuration: {},
    recentActions: [],
    activeSimulations: []
  };

  describe('runSimulationAction', () => {
    it('should validate required parameters', () => {
      const invalidParams = {
        type: 'INVALID_TYPE',
        location: { latitude: 40.7128, longitude: -74.0060, address: '123 Main', city: 'NYC', country: 'USA' },
        severity: Severity.HIGH,
        duration: 24
      };

      const result = runSimulationAction.validate(invalidParams);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid parameters', () => {
      const validParams = {
        type: DisruptionType.NATURAL_DISASTER,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        },
        severity: Severity.HIGH,
        duration: 24,
        affectedNodes: ['supplier-1', 'manufacturer-1']
      };

      const result = runSimulationAction.validate(validParams);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should execute simulation successfully', async () => {
      const params = {
        type: DisruptionType.NATURAL_DISASTER,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        },
        severity: Severity.HIGH,
        duration: 24
      };

      const result = await runSimulationAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.scenario).toBeDefined();
      expect(result.data.affectedNodesCount).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should fail when no nodes are available', async () => {
      const emptyContext: SupplyChainContext = {
        ...mockContext,
        nodes: []
      };

      const params = {
        type: DisruptionType.NATURAL_DISASTER,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        },
        severity: Severity.HIGH,
        duration: 24
      };

      const result = await runSimulationAction.execute(params, emptyContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No nodes available');
    });
  });

  describe('whatIfPortClosureAction', () => {
    it('should validate port location parameter', () => {
      const invalidParams = {
        portLocation: { latitude: 'invalid', longitude: -74.0060 },
        duration: 48
      };

      const result = whatIfPortClosureAction.validate(invalidParams);
      expect(result.valid).toBe(false);
    });

    it('should execute port closure simulation', async () => {
      const params = {
        portLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Port Authority',
          city: 'New York',
          country: 'USA'
        },
        duration: 48,
        severity: Severity.CRITICAL
      };

      const result = await whatIfPortClosureAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.portLocation).toEqual(params.portLocation);
      expect(result.data.alternativeRoutes).toBeDefined();
    });

    it('should find nodes near port location', async () => {
      const params = {
        portLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Port Authority',
          city: 'New York',
          country: 'USA'
        },
        duration: 48
      };

      const result = await whatIfPortClosureAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.affectedNodesCount).toBeGreaterThan(0);
    });
  });

  describe('whatIfSupplierFailureAction', () => {
    it('should validate supplier ID parameter', () => {
      const invalidParams = {
        supplierId: '',
        duration: 72
      };

      const result = whatIfSupplierFailureAction.validate(invalidParams);
      expect(result.valid).toBe(false);
    });

    it('should execute supplier failure simulation', async () => {
      const params = {
        supplierId: 'supplier-1',
        duration: 72,
        severity: Severity.CRITICAL
      };

      const result = await whatIfSupplierFailureAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.supplierNode).toBeDefined();
      expect(result.data.supplierNode.id).toBe('supplier-1');
      expect(result.data.alternativeSuppliers).toBeDefined();
    });

    it('should fail when supplier not found', async () => {
      const params = {
        supplierId: 'non-existent-supplier',
        duration: 72
      };

      const result = await whatIfSupplierFailureAction.execute(params, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when node is not a supplier', async () => {
      const params = {
        supplierId: 'warehouse-1',
        duration: 72
      };

      const result = await whatIfSupplierFailureAction.execute(params, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a supplier');
    });

    it('should identify downstream affected nodes', async () => {
      const params = {
        supplierId: 'supplier-1',
        duration: 72
      };

      const result = await whatIfSupplierFailureAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.affectedNodesCount).toBeGreaterThan(1); // Should include supplier + downstream
    });
  });

  describe('whatIfDemandSpikeAction', () => {
    it('should validate demand increase parameter', () => {
      const invalidParams = {
        demandIncrease: -10,
        duration: 24
      };

      const result = whatIfDemandSpikeAction.validate(invalidParams);
      expect(result.valid).toBe(false);
    });

    it('should execute demand spike simulation', async () => {
      const params = {
        demandIncrease: 50,
        duration: 24
      };

      const result = await whatIfDemandSpikeAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.demandIncrease).toBe('50%');
      expect(result.data.capacityGap).toBeDefined();
    });

    it('should execute demand spike with affected region', async () => {
      const params = {
        demandIncrease: 75,
        duration: 48,
        affectedRegion: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Downtown',
          city: 'New York',
          country: 'USA'
        }
      };

      const result = await whatIfDemandSpikeAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.affectedNodesCount).toBeGreaterThan(0);
    });

    it('should calculate severity based on demand increase', async () => {
      const highDemandParams = {
        demandIncrease: 150,
        duration: 24
      };

      const result = await whatIfDemandSpikeAction.execute(highDemandParams, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.scenario.parameters.severity).toBe(Severity.CRITICAL);
    });

    it('should calculate capacity gap', async () => {
      const params = {
        demandIncrease: 100,
        duration: 24
      };

      const result = await whatIfDemandSpikeAction.execute(params, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.capacityGap).toBeDefined();
      expect(result.data.capacityGap.currentUtilization).toBeDefined();
      expect(result.data.capacityGap.projectedUtilization).toBeDefined();
    });
  });

  describe('Action metadata', () => {
    it('should have correct category for all simulation actions', () => {
      expect(runSimulationAction.category).toBe('simulate');
      expect(whatIfPortClosureAction.category).toBe('simulate');
      expect(whatIfSupplierFailureAction.category).toBe('simulate');
      expect(whatIfDemandSpikeAction.category).toBe('simulate');
    });

    it('should have examples for all simulation actions', () => {
      expect(runSimulationAction.examples.length).toBeGreaterThan(0);
      expect(whatIfPortClosureAction.examples.length).toBeGreaterThan(0);
      expect(whatIfSupplierFailureAction.examples.length).toBeGreaterThan(0);
      expect(whatIfDemandSpikeAction.examples.length).toBeGreaterThan(0);
    });

    it('should have descriptions for all simulation actions', () => {
      expect(runSimulationAction.description).toBeTruthy();
      expect(whatIfPortClosureAction.description).toBeTruthy();
      expect(whatIfSupplierFailureAction.description).toBeTruthy();
      expect(whatIfDemandSpikeAction.description).toBeTruthy();
    });
  });
});
