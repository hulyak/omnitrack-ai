/**
 * Intent Classifier for AI Copilot
 * 
 * Classifies user intents from natural language messages and extracts parameters.
 * Uses Amazon Bedrock (Claude 3.5 Sonnet) for intent classification.
 * 
 * Requirements: 1.2, 1.3
 */

import { BedrockService, IntentClassification, Message } from './bedrock-service';
import { actionRegistry } from './action-registry';
import { logger } from '../utils/logger';

/**
 * Intent classification options
 */
export interface ClassificationOptions {
  includeHistory?: boolean;
  minConfidence?: number;
  maxHistoryMessages?: number;
}

/**
 * Intent Classifier class
 * 
 * Provides intent classification with confidence scoring and parameter extraction.
 * Integrates with action registry to ensure classified intents map to available actions.
 */
export class IntentClassifier {
  private bedrockService: BedrockService;
  private minConfidence: number;

  constructor(bedrockService: BedrockService, minConfidence: number = 0.5) {
    this.bedrockService = bedrockService;
    this.minConfidence = minConfidence;
    
    logger.info('IntentClassifier initialized', { minConfidence });
  }

  /**
   * Classify user intent from message
   * 
   * Property 1: Intent classification accuracy
   * For any valid user message, should return a valid intent with confidence > 0.5
   * 
   * @param message - User's message
   * @param history - Conversation history for context
   * @param options - Classification options
   * @returns Intent classification with parameters
   */
  async classify(
    message: string,
    history: Message[] = [],
    options: ClassificationOptions = {}
  ): Promise<IntentClassification> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!message || message.trim().length === 0) {
        return this.createLowConfidenceResult(
          'unknown',
          'Please provide a message to classify.',
          0.0
        );
      }

      // Build prompt with available actions
      const prompt = this.buildClassificationPrompt(message, history, options);

      // Get classification from Bedrock
      const rawResponse = await this.invokeClassification(prompt);

      // Parse and validate classification
      const classification = this.parseAndValidate(rawResponse, message);

      // Check confidence threshold
      if (classification.confidence < this.minConfidence) {
        logger.info('Low confidence classification', {
          intent: classification.intent,
          confidence: classification.confidence,
          threshold: this.minConfidence
        });

        return {
          ...classification,
          requiresClarification: true,
          clarificationQuestion: classification.clarificationQuestion || 
            this.generateClarificationQuestion(message, classification)
        };
      }

      const executionTime = Date.now() - startTime;
      logger.info('Intent classified successfully', {
        intent: classification.intent,
        confidence: classification.confidence,
        executionTime,
        parametersExtracted: Object.keys(classification.parameters).length
      });

      return classification;
    } catch (error) {
      logger.error('Intent classification failed', error as Error, { message });
      
      return this.createLowConfidenceResult(
        'unknown',
        'I encountered an error processing your request. Could you try rephrasing?',
        0.0
      );
    }
  }

  /**
   * Build classification prompt with available actions
   */
  private buildClassificationPrompt(
    message: string,
    history: Message[],
    options: ClassificationOptions
  ): string {
    const maxHistory = options.maxHistoryMessages || 5;
    const includeHistory = options.includeHistory !== false;

    // Get all available actions from registry
    const actions = actionRegistry.getAllActions();
    
    // Build action descriptions
    const actionDescriptions = actions.map(action => {
      const params = action.parameters
        .filter(p => p.required)
        .map(p => p.name)
        .join(', ');
      
      const examples = action.examples.slice(0, 2).join('; ');
      
      return `- ${action.name}: ${action.description}${params ? ` (requires: ${params})` : ''}${examples ? `\n  Examples: ${examples}` : ''}`;
    }).join('\n');

    // Build conversation context
    let contextSection = '';
    if (includeHistory && history.length > 0) {
      const recentHistory = history.slice(-maxHistory);
      const contextMessages = recentHistory
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
      
      contextSection = `\nConversation history:\n${contextMessages}\n`;
    }

    return `You are an AI assistant for a supply chain management system. Your job is to classify the user's intent and extract parameters.

Available actions:
${actionDescriptions}

${contextSection}
User message: ${message}

Analyze the user's message and respond with a JSON object containing:
{
  "intent": "the classified intent (must be one of the action names above)",
  "confidence": 0.0-1.0 (how confident you are in this classification),
  "parameters": { extracted parameters as key-value pairs },
  "requiresClarification": true/false (whether you need more information),
  "clarificationQuestion": "optional question if clarification needed"
}

Guidelines:
- Match the intent to one of the available action names
- Extract all relevant parameters from the message
- Set confidence based on how clear the intent is
- Request clarification if the message is ambiguous or missing required parameters
- Use context from conversation history to resolve pronouns and references

Only respond with the JSON object, no other text.`;
  }

  /**
   * Invoke Bedrock for classification
   */
  private async invokeClassification(prompt: string): Promise<string> {
    // Use lower temperature for more deterministic classification
    const messages: Message[] = [{ role: 'user', content: prompt }];
    
    // Reuse BedrockService's classifyIntent method
    const result = await this.bedrockService.classifyIntent(prompt, []);
    
    // Return as JSON string for parsing
    return JSON.stringify(result);
  }

  /**
   * Parse and validate classification result
   */
  private parseAndValidate(
    response: string,
    originalMessage: string
  ): IntentClassification {
    try {
      // Parse JSON response
      const parsed = JSON.parse(response);

      // Validate intent exists in registry
      const intent = parsed.intent || 'unknown';
      const action = actionRegistry.getByName(intent);

      if (!action && intent !== 'unknown') {
        logger.warning('Classified intent not found in registry', { intent });
        
        // Try to find similar action
        const similarAction = this.findSimilarAction(intent);
        if (similarAction) {
          logger.info('Found similar action', { 
            originalIntent: intent, 
            similarAction: similarAction.name 
          });
          
          return {
            intent: similarAction.name,
            confidence: Math.max(0.3, (parsed.confidence || 0.5) - 0.2),
            parameters: parsed.parameters || {},
            requiresClarification: true,
            clarificationQuestion: `Did you mean to ${similarAction.description.toLowerCase()}?`
          };
        }

        return this.createLowConfidenceResult(
          'unknown',
          `I'm not sure how to help with that. Try asking for "help" to see what I can do.`,
          0.3
        );
      }

      // Validate confidence is in valid range
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

      // Validate parameters if action exists
      let parameters = parsed.parameters || {};
      if (action) {
        const validation = action.validate(parameters);
        if (!validation.valid) {
          logger.info('Parameter validation failed', {
            intent,
            errors: validation.errors
          });

          return {
            intent,
            confidence: confidence * 0.8, // Reduce confidence
            parameters,
            requiresClarification: true,
            clarificationQuestion: this.generateParameterQuestion(action, validation.errors)
          };
        }
      }

      return {
        intent,
        confidence,
        parameters,
        requiresClarification: parsed.requiresClarification || false,
        clarificationQuestion: parsed.clarificationQuestion
      };
    } catch (error) {
      logger.error('Failed to parse classification response', error as Error, { response });
      
      return this.createLowConfidenceResult(
        'unknown',
        'I had trouble understanding that. Could you rephrase your request?',
        0.2
      );
    }
  }

  /**
   * Find similar action by name matching
   */
  private findSimilarAction(intent: string): any {
    const actions = actionRegistry.getAllActions();
    const normalizedIntent = intent.toLowerCase().replace(/[-_]/g, '');

    // Try exact substring match
    for (const action of actions) {
      const normalizedName = action.name.toLowerCase().replace(/[-_]/g, '');
      if (normalizedName.includes(normalizedIntent) || normalizedIntent.includes(normalizedName)) {
        return action;
      }
    }

    // Try word-based matching
    const intentWords = normalizedIntent.split(/\s+/);
    for (const action of actions) {
      const nameWords = action.name.toLowerCase().replace(/[-_]/g, ' ').split(/\s+/);
      const matchCount = intentWords.filter(word => nameWords.includes(word)).length;
      if (matchCount > 0) {
        return action;
      }
    }

    return null;
  }

  /**
   * Generate clarification question for ambiguous intent
   */
  private generateClarificationQuestion(
    message: string,
    classification: IntentClassification
  ): string {
    if (classification.intent === 'unknown') {
      return "I'm not sure what you want to do. Could you be more specific? You can ask for 'help' to see available commands.";
    }

    const action = actionRegistry.getByName(classification.intent);
    if (!action) {
      return "I'm not sure I understand. Could you rephrase that?";
    }

    // Check for missing required parameters
    const missingParams = action.parameters
      .filter(p => p.required && !classification.parameters[p.name])
      .map(p => p.name);

    if (missingParams.length > 0) {
      return `To ${action.description.toLowerCase()}, I need to know: ${missingParams.join(', ')}. Could you provide that information?`;
    }

    return `Did you want to ${action.description.toLowerCase()}?`;
  }

  /**
   * Generate question about missing/invalid parameters
   */
  private generateParameterQuestion(action: any, errors: string[]): string {
    if (errors.length === 0) {
      return `To ${action.description.toLowerCase()}, what additional information do you need to provide?`;
    }

    const errorSummary = errors.slice(0, 2).join('; ');
    return `I need some clarification: ${errorSummary}`;
  }

  /**
   * Create low confidence result
   */
  private createLowConfidenceResult(
    intent: string,
    question: string,
    confidence: number
  ): IntentClassification {
    return {
      intent,
      confidence,
      parameters: {},
      requiresClarification: true,
      clarificationQuestion: question
    };
  }

  /**
   * Get confidence threshold
   */
  getMinConfidence(): number {
    return this.minConfidence;
  }

  /**
   * Set confidence threshold
   */
  setMinConfidence(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.minConfidence = threshold;
    logger.info('Confidence threshold updated', { threshold });
  }
}

/**
 * Create intent classifier instance
 */
export function createIntentClassifier(
  bedrockService: BedrockService,
  minConfidence?: number
): IntentClassifier {
  return new IntentClassifier(bedrockService, minConfidence);
}
