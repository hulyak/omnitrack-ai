/**
 * Tests for Intent Classifier
 */

import { IntentClassifier } from './intent-classifier';
import { BedrockService } from './bedrock-service';
import { actionRegistry } from './action-registry';
import { registerAllActions } from './actions';

// Mock BedrockService
jest.mock('./bedrock-service');

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;
  let mockBedrockService: jest.Mocked<BedrockService>;

  beforeEach(() => {
    // Clear and register actions
    actionRegistry.clear();
    registerAllActions();

    // Create mock Bedrock service
    mockBedrockService = {
      classifyIntent: jest.fn(),
      generateResponse: jest.fn(),
      streamResponse: jest.fn(),
      countTokens: jest.fn(),
      summarizeHistory: jest.fn(),
    } as any;

    classifier = new IntentClassifier(mockBedrockService, 0.5);
  });

  afterEach(() => {
    actionRegistry.clear();
  });

  describe('classify', () => {
    it('should classify valid intent with high confidence', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: { 
          name: 'Acme Corp', 
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St',
            city: 'New York',
            country: 'USA'
          }, 
          capacity: 1000 
        },
        requiresClarification: false
      });

      const result = await classifier.classify('Add a supplier named Acme Corp in New York with capacity 1000');

      expect(result.intent).toBe('add-supplier');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.parameters).toHaveProperty('name');
      expect(result.requiresClarification).toBe(false);
    });

    it('should handle empty message', async () => {
      const result = await classifier.classify('');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.0);
      expect(result.requiresClarification).toBe(true);
    });

    it('should request clarification for low confidence', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'add-warehouse',
        confidence: 0.3,
        parameters: {},
        requiresClarification: false
      });

      const result = await classifier.classify('maybe add something');

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.requiresClarification).toBe(true);
      expect(result.clarificationQuestion).toBeDefined();
    });

    it('should handle unknown intent', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'unknown',
        confidence: 0.2,
        parameters: {},
        requiresClarification: true,
        clarificationQuestion: "I'm not sure what you want to do."
      });

      const result = await classifier.classify('do something random');

      expect(result.intent).toBe('unknown');
      expect(result.requiresClarification).toBe(true);
    });

    it('should validate parameters against action schema', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'add-supplier',
        confidence: 0.8,
        parameters: {}, // Missing required parameters
        requiresClarification: false
      });

      const result = await classifier.classify('Add a supplier');

      expect(result.requiresClarification).toBe(true);
      expect(result.clarificationQuestion).toContain('need');
    });

    it('should handle Bedrock service errors gracefully', async () => {
      mockBedrockService.classifyIntent.mockRejectedValue(
        new Error('Bedrock API error')
      );

      const result = await classifier.classify('add supplier');

      expect(result.intent).toBe('unknown');
      expect(result.requiresClarification).toBe(true);
    });
  });

  describe('confidence threshold', () => {
    it('should get current confidence threshold', () => {
      expect(classifier.getMinConfidence()).toBe(0.5);
    });

    it('should set confidence threshold', () => {
      classifier.setMinConfidence(0.7);
      expect(classifier.getMinConfidence()).toBe(0.7);
    });

    it('should reject invalid confidence threshold', () => {
      expect(() => classifier.setMinConfidence(-0.1)).toThrow();
      expect(() => classifier.setMinConfidence(1.5)).toThrow();
    });
  });

  describe('action registry integration', () => {
    it('should find similar action when exact match not found', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'add_supplier', // Underscore instead of hyphen
        confidence: 0.8,
        parameters: { name: 'Test' },
        requiresClarification: false
      });

      const result = await classifier.classify('add supplier');

      // Should find add-supplier action
      expect(result.intent).toBe('add-supplier');
    });

    it('should handle intent not in registry', async () => {
      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'nonexistent-action',
        confidence: 0.8,
        parameters: {},
        requiresClarification: false
      });

      const result = await classifier.classify('do something');

      expect(result.intent).toBe('unknown');
      expect(result.requiresClarification).toBe(true);
    });
  });

  describe('conversation history', () => {
    it('should use conversation history for context', async () => {
      const history = [
        { role: 'user' as const, content: 'I want to add a supplier' },
        { role: 'assistant' as const, content: 'What is the supplier name?' }
      ];

      mockBedrockService.classifyIntent.mockResolvedValue({
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: { name: 'Acme Corp' },
        requiresClarification: false
      });

      const result = await classifier.classify('Acme Corp', history);

      expect(mockBedrockService.classifyIntent).toHaveBeenCalled();
      expect(result.intent).toBe('add-supplier');
    });
  });
});
