/**
 * Property-based tests for Scenario Agent
 * 
 * Feature: omnitrack-ai-supply-chain, Property 6: Simulation performance guarantee
 * Validates: Requirements 2.1
 * 
 * Feature: omnitrack-ai-supply-chain, Property 8: Scenario variation diversity
 * Validates: Requirements 2.4
 */

import * as fc from 'fast-check';
import { handler } from './scenario-agent';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { 
  DisruptionType, 
  Severity, 
  Location,
  Scenario
} from '../models/types';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              description: 'Test scenario description',
              riskFactors: ['factor1', 'factor2'],
              timeline: 'Test timeline',
              criticalDecisionPoints: ['point1', 'point2'],
              additionalParameters: {
                estimatedCostImpact: 100000,
                probabilityOfOccurrence: 0.7
              }
            })
          }]
        }))
      })
    })),
    InvokeModelCommand: jest.fn()
  };
});

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
const mockStorage = new Map<string, any>();

// Mock ScenarioRepository module - use inline implementation
jest.mock('../repositories/scenario-repository', () => {
  return {
    ScenarioRepository: jest.fn().mockImplementation(() => {
      return {
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
          mockStorage.set(key, newScenario);

          return newScenario;
        },
        getScenarioById: async (scenarioId: string) => {
          const key = `SCENARIO#${scenarioId}#DEFINITION`;
          return mockStorage.get(key) || null;
        }
      };
    })
  };
});

