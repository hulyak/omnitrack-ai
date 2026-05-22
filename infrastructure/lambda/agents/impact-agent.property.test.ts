/**
 * Property-based tests for Impact Agent
 * 
 * Feature: omnitrack-ai-supply-chain, Property 7: Simulation output completeness
 * Validates: Requirements 2.2, 2.3, 6.1
 * 
 * Feature: omnitrack-ai-supply-chain, Property 9: Conditional sustainability calculation
 * Validates: Requirements 2.5
 */

import * as fc from 'fast-check';
import { handler } from './impact-agent';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { NodeRepository } from '../repositories/node-repository';
import { 
  DisruptionType, 
  Severity, 
  Location,
  Scenario,
  Node,
  NodeType,
  NodeStatus
} from '../models/types';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK clients
jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    GetCommand: jest.fn(),
    PutCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    QueryCommand: jest.fn(),
    BatchGetCommand: jest.fn()
  };
});

// Mock X-Ray
jest.mock('aws-xray-sdk-core', () => ({
  getSegment: jest.fn(() => ({
    addNewSubsegment: jest.fn(() => ({
      addAnnotation: jest.fn(),
      addError: jest.fn(),
      close: jest.fn()
    }))
  }))
}));

// In-memory storage for testing
const mockScenarioStorage = new Map<string, any>();
const mockNodeStorage = new Map<string, any>();

// Mock ScenarioRepository
jest.mock('../repositories/scenario-repository', () => {
  return {
    ScenarioRepository: jest.fn().mockImplementation(() => {
      return {
        getScenarioById: async (scenarioId: string) => {
          const key = `SCENARIO#${scenarioId}#DEFINITION`;
          return mockScenarioStorage.get(key) || null;
        },
        createScenario: async (scenario: any) => {
          const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = new Date().toISOString();

          const newScenario: any = {
            scenarioId,
            ...scenario,
            createdAt: timestamp,
            updatedAt: timestamp,
            version: 1
          };

          const key = `SCENARIO#${scenarioId}#DEFINITION`;
          mockScenarioStorage.set(key, newScenario);

          return newScenario;
        }
      };
    })
  };
});

// Mock NodeRepository
jest.mock('../repositories/node-repository', () => {
  return {
    NodeRepository: jest.fn().mockImplementation(() => {
      return {
        getNodesByIds: async (nodeIds: string[]) => {
          const nodes: any[] = [];
          for (const nodeId of nodeIds) {
            const key = `NODE#${nodeId}#METADATA`;
            const node = mockNodeStorage.get(key);
            if (node) {
              nodes.push(node);
            }
          }
          return nodes;
        },
        createNode: async (node: any) => {
          const nodeId = node.nodeId || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = new Date().toISOString();

          const newNode: any = {
            nodeId,
            ...node,
            createdAt: timestamp,
            updatedAt: timestamp,
            version: 1
          };

          const key = `NODE#${nodeId}#METADATA`;
          mockNodeStorage.set(key, newNode);

          return newNode;
        }
      };
    })
  };
});

