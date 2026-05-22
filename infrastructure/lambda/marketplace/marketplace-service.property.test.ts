/**
 * Property-based tests for Marketplace Service
 * Feature: omnitrack-ai-supply-chain
 */

import * as fc from 'fast-check';
import { MarketplaceService } from './marketplace-service';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { Scenario, DisruptionType, Severity } from '../models/types';

// Mock the ScenarioRepository
jest.mock('../repositories/scenario-repository');

describe('Marketplace Service Property Tests', () => {
  let marketplaceService: MarketplaceService;
  let mockScenarioRepository: jest.Mocked<ScenarioRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    marketplaceService = new MarketplaceService();
    mockScenarioRepository = (marketplaceService as any).scenarioRepository;
  });

  // Helper to generate valid dates
  const validDate = () => fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2025-12-31') }).map(ts => new Date(ts).toISOString());

  /**
   * Feature: omnitrack-ai-supply-chain, Property 18: Marketplace listing completeness
   * Validates: Requirements 5.1
   * 
   * For any scenario displayed in the marketplace, the listing should include 
   * rating, usage count, and community feedback fields.
   */
  describe('Property 18: Marketplace listing completeness', () => {
    it('should ensure all marketplace scenarios have complete metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              scenarioId: fc.uuid(),
              type: fc.constantFrom(...Object.values(DisruptionType)),
              createdBy: fc.uuid(),
              createdAt: validDate(),
              updatedAt: validDate(),
              isPublic: fc.constant(true),
              version: fc.integer({ min: 1, max: 10 }),
              parameters: fc.record({
                location: fc.record({
                  latitude: fc.double({ min: -90, max: 90 }),
                  longitude: fc.double({ min: -180, max: 180 }),
                  address: fc.string({ minLength: 5, maxLength: 100 }),
                  city: fc.string({ minLength: 3, maxLength: 50 }),
                  country: fc.string({ minLength: 3, maxLength: 50 })
                }),
                severity: fc.constantFrom(...Object.values(Severity)),
                duration: fc.integer({ min: 1, max: 720 }),
                affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
              }),
              marketplaceMetadata: fc.record({
                title: fc.string({ minLength: 5, maxLength: 100 }),
                description: fc.string({ minLength: 10, maxLength: 500 }),
                author: fc.uuid(),
                rating: fc.double({ min: 0, max: 5 }),
                usageCount: fc.integer({ min: 0, max: 10000 }),
                tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
                industry: fc.string({ minLength: 3, maxLength: 50 }),
                geography: fc.string({ minLength: 3, maxLength: 50 })
              })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (scenarios) => {
            // Mock the repository to return these scenarios
            mockScenarioRepository.listScenarios.mockResolvedValue({
              items: scenarios as Scenario[],
              lastEvaluatedKey: undefined
            });

            // Get marketplace scenarios
            const marketplaceScenarios = await marketplaceService.listMarketplaceScenarios();

            // Verify all scenarios have complete marketplace metadata
            for (const scenario of marketplaceScenarios) {
              expect(scenario.marketplaceMetadata).toBeDefined();
              expect(scenario.marketplaceMetadata!.rating).toBeDefined();
              expect(typeof scenario.marketplaceMetadata!.rating).toBe('number');
              expect(scenario.marketplaceMetadata!.usageCount).toBeDefined();
              expect(typeof scenario.marketplaceMetadata!.usageCount).toBe('number');
              expect(scenario.marketplaceMetadata!.title).toBeDefined();
              expect(scenario.marketplaceMetadata!.description).toBeDefined();
              expect(scenario.marketplaceMetadata!.author).toBeDefined();
              expect(scenario.marketplaceMetadata!.tags).toBeDefined();
              expect(Array.isArray(scenario.marketplaceMetadata!.tags)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 19: Search filter correctness
   * Validates: Requirements 5.2
   * 
   * For any marketplace search with filters (industry, disruption type, geography, rating),
   * all returned results should match all specified filter criteria.
   */
  describe('Property 19: Search filter correctness', () => {
    it('should return only scenarios matching all filter criteria', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a collection of scenarios
          fc.array(
            fc.record({
              scenarioId: fc.uuid(),
              type: fc.constantFrom(...Object.values(DisruptionType)),
              createdBy: fc.uuid(),
              createdAt: validDate(),
              updatedAt: validDate(),
              isPublic: fc.constant(true),
              version: fc.integer({ min: 1, max: 10 }),
              parameters: fc.record({
                location: fc.record({
                  latitude: fc.double({ min: -90, max: 90 }),
                  longitude: fc.double({ min: -180, max: 180 }),
                  address: fc.string({ minLength: 5, maxLength: 100 }),
                  city: fc.string({ minLength: 3, maxLength: 50 }),
                  country: fc.string({ minLength: 3, maxLength: 50 })
                }),
                severity: fc.constantFrom(...Object.values(Severity)),
                duration: fc.integer({ min: 1, max: 720 }),
                affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
              }),
              marketplaceMetadata: fc.record({
                title: fc.string({ minLength: 5, maxLength: 100 }),
                description: fc.string({ minLength: 10, maxLength: 500 }),
                author: fc.uuid(),
                rating: fc.double({ min: 0, max: 5 }),
                usageCount: fc.integer({ min: 0, max: 10000 }),
                tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
                industry: fc.constantFrom('Manufacturing', 'Retail', 'Healthcare', 'Technology'),
                geography: fc.constantFrom('North America', 'Europe', 'Asia', 'South America')
              })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          // Generate random filters
          fc.record({
            industry: fc.option(fc.constantFrom('Manufacturing', 'Retail', 'Healthcare', 'Technology'), { nil: undefined }),
            disruptionType: fc.option(fc.constantFrom(...Object.values(DisruptionType)), { nil: undefined }),
            geography: fc.option(fc.constantFrom('North America', 'Europe', 'Asia', 'South America'), { nil: undefined }),
            minRating: fc.option(fc.double({ min: 0, max: 5 }), { nil: undefined }),
            tags: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 3 }), { nil: undefined })
          }),
          async (scenarios, filters) => {
            // Mock the repository
            mockScenarioRepository.listScenarios.mockResolvedValue({
              items: scenarios as Scenario[],
              lastEvaluatedKey: undefined
            });

            // Search with filters
            const results = await marketplaceService.searchScenarios(filters);

            // Verify all results match the filters
            for (const result of results) {
              if (filters.industry) {
                expect(result.marketplaceMetadata?.industry).toBe(filters.industry);
              }
              if (filters.disruptionType) {
                expect(result.type).toBe(filters.disruptionType);
              }
              if (filters.geography) {
                expect(result.marketplaceMetadata?.geography).toBe(filters.geography);
              }
              if (filters.minRating !== undefined) {
                expect(result.marketplaceMetadata?.rating || 0).toBeGreaterThanOrEqual(filters.minRating);
              }
              if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag =>
                  result.marketplaceMetadata?.tags.includes(tag)
                );
                expect(hasMatchingTag).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 21: Rating aggregation timing
   * Validates: Requirements 5.4
   * 
   * For any scenario rating submission, the aggregate rating should update
   * and be visible to all users within 5 seconds.
   */
  describe('Property 21: Rating aggregation timing', () => {
    it('should update aggregate rating within 5 seconds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // scenarioId
          fc.uuid(), // userId
          fc.integer({ min: 1, max: 5 }), // rating
          fc.array(
            fc.record({
              score: fc.integer({ min: 1, max: 5 }),
              timestamp: validDate()
            }),
            { minLength: 0, maxLength: 20 }
          ), // existing ratings
          async (scenarioId, userId, rating, existingRatings) => {
            const startTime = Date.now();

            // Mock scenario
            const mockScenario: Scenario = {
              scenarioId,
              type: DisruptionType.SUPPLIER_FAILURE,
              createdBy: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: true,
              version: 1,
              parameters: {
                location: {
                  latitude: 0,
                  longitude: 0,
                  address: 'Test',
                  city: 'Test',
                  country: 'Test'
                },
                severity: Severity.MEDIUM,
                duration: 24,
                affectedNodes: []
              },
              marketplaceMetadata: {
                title: 'Test',
                description: 'Test',
                author: userId,
                rating: 0,
                usageCount: 0,
                tags: ['test'],
                industry: 'Test',
                geography: 'Test'
              }
            };

            mockScenarioRepository.getScenarioById.mockResolvedValue(mockScenario);
            mockScenarioRepository['putItem'] = jest.fn().mockResolvedValue(undefined);
            
            // Mock query to return existing ratings plus new one
            const allRatings = [
              ...existingRatings.map((r, i) => ({
                PK: `MARKETPLACE#${scenarioId}`,
                SK: `RATING#user${i}`,
                score: r.score,
                timestamp: r.timestamp
              })),
              {
                PK: `MARKETPLACE#${scenarioId}`,
                SK: `RATING#${userId}`,
                score: rating,
                timestamp: new Date().toISOString()
              }
            ];

            mockScenarioRepository['query'] = jest.fn().mockResolvedValue({
              items: allRatings,
              lastEvaluatedKey: undefined
            });

            mockScenarioRepository.updateScenario.mockResolvedValue(mockScenario);

            // Submit rating
            await marketplaceService.rateScenario({
              scenarioId,
              userId,
              rating
            });

            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify operation completed within 5 seconds (5000ms)
            expect(elapsedTime).toBeLessThan(5000);

            // Verify updateScenario was called with updated rating
            expect(mockScenarioRepository.updateScenario).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 22: Attribution preservation in forks
   * Validates: Requirements 5.5
   * 
   * For any customized marketplace scenario, the new version should maintain
   * a reference to the original author's ID.
   */
  describe('Property 22: Attribution preservation in forks', () => {
    it('should preserve original author attribution when forking', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // original scenario ID
          fc.uuid(), // original author
          fc.uuid(), // forking user
          async (originalScenarioId, originalAuthor, forkingUser) => {
            // Mock original scenario
            const originalScenario: Scenario = {
              scenarioId: originalScenarioId,
              type: DisruptionType.NATURAL_DISASTER,
              createdBy: originalAuthor,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPublic: true,
              version: 1,
              parameters: {
                location: {
                  latitude: 0,
                  longitude: 0,
                  address: 'Test',
                  city: 'Test',
                  country: 'Test'
                },
                severity: Severity.HIGH,
                duration: 48,
                affectedNodes: []
              },
              marketplaceMetadata: {
                title: 'Original Scenario',
                description: 'Original description',
                author: originalAuthor,
                rating: 4.5,
                usageCount: 10,
                tags: ['test'],
                industry: 'Manufacturing',
                geography: 'Asia'
              }
            };

            mockScenarioRepository.getScenarioById.mockResolvedValue(originalScenario);

            // Mock the created forked scenario
            const forkedScenarioId = 'forked-' + originalScenarioId;
            const forkedScenario: Scenario = {
              ...originalScenario,
              scenarioId: forkedScenarioId,
              createdBy: forkingUser,
              marketplaceMetadata: {
                ...originalScenario.marketplaceMetadata!,
                originalAuthor: originalAuthor,
                author: forkingUser,
                rating: 0,
                usageCount: 0
              }
            };

            mockScenarioRepository.createScenario.mockResolvedValue(forkedScenario);
            mockScenarioRepository.updateScenario.mockResolvedValue(originalScenario);

            // Fork the scenario
            const result = await marketplaceService.forkScenario({
              scenarioId: originalScenarioId,
              userId: forkingUser
            });

            // Verify attribution is preserved
            expect(result.marketplaceMetadata?.originalAuthor).toBe(originalAuthor);
            expect(result.marketplaceMetadata?.author).toBe(forkingUser);
            expect(result.createdBy).toBe(forkingUser);

            // Verify it's a different scenario
            expect(result.scenarioId).not.toBe(originalScenarioId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
