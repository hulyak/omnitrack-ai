/**
 * Property-based tests for Explainability Service
 * 
 * These tests verify correctness properties across randomized inputs.
 */

import * as fc from 'fast-check';
import { ExplainabilityService, AgentContribution, ExplanationRequest } from './explainability-service';
import {
  DisruptionType,
  Severity,
  ImpactAnalysis,
  MitigationStrategy,
  Scenario,
  Location
} from '../models/types';

describe('Explainability Service Property Tests', () => {
  let service: ExplainabilityService;

  beforeEach(() => {
    service = new ExplainabilityService();
  });

  // Arbitraries for generating test data
  const locationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
    address: fc.string({ minLength: 5, maxLength: 50 }),
    city: fc.string({ minLength: 3, maxLength: 30 }),
    country: fc.string({ minLength: 3, maxLength: 30 })
  });

  const scenarioArb = fc.record({
    scenarioId: fc.uuid(),
    type: fc.constantFrom(...Object.values(DisruptionType)),
    parameters: fc.record({
      location: locationArb,
      severity: fc.constantFrom(...Object.values(Severity)),
      duration: fc.integer({ min: 1, max: 720 }),
      affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 })
    }),
    createdBy: fc.uuid(),
    createdAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    updatedAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    isPublic: fc.boolean(),
    version: fc.integer({ min: 1, max: 10 })
  });

  const impactAnalysisArb = fc.record({
    costImpact: fc.double({ min: 1000, max: 10000000, noNaN: true }),
    deliveryTimeImpact: fc.double({ min: 1, max: 720, noNaN: true }),
    inventoryImpact: fc.double({ min: 100, max: 100000, noNaN: true }),
    sustainabilityImpact: fc.option(
      fc.record({
        carbonFootprint: fc.double({ min: 100, max: 100000, noNaN: true }),
        emissionsByRoute: fc.dictionary(fc.string(), fc.double({ min: 10, max: 1000, noNaN: true })),
        sustainabilityScore: fc.integer({ min: 0, max: 100 })
      }),
      { nil: undefined }
    )
  });

  const mitigationStrategyArb = fc.record({
    strategyId: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    costImpact: fc.double({ min: 1000, max: 1000000, noNaN: true }),
    riskReduction: fc.double({ min: 0.1, max: 1.0, noNaN: true }),
    sustainabilityImpact: fc.double({ min: -1000, max: 1000, noNaN: true }),
    implementationTime: fc.integer({ min: 1, max: 168 }),
    tradeoffs: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 })
  });

  const agentContributionArb = fc.record({
    agentName: fc.constantFrom('Info Agent', 'Scenario Agent', 'Impact Agent', 'Strategy Agent', 'Sustainability Service'),
    contributionType: fc.string({ minLength: 5, maxLength: 50 }),
    data: fc.anything(),
    confidence: fc.option(fc.double({ min: 0.5, max: 1.0, noNaN: true }), { nil: undefined }),
    uncertaintyRange: fc.option(
      fc.record({
        lower: fc.double({ min: 0, max: 1000, noNaN: true }),
        upper: fc.double({ min: 1000, max: 10000, noNaN: true }),
        confidenceLevel: fc.double({ min: 0.8, max: 0.99, noNaN: true })
      }),
      { nil: undefined }
    )
  });

  const explanationRequestArb = fc.record({
    scenarioId: fc.uuid(),
    scenario: fc.option(scenarioArb, { nil: undefined }),
    impacts: fc.option(impactAnalysisArb, { nil: undefined }),
    strategies: fc.option(fc.array(mitigationStrategyArb, { minLength: 1, maxLength: 5 }), { nil: undefined }),
    agentContributions: fc.array(agentContributionArb, { minLength: 1, maxLength: 10 }),
    includeNaturalLanguage: fc.option(fc.boolean(), { nil: undefined }),
    includeDecisionTree: fc.option(fc.boolean(), { nil: undefined }),
    includeUncertainty: fc.option(fc.boolean(), { nil: undefined })
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 23: Explanation structure presence
   * Validates: Requirements 6.2
   * 
   * For any simulation result explanation request, the response should include
   * a well-formed decision tree structure with nodes and edges.
   */
  test('Property 23: Explanation structure presence - decision tree has nodes and edges', async () => {
    await fc.assert(
      fc.asyncProperty(explanationRequestArb, async (request) => {
        // Ensure decision tree generation is enabled
        const requestWithTree = {
          ...request,
          includeDecisionTree: true
        };

        const explanation = await service.generateExplanation(requestWithTree);

        // Verify decision tree is present
        expect(explanation.decisionTree).toBeDefined();
        
        // Verify decision tree has nodes
        expect(explanation.decisionTree!.nodes).toBeDefined();
        expect(Array.isArray(explanation.decisionTree!.nodes)).toBe(true);
        expect(explanation.decisionTree!.nodes.length).toBeGreaterThan(0);

        // Verify decision tree has edges
        expect(explanation.decisionTree!.edges).toBeDefined();
        expect(Array.isArray(explanation.decisionTree!.edges)).toBe(true);
        expect(explanation.decisionTree!.edges.length).toBeGreaterThan(0);

        // Verify nodes have required structure
        explanation.decisionTree!.nodes.forEach(node => {
          expect(node.nodeId).toBeDefined();
          expect(typeof node.nodeId).toBe('string');
          expect(node.nodeId.length).toBeGreaterThan(0);
          
          expect(node.label).toBeDefined();
          expect(typeof node.label).toBe('string');
          expect(node.label.length).toBeGreaterThan(0);
          
          expect(node.type).toBeDefined();
          expect(['decision', 'outcome', 'condition']).toContain(node.type);
        });

        // Verify edges have required structure
        explanation.decisionTree!.edges.forEach(edge => {
          expect(edge.from).toBeDefined();
          expect(typeof edge.from).toBe('string');
          expect(edge.from.length).toBeGreaterThan(0);
          
          expect(edge.to).toBeDefined();
          expect(typeof edge.to).toBe('string');
          expect(edge.to.length).toBeGreaterThan(0);
          
          expect(edge.label).toBeDefined();
          expect(typeof edge.label).toBe('string');
          expect(edge.label.length).toBeGreaterThan(0);
        });

        // Verify edges reference valid nodes
        const nodeIds = new Set(explanation.decisionTree!.nodes.map(n => n.nodeId));
        explanation.decisionTree!.edges.forEach(edge => {
          expect(nodeIds.has(edge.from)).toBe(true);
          expect(nodeIds.has(edge.to)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 24: Agent attribution completeness
   * Validates: Requirements 6.3
   * 
   * For any recommendation generated by multiple agents, each component should have
   * attribution identifying which agent provided it.
   */
  test('Property 24: Agent attribution completeness - all contributions have agent attribution', async () => {
    await fc.assert(
      fc.asyncProperty(explanationRequestArb, async (request) => {
        const explanation = await service.generateExplanation(request);

        // Verify agent attributions are present
        expect(explanation.agentAttributions).toBeDefined();
        expect(Array.isArray(explanation.agentAttributions)).toBe(true);
        expect(explanation.agentAttributions.length).toBeGreaterThan(0);

        // Verify each attribution has required fields
        explanation.agentAttributions.forEach(attribution => {
          expect(attribution.agentName).toBeDefined();
          expect(typeof attribution.agentName).toBe('string');
          expect(attribution.agentName.length).toBeGreaterThan(0);
          
          expect(attribution.componentId).toBeDefined();
          expect(typeof attribution.componentId).toBe('string');
          expect(attribution.componentId.length).toBeGreaterThan(0);
          
          expect(attribution.contributionDescription).toBeDefined();
          expect(typeof attribution.contributionDescription).toBe('string');
          expect(attribution.contributionDescription.length).toBeGreaterThan(0);
        });

        // Verify all agent contributions are represented in attributions
        const attributedAgents = new Set(explanation.agentAttributions.map(a => a.agentName));
        request.agentContributions.forEach(contribution => {
          expect(attributedAgents.has(contribution.agentName)).toBe(true);
        });

        // Verify unique component IDs
        const componentIds = explanation.agentAttributions.map(a => a.componentId);
        const uniqueComponentIds = new Set(componentIds);
        expect(componentIds.length).toBe(uniqueComponentIds.size);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 25: Uncertainty quantification presence
   * Validates: Requirements 6.4
   * 
   * For any prediction with varying confidence levels, the results should include
   * uncertainty ranges and confidence intervals.
   */
  test('Property 25: Uncertainty quantification presence - predictions include uncertainty ranges', async () => {
    await fc.assert(
      fc.asyncProperty(explanationRequestArb, async (request) => {
        // Ensure uncertainty quantification is enabled
        const requestWithUncertainty = {
          ...request,
          includeUncertainty: true
        };

        const explanation = await service.generateExplanation(requestWithUncertainty);

        // Verify uncertainty quantification is present
        expect(explanation.uncertaintyQuantification).toBeDefined();
        
        // Verify overall confidence is present and valid
        expect(explanation.uncertaintyQuantification!.overallConfidence).toBeDefined();
        expect(typeof explanation.uncertaintyQuantification!.overallConfidence).toBe('number');
        expect(explanation.uncertaintyQuantification!.overallConfidence).toBeGreaterThanOrEqual(0);
        expect(explanation.uncertaintyQuantification!.overallConfidence).toBeLessThanOrEqual(1);

        // Verify prediction ranges are present
        expect(explanation.uncertaintyQuantification!.predictionRanges).toBeDefined();
        expect(Array.isArray(explanation.uncertaintyQuantification!.predictionRanges)).toBe(true);
        
        // If impacts are provided, prediction ranges should be present
        if (request.impacts) {
          expect(explanation.uncertaintyQuantification!.predictionRanges.length).toBeGreaterThan(0);
        }

        // Verify each prediction range has required structure
        explanation.uncertaintyQuantification!.predictionRanges.forEach(range => {
          expect(range.metric).toBeDefined();
          expect(typeof range.metric).toBe('string');
          expect(range.metric.length).toBeGreaterThan(0);
          
          expect(range.pointEstimate).toBeDefined();
          expect(typeof range.pointEstimate).toBe('number');
          
          expect(range.lowerBound).toBeDefined();
          expect(typeof range.lowerBound).toBe('number');
          
          expect(range.upperBound).toBeDefined();
          expect(typeof range.upperBound).toBe('number');
          
          expect(range.confidenceLevel).toBeDefined();
          expect(typeof range.confidenceLevel).toBe('number');
          expect(range.confidenceLevel).toBeGreaterThan(0);
          expect(range.confidenceLevel).toBeLessThanOrEqual(1);
          
          // Verify bounds are ordered correctly
          expect(range.lowerBound).toBeLessThanOrEqual(range.pointEstimate);
          expect(range.pointEstimate).toBeLessThanOrEqual(range.upperBound);
        });

        // Verify assumptions are present
        expect(explanation.uncertaintyQuantification!.assumptions).toBeDefined();
        expect(Array.isArray(explanation.uncertaintyQuantification!.assumptions)).toBe(true);
        expect(explanation.uncertaintyQuantification!.assumptions.length).toBeGreaterThan(0);

        // Verify limitations are present
        expect(explanation.uncertaintyQuantification!.limitationsAndCaveats).toBeDefined();
        expect(Array.isArray(explanation.uncertaintyQuantification!.limitationsAndCaveats)).toBe(true);
        expect(explanation.uncertaintyQuantification!.limitationsAndCaveats.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // Additional property: Completeness score is valid
  test('Property: Completeness score is between 0 and 1', async () => {
    await fc.assert(
      fc.asyncProperty(explanationRequestArb, async (request) => {
        const explanation = await service.generateExplanation(request);

        expect(explanation.metadata.completeness).toBeDefined();
        expect(typeof explanation.metadata.completeness).toBe('number');
        expect(explanation.metadata.completeness).toBeGreaterThanOrEqual(0);
        expect(explanation.metadata.completeness).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  // Additional property: Natural language summary is present when requested
  test('Property: Natural language summary is present when requested', async () => {
    await fc.assert(
      fc.asyncProperty(explanationRequestArb, async (request) => {
        const requestWithNL = {
          ...request,
          includeNaturalLanguage: true
        };

        const explanation = await service.generateExplanation(requestWithNL);

        expect(explanation.naturalLanguageSummary).toBeDefined();
        expect(typeof explanation.naturalLanguageSummary).toBe('string');
        expect(explanation.naturalLanguageSummary!.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
