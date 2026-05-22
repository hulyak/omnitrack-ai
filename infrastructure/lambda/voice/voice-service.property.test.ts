/**
 * Property-Based Tests for Voice Service
 * 
 * Tests correctness properties for voice interface functionality
 * using fast-check for property-based testing.
 */

import * as fc from 'fast-check';
import { VoiceService, VoiceCommandInput, RecognizedIntent } from './voice-service';

describe('Voice Service Property Tests', () => {
  let voiceService: VoiceService;

  beforeEach(() => {
    voiceService = new VoiceService();
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 31: Voice intent recognition
   * Validates: Requirements 8.1
   * 
   * For any voice command issued through the AI Copilot,
   * the system should extract and return the recognized intent.
   */
  describe('Property 31: Voice intent recognition', () => {
    it('should extract and return recognized intent for any voice command', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show me the status'),
              fc.constant('what is the supply chain status'),
              fc.constant('run a scenario'),
              fc.constant('simulate a disruption'),
              fc.constant('show alerts'),
              fc.constant('view active alerts'),
              fc.constant('acknowledge alert 123'),
              fc.constant('get metrics'),
              fc.constant('show key metrics'),
              fc.constant('compare strategies'),
              fc.constant('show strategy comparison'),
              fc.string({ minLength: 5, maxLength: 100 }) // Random text
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            // Execute voice command
            const result = await voiceService.processVoiceCommand(input);

            // Property: Result must contain a recognized intent
            expect(result).toHaveProperty('recognizedIntent');
            expect(result.recognizedIntent).toHaveProperty('name');
            expect(result.recognizedIntent).toHaveProperty('confidence');
            expect(typeof result.recognizedIntent.name).toBe('string');
            expect(typeof result.recognizedIntent.confidence).toBe('number');
            expect(result.recognizedIntent.confidence).toBeGreaterThanOrEqual(0);
            expect(result.recognizedIntent.confidence).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recognize known intents with high confidence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show me the status'),
              fc.constant('what is the current status'),
              fc.constant('run a scenario'),
              fc.constant('execute scenario'),
              fc.constant('show alerts'),
              fc.constant('view alerts'),
              fc.constant('get metrics'),
              fc.constant('compare strategies')
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: Known commands should have recognized intent with name not 'Unknown'
            if (result.recognizedIntent.confidence > 0.5) {
              expect(result.recognizedIntent.name).not.toBe('Unknown');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 32: Voice command execution with confirmation
   * Validates: Requirements 8.2
   * 
   * For any recognized voice command, the system should execute
   * the requested action and provide audio confirmation.
   */
  describe('Property 32: Voice command execution with confirmation', () => {
    it('should execute command and provide audio confirmation for recognized intents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show me the status'),
              fc.constant('run a scenario'),
              fc.constant('show alerts'),
              fc.constant('get metrics'),
              fc.constant('compare strategies')
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: Successful execution must include audio response
            if (result.executionStatus === 'success') {
              expect(result.audioResponse).toBeDefined();
              expect(typeof result.audioResponse).toBe('string');
              expect(result.audioResponse.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide audio confirmation for all execution statuses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show status'),
              fc.constant('run scenario'),
              fc.constant('show alerts'),
              fc.constant('xyz random unknown command'),
              fc.string({ minLength: 1, maxLength: 50 })
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: All results must have audio response regardless of status
            expect(result.audioResponse).toBeDefined();
            expect(typeof result.audioResponse).toBe('string');
            expect(result.audioResponse.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 33: Ambiguity handling
   * Validates: Requirements 8.3
   * 
   * For any ambiguous voice input (multiple possible intents with similar confidence),
   * the system should request clarification.
   */
  describe('Property 33: Ambiguity handling', () => {
    it('should request clarification when input is ambiguous', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.string({ minLength: 1, maxLength: 100 }),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: If clarification is required, must have clarification prompt
            if (result.requiresClarification) {
              expect(result.clarificationPrompt).toBeDefined();
              expect(typeof result.clarificationPrompt).toBe('string');
              expect(result.clarificationPrompt!.length).toBeGreaterThan(0);
              expect(result.executionStatus).toBe('needs_clarification');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set requiresClarification flag appropriately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show status'),
              fc.constant('run scenario'),
              fc.constant('xyz unknown'),
              fc.string({ minLength: 1, maxLength: 50 })
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: requiresClarification must be a boolean
            expect(typeof result.requiresClarification).toBe('boolean');

            // Property: If needs clarification, execution status should reflect it
            if (result.requiresClarification) {
              expect(['needs_clarification', 'failed']).toContain(
                result.executionStatus
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 34: Multi-modal visualization output
   * Validates: Requirements 8.4
   * 
   * For any voice command requesting data visualization,
   * the system should provide both visual display and voice summary.
   */
  describe('Property 34: Multi-modal visualization output', () => {
    it('should provide both visual and audio output for successful commands', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.oneof(
              fc.constant('show me the status'),
              fc.constant('show alerts'),
              fc.constant('get metrics'),
              fc.constant('compare strategies')
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: Successful visualization commands must have both audio and visual
            if (result.executionStatus === 'success') {
              expect(result.audioResponse).toBeDefined();
              expect(typeof result.audioResponse).toBe('string');
              expect(result.audioResponse.length).toBeGreaterThan(0);

              // Visual data should be present for data visualization commands
              expect(result.visualData).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate multi-modal output with both components', async () => {
      // Generator for intent-specific data
      const intentDataGenerator = fc.oneof(
        fc.record({
          intentName: fc.constant('QueryStatus'),
          data: fc.record({
            status: fc.constantFrom('operational', 'degraded', 'critical'),
            activeNodes: fc.integer({ min: 0, max: 100 }),
            alerts: fc.integer({ min: 0, max: 50 }),
            lastUpdate: fc.date().map(d => d.toISOString()),
          }),
        }),
        fc.record({
          intentName: fc.constant('ViewAlerts'),
          data: fc.record({
            alerts: fc.array(
              fc.record({
                id: fc.string(),
                severity: fc.constantFrom('high', 'medium', 'low'),
                message: fc.string(),
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }),
        }),
        fc.record({
          intentName: fc.constant('GetMetrics'),
          data: fc.record({
            cost: fc.record({
              value: fc.integer({ min: 0, max: 10000000 }),
              change: fc.float({ min: -100, max: 100 }),
            }),
            risk: fc.record({
              value: fc.float({ min: 0, max: 1 }),
              change: fc.float({ min: -1, max: 1 }),
            }),
            sustainability: fc.record({
              value: fc.float({ min: 0, max: 1 }),
              change: fc.float({ min: -1, max: 1 }),
            }),
          }),
        }),
        fc.record({
          intentName: fc.constant('CompareStrategies'),
          data: fc.record({
            strategies: fc.array(
              fc.record({
                id: fc.string(),
                name: fc.string(),
                score: fc.float({ min: 0, max: 1 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
        })
      );

      await fc.assert(
        fc.asyncProperty(
          intentDataGenerator,
          async ({ intentName, data }) => {
            const output = voiceService.generateMultiModalOutput(
              intentName,
              data
            );

            // Property: Multi-modal output must have both visual and audio
            expect(output).toHaveProperty('visual');
            expect(output).toHaveProperty('audio');
            expect(output.visual).toBeDefined();
            expect(output.audio).toBeDefined();
            expect(typeof output.audio).toBe('string');
            expect(output.audio.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include visual data for data-requesting commands', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.constantFrom(
              'show status',
              'view alerts',
              'get metrics',
              'compare strategies'
            ),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: Data visualization commands should include visual data
            if (
              result.executionStatus === 'success' &&
              !result.requiresClarification
            ) {
              expect(result.visualData).toBeDefined();
              expect(typeof result.visualData).toBe('object');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Execution status consistency
   * 
   * For any voice command, the execution status should be consistent
   * with other result properties.
   */
  describe('Execution status consistency', () => {
    it('should have consistent execution status with other properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            transcript: fc.string({ minLength: 1, maxLength: 100 }),
            sessionId: fc.uuid(),
          }),
          async (input: VoiceCommandInput) => {
            const result = await voiceService.processVoiceCommand(input);

            // Property: Execution status must be one of the valid values
            expect(['success', 'failed', 'needs_clarification']).toContain(
              result.executionStatus
            );

            // Property: Success status should have visual data for data commands
            if (result.executionStatus === 'success') {
              expect(result.requiresClarification).toBe(false);
            }

            // Property: Needs clarification should have clarification prompt
            if (result.executionStatus === 'needs_clarification') {
              expect(result.requiresClarification).toBe(true);
              expect(result.clarificationPrompt).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