describe('Scenario Agent Property Tests', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
  });

  describe('Property 6: Simulation performance guarantee', () => {
    /**
     * For any valid scenario parameters (disruption type, location, severity),
     * the system should complete simulation and return results within 60 seconds.
     * 
     * This test verifies that scenario generation completes within the required
     * time window regardless of input parameters.
     */
    it('should generate scenarios within 60 seconds for any valid parameters', async () => {
      // Generator for valid location data
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      // Generator for valid scenario request
      const scenarioRequestArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }), // 1 to 720 hours (30 days)
        affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        userId: fc.uuid(),
        isPublic: fc.boolean(),
        generateVariations: fc.constant(false) // Don't generate variations for performance test
      });

      await fc.assert(
        fc.asyncProperty(scenarioRequestArb, async (requestData) => {
          mockStorage.clear();
          const startTime = Date.now();

          // Create mock API Gateway event
          const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify(requestData),
            headers: {
              'x-correlation-id': `test-${Date.now()}`
            },
            requestContext: {
              requestId: `req-${Date.now()}`
            } as any,
            path: '/agents/scenario',
            httpMethod: 'POST'
          };

          // Create mock Lambda context
          const context: Partial<Context> = {
            awsRequestId: `ctx-${Date.now()}`,
            functionName: 'scenario-agent-test',
            getRemainingTimeInMillis: () => 300000
          };

          // Invoke handler
          const response = await handler(
            event as APIGatewayProxyEvent,
            context as Context
          );

          const endTime = Date.now();
          const elapsedTime = endTime - startTime;

          // Verify performance guarantee (within 60 seconds = 60000ms)
          expect(elapsedTime).toBeLessThan(60000);

          // Verify successful response
          expect(response.statusCode).toBe(200);

          // Verify response contains scenario
          const responseBody = JSON.parse(response.body);
          expect(responseBody.scenario).toBeDefined();
          expect(responseBody.scenario.scenarioId).toBeDefined();
          expect(responseBody.scenario.type).toBe(requestData.type);
          expect(responseBody.scenario.parameters.severity).toBe(requestData.severity);
          expect(responseBody.scenario.parameters.duration).toBe(requestData.duration);

          // Verify metadata includes execution time
          expect(responseBody.metadata).toBeDefined();
          expect(responseBody.metadata.executionTime).toBeLessThan(60000);
        }),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    }, 120000); // 120 second timeout for the entire test suite

    /**
     * Additional property: Scenario generation should be deterministic for same inputs
     * (when not using LLM randomness)
     */
    it('should generate consistent scenarios for identical parameters', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const scenarioRequestArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 1, max: 720 }),
        affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        userId: fc.uuid(),
        isPublic: fc.boolean(),
        generateVariations: fc.constant(false)
      });

      await fc.assert(
        fc.asyncProperty(scenarioRequestArb, async (requestData) => {
          mockStorage.clear();

          const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify(requestData),
            headers: { 'x-correlation-id': `test-${Date.now()}` },
            requestContext: { requestId: `req-${Date.now()}` } as any,
            path: '/agents/scenario',
            httpMethod: 'POST'
          };

          const context: Partial<Context> = {
            awsRequestId: `ctx-${Date.now()}`,
            functionName: 'scenario-agent-test',
            getRemainingTimeInMillis: () => 300000
          };

          // Generate scenario twice
          const response1 = await handler(
            event as APIGatewayProxyEvent,
            context as Context
          );

          const response2 = await handler(
            event as APIGatewayProxyEvent,
            context as Context
          );

          // Both should succeed
          expect(response1.statusCode).toBe(200);
          expect(response2.statusCode).toBe(200);

          const body1 = JSON.parse(response1.body);
          const body2 = JSON.parse(response2.body);

          // Core parameters should match
          expect(body1.scenario.type).toBe(body2.scenario.type);
          expect(body1.scenario.parameters.severity).toBe(body2.scenario.parameters.severity);
          expect(body1.scenario.parameters.duration).toBe(body2.scenario.parameters.duration);
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  describe('Property 8: Scenario variation diversity', () => {
    /**
     * For any scenario variation request, the system should generate scenarios
     * where at least one parameter differs from the original while maintaining
     * validity constraints.
     * 
     * This test verifies that variations are actually different from the base
     * scenario and from each other.
     */
    it('should generate diverse variations with at least one differing parameter', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const scenarioRequestArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 10, max: 720 }), // At least 10 hours for variation
        affectedNodes: fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }), // At least 2 nodes
        userId: fc.uuid(),
        isPublic: fc.boolean(),
        generateVariations: fc.constant(true),
        variationCount: fc.integer({ min: 2, max: 5 })
      });

      await fc.assert(
        fc.asyncProperty(scenarioRequestArb, async (requestData) => {
          mockStorage.clear();

          const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify(requestData),
            headers: { 'x-correlation-id': `test-${Date.now()}` },
            requestContext: { requestId: `req-${Date.now()}` } as any,
            path: '/agents/scenario',
            httpMethod: 'POST'
          };

          const context: Partial<Context> = {
            awsRequestId: `ctx-${Date.now()}`,
            functionName: 'scenario-agent-test',
            getRemainingTimeInMillis: () => 300000
          };

          const response = await handler(
            event as APIGatewayProxyEvent,
            context as Context
          );

          expect(response.statusCode).toBe(200);

          const responseBody = JSON.parse(response.body);
          expect(responseBody.scenario).toBeDefined();
          expect(responseBody.variations).toBeDefined();
          expect(Array.isArray(responseBody.variations)).toBe(true);
          expect(responseBody.variations.length).toBeGreaterThan(0);

          const baseScenario = responseBody.scenario;
          const variations = responseBody.variations;

          // Check each variation differs from base in at least one parameter
          for (const variation of variations) {
            const differs = 
              variation.parameters.severity !== baseScenario.parameters.severity ||
              variation.parameters.duration !== baseScenario.parameters.duration ||
              variation.parameters.affectedNodes.length !== baseScenario.parameters.affectedNodes.length ||
              Math.abs(variation.parameters.location.latitude - baseScenario.parameters.location.latitude) > 0.01 ||
              Math.abs(variation.parameters.location.longitude - baseScenario.parameters.location.longitude) > 0.01;

            expect(differs).toBe(true);

            // Verify variation maintains validity constraints
            expect(Object.values(Severity)).toContain(variation.parameters.severity);
            expect(variation.parameters.duration).toBeGreaterThan(0);
            expect(Array.isArray(variation.parameters.affectedNodes)).toBe(true);
            expect(variation.parameters.affectedNodes.length).toBeGreaterThan(0);
            expect(variation.parameters.location.latitude).toBeGreaterThanOrEqual(-90);
            expect(variation.parameters.location.latitude).toBeLessThanOrEqual(90);
            expect(variation.parameters.location.longitude).toBeGreaterThanOrEqual(-180);
            expect(variation.parameters.location.longitude).toBeLessThanOrEqual(180);
          }
        }),
        { numRuns: 100 }
      );
    }, 180000); // 180 second timeout for variation tests

    /**
     * Additional property: Variations should maintain the same disruption type
     * 
     * While parameters vary, the core disruption type should remain consistent
     * to ensure variations are meaningful alternatives to the same scenario.
     */
    it('should maintain disruption type across all variations', async () => {
      const locationArb = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
        city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
      });

      const scenarioRequestArb = fc.record({
        type: fc.constantFrom(...Object.values(DisruptionType)),
        location: locationArb,
        severity: fc.constantFrom(...Object.values(Severity)),
        duration: fc.integer({ min: 10, max: 720 }),
        affectedNodes: fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        userId: fc.uuid(),
        isPublic: fc.boolean(),
        generateVariations: fc.constant(true),
        variationCount: fc.constant(3)
      });

      await fc.assert(
        fc.asyncProperty(scenarioRequestArb, async (requestData) => {
          mockStorage.clear();

          const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify(requestData),
            headers: { 'x-correlation-id': `test-${Date.now()}` },
            requestContext: { requestId: `req-${Date.now()}` } as any,
            path: '/agents/scenario',
            httpMethod: 'POST'
          };

          const context: Partial<Context> = {
            awsRequestId: `ctx-${Date.now()}`,
            functionName: 'scenario-agent-test',
            getRemainingTimeInMillis: () => 300000
          };

          const response = await handler(
            event as APIGatewayProxyEvent,
            context as Context
          );

          expect(response.statusCode).toBe(200);

          const responseBody = JSON.parse(response.body);
          const baseType = responseBody.scenario.type;
          const variations = responseBody.variations || [];

          // All variations should have the same disruption type as base
          for (const variation of variations) {
            expect(variation.type).toBe(baseType);
          }
        }),
        { numRuns: 100 }
      );
    }, 180000);
  });
});
