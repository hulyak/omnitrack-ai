/**
 * Tests for Analysis Actions
 */

import {
  scanAnomaliesAction,
  identifyRisksAction,
  findBottlenecksAction,
  calculateUtilizationAction
} from './analysis-actions';
import { SupplyChainContext } from '../action-registry';
import { NodeType, NodeStatus } from '../../models/types';

// Mock the repositories
jest.mock('../../repositories/node-repository');
jest.mock('../../repositories/alert-repository');
jest.mock('../../utils/logger');

import { NodeRepository } from '../../repositories/node-repository';
import { AlertRepository } from '../../repositories/alert-repository';

describe('Analysis Actions', () => {
  let mockContext: SupplyChainContext;
  let mockNodeRepository: jest.Mocked<NodeRepository>;
  let mockAlertRepository: jest.Mocked<AlertRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock context
    mockContext = {
      userId: 'test-user',
      edges: [],
      recentActions: [],
      activeSimulations: [],
      nodes: [
        {
          nodeId: 'node-1',
          type: NodeType.SUPPLIER,
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St',
            city: 'New York',
            country: 'USA'
          },
          capacity: 1000,
          status: NodeStatus.OPERATIONAL,
          connections: ['node-2'],
          metrics: {
            currentInventory: 500,
            utilizationRate: 0.5,
            lastUpdateTimestamp: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        {
          nodeId: 'node-2',
          type: NodeType.MANUFACTURER,
          location: {
            latitude: 40.7580,
            longitude: -73.9855,
            address: '456 Factory Ave',
            city: 'New York',
            country: 'USA'
          },
          capacity: 2000,
          status: NodeStatus.OPERATIONAL,
          connections: ['node-3'],
          metrics: {
            currentInventory: 1800,
            utilizationRate: 0.95,
            lastUpdateTimestamp: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        }
      ],
      configuration: {
        region: 'north-america',
        industry: 'electronics',
        currency: 'USD'
      }
    };

    // Setup repository mocks
    mockNodeRepository = NodeRepository.prototype as jest.Mocked<NodeRepository>;
    mockAlertRepository = AlertRepository.prototype as jest.Mocked<AlertRepository>;
  });

  describe('scanAnomaliesAction', () => {
    it('should validate parameters correctly', () => {
      const validParams = { nodeIds: ['node-1', 'node-2'] };
      const result = scanAnomaliesAction.validate(validParams);
      expect(result.valid).toBe(true);
    });

    it('should detect high utilization anomaly', async () => {
      mockNodeRepository.getNodesByIds = jest.fn().mockResolvedValue(mockContext.nodes);

      const result = await scanAnomaliesAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.anomaliesFound).toBeGreaterThan(0);
      
      const highUtilizationAnomaly = result.data.anomalies.find(
        (a: any) => a.type === 'high-utilization'
      );
      expect(highUtilizationAnomaly).toBeDefined();
      expect(highUtilizationAnomaly.nodeId).toBe('node-2');
    });

    it('should return error when no nodes available', async () => {
      const emptyContext = { ...mockContext, nodes: [] };
      const result = await scanAnomaliesAction.execute({}, emptyContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No nodes available');
    });
  });

  describe('identifyRisksAction', () => {
    it('should identify capacity constraint risks', async () => {
      mockAlertRepository.getAlertsByStatus = jest.fn().mockResolvedValue({ items: [] });

      const result = await identifyRisksAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.totalRisks).toBeGreaterThan(0);
      
      const capacityRisk = result.data.risks.find(
        (r: any) => r.type === 'capacity-constraint'
      );
      expect(capacityRisk).toBeDefined();
    });

    it('should identify geographic concentration risks', async () => {
      mockAlertRepository.getAlertsByStatus = jest.fn().mockResolvedValue({ items: [] });

      const result = await identifyRisksAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      
      const geoRisk = result.data.risks.find(
        (r: any) => r.type === 'geographic-concentration'
      );
      expect(geoRisk).toBeDefined();
    });

    it('should return error when no nodes available', async () => {
      const emptyContext = { ...mockContext, nodes: [] };
      const result = await identifyRisksAction.execute({}, emptyContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No nodes available');
    });
  });

  describe('findBottlenecksAction', () => {
    it('should identify capacity bottlenecks', async () => {
      const result = await findBottlenecksAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.totalBottlenecks).toBeGreaterThan(0);
      
      const capacityBottleneck = result.data.bottlenecks.find(
        (b: any) => b.type === 'capacity-bottleneck'
      );
      expect(capacityBottleneck).toBeDefined();
      expect(capacityBottleneck.nodeId).toBe('node-2');
    });

    it('should provide suggestions when bottlenecks found', async () => {
      const result = await findBottlenecksAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should return error when no nodes available', async () => {
      const emptyContext = { ...mockContext, nodes: [] };
      const result = await findBottlenecksAction.execute({}, emptyContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No nodes available');
    });
  });

  describe('calculateUtilizationAction', () => {
    it('should calculate utilization metrics for all nodes', async () => {
      mockNodeRepository.getNodesByIds = jest.fn().mockResolvedValue(mockContext.nodes);

      const result = await calculateUtilizationAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.summary.nodesAnalyzed).toBe(2);
      expect(result.data.nodeMetrics).toHaveLength(2);
    });

    it('should calculate average utilization correctly', async () => {
      mockNodeRepository.getNodesByIds = jest.fn().mockResolvedValue(mockContext.nodes);

      const result = await calculateUtilizationAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      // Average of 0.5 and 0.95 = 0.725 = 72.5%
      expect(result.data.summary.averageUtilization).toBe('72.5%');
    });

    it('should mark high utilization nodes as critical', async () => {
      mockNodeRepository.getNodesByIds = jest.fn().mockResolvedValue(mockContext.nodes);

      const result = await calculateUtilizationAction.execute({}, mockContext);

      expect(result.success).toBe(true);
      
      const criticalNode = result.data.nodeMetrics.find(
        (m: any) => m.status === 'critical'
      );
      expect(criticalNode).toBeDefined();
      expect(criticalNode.nodeId).toBe('node-2');
    });

    it('should calculate specific nodes when nodeIds provided', async () => {
      mockNodeRepository.getNodesByIds = jest.fn().mockResolvedValue([mockContext.nodes![0]]);

      const result = await calculateUtilizationAction.execute(
        { nodeIds: ['node-1'] },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockNodeRepository.getNodesByIds).toHaveBeenCalledWith(['node-1']);
    });

    it('should return error when no nodes available', async () => {
      const emptyContext = { ...mockContext, nodes: [] };
      const result = await calculateUtilizationAction.execute({}, emptyContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No nodes available');
    });
  });

  describe('Action Metadata', () => {
    it('should have correct category for all analysis actions', () => {
      expect(scanAnomaliesAction.category).toBe('analyze');
      expect(identifyRisksAction.category).toBe('analyze');
      expect(findBottlenecksAction.category).toBe('analyze');
      expect(calculateUtilizationAction.category).toBe('analyze');
    });

    it('should have descriptions for all actions', () => {
      expect(scanAnomaliesAction.description).toBeTruthy();
      expect(identifyRisksAction.description).toBeTruthy();
      expect(findBottlenecksAction.description).toBeTruthy();
      expect(calculateUtilizationAction.description).toBeTruthy();
    });

    it('should have examples for all actions', () => {
      expect(scanAnomaliesAction.examples.length).toBeGreaterThan(0);
      expect(identifyRisksAction.examples.length).toBeGreaterThan(0);
      expect(findBottlenecksAction.examples.length).toBeGreaterThan(0);
      expect(calculateUtilizationAction.examples.length).toBeGreaterThan(0);
    });
  });
});
