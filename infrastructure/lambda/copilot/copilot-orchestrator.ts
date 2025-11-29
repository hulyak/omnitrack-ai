/**
 * Copilot Orchestrator
 * 
 * Main orchestrator for the AI Copilot that coordinates all components:
 * - Intent classification
 * - Action execution
 * - Response generation
 * - Error handling
 * - Multi-step request handling
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { logger } from '../utils/logger';
import { BedrockService, IntentClassification, Message } from './bedrock-service';
import { IntentClassifier } from './intent-classifier';
import { ActionRegistry, ActionResult, SupplyChainContext } from './action-registry';
import { ConversationService } from './conversation-service';
import { ContextResolver } from './context-resolver';

/**
 * Request to process by the orchestrator
 */
export interface CopilotRequest {
  message: string;
  userId: string;
  conversationId?: string;
  connectionId?: string;
  supplyChainContext?: Partial<SupplyChainContext>;
}

/**
 * Response from the orchestrator
 */
export interface CopilotResponse {
  success: boolean;
  content: string;
  conversationId: string;
  metadata: {
    intent?: string;
    confidence?: number;
    requiresClarification?: boolean;
    actionSuccess?: boolean;
    executionTime: number;
    stepsExecuted?: number;
  };
  suggestions?: string[];
  error?: string;
}

/**
 * Multi-step request parsing result
 */
interface MultiStepRequest {
  isMultiStep: boolean;
  steps: string[];
}

/**
 * Step execution result
 */
interface StepResult {
  stepNumber: number;
  message: string;
  intent: string;
  success: boolean;
  result: ActionResult;
  response: string;
}

/**
 * Copilot Orchestrator Options
 */
export interface OrchestratorOptions {
  enableMultiStep?: boolean;
  maxSteps?: number;
  minConfidence?: number;
  enableContextResolution?: boolean;
}

/**
 * Copilot Orchestrator
 * 
 * Coordinates all copilot components to process user requests.
 * Handles single and multi-step requests with proper error handling.
 */
export class CopilotOrchestrator {
  private bedrockService: BedrockService;
  private intentClassifier: IntentClassifier;
  private actionRegistry: ActionRegistry;
  private conversationService: ConversationService;
  private contextResolver: ContextResolver;
  private options: Required<OrchestratorOptions>;

  constructor(
    bedrockService: BedrockService,
    intentClassifier: IntentClassifier,
    actionRegistry: ActionRegistry,
    conversationService: ConversationService,
    contextResolver: ContextResolver,
    options: OrchestratorOptions = {}
  ) {
    this.bedrockService = bedrockService;
    this.intentClassifier = intentClassifier;
    this.actionRegistry = actionRegistry;
    this.conversationService = conversationService;
    this.contextResolver = contextResolver;

    // Set default options
    this.options = {
      enableMultiStep: options.enableMultiStep !== false,
      maxSteps: options.maxSteps || 5,
      minConfidence: options.minConfidence || 0.5,
      enableContextResolution: options.enableContextResolution !== false,
    };

    logger.info('CopilotOrchestrator initialized', {
      enableMultiStep: this.options.enableMultiStep,
      maxSteps: this.options.maxSteps,
      minConfidence: this.options.minConfidence,
    });
  }

