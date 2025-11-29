/**
 * Tests for Copilot Orchestrator
 */

import { CopilotOrchestrator, CopilotRequest } from './copilot-orchestrator';
import { BedrockService } from './bedrock-service';
import { IntentClassifier } from './intent-classifier';
import { ActionRegistry } from './action-registry';
import { ConversationService } from './conversation-service';
import { ContextResolver } from './context-resolver';

// Mock services
const mockBedrockService = {
  classifyIntent: jest.fn(),
  generateResponse: jest.fn(),
  streamResponse: jest.fn(),
  countTokens: jest.fn(),
  summarizeHistory: jest.fn(),
} as unknown as BedrockService;

const mockIntentClassifier = {
  classify: jest.fn(),
  getMinConfidence: jest.fn(),
  setMinConfidence: jest.fn(),
} as unknown as IntentClassifier;

const mockActionRegistry = {
  register: jest.fn(),
  getByName: jest.fn(),
  getByIntent: jest.fn(),
  getAllActions: jest.fn(),
  getByCategory: jest.fn(),
  getActionCount: jest.fn(),
  hasAction: jest.fn(),
  unregister: jest.fn(),
  clear: jest.fn(),
} as unknown as ActionRegistry;

const mockConversationService = {
  createConversation: jest.fn(),
  getConversation: jest.fn(),
  getConversationByConnectionId: jest.fn(),
  addMessage: jest.fn(),
  getConversationHistory: jest.fn(),
  summarizeConversation: jest.fn(),
  getConversationContext: jest.fn(),
  updateSupplyChainContext: jest.fn(),
  updateMetadata: jest.fn(),
  clearConversation: jest.fn(),
  estimateTokenCount: jest.fn(),
  isContextSizeValid: jest.fn(),
} as unknown as ConversationService;

const mockContextResolver = {
  extractEntities: jest.fn(),
  trackEntities: jest.fn(),
  containsPronouns: jest.fn(),
  resolveReferences: jest.fn(),
  getEntity: jest.fn(),
  getEntitiesByType: jest.fn(),
  addEntity: jest.fn(),
  pruneOldEntities: jest.fn(),
  createEnhancedMessage: jest.fn(),
} as unknown as ContextResolver;

