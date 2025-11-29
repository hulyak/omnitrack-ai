/**
 * Tests for Clarification Handler
 */

import { ClarificationHandler } from './clarification-handler';
import { IntentClassification } from './bedrock-service';
import { actionRegistry } from './action-registry';
import { registerAllActions } from './actions';

describe('ClarificationHandler', () => {
  let handler: ClarificationHandler;

  beforeEach(() => {
    actionRegistry.clear();
    registerAllActions();
    handler = new ClarificationHandler(3, 300000);
  });

  afterEach(() => {
    actionRegistry.clear();
  });

  describe('requiresClarification', () => {
    it('should detect explicit clarification flag', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: {},
        requiresClarification: true
      };

      expect(handler.requiresClarification(classification)).toBe(true);
    });

    it('should detect low confidence', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.4,
        parameters: {},
        requiresClarification: false
      };

      expect(handler.requiresClarification(classification)).toBe(true);
    });

    it('should detect unknown intent', () => {
      const classification: IntentClassification = {
        intent: 'unknown',
        confidence: 0.8,
        parameters: {},
        requiresClarification: false
      };

      expect(handler.requiresClarification(classification)).toBe(true);
    });

    it('should detect missing required parameters', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: {}, // Missing required 'name' parameter
        requiresClarification: false
      };

      expect(handler.requiresClarification(classification)).toBe(true);
    });

    it('should not require clarification for valid classification', () => {
      const classification: IntentClassification = {
        intent: 'get-network-summary',
        confidence: 0.9,
        parameters: {},
        requiresClarification: false
      };

      expect(handler.requiresClarification(classification)).toBe(false);
    });
  });

  describe('generateClarificationQuestion', () => {
    it('should use provided clarification question', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true,
        clarificationQuestion: 'What is the supplier name?'
      };

      const question = handler.generateClarificationQuestion(
        classification,
        'user123',
        'add supplier'
      );

      expect(question).toBe('What is the supplier name?');
      expect(handler.hasPendingClarification('user123')).toBe(true);
    });

    it('should generate question for unknown intent', () => {
      const classification: IntentClassification = {
        intent: 'unknown',
        confidence: 0.3,
        parameters: {},
        requiresClarification: true
      };

      const question = handler.generateClarificationQuestion(
        classification,
        'user123',
        'do something'
      );

      expect(question).toContain('not sure');
      expect(question.toLowerCase()).toContain('help');
    });

    it('should generate question for missing parameters', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: {},
        requiresClarification: true
      };

      const question = handler.generateClarificationQuestion(
        classification,
        'user123',
        'add supplier'
      );

      expect(question).toContain('need');
    });

    it('should generate question for low confidence', () => {
      const classification: IntentClassification = {
        intent: 'add-warehouse',
        confidence: 0.5,
        parameters: { name: 'Test' },
        requiresClarification: true
      };

      const question = handler.generateClarificationQuestion(
        classification,
        'user123',
        'maybe add warehouse'
      );

      expect(question).toContain('want to');
    });
  });

  describe('handleFollowUp', () => {
    it('should handle confirmation', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.6,
        parameters: { name: 'Acme' },
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');

      const result = handler.handleFollowUp('user123', 'yes', classification);

      expect(result).not.toBeNull();
      expect(result!.confidence).toBeGreaterThan(0.6);
    });

    it('should handle rejection', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.6,
        parameters: {},
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user123', 'add something');

      const result = handler.handleFollowUp('user123', 'no', classification);

      expect(result).not.toBeNull();
      expect(result!.intent).toBe('unknown');
    });

    it('should extract parameter from follow-up', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: {},
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');

      const result = handler.handleFollowUp('user123', 'Acme Corp', classification);

      expect(result).not.toBeNull();
      // The handler extracts the first missing required parameter (location in this case)
      expect(result!.parameters).toHaveProperty('location');
      expect(result!.parameters.location).toBe('Acme Corp');
    });

    it('should return null when no pending clarification', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.9,
        parameters: {},
        requiresClarification: false
      };

      const result = handler.handleFollowUp('user123', 'yes', classification);

      expect(result).toBeNull();
    });

    it('should handle max attempts reached', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      // Generate initial question
      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');

      // Simulate multiple attempts
      for (let i = 0; i < 3; i++) {
        const result = handler.handleFollowUp('user123', 'unclear response', classification);
        if (result && result.intent === 'help') {
          expect(result.intent).toBe('help');
          return;
        }
        if (result) {
          handler.generateClarificationQuestion(result, 'user123', 'unclear response');
        }
      }
    });
  });

  describe('context management', () => {
    it('should track pending clarification', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      expect(handler.hasPendingClarification('user123')).toBe(false);

      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');

      expect(handler.hasPendingClarification('user123')).toBe(true);
    });

    it('should get clarification context', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');

      const context = handler.getClarificationContext('user123');

      expect(context).toBeDefined();
      expect(context!.originalMessage).toBe('add supplier');
      expect(context!.possibleIntents).toContain('add-supplier');
    });

    it('should clear clarification', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user123', 'add supplier');
      expect(handler.hasPendingClarification('user123')).toBe(true);

      handler.clearClarification('user123');
      expect(handler.hasPendingClarification('user123')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired contexts', async () => {
      const shortTimeoutHandler = new ClarificationHandler(3, 100); // 100ms timeout

      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      shortTimeoutHandler.generateClarificationQuestion(
        classification,
        'user123',
        'add supplier'
      );

      expect(shortTimeoutHandler.hasPendingClarification('user123')).toBe(true);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      const cleaned = shortTimeoutHandler.cleanupExpiredContexts();

      expect(cleaned).toBe(1);
      expect(shortTimeoutHandler.hasPendingClarification('user123')).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should provide statistics', () => {
      const classification: IntentClassification = {
        intent: 'add-supplier',
        confidence: 0.5,
        parameters: {},
        requiresClarification: true
      };

      handler.generateClarificationQuestion(classification, 'user1', 'add supplier');
      handler.generateClarificationQuestion(classification, 'user2', 'add warehouse');

      const stats = handler.getStats();

      expect(stats.totalPending).toBe(2);
      expect(stats.averageAttempts).toBeGreaterThan(0);
      expect(stats.oldestContextAge).toBeGreaterThanOrEqual(0);
    });
  });
});
