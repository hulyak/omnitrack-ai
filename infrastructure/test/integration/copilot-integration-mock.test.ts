/**
 * AI Copilot Integration Tests (Mocked)
 * 
 * Integration tests with mocked external dependencies for CI/CD.
 * Tests the integration between copilot components without requiring AWS services.
 * 
 * Task 20: Checkpoint - Integration testing
 * Requirements: All copilot requirements (1.1-10.5)
 */

import { ActionRegistry, Action, ActionResult, SupplyChainContext } from '../../lambda/copilot/action-registry';
import { IntentClassifier } from '../../lambda/copilot/intent-classifier';
import { ConversationService } from '../../lambda/copilot/conversation-service';
import { ContextResolver } from '../../lambda/copilot/context-resolver';
import { CopilotOrchestrator } from '../../lambda/copilot/copilot-orchestrator';
import { BedrockService } from '../../lambda/copilot/bedrock-service';

// Mock Bedrock Service
class MockBedrockService {
  async classifyIntent(message: string, history: any[]): Promise<any> {
    // Simple intent classification based on keywords
    let intent = 'help';
    let confidence = 0.9;
    const parameters: Record<string, any> = {};

    if (message.includes('add') && message.includes('supplier')) {
      intent = 'add-supplier';
      const nameMatch = message.match(/named\s+([A-Za-z\s]+)/);
      const locationMatch = message.match(/in\s+([A-Za-z\s]+)/);
      if (nameMatch) parameters.name = nameMatch[1].trim();
      if (locationMatch) parameters.location = locationMatch[1].trim();
    } else if (message.includes('add') && message.includes('manufacturer')) {
      intent = 'add-manufacturer';
    } else if (message.includes('add') && message.includes('warehouse')) {
      intent = 'add-warehouse';
    } else if (message.includes('connect')) {
      intent = 'connect-nodes';
    } else if (message.includes('set') && message.includes('region')) {
      intent = 'set-region';
    } else if (message.includes('scan') || message.includes('anomal')) {
      intent = 'scan-anomalies';
    } else if (message.includes('simulation') || message.includes('simulate')) {
      intent = 'run-simulation';
    } else if (message.includes('summary')) {
      intent = 'get-network-summary';
    } else if (message.includes('help')) {
      intent = 'help';
    }

    return {
      intent,
      confidence,
      parameters,
      requiresClarification: false,
    };
  }

  async generateResponse(actionResult: ActionResult, context: any): Promise<string> {
    if (actionResult.success) {
      return `Successfully completed the action. ${JSON.stringify(actionResult.data || {})}`;
    } else {
      return `Failed to complete the action: ${actionResult.error}`;
    }
  }