describe('CopilotOrchestrator', () => {
  let orchestrator: CopilotOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();

    orchestrator = new CopilotOrchestrator(
      mockBedrockService,
      mockIntentClassifier,
      mockActionRegistry,
      mockConversationService,
      mockContextResolver
    );

    // Setup default mocks
    (mockConversationService.createConversation as jest.Mock).mockResolvedValue({
      id: 'conv_123',
      userId: 'user_123',
      connectionId: 'conn_123',
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        totalMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
      },
    });

    (mockConversationService.getConversation as jest.Mock).mockResolvedValue(null);
    (mockConversationService.getConversationByConnectionId as jest.Mock).mockResolvedValue(null);
    (mockConversationService.addMessage as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: 'test message',
      timestamp: new Date(),
    });
    (mockConversationService.getConversationHistory as jest.Mock).mockResolvedValue([]);

    (mockContextResolver.createEnhancedMessage as jest.Mock).mockReturnValue({
      originalMessage: 'test message',
      enhancedMessage: 'test message',
      context: { entities: [], lastAction: undefined },
      hasReferences: false,
    });

    (mockIntentClassifier.classify as jest.Mock).mockResolvedValue({
      intent: 'help',
      confidence: 0.9,
      parameters: {},
      requiresClarification: false,
    });

    (mockActionRegistry.getByName as jest.Mock).mockReturnValue({
      name: 'help',
      category: 'query',
      description: 'Show help',
      examples: ['help', 'show help'],
      parameters: [],
      validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      execute: jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Help information' },
      }),
    });

    (mockBedrockService.generateResponse as jest.Mock).mockResolvedValue(
      'Here is the help information you requested.'
    );
  });

  describe('processRequest', () => {
    it('should process a simple request successfully', async () => {
      const request: CopilotRequest = {
        message: 'help',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Here is the help information you requested.');
      expect(response.metadata.intent).toBe('help');
      expect(response.metadata.confidence).toBe(0.9);
      expect(mockConversationService.addMessage).toHaveBeenCalledTimes(2); // User + assistant
    });

    it('should handle clarification requests', async () => {
      (mockIntentClassifier.classify as jest.Mock).mockResolvedValue({
        intent: 'unknown',
        confidence: 0.3,
        parameters: {},
        requiresClarification: true,
        clarificationQuestion: 'Could you be more specific?',
      });

      const request: CopilotRequest = {
        message: 'do something',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Could you be more specific?');
      expect(response.metadata.requiresClarification).toBe(true);
    });

    it('should handle action not found', async () => {
      (mockActionRegistry.getByName as jest.Mock).mockReturnValue(null);

      const request: CopilotRequest = {
        message: 'unknown action',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.content).toContain('don\'t know how to');
    });

    it('should handle parameter validation errors', async () => {
      const mockAction = {
        name: 'add-supplier',
        category: 'build',
        description: 'Add supplier',
        examples: ['add supplier'],
        parameters: [{ name: 'name', type: 'string', required: true, description: 'Supplier name' }],
        validate: jest.fn().mockReturnValue({
          valid: false,
          errors: ['Name is required'],
        }),
        execute: jest.fn(),
      };

      (mockActionRegistry.getByName as jest.Mock).mockReturnValue(mockAction);

      const request: CopilotRequest = {
        message: 'add supplier',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.content).toContain('Invalid parameters');
    });

    it('should handle action execution errors gracefully', async () => {
      const mockAction = {
        name: 'add-supplier',
        category: 'build',
        description: 'Add supplier',
        examples: ['add supplier'],
        parameters: [],
        validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockActionRegistry.getByName as jest.Mock).mockReturnValue(mockAction);

      const request: CopilotRequest = {
        message: 'add supplier',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.content).toContain('encountered an error');
      expect(response.suggestions).toBeDefined();
    });

    it('should validate request message', async () => {
      const request: CopilotRequest = {
        message: '',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Message is required');
    });

    it('should validate user ID', async () => {
      const request: CopilotRequest = {
        message: 'help',
        userId: '',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('User ID is required');
    });
  });

  describe('multi-step requests', () => {
    it('should detect and parse multi-step requests with "and then"', async () => {
      const request: CopilotRequest = {
        message: 'add supplier ABC and then connect it to warehouse XYZ',
        userId: 'user_123',
      };

      // Mock multiple action executions
      let callCount = 0;
      (mockIntentClassifier.classify as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            intent: 'add-supplier',
            confidence: 0.9,
            parameters: { name: 'ABC' },
            requiresClarification: false,
          });
        } else {
          return Promise.resolve({
            intent: 'connect-nodes',
            confidence: 0.9,
            parameters: { from: 'ABC', to: 'XYZ' },
            requiresClarification: false,
          });
        }
      });

      (mockActionRegistry.getByName as jest.Mock).mockImplementation((name) => ({
        name,
        category: 'build',
        description: `Execute ${name}`,
        examples: [],
        parameters: [],
        validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        execute: jest.fn().mockResolvedValue({
          success: true,
          data: { message: `${name} completed` },
        }),
      }));

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.metadata.stepsExecuted).toBe(2);
      expect(response.content).toContain('Step 1');
      expect(response.content).toContain('Step 2');
    });

    it('should detect and parse numbered multi-step requests', async () => {
      const request: CopilotRequest = {
        message: '1. add supplier ABC 2. add warehouse XYZ',
        userId: 'user_123',
      };

      // Mock multiple action executions
      let callCount = 0;
      (mockIntentClassifier.classify as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          intent: callCount === 1 ? 'add-supplier' : 'add-warehouse',
          confidence: 0.9,
          parameters: { name: callCount === 1 ? 'ABC' : 'XYZ' },
          requiresClarification: false,
        });
      });

      (mockActionRegistry.getByName as jest.Mock).mockImplementation((name) => ({
        name,
        category: 'build',
        description: `Execute ${name}`,
        examples: [],
        parameters: [],
        validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        execute: jest.fn().mockResolvedValue({
          success: true,
          data: { message: `${name} completed` },
        }),
      }));

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true);
      expect(response.metadata.stepsExecuted).toBe(2);
    });

    it('should stop execution when a step fails', async () => {
      const request: CopilotRequest = {
        message: 'add supplier ABC and then add warehouse XYZ and then add retailer DEF',
        userId: 'user_123',
      };

      // Mock multiple action executions with second one failing
      let callCount = 0;
      (mockIntentClassifier.classify as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          intent: `action-${callCount}`,
          confidence: 0.9,
          parameters: {},
          requiresClarification: false,
        });
      });

      (mockActionRegistry.getByName as jest.Mock).mockImplementation((name) => ({
        name,
        category: 'build',
        description: `Execute ${name}`,
        examples: [],
        parameters: [],
        validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        execute: jest.fn().mockImplementation(() => {
          if (name === 'action-2') {
            return Promise.resolve({
              success: false,
              error: 'Step 2 failed',
            });
          }
          return Promise.resolve({
            success: true,
            data: { message: `${name} completed` },
          });
        }),
      }));

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.metadata.stepsExecuted).toBe(2); // Should stop after step 2
      expect(response.content).toContain('step 2 failed');
    });

    it('should enforce maximum step limit', async () => {
      const orchestratorWithLimit = new CopilotOrchestrator(
        mockBedrockService,
        mockIntentClassifier,
        mockActionRegistry,
        mockConversationService,
        mockContextResolver,
        { maxSteps: 2 }
      );

      const request: CopilotRequest = {
        message: '1. step one 2. step two 3. step three',
        userId: 'user_123',
      };

      const response = await orchestratorWithLimit.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Too many steps');
    });
  });

  describe('context resolution', () => {
    it('should resolve pronoun references when enabled', async () => {
      (mockContextResolver.createEnhancedMessage as jest.Mock).mockReturnValue({
        originalMessage: 'connect it to warehouse',
        enhancedMessage: 'connect node "supplier ABC" to warehouse',
        context: {
          entities: [
            {
              type: 'node',
              id: 'node_supplier_abc',
              name: 'supplier ABC',
              mentionedAt: new Date(),
            },
          ],
        },
        hasReferences: true,
      });

      const request: CopilotRequest = {
        message: 'connect it to warehouse',
        userId: 'user_123',
      };

      await orchestrator.processRequest(request);

      expect(mockContextResolver.createEnhancedMessage).toHaveBeenCalled();
      expect(mockIntentClassifier.classify).toHaveBeenCalledWith(
        'connect node "supplier ABC" to warehouse',
        expect.any(Array)
      );
    });

    it('should work without context resolution when disabled', async () => {
      const orchestratorNoContext = new CopilotOrchestrator(
        mockBedrockService,
        mockIntentClassifier,
        mockActionRegistry,
        mockConversationService,
        mockContextResolver,
        { enableContextResolution: false }
      );

      const request: CopilotRequest = {
        message: 'help',
        userId: 'user_123',
      };

      await orchestratorNoContext.processRequest(request);

      expect(mockContextResolver.createEnhancedMessage).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should provide user-friendly error messages', async () => {
      (mockConversationService.createConversation as jest.Mock).mockRejectedValue(
        new Error('Database connection timeout')
      );

      const request: CopilotRequest = {
        message: 'help',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(false);
      expect(response.content).not.toContain('Database connection');
      expect(response.content).toContain('try again');
      expect(response.suggestions).toBeDefined();
    });

    it('should handle response generation failures gracefully', async () => {
      (mockBedrockService.generateResponse as jest.Mock).mockRejectedValue(
        new Error('Bedrock API error')
      );

      const request: CopilotRequest = {
        message: 'help',
        userId: 'user_123',
      };

      const response = await orchestrator.processRequest(request);

      expect(response.success).toBe(true); // Action succeeded
      expect(response.content).toBe('Your request was completed successfully.'); // Fallback message
    });
  });
});