  /**
   * Process a copilot request
   * 
   * Main entry point for processing user messages.
   * Handles both single and multi-step requests.
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * 
   * @param request - The copilot request
   * @returns Copilot response
   */
  async processRequest(request: CopilotRequest): Promise<CopilotResponse> {
    const startTime = Date.now();
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Processing copilot request', {
      correlationId,
      userId: request.userId,
      conversationId: request.conversationId,
      messageLength: request.message.length,
    });

    try {
      // Validate request
      this.validateRequest(request);

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(request);
      const conversationId = conversation.id;

      // Add user message to conversation
      await this.conversationService.addMessage(conversationId, {
        role: 'user',
        content: request.message,
      });

      // Check if this is a multi-step request
      const multiStepParsing = this.parseMultiStepRequest(request.message);

      let response: CopilotResponse;

      if (multiStepParsing.isMultiStep && this.options.enableMultiStep) {
        // Handle multi-step request
        logger.info('Processing multi-step request', {
          correlationId,
          stepCount: multiStepParsing.steps.length,
        });

        response = await this.processMultiStepRequest(
          multiStepParsing.steps,
          request,
          conversationId,
          correlationId
        );
      } else {
        // Handle single-step request
        response = await this.processSingleStepRequest(
          request.message,
          request,
          conversationId,
          correlationId
        );
      }

      // Add assistant message to conversation
      await this.conversationService.addMessage(conversationId, {
        role: 'assistant',
        content: response.content,
      });

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      response.metadata.executionTime = executionTime;

      logger.info('Copilot request processed successfully', {
        correlationId,
        conversationId,
        executionTime,
        success: response.success,
      });

      return response;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Failed to process copilot request', error as Error, {
        correlationId,
        userId: request.userId,
        executionTime,
      });

      return this.createErrorResponse(
        error as Error,
        request.conversationId || '',
        executionTime
      );
    }
  }

  /**
   * Process a single-step request
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private async processSingleStepRequest(
    message: string,
    request: CopilotRequest,
    conversationId: string,
    correlationId: string
  ): Promise<CopilotResponse> {
    try {
      // Get conversation history for context
      const history = await this.conversationService.getConversationHistory(
        conversationId,
        5
      );

      // Resolve context references if enabled
      let resolvedMessage = message;
      if (this.options.enableContextResolution) {
        const enhanced = this.contextResolver.createEnhancedMessage(message, history);
        resolvedMessage = enhanced.enhancedMessage;
        
        if (enhanced.hasReferences) {
          logger.info('Context references resolved', {
            correlationId,
            original: message,
            resolved: resolvedMessage,
          });
        }
      }

      // Classify intent
      // Convert Message[] to format expected by classifier
      const classifierHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
      }));
      
      const classification = await this.intentClassifier.classify(
        resolvedMessage,
        classifierHistory
      );

      logger.info('Intent classified', {
        correlationId,
        intent: classification.intent,
        confidence: classification.confidence,
        requiresClarification: classification.requiresClarification,
      });

      // Handle clarification if needed
      if (classification.requiresClarification && classification.clarificationQuestion) {
        return {
          success: true,
          content: classification.clarificationQuestion,
          conversationId,
          metadata: {
            intent: classification.intent,
            confidence: classification.confidence,
            requiresClarification: true,
            executionTime: 0, // Will be set by caller
          },
        };
      }

      // Execute action
      const actionResult = await this.executeAction(
        classification,
        request,
        conversationId,
        correlationId
      );

      // Generate response
      // Convert Message[] to format expected by Bedrock
      const bedrockHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
      }));
      
      const responseContent = await this.generateResponse(
        actionResult,
        bedrockHistory,
        correlationId
      );

      return {
        success: actionResult.success,
        content: responseContent,
        conversationId,
        metadata: {
          intent: classification.intent,
          confidence: classification.confidence,
          requiresClarification: false,
          actionSuccess: actionResult.success,
          executionTime: 0, // Will be set by caller
        },
        suggestions: actionResult.suggestions,
      };
    } catch (error) {
      logger.error('Failed to process single-step request', error as Error, {
        correlationId,
        conversationId,
      });
      throw error;
    }
  }

  /**
   * Process a multi-step request
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   * Property 12: Multi-step execution atomicity
   */
  private async processMultiStepRequest(
    steps: string[],
    request: CopilotRequest,
    conversationId: string,
    correlationId: string
  ): Promise<CopilotResponse> {
    const stepResults: StepResult[] = [];
    let allSuccessful = true;
    let failedStepNumber: number | null = null;

    try {
      // Validate step count
      if (steps.length > this.options.maxSteps) {
        throw new Error(
          `Too many steps requested (${steps.length}). Maximum is ${this.options.maxSteps}.`
        );
      }

      // Get conversation history
      const history = await this.conversationService.getConversationHistory(
        conversationId,
        5
      );

      // Execute steps sequentially
      for (let i = 0; i < steps.length; i++) {
        const stepNumber = i + 1;
        const stepMessage = steps[i].trim();

        logger.info('Executing step', {
          correlationId,
          stepNumber,
          totalSteps: steps.length,
          message: stepMessage,
        });

        try {
          // Resolve context references
          let resolvedMessage = stepMessage;
          if (this.options.enableContextResolution) {
            const enhanced = this.contextResolver.createEnhancedMessage(
              stepMessage,
              history
            );
            resolvedMessage = enhanced.enhancedMessage;
          }

          // Classify intent for this step
          // Convert Message[] to format expected by classifier
          const classifierHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.getTime(),
          }));
          
          const classification = await this.intentClassifier.classify(
            resolvedMessage,
            classifierHistory
          );

          // Check if clarification is needed
          if (classification.requiresClarification) {
            throw new Error(
              `Step ${stepNumber} requires clarification: ${classification.clarificationQuestion}`
            );
          }

          // Execute action for this step
          const actionResult = await this.executeAction(
            classification,
            request,
            conversationId,
            correlationId
          );

          // Generate response for this step
          // Convert Message[] to format expected by Bedrock
          const bedrockHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.getTime(),
          }));
          
          const responseContent = await this.generateResponse(
            actionResult,
            bedrockHistory,
            correlationId
          );

          // Store step result
          stepResults.push({
            stepNumber,
            message: stepMessage,
            intent: classification.intent,
            success: actionResult.success,
            result: actionResult,
            response: responseContent,
          });

          // Check if step failed
          if (!actionResult.success) {
            allSuccessful = false;
            failedStepNumber = stepNumber;
            
            logger.warning('Step execution failed', {
              correlationId,
              stepNumber,
              intent: classification.intent,
              error: actionResult.error,
            });

            // Stop execution on failure (Requirement 10.3)
            break;
          }

          // Add step result to conversation history for context
          await this.conversationService.addMessage(conversationId, {
            role: 'assistant',
            content: `Step ${stepNumber} completed: ${responseContent}`,
          });

          logger.info('Step executed successfully', {
            correlationId,
            stepNumber,
            intent: classification.intent,
          });
        } catch (stepError) {
          allSuccessful = false;
          failedStepNumber = stepNumber;

          logger.error('Step execution error', stepError as Error, {
            correlationId,
            stepNumber,
          });

          // Store error result
          stepResults.push({
            stepNumber,
            message: stepMessage,
            intent: 'unknown',
            success: false,
            result: {
              success: false,
              error: (stepError as Error).message,
            },
            response: `Error in step ${stepNumber}: ${(stepError as Error).message}`,
          });

          // Stop execution on error (Requirement 10.3)
          break;
        }
      }

      // Generate summary response
      const summaryResponse = this.generateMultiStepSummary(
        stepResults,
        allSuccessful,
        failedStepNumber
      );

      return {
        success: allSuccessful,
        content: summaryResponse,
        conversationId,
        metadata: {
          executionTime: 0, // Will be set by caller
          stepsExecuted: stepResults.length,
          actionSuccess: allSuccessful,
        },
        suggestions: this.generateMultiStepSuggestions(stepResults, allSuccessful),
      };
    } catch (error) {
      logger.error('Failed to process multi-step request', error as Error, {
        correlationId,
        conversationId,
        stepsCompleted: stepResults.length,
      });

      // Generate error summary
      const errorSummary = this.generateMultiStepErrorSummary(
        stepResults,
        error as Error
      );

      return {
        success: false,
        content: errorSummary,
        conversationId,
        metadata: {
          executionTime: 0, // Will be set by caller
          stepsExecuted: stepResults.length,
          actionSuccess: false,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute an action based on classified intent
   * 
   * Requirements: 1.4, 7.4
   * Property 9: Error handling graceful degradation
   */
  private async executeAction(
    classification: IntentClassification,
    request: CopilotRequest,
    conversationId: string,
    correlationId: string
  ): Promise<ActionResult> {
    try {
      // Get action from registry
      const action = this.actionRegistry.getByName(classification.intent);

      if (!action) {
        logger.warning('Action not found', {
          correlationId,
          intent: classification.intent,
        });

        return {
          success: false,
          error: `I don't know how to ${classification.intent}. Try asking for "help" to see what I can do.`,
          suggestions: ['help', 'get-network-summary'],
        };
      }

      // Validate parameters
      const validation = action.validate(classification.parameters);
      if (!validation.valid) {
        logger.warning('Parameter validation failed', {
          correlationId,
          intent: classification.intent,
          errors: validation.errors,
        });

        return {
          success: false,
          error: `Invalid parameters: ${validation.errors.join(', ')}`,
          suggestions: [`Try: ${action.examples[0]}`],
        };
      }

      // Build supply chain context
      const conversation = await this.conversationService.getConversation(
        conversationId
      );
      
      const supplyChainContext: SupplyChainContext = {
        userId: request.userId,
        nodes: conversation?.context.nodes || request.supplyChainContext?.nodes || [],
        edges: conversation?.context.edges || request.supplyChainContext?.edges || [],
        configuration: conversation?.context.configuration || request.supplyChainContext?.configuration || {},
        recentActions: conversation?.context.recentActions || request.supplyChainContext?.recentActions || [],
        activeSimulations: conversation?.context.activeSimulations || request.supplyChainContext?.activeSimulations || [],
      };

      // Execute action
      logger.info('Executing action', {
        correlationId,
        intent: classification.intent,
        parameters: Object.keys(classification.parameters),
      });

      const result = await action.execute(
        classification.parameters,
        supplyChainContext
      );

      logger.info('Action executed', {
        correlationId,
        intent: classification.intent,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error('Action execution failed', error as Error, {
        correlationId,
        intent: classification.intent,
      });

      // Graceful degradation - return user-friendly error
      return {
        success: false,
        error: 'I encountered an error while processing your request. Please try again or rephrase your request.',
        suggestions: ['Try rephrasing your request', 'Ask for help'],
      };
    }
  }

  /**
   * Generate natural language response
   * 
   * Requirements: 1.5
   * Property 2: Response generation completeness
   */
  private async generateResponse(
    actionResult: ActionResult,
    history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>,
    correlationId: string
  ): Promise<string> {
    try {
      const response = await this.bedrockService.generateResponse(actionResult, {
        messages: history,
        userId: '', // Not needed for response generation
      });

      if (!response || response.trim().length === 0) {
        logger.warning('Empty response generated', { correlationId });
        return 'I completed your request, but I don\'t have any additional information to share.';
      }

      return response;
    } catch (error) {
      logger.error('Response generation failed', error as Error, {
        correlationId,
      });

      // Fallback to basic response
      if (actionResult.success) {
        return 'Your request was completed successfully.';
      } else {
        return `I encountered an issue: ${actionResult.error || 'Unknown error'}`;
      }
    }
  }

  /**
   * Parse multi-step request
   * 
   * Detects if a message contains multiple steps and parses them.
   * 
   * Requirements: 10.1
   */
  private parseMultiStepRequest(message: string): MultiStepRequest {
    // Check for common multi-step indicators
    const multiStepPatterns = [
      /\band then\b/i,
      /\bafter that\b/i,
      /\bnext\b/i,
      /\bfollowed by\b/i,
      /\balso\b/i,
      /\d+\.\s+/,  // Numbered lists
      /\d+\)\s+/,  // Numbered lists with parentheses
      /;\s+/,      // Semicolon-separated
    ];

    const isMultiStep = multiStepPatterns.some(pattern => pattern.test(message));

    if (!isMultiStep) {
      return {
        isMultiStep: false,
        steps: [message],
      };
    }

    // Parse steps
    let steps: string[] = [];

    // Try numbered list first
    const numberedMatch = message.match(/(\d+[\.)]\s+[^0-9]+)/g);
    if (numberedMatch && numberedMatch.length > 1) {
      steps = numberedMatch.map(step => 
        step.replace(/^\d+[\.)]\s+/, '').trim()
      );
    }
    // Try semicolon-separated
    else if (message.includes(';')) {
      steps = message.split(';').map(s => s.trim()).filter(s => s.length > 0);
    }
    // Try "and then" pattern
    else if (/\band then\b/i.test(message)) {
      steps = message.split(/\band then\b/i).map(s => s.trim()).filter(s => s.length > 0);
    }
    // Try "after that" pattern
    else if (/\bafter that\b/i.test(message)) {
      steps = message.split(/\bafter that\b/i).map(s => s.trim()).filter(s => s.length > 0);
    }
    // Default: treat as single step
    else {
      steps = [message];
    }

    return {
      isMultiStep: steps.length > 1,
      steps,
    };
  }

  /**
   * Generate summary for multi-step execution
   * 
   * Requirements: 10.4
   */
  private generateMultiStepSummary(
    stepResults: StepResult[],
    allSuccessful: boolean,
    failedStepNumber: number | null
  ): string {
    if (allSuccessful) {
      const summary = `I successfully completed all ${stepResults.length} steps:\n\n` +
        stepResults.map(step => 
          `${step.stepNumber}. ${step.response}`
        ).join('\n\n');
      
      return summary;
    } else {
      const completedSteps = stepResults.filter(s => s.success);
      const failedStep = stepResults.find(s => !s.success);

      let summary = '';
      
      if (completedSteps.length > 0) {
        summary += `I completed ${completedSteps.length} step(s):\n\n` +
          completedSteps.map(step => 
            `${step.stepNumber}. ${step.response}`
          ).join('\n\n');
        
        summary += '\n\n';
      }

      summary += `However, step ${failedStepNumber} failed: ${failedStep?.result.error || 'Unknown error'}`;

      return summary;
    }
  }

  /**
   * Generate suggestions for multi-step execution
   */
  private generateMultiStepSuggestions(
    stepResults: StepResult[],
    allSuccessful: boolean
  ): string[] {
    if (allSuccessful) {
      return [
        'View network summary',
        'Run a simulation',
        'Check for alerts',
      ];
    } else {
      const failedStep = stepResults.find(s => !s.success);
      if (failedStep?.result.suggestions) {
        return failedStep.result.suggestions;
      }
      return ['Try again', 'Ask for help'];
    }
  }

  /**
   * Generate error summary for multi-step execution
   */
  private generateMultiStepErrorSummary(
    stepResults: StepResult[],
    error: Error
  ): string {
    if (stepResults.length === 0) {
      return `I encountered an error before starting: ${error.message}`;
    }

    const completedSteps = stepResults.filter(s => s.success);
    
    let summary = '';
    
    if (completedSteps.length > 0) {
      summary += `I completed ${completedSteps.length} step(s) before encountering an error:\n\n` +
        completedSteps.map(step => 
          `${step.stepNumber}. ${step.response}`
        ).join('\n\n');
      
      summary += '\n\n';
    }

    summary += `Error: ${error.message}`;

    return summary;
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    request: CopilotRequest
  ): Promise<any> {
    if (request.conversationId) {
      const existing = await this.conversationService.getConversation(
        request.conversationId
      );
      if (existing) {
        return existing;
      }
    }

    if (request.connectionId) {
      const existing = await this.conversationService.getConversationByConnectionId(
        request.connectionId
      );
      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    return await this.conversationService.createConversation(
      request.userId,
      request.connectionId || `conn_${Date.now()}`,
      request.supplyChainContext || {}
    );
  }

  /**
   * Validate request
   */
  private validateRequest(request: CopilotRequest): void {
    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (request.message.length > 2000) {
      throw new Error('Message is too long (max 2000 characters)');
    }
  }

  /**
   * Create error response
   * 
   * Property 9: Error handling graceful degradation
   */
  private createErrorResponse(
    error: Error,
    conversationId: string,
    executionTime: number
  ): CopilotResponse {
    // Determine error type and create user-friendly message
    let userMessage: string;
    let suggestions: string[] = [];

    if (error.message.includes('required')) {
      userMessage = 'I need some additional information to help you with that.';
      suggestions = ['Try providing more details', 'Ask for help'];
    } else if (error.message.includes('not found')) {
      userMessage = 'I couldn\'t find what you\'re looking for. Could you be more specific?';
      suggestions = ['Try rephrasing', 'Ask for help'];
    } else if (error.message.includes('timeout')) {
      userMessage = 'That request took too long. Please try again.';
      suggestions = ['Try again', 'Simplify your request'];
    } else {
      userMessage = 'I encountered an unexpected error. Please try again or rephrase your request.';
      suggestions = ['Try again', 'Ask for help'];
    }

    return {
      success: false,
      content: userMessage,
      conversationId,
      metadata: {
        executionTime,
        actionSuccess: false,
      },
      suggestions,
      error: error.message,
    };
  }
}

/**
 * Create copilot orchestrator instance
 */
export function createCopilotOrchestrator(
  bedrockService: BedrockService,
  intentClassifier: IntentClassifier,
  actionRegistry: ActionRegistry,
  conversationService: ConversationService,
  contextResolver: ContextResolver,
  options?: OrchestratorOptions
): CopilotOrchestrator {
  return new CopilotOrchestrator(
    bedrockService,
    intentClassifier,
    actionRegistry,
    conversationService,
    contextResolver,
    options
  );
}