  async *streamResponse(prompt: string): AsyncGenerator<string> {
    const response = 'This is a streamed response from the copilot.';
    for (const char of response) {
      yield char;
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
}

describe('AI Copilot Integration Tests (Mocked)', () => {
  let orchestrator: CopilotOrchestrator;
  let bedrockService: any;
  let intentClassifier: IntentClassifier;
  let actionRegistry: ActionRegistry;
  let conversationService: ConversationService;
  let contextResolver: ContextResolver;

  beforeAll(() => {
    // Initialize services with mocks
    bedrockService = new MockBedrockService() as any;
    intentClassifier = new IntentClassifier(bedrockService);
    actionRegistry = new ActionRegistry();
    conversationService = new ConversationService(bedrockService);
    contextResolver = new ContextResolver();

    // Register test actions
    registerTestActions(actionRegistry);

    // Create orchestrator
    orchestrator = new CopilotOrchestrator(
      bedrockService,
      intentClassifier,
      actionRegistry,
      conversationService,
      contextResolver
    );
  });

  describe('Component Integration', () => {
    it('should integrate all components successfully', () => {
      expect(orchestrator).toBeDefined();
      expect(intentClassifier).toBeDefined();
      expect(actionRegistry).toBeDefined();
      expect(conversationService).toBeDefined();
      expect(contextResolver).toBeDefined();
    });

    it('should have actions registered', () => {
      const actionCount = actionRegistry.getActionCount();
      expect(actionCount).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Message Flow', () => {
    it('should process a simple help message', async () => {
      const request = {
        message: 'help',
        userId: 'test-user-1',
      };

      const response = await orchestrator.processRequest(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.content).toBeTruthy();
      expect(response.conversationId).toBeTruthy();
      expect(response.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should process an add supplier message', async () => {
      const request = {
        message: 'add a supplier named Acme Corp in New York',
        userId: 'test-user-2',
      };

      const response = await orchestrator.processRequest(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.content).toBeTruthy();
    });

    it('should maintain conversation context', async () => {
      const userId = 'test-user-context';
      
      // First message
      const request1 = {
        message: 'add a supplier in Tokyo',
        userId,
      };

      const response1 = await orchestrator.processRequest(request1);
      expect(response1.success).toBe(true);
      const conversationId = response1.conversationId;

      // Second message in same conversation
      const request2 = {
        message: 'show network summary',
        userId,
        conversationId,
      };

      const response2 = await orchestrator.processRequest(request2);
      expect(response2.success).toBe(true);
      expect(response2.conversationId).toBe(conversationId);
    });
  });

  describe('Action Execution', () => {
    it('should execute build actions', async () => {
      const messages = [
        'add a supplier',
        'add a manufacturer',
        'add a warehouse',
      ];

      for (const message of messages) {
        const response = await orchestrator.processRequest({
          message,
          userId: 'test-user-build',
        });
        expect(response.success).toBe(true);
      }
    });

    it('should execute configuration actions', async () => {
      const response = await orchestrator.processRequest({
        message: 'set region to North America',
        userId: 'test-user-config',
      });
      expect(response.success).toBe(true);
    });

    it('should execute analysis actions', async () => {
      const response = await orchestrator.processRequest({
        message: 'scan for anomalies',
        userId: 'test-user-analysis',
      });
      expect(response.success).toBe(true);
    });

    it('should execute simulation actions', async () => {
      const response = await orchestrator.processRequest({
        message: 'run a simulation',
        userId: 'test-user-sim',
      });
      expect(response.success).toBe(true);
    });

    it('should execute query actions', async () => {
      const response = await orchestrator.processRequest({
        message: 'show network summary',
        userId: 'test-user-query',
      });
      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty message', async () => {
      const response = await orchestrator.processRequest({
        message: '',
        userId: 'test-user-error',
      });
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    it('should handle missing userId', async () => {
      const response = await orchestrator.processRequest({
        message: 'help',
        userId: '',
      });
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    it('should handle message too long', async () => {
      const longMessage = 'a'.repeat(3000);
      const response = await orchestrator.processRequest({
        message: longMessage,
        userId: 'test-user-error',
      });
      expect(response.success).toBe(false);
      expect(response.error).toContain('too long');
    });

    it('should handle unknown action gracefully', async () => {
      const response = await orchestrator.processRequest({
        message: 'do something completely unknown',
        userId: 'test-user-error',
      });
      // Should return a response even if action not found
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });
  });

  describe('Multi-Step Requests', () => {
    it('should handle numbered list multi-step request', async () => {
      const response = await orchestrator.processRequest({
        message: '1. add a supplier 2. add a manufacturer 3. show summary',
        userId: 'test-user-multistep',
      });
      expect(response).toBeDefined();
      expect(response.metadata.stepsExecuted).toBeGreaterThan(1);
    });

    it('should handle "and then" pattern', async () => {
      const response = await orchestrator.processRequest({
        message: 'add a supplier and then add a manufacturer',
        userId: 'test-user-multistep-and',
      });
      expect(response).toBeDefined();
    });

    it('should stop on first failure', async () => {
      const response = await orchestrator.processRequest({
        message: '1. add a supplier 2. invalid action 3. add warehouse',
        userId: 'test-user-multistep-fail',
      });
      expect(response).toBeDefined();
      // Should have attempted at least one step
      expect(response.metadata.stepsExecuted).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should respond quickly for simple queries', async () => {
      const startTime = Date.now();
      
      const response = await orchestrator.processRequest({
        message: 'help',
        userId: 'test-user-perf',
      });
      
      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        message: 'help',
        userId: `test-user-concurrent-${i}`,
      }));

      const responses = await Promise.all(
        requests.map(req => orchestrator.processRequest(req))
      );

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });
    });
  });

  describe('Context Resolution', () => {
    it('should resolve context references', async () => {
      const userId = 'test-user-context-res';
      
      // First message
      const response1 = await orchestrator.processRequest({
        message: 'add a supplier in Tokyo',
        userId,
      });
      expect(response1.success).toBe(true);
      const conversationId = response1.conversationId;

      // Second message with reference
      const response2 = await orchestrator.processRequest({
        message: 'show me details about it',
        userId,
        conversationId,
      });
      expect(response2).toBeDefined();
    });
  });

  describe('Conversation Management', () => {
    it('should maintain conversation history', async () => {
      const userId = 'test-user-history';
      
      const messages = [
        'add a supplier',
        'add a manufacturer',
        'show summary',
      ];

      let conversationId: string | undefined;

      for (const message of messages) {
        const response = await orchestrator.processRequest({
          message,
          userId,
          conversationId,
        });
        expect(response).toBeDefined();
        conversationId = response.conversationId;
      }

      expect(conversationId).toBeTruthy();
    });
  });
});

/**
 * Register test actions
 */
function registerTestActions(registry: ActionRegistry): void {
  const testActions: Action[] = [
    {
      name: 'help',
      category: 'query',
      description: 'Show help information',
      examples: ['help', 'what can you do'],
      parameters: [],
      execute: async () => ({ success: true, data: { message: 'Help information' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'add-supplier',
      category: 'build',
      description: 'Add a supplier node',
      examples: ['add a supplier', 'create supplier'],
      parameters: [],
      execute: async () => ({ success: true, data: { nodeId: 'supplier-1' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'add-manufacturer',
      category: 'build',
      description: 'Add a manufacturer node',
      examples: ['add a manufacturer'],
      parameters: [],
      execute: async () => ({ success: true, data: { nodeId: 'manufacturer-1' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'add-warehouse',
      category: 'build',
      description: 'Add a warehouse node',
      examples: ['add a warehouse'],
      parameters: [],
      execute: async () => ({ success: true, data: { nodeId: 'warehouse-1' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'connect-nodes',
      category: 'build',
      description: 'Connect two nodes',
      examples: ['connect nodes'],
      parameters: [],
      execute: async () => ({ success: true, data: { edgeId: 'edge-1' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'set-region',
      category: 'configure',
      description: 'Set region',
      examples: ['set region'],
      parameters: [],
      execute: async () => ({ success: true, data: { region: 'North America' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'scan-anomalies',
      category: 'analyze',
      description: 'Scan for anomalies',
      examples: ['scan anomalies'],
      parameters: [],
      execute: async () => ({ success: true, data: { anomalies: [] } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'run-simulation',
      category: 'simulate',
      description: 'Run simulation',
      examples: ['run simulation'],
      parameters: [],
      execute: async () => ({ success: true, data: { simulationId: 'sim-1' } }),
      validate: () => ({ valid: true, errors: [] }),
    },
    {
      name: 'get-network-summary',
      category: 'query',
      description: 'Get network summary',
      examples: ['show summary', 'network summary'],
      parameters: [],
      execute: async () => ({ success: true, data: { nodes: 0, edges: 0 } }),
      validate: () => ({ valid: true, errors: [] }),
    },
  ];

  testActions.forEach(action => registry.register(action));
}