describe('Impact Agent Property Tests', () => {
  beforeEach(() => {
    mockScenarioStorage.clear();
    mockNodeStorage.clear();
    jest.clearAllMocks();
  });

  describe('Property 7: Simulation output completeness', () => {
    /**
     * For any completed simulation, the results should include all required fields:
     * cost impact, delivery time impact, inventory impact, decision tree, and 
     * natural language summary.
     * 
     * This test verifies that the Impact Agent always returns complete results
     * with all required fields populated.
     */
    it('should return complete simulation results with all required fields', async () => {
      // Generator for valid location data
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      // Generator for valid node data
      const nodeArb = fc.record({
        nodeId: fc.uuid(),
        type: fc.constantFrom(...Object.values(NodeType)),
        location: locationArb,
        capacity: fc.integer({ min: 100, max: 10000 }),
        status: fc.constantFrom(...Object.values(NodeStatus)),
        connections: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        metrics: fc.record({
          currentInventory: fc.integer({ min: 0, max: 5000 }),
          utilizationRate: fc.double({ min: 0, max: 1, noNaN: true }),
          lastUpdateTimestamp: fc.constant(new Date().toISOString())
        })
      });

      // Generator for valid scenario data
      const scenarioArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }),
        affectedNodeCount: fc.integer({ min: 1, max: 5 }),
        userId: fc.uuid(),
        includeSustainability: fc.boolean()
      });

      await fc.assert(
        fc.asyncProperty(
          scenarioArb,
          fc.array(nodeArb, { minLength: 1, maxLength: 5 }),
          async (scenarioData, nodes) => {
            mockScenarioStorage.clear();
            mockNodeStorage.clear();

            // Create nodes in mock storage
            const nodeIds: string[] = [];
            for (let i = 0; i < Math.min(scenarioData.affectedNodeCount, nodes.length); i++) {
              const node = nodes[i];
              const key = `NODE#${node.nodeId}#METADATA`;
              mockNodeStorage.set(key, node);
              nodeIds.push(node.nodeId);
            }

            // Create scenario in mock storage
            const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const scenario: any = {
              scenarioId,
              type: scenarioData.type,
              parameters: {
                location: scenarioData.location,
                severity: scenarioData.severity,
                duration: scenarioData.duration,
                affectedNodes: nodeIds
              },
              createdBy: scenarioData.userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: false,
              version: 1
            };

            const scenarioKey = `SCENARIO#${scenarioId}#DEFINITION`;
            mockScenarioStorage.set(scenarioKey, scenario);

            // Create request
            const request = {
              scenarioId,
              includeSustainability: scenarioData.includeSustainability,
              simulationIterations: 100 // Use fewer iterations for faster tests
            };

            // Create mock API Gateway event
            const event: Partial<APIGatewayProxyEvent> = {
              body: JSON.stringify(request),
              headers: {
                'x-correlation-id': `test-${Date.now()}`
              },
              requestContext: {
                requestId: `req-${Date.now()}`
              } as any,
              path: '/agents/impact',
              httpMethod: 'POST'
            };

            // Create mock Lambda context
            const context: Partial<Context> = {
              awsRequestId: `ctx-${Date.now()}`,
              functionName: 'impact-agent-test',
              getRemainingTimeInMillis: () => 300000
            };

            // Invoke handler
            const response = await handler(
              event as APIGatewayProxyEvent,
              context as Context
            );

            // Verify successful response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(response.body);

            // Verify all required fields are present
            expect(responseBody.scenarioId).toBeDefined();
            expect(responseBody.scenarioId).toBe(scenarioId);

            // Verify impacts object is present and complete
            expect(responseBody.impacts).toBeDefined();
            expect(typeof responseBody.impacts.costImpact).toBe('number');
            expect(typeof responseBody.impacts.deliveryTimeImpact).toBe('number');
            expect(typeof responseBody.impacts.inventoryImpact).toBe('number');

            // Verify impacts are non-negative
            expect(responseBody.impacts.costImpact).toBeGreaterThanOrEqual(0);
            expect(responseBody.impacts.deliveryTimeImpact).toBeGreaterThanOrEqual(0);
            expect(responseBody.impacts.inventoryImpact).toBeGreaterThanOrEqual(0);

            // Verify decision tree is present and well-formed
            expect(responseBody.decisionTree).toBeDefined();
            expect(responseBody.decisionTree.nodes).toBeDefined();
            expect(Array.isArray(responseBody.decisionTree.nodes)).toBe(true);
            expect(responseBody.decisionTree.nodes.length).toBeGreaterThan(0);
            expect(responseBody.decisionTree.edges).toBeDefined();
            expect(Array.isArray(responseBody.decisionTree.edges)).toBe(true);
            expect(responseBody.decisionTree.edges.length).toBeGreaterThan(0);

            // Verify each decision tree node has required fields
            for (const node of responseBody.decisionTree.nodes) {
              expect(node.nodeId).toBeDefined();
              expect(node.label).toBeDefined();
              expect(node.type).toBeDefined();
              expect(['decision', 'outcome', 'condition']).toContain(node.type);
            }

            // Verify each decision tree edge has required fields
            for (const edge of responseBody.decisionTree.edges) {
              expect(edge.from).toBeDefined();
              expect(edge.to).toBeDefined();
              expect(edge.label).toBeDefined();
            }

            // Verify natural language summary is present and non-empty
            expect(responseBody.naturalLanguageSummary).toBeDefined();
            expect(typeof responseBody.naturalLanguageSummary).toBe('string');
            expect(responseBody.naturalLanguageSummary.length).toBeGreaterThan(0);

            // Verify confidence is present and in valid range
            expect(responseBody.confidence).toBeDefined();
            expect(typeof responseBody.confidence).toBe('number');
            expect(responseBody.confidence).toBeGreaterThanOrEqual(0);
            expect(responseBody.confidence).toBeLessThanOrEqual(1);

            // Verify metadata is present
            expect(responseBody.metadata).toBeDefined();
            expect(responseBody.metadata.correlationId).toBeDefined();
            expect(typeof responseBody.metadata.executionTime).toBe('number');
            expect(responseBody.metadata.executionTime).toBeGreaterThan(0);
            expect(typeof responseBody.metadata.simulationIterations).toBe('number');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    }, 180000); // 180 second timeout

    /**
     * Additional property: Decision tree structure should be valid
     * 
     * Verifies that the decision tree forms a valid directed graph with
     * proper node references in edges.
     */
    it('should generate valid decision tree structure with proper node references', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const nodeArb = fc.record({
        nodeId: fc.uuid(),
        type: fc.constantFrom(...Object.values(NodeType)),
        location: locationArb,
        capacity: fc.integer({ min: 100, max: 10000 }),
        status: fc.constantFrom(...Object.values(NodeStatus)),
        connections: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        metrics: fc.record({
          currentInventory: fc.integer({ min: 0, max: 5000 }),
          utilizationRate: fc.double({ min: 0, max: 1, noNaN: true }),
          lastUpdateTimestamp: fc.constant(new Date().toISOString())
        })
      });

      const scenarioArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }),
        affectedNodeCount: fc.integer({ min: 1, max: 5 }),
        userId: fc.uuid()
      });

      await fc.assert(
        fc.asyncProperty(
          scenarioArb,
          fc.array(nodeArb, { minLength: 1, maxLength: 5 }),
          async (scenarioData, nodes) => {
            mockScenarioStorage.clear();
            mockNodeStorage.clear();

            // Create nodes in mock storage
            const nodeIds: string[] = [];
            for (let i = 0; i < Math.min(scenarioData.affectedNodeCount, nodes.length); i++) {
              const node = nodes[i];
              const key = `NODE#${node.nodeId}#METADATA`;
              mockNodeStorage.set(key, node);
              nodeIds.push(node.nodeId);
            }

            // Create scenario
            const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const scenario: any = {
              scenarioId,
              type: scenarioData.type,
              parameters: {
                location: scenarioData.location,
                severity: scenarioData.severity,
                duration: scenarioData.duration,
                affectedNodes: nodeIds
              },
              createdBy: scenarioData.userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: false,
              version: 1
            };

            const scenarioKey = `SCENARIO#${scenarioId}#DEFINITION`;
            mockScenarioStorage.set(scenarioKey, scenario);

            const request = {
              scenarioId,
              simulationIterations: 100
            };

            const event: Partial<APIGatewayProxyEvent> = {
              body: JSON.stringify(request),
              headers: { 'x-correlation-id': `test-${Date.now()}` },
              requestContext: { requestId: `req-${Date.now()}` } as any,
              path: '/agents/impact',
              httpMethod: 'POST'
            };

            const context: Partial<Context> = {
              awsRequestId: `ctx-${Date.now()}`,
              functionName: 'impact-agent-test',
              getRemainingTimeInMillis: () => 300000
            };

            const response = await handler(
              event as APIGatewayProxyEvent,
              context as Context
            );

            expect(response.statusCode).toBe(200);

            const responseBody = JSON.parse(response.body);
            const decisionTree = responseBody.decisionTree;

            // Build set of node IDs
            const nodeIdSet = new Set(decisionTree.nodes.map((n: any) => n.nodeId));

            // Verify all edge references point to existing nodes
            for (const edge of decisionTree.edges) {
              expect(nodeIdSet.has(edge.from)).toBe(true);
              expect(nodeIdSet.has(edge.to)).toBe(true);
            }

            // Verify there's a root node
            const hasRoot = decisionTree.nodes.some((n: any) => n.nodeId === 'root');
            expect(hasRoot).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    }, 120000);
  });

  describe('Property 9: Conditional sustainability calculation', () => {
    /**
     * For any simulation that includes sustainability parameters, the results
     * should include carbon footprint estimates.
     * 
     * This test verifies that when sustainability is requested, the impact
     * analysis includes complete sustainability metrics.
     */
    it('should include sustainability metrics when requested', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const nodeArb = fc.record({
        nodeId: fc.uuid(),
        type: fc.constantFrom(...Object.values(NodeType)),
        location: locationArb,
        capacity: fc.integer({ min: 100, max: 10000 }),
        status: fc.constantFrom(...Object.values(NodeStatus)),
        connections: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        metrics: fc.record({
          currentInventory: fc.integer({ min: 0, max: 5000 }),
          utilizationRate: fc.double({ min: 0, max: 1, noNaN: true }),
          lastUpdateTimestamp: fc.constant(new Date().toISOString())
        })
      });

      const scenarioArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }),
        affectedNodeCount: fc.integer({ min: 1, max: 5 }),
        userId: fc.uuid()
      });

      await fc.assert(
        fc.asyncProperty(
          scenarioArb,
          fc.array(nodeArb, { minLength: 1, maxLength: 5 }),
          async (scenarioData, nodes) => {
            mockScenarioStorage.clear();
            mockNodeStorage.clear();

            // Create nodes in mock storage
            const nodeIds: string[] = [];
            for (let i = 0; i < Math.min(scenarioData.affectedNodeCount, nodes.length); i++) {
              const node = nodes[i];
              const key = `NODE#${node.nodeId}#METADATA`;
              mockNodeStorage.set(key, node);
              nodeIds.push(node.nodeId);
            }

            // Create scenario
            const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const scenario: any = {
              scenarioId,
              type: scenarioData.type,
              parameters: {
                location: scenarioData.location,
                severity: scenarioData.severity,
                duration: scenarioData.duration,
                affectedNodes: nodeIds
              },
              createdBy: scenarioData.userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: false,
              version: 1
            };

            const scenarioKey = `SCENARIO#${scenarioId}#DEFINITION`;
            mockScenarioStorage.set(scenarioKey, scenario);

            // Request WITH sustainability
            const request = {
              scenarioId,
              includeSustainability: true,
              simulationIterations: 100
            };

            const event: Partial<APIGatewayProxyEvent> = {
              body: JSON.stringify(request),
              headers: { 'x-correlation-id': `test-${Date.now()}` },
              requestContext: { requestId: `req-${Date.now()}` } as any,
              path: '/agents/impact',
              httpMethod: 'POST'
            };

            const context: Partial<Context> = {
              awsRequestId: `ctx-${Date.now()}`,
              functionName: 'impact-agent-test',
              getRemainingTimeInMillis: () => 300000
            };

            const response = await handler(
              event as APIGatewayProxyEvent,
              context as Context
            );

            expect(response.statusCode).toBe(200);

            const responseBody = JSON.parse(response.body);

            // Verify sustainability impact is present
            expect(responseBody.impacts.sustainabilityImpact).toBeDefined();

            // Verify all sustainability fields are present
            expect(typeof responseBody.impacts.sustainabilityImpact.carbonFootprint).toBe('number');
            expect(responseBody.impacts.sustainabilityImpact.carbonFootprint).toBeGreaterThanOrEqual(0);

            expect(responseBody.impacts.sustainabilityImpact.emissionsByRoute).toBeDefined();
            expect(typeof responseBody.impacts.sustainabilityImpact.emissionsByRoute).toBe('object');

            expect(typeof responseBody.impacts.sustainabilityImpact.sustainabilityScore).toBe('number');
            expect(responseBody.impacts.sustainabilityImpact.sustainabilityScore).toBeGreaterThanOrEqual(0);
            expect(responseBody.impacts.sustainabilityImpact.sustainabilityScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    }, 180000);

    /**
     * Additional property: Sustainability should NOT be included when not requested
     * 
     * Verifies that sustainability metrics are only calculated when explicitly
     * requested, avoiding unnecessary computation.
     */
    it('should NOT include sustainability metrics when not requested', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const nodeArb = fc.record({
        nodeId: fc.uuid(),
        type: fc.constantFrom(...Object.values(NodeType)),
        location: locationArb,
        capacity: fc.integer({ min: 100, max: 10000 }),
        status: fc.constantFrom(...Object.values(NodeStatus)),
        connections: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        metrics: fc.record({
          currentInventory: fc.integer({ min: 0, max: 5000 }),
          utilizationRate: fc.double({ min: 0, max: 1, noNaN: true }),
          lastUpdateTimestamp: fc.constant(new Date().toISOString())
        })
      });

      const scenarioArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }),
        affectedNodeCount: fc.integer({ min: 1, max: 5 }),
        userId: fc.uuid()
      });

      await fc.assert(
        fc.asyncProperty(
          scenarioArb,
          fc.array(nodeArb, { minLength: 1, maxLength: 5 }),
          async (scenarioData, nodes) => {
            mockScenarioStorage.clear();
            mockNodeStorage.clear();

            // Create nodes
            const nodeIds: string[] = [];
            for (let i = 0; i < Math.min(scenarioData.affectedNodeCount, nodes.length); i++) {
              const node = nodes[i];
              const key = `NODE#${node.nodeId}#METADATA`;
              mockNodeStorage.set(key, node);
              nodeIds.push(node.nodeId);
            }

            // Create scenario
            const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const scenario: any = {
              scenarioId,
              type: scenarioData.type,
              parameters: {
                location: scenarioData.location,
                severity: scenarioData.severity,
                duration: scenarioData.duration,
                affectedNodes: nodeIds
              },
              createdBy: scenarioData.userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: false,
              version: 1
            };

            const scenarioKey = `SCENARIO#${scenarioId}#DEFINITION`;
            mockScenarioStorage.set(scenarioKey, scenario);

            // Request WITHOUT sustainability
            const request = {
              scenarioId,
              includeSustainability: false,
              simulationIterations: 100
            };

            const event: Partial<APIGatewayProxyEvent> = {
              body: JSON.stringify(request),
              headers: { 'x-correlation-id': `test-${Date.now()}` },
              requestContext: { requestId: `req-${Date.now()}` } as any,
              path: '/agents/impact',
              httpMethod: 'POST'
            };

            const context: Partial<Context> = {
              awsRequestId: `ctx-${Date.now()}`,
              functionName: 'impact-agent-test',
              getRemainingTimeInMillis: () => 300000
            };

            const response = await handler(
              event as APIGatewayProxyEvent,
              context as Context
            );

            expect(response.statusCode).toBe(200);

            const responseBody = JSON.parse(response.body);

            // Verify sustainability impact is NOT present
            expect(responseBody.impacts.sustainabilityImpact).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    }, 180000);
  });
});
