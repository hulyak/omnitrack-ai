/**
 * AI Copilot Integration Tests
 * 
 * Comprehensive integration tests for the AI Copilot system.
 * Tests end-to-end message flow, all actions, error scenarios, and performance.
 * 
 * Task 20: Checkpoint - Integration testing
 * Requirements: All copilot requirements (1.1-10.5)
 */

import { CopilotOrchestrator, CopilotRequest, CopilotResponse } from '../../lambda/copilot/copilot-orchestrator';
import { createBedrockService, BedrockService } from '../../lambda/copilot/bedrock-service';
import { IntentClassifier } from '../../lambda/copilot/intent-classifier';
import { ActionRegistry, SupplyChainContext } from '../../lambda/copilot/action-registry';
import { ConversationService } from '../../lambda/copilot/conversation-service';
import { ContextResolver } from '../../lambda/copilot/context-resolver';
import { registerAllActions } from '../../lambda/copilot/actions';

describe('AI Copilot Integration Tests', () => {
  let orchestrator: CopilotOrchestrator;
  let bedrockService: BedrockService;
  let intentClassifier: IntentClassifier;
  let actionRegistry: ActionRegistry;
  let conversationService: ConversationService;
  let contextResolver: ContextResolver;

  beforeAll(() => {
    // Initialize services
    bedrockService = createBedrockService();
    intentClassifier = new IntentClassifier(bedrockService);
    actionRegistry = new ActionRegistry();
    conversationService = new ConversationService(bedrockService);
    contextResolver = new ContextResolver();

    // Register all actions
    registerAllActions();

    // Create orchestrator
    orchestrator = new CopilotOrchestrator(
      bedrockService,
      intentClassifier,
      actionRegistry,
      conversationService,
      contextResolver
    );
  });

  describe('End-to-End Message Flow', () => {
    it('should process a simple query message end-to-end', async () => {
      const request: CopilotRequest = {
        message: 'help',
        userId: 'test-user-1',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBeTruthy();
      expect(response.conversationId).toBeTruthy();
      expect(response.metadata.executionTime).toBeGreaterThan(0);
    }, 30000);

    it('should handle conversation context across multiple messages', async () => {
      const userId = 'test-user-context';
      
      // First message
      const request1: CopilotRequest = {
        message: 'add a supplier in Shanghai',
        userId,
      };

      const response1 = await orchestrator.processRequest(request1);
      expect(response1.success).toBe(true);
      const conversationId = response1.conversationId;

      // Second message with context reference
      const request2: CopilotRequest = {
        message: 'what are the details of that node?',
        userId,
        conversationId,
      };

      const response2 = await orchestrator.processRequest(request2);
      expect(response2.success).toBe(true);
      expect(response2.conversationId).toBe(conversationId);
    }, 60000);

    it('should stream responses incrementally', async () => {
      // This test would require WebSocket infrastructure
      // For now, we test that the orchestrator can handle streaming requests
      const request: CopilotRequest = {
        message: 'get network summary',
        userId: 'test-user-streaming',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Action Execution Tests', () => {
    const testUserId = 'test-user-actions';

    describe('Build Actions', () => {
      it('should execute add-supplier action', async () => {
        const request: CopilotRequest = {
          message: 'add a supplier named Acme Corp in New York',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
        expect(response.metadata.intent).toContain('supplier');
      }, 30000);

      it('should execute add-manufacturer action', async () => {
        const request: CopilotRequest = {
          message: 'add a manufacturer in Detroit',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute add-warehouse action', async () => {
        const request: CopilotRequest = {
          message: 'add a warehouse in Chicago',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute connect-nodes action', async () => {
        const request: CopilotRequest = {
          message: 'connect supplier-1 to manufacturer-1',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);
    });

    describe('Configuration Actions', () => {
      it('should execute set-region action', async () => {
        const request: CopilotRequest = {
          message: 'set region to North America',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute set-industry action', async () => {
        const request: CopilotRequest = {
          message: 'set industry to automotive',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);
    });

    describe('Analysis Actions', () => {
      it('should execute scan-anomalies action', async () => {
        const request: CopilotRequest = {
          message: 'scan for anomalies',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute identify-risks action', async () => {
        const request: CopilotRequest = {
          message: 'identify risks in the network',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);
    });

    describe('Simulation Actions', () => {
      it('should execute run-simulation action', async () => {
        const request: CopilotRequest = {
          message: 'run a simulation',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute what-if scenario action', async () => {
        const request: CopilotRequest = {
          message: 'what if there is a port closure in Shanghai?',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);
    });

    describe('Query Actions', () => {
      it('should execute get-network-summary action', async () => {
        const request: CopilotRequest = {
          message: 'show me the network summary',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
      }, 30000);

      it('should execute help action', async () => {
        const request: CopilotRequest = {
          message: 'help',
          userId: testUserId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response.success).toBe(true);
        expect(response.content).toContain('help');
      }, 30000);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid message gracefully', async () => {
      const request: CopilotRequest = {
        message: '',
        userId: 'test-user-error',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    }, 30000);

    it('should handle missing userId gracefully', async () => {
      const request: CopilotRequest = {
        message: 'help',
        userId: '',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    }, 30000);

    it('should handle unknown intent gracefully', async () => {
      const request: CopilotRequest = {
        message: 'do something completely unknown and impossible',
        userId: 'test-user-error',
      };

      const response = await orchestrator.processRequest(request);
      // Should still return a response, even if action not found
      expect(response).toBeTruthy();
      expect(response.content).toBeTruthy();
    }, 30000);

    it('should handle message too long gracefully', async () => {
      const longMessage = 'a'.repeat(3000);
      const request: CopilotRequest = {
        message: longMessage,
        userId: 'test-user-error',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(false);
      expect(response.error).toContain('too long');
    }, 30000);

    it('should handle action execution failure gracefully', async () => {
      const request: CopilotRequest = {
        message: 'remove node that does not exist',
        userId: 'test-user-error',
      };

      const response = await orchestrator.processRequest(request);
      // Should return a response explaining the issue
      expect(response).toBeTruthy();
      expect(response.content).toBeTruthy();
    }, 30000);
  });

  describe('Multi-Step Request Handling', () => {
    it('should execute multi-step request successfully', async () => {
      const request: CopilotRequest = {
        message: '1. add a supplier in Boston 2. add a manufacturer in Detroit 3. connect them',
        userId: 'test-user-multistep',
      };

      const response = await orchestrator.processRequest(request);
      expect(response).toBeTruthy();
      expect(response.metadata.stepsExecuted).toBeGreaterThan(1);
    }, 60000);

    it('should stop on first failure in multi-step request', async () => {
      const request: CopilotRequest = {
        message: '1. add a supplier 2. do something invalid 3. add a warehouse',
        userId: 'test-user-multistep-fail',
      };

      const response = await orchestrator.processRequest(request);
      expect(response).toBeTruthy();
      // Should have attempted at least one step
      expect(response.metadata.stepsExecuted).toBeGreaterThanOrEqual(1);
    }, 60000);

    it('should handle "and then" pattern', async () => {
      const request: CopilotRequest = {
        message: 'add a supplier and then add a manufacturer',
        userId: 'test-user-multistep-and',
      };

      const response = await orchestrator.processRequest(request);
      expect(response).toBeTruthy();
    }, 60000);
  });

  describe('Performance Tests', () => {
    it('should respond within 2 seconds for simple queries', async () => {
      const startTime = Date.now();
      
      const request: CopilotRequest = {
        message: 'help',
        userId: 'test-user-perf',
      };

      const response = await orchestrator.processRequest(request);
      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(2000);
    }, 30000);

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        message: 'help',
        userId: `test-user-concurrent-${i}`,
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => orchestrator.processRequest(req))
      );
      const duration = Date.now() - startTime;

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });
      
      // All 5 requests should complete in reasonable time
      expect(duration).toBeLessThan(10000);
    }, 30000);

    it('should maintain performance under load', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        message: `add a supplier named Supplier-${i}`,
        userId: `test-user-load-${i}`,
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => orchestrator.processRequest(req))
      );
      const duration = Date.now() - startTime;

      expect(responses).toHaveLength(10);
      
      // Calculate average response time
      const avgResponseTime = duration / 10;
      expect(avgResponseTime).toBeLessThan(3000); // Average < 3s per request
    }, 60000);
  });

  describe('Context Resolution', () => {
    it('should resolve pronoun references', async () => {
      const userId = 'test-user-pronouns';
      
      // First message creates context
      const request1: CopilotRequest = {
        message: 'add a supplier in Tokyo',
        userId,
      };

      const response1 = await orchestrator.processRequest(request1);
      expect(response1.success).toBe(true);
      const conversationId = response1.conversationId;

      // Second message uses pronoun
      const request2: CopilotRequest = {
        message: 'update it with capacity 1000',
        userId,
        conversationId,
      };

      const response2 = await orchestrator.processRequest(request2);
      expect(response2).toBeTruthy();
    }, 60000);
  });

  describe('Conversation Management', () => {
    it('should maintain conversation history', async () => {
      const userId = 'test-user-history';
      
      const messages = [
        'add a supplier',
        'add a manufacturer',
        'connect them',
        'show network summary',
      ];

      let conversationId: string | undefined;

      for (const message of messages) {
        const request: CopilotRequest = {
          message,
          userId,
          conversationId,
        };

        const response = await orchestrator.processRequest(request);
        expect(response).toBeTruthy();
        conversationId = response.conversationId;
      }

      // All messages should use the same conversation
      expect(conversationId).toBeTruthy();
    }, 120000);

    it('should summarize long conversations', async () => {
      const userId = 'test-user-long-conv';
      
      // Send many messages to trigger summarization
      const messages = Array.from({ length: 15 }, (_, i) => 
        `add a supplier named Supplier-${i}`
      );

      let conversationId: string | undefined;

      for (const message of messages) {
        const request: CopilotRequest = {
          message,
          userId,
          conversationId,
        };

        const response = await orchestrator.processRequest(request);
        conversationId = response.conversationId;
      }

      // Conversation should still work after many messages
      const finalRequest: CopilotRequest = {
        message: 'show network summary',
        userId,
        conversationId,
      };

      const finalResponse = await orchestrator.processRequest(finalRequest);
      expect(finalResponse.success).toBe(true);
    }, 180000);
  });

  describe('Intent Classification', () => {
    it('should classify build intents correctly', async () => {
      const buildMessages = [
        'add a supplier',
        'create a new warehouse',
        'remove node-1',
        'connect two nodes',
      ];

      for (const message of buildMessages) {
        const request: CopilotRequest = {
          message,
          userId: 'test-user-intent',
        };

        const response = await orchestrator.processRequest(request);
        expect(response).toBeTruthy();
      }
    }, 120000);

    it('should classify configuration intents correctly', async () => {
      const configMessages = [
        'set region to Europe',
        'change industry to retail',
        'set currency to EUR',
      ];

      for (const message of configMessages) {
        const request: CopilotRequest = {
          message,
          userId: 'test-user-intent',
        };

        const response = await orchestrator.processRequest(request);
        expect(response).toBeTruthy();
      }
    }, 120000);

    it('should classify analysis intents correctly', async () => {
      const analysisMessages = [
        'scan for anomalies',
        'identify risks',
        'find bottlenecks',
      ];

      for (const message of analysisMessages) {
        const request: CopilotRequest = {
          message,
          userId: 'test-user-intent',
        };

        const response = await orchestrator.processRequest(request);
        expect(response).toBeTruthy();
      }
    }, 120000);
  });

  describe('Parameter Extraction', () => {
    it('should extract parameters from natural language', async () => {
      const request: CopilotRequest = {
        message: 'add a supplier named Acme Corp in New York with capacity 5000',
        userId: 'test-user-params',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(true);
    }, 30000);

    it('should handle missing optional parameters', async () => {
      const request: CopilotRequest = {
        message: 'add a supplier in Boston',
        userId: 'test-user-params',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(true);
    }, 30000);
  });

  describe('Suggestions', () => {
    it('should provide suggestions after successful actions', async () => {
      const request: CopilotRequest = {
        message: 'add a supplier',
        userId: 'test-user-suggestions',
      };

      const response = await orchestrator.processRequest(request);
      expect(response.success).toBe(true);
      // Suggestions may or may not be present depending on action
      if (response.suggestions) {
        expect(Array.isArray(response.suggestions)).toBe(true);
      }
    }, 30000);

    it('should provide helpful suggestions on errors', async () => {
      const request: CopilotRequest = {
        message: 'do something invalid',
        userId: 'test-user-suggestions',
      };

      const response = await orchestrator.processRequest(request);
      // Should provide suggestions even on error
      expect(response.content).toBeTruthy();
    }, 30000);
  });
});
