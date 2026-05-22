/**
 * Clarification Handler for AI Copilot
 * 
 * Handles ambiguous intents, generates clarifying questions,
 * and manages follow-up responses in conversations.
 * 
 * Requirements: 5.2
 */

import { IntentClassification, Message } from './bedrock-service';
import { actionRegistry, Action } from './action-registry';
import { logger } from '../utils/logger';

/**
 * Clarification context stored for follow-up
 */
export interface ClarificationContext {
  originalMessage: string;
  possibleIntents: string[];
  missingParameters: string[];
  timestamp: number;
  attemptCount: number;
}

/**
 * Clarification state for a conversation
 */
export interface ClarificationState {
  pending: boolean;
  context?: ClarificationContext;
  lastQuestion?: string;
}

/**
 * Clarification Handler class
 * 
 * Manages the clarification flow when user intents are ambiguous
 * or when required parameters are missing.
 */
export class ClarificationHandler {
  private clarificationStates: Map<string, ClarificationState>;
  private maxAttempts: number;
  private contextTimeoutMs: number;

  constructor(maxAttempts: number = 3, contextTimeoutMs: number = 300000) {
    this.clarificationStates = new Map();
    this.maxAttempts = maxAttempts;
    this.contextTimeoutMs = contextTimeoutMs; // 5 minutes default
    
    logger.info('ClarificationHandler initialized', { 
      maxAttempts, 
      contextTimeoutMs 
    });
  }

  /**
   * Detect if intent requires clarification
   * 
   * @param classification - Intent classification result
   * @returns True if clarification is needed
   */
  requiresClarification(classification: IntentClassification): boolean {
    // Explicit clarification flag
    if (classification.requiresClarification) {
      return true;
    }

    // Low confidence
    if (classification.confidence < 0.6) {
      return true;
    }

    // Unknown intent
    if (classification.intent === 'unknown') {
      return true;
    }

    // Check for missing required parameters
    const action = actionRegistry.getByName(classification.intent);
    if (action) {
      const missingParams = this.getMissingRequiredParameters(
        action,
        classification.parameters
      );
      if (missingParams.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate clarifying question
   * 
   * @param classification - Intent classification result
   * @param userId - User ID for context tracking
   * @param originalMessage - Original user message
   * @returns Clarifying question
   */
  generateClarificationQuestion(
    classification: IntentClassification,
    userId: string,
    originalMessage: string
  ): string {
    // Use provided clarification question if available
    if (classification.clarificationQuestion) {
      this.storeClarificationContext(userId, {
        originalMessage,
        possibleIntents: [classification.intent],
        missingParameters: [],
        timestamp: Date.now(),
        attemptCount: this.getAttemptCount(userId) + 1
      });

      logger.info('Using provided clarification question', {
        userId,
        intent: classification.intent
      });

      return classification.clarificationQuestion;
    }

    // Generate question based on classification
    const question = this.generateQuestion(classification, originalMessage);

    // Store context for follow-up
    this.storeClarificationContext(userId, {
      originalMessage,
      possibleIntents: [classification.intent],
      missingParameters: this.getMissingParameterNames(classification),
      timestamp: Date.now(),
      attemptCount: this.getAttemptCount(userId) + 1
    });

    logger.info('Generated clarification question', {
      userId,
      intent: classification.intent,
      attemptCount: this.getAttemptCount(userId)
    });

    return question;
  }

  /**
   * Handle follow-up response to clarification
   * 
   * @param userId - User ID
   * @param response - User's follow-up response
   * @param originalClassification - Original classification that needed clarification
   * @returns Updated classification or null if still unclear
   */
  handleFollowUp(
    userId: string,
    response: string,
    originalClassification: IntentClassification
  ): IntentClassification | null {
    const state = this.clarificationStates.get(userId);

    if (!state || !state.pending || !state.context) {
      logger.warning('No pending clarification for user', { userId });
      return null;
    }

    // Check if context has expired
    if (Date.now() - state.context.timestamp > this.contextTimeoutMs) {
      logger.info('Clarification context expired', { userId });
      this.clearClarification(userId);
      return null;
    }

    // Check if max attempts reached
    if (state.context.attemptCount >= this.maxAttempts) {
      logger.info('Max clarification attempts reached', { 
        userId, 
        attempts: state.context.attemptCount 
      });
      this.clearClarification(userId);
      return {
        intent: 'help',
        confidence: 0.8,
        parameters: {},
        requiresClarification: false,
        clarificationQuestion: undefined
      };
    }

    // Try to extract information from follow-up
    const updatedClassification = this.extractFromFollowUp(
      response,
      originalClassification,
      state.context
    );

    // Check if we have enough information now
    if (!this.requiresClarification(updatedClassification)) {
      logger.info('Clarification resolved', {
        userId,
        intent: updatedClassification.intent,
        attempts: state.context.attemptCount
      });
      this.clearClarification(userId);
      return updatedClassification;
    }

    // Still need more information
    logger.info('Still requires clarification', {
      userId,
      intent: updatedClassification.intent,
      attempts: state.context.attemptCount
    });

    return updatedClassification;
  }

  /**
   * Check if user has pending clarification
   * 
   * @param userId - User ID
   * @returns True if clarification is pending
   */
  hasPendingClarification(userId: string): boolean {
    const state = this.clarificationStates.get(userId);
    return state?.pending || false;
  }

  /**
   * Get pending clarification context
   * 
   * @param userId - User ID
   * @returns Clarification context if pending
   */
  getClarificationContext(userId: string): ClarificationContext | undefined {
    const state = this.clarificationStates.get(userId);
    return state?.context;
  }

  /**
   * Clear clarification state for user
   * 
   * @param userId - User ID
   */
  clearClarification(userId: string): void {
    this.clarificationStates.delete(userId);
    logger.debug('Clarification cleared', { userId });
  }

  /**
   * Generate question based on classification
   */
  private generateQuestion(
    classification: IntentClassification,
    originalMessage: string
  ): string {
    // Unknown intent
    if (classification.intent === 'unknown') {
      return this.generateUnknownIntentQuestion(originalMessage);
    }

    // Low confidence
    if (classification.confidence < 0.6) {
      return this.generateLowConfidenceQuestion(classification);
    }

    // Missing parameters
    const action = actionRegistry.getByName(classification.intent);
    if (action) {
      const missingParams = this.getMissingRequiredParameters(
        action,
        classification.parameters
      );
      if (missingParams.length > 0) {
        return this.generateMissingParametersQuestion(action, missingParams);
      }
    }

    // Generic clarification
    return "Could you provide more details about what you'd like to do?";
  }

  /**
   * Generate question for unknown intent
   */
  private generateUnknownIntentQuestion(message: string): string {
    const suggestions = this.getSuggestedActions(message);

    if (suggestions.length > 0) {
      const suggestionList = suggestions
        .slice(0, 3)
        .map(a => `"${a.description}"`)
        .join(', ');
      
      return `I'm not sure what you want to do. Did you mean to: ${suggestionList}? Or type "help" to see all available commands.`;
    }

    return "I'm not sure what you want to do. Could you rephrase that, or type 'help' to see what I can do?";
  }

  /**
   * Generate question for low confidence classification
   */
  private generateLowConfidenceQuestion(
    classification: IntentClassification
  ): string {
    const action = actionRegistry.getByName(classification.intent);
    
    if (action) {
      return `Did you want to ${action.description.toLowerCase()}? If not, please clarify what you'd like to do.`;
    }

    return "I'm not entirely sure what you want to do. Could you be more specific?";
  }

  /**
   * Generate question for missing parameters
   */
  private generateMissingParametersQuestion(
    action: Action,
    missingParams: string[]
  ): string {
    const paramDescriptions = missingParams
      .map(name => {
        const param = action.parameters.find(p => p.name === name);
        return param ? `${param.name} (${param.description})` : name;
      })
      .join(', ');

    if (missingParams.length === 1) {
      return `To ${action.description.toLowerCase()}, I need to know the ${paramDescriptions}. What would you like it to be?`;
    }

    return `To ${action.description.toLowerCase()}, I need the following information: ${paramDescriptions}. Could you provide these details?`;
  }

  /**
   * Get suggested actions based on message
   */
  private getSuggestedActions(message: string): Action[] {
    const allActions = actionRegistry.getAllActions();
    const normalizedMessage = message.toLowerCase();

    // Find actions with keywords in message
    return allActions
      .filter(action => {
        const keywords = [
          action.name,
          ...action.description.toLowerCase().split(/\s+/),
          ...action.examples.join(' ').toLowerCase().split(/\s+/)
        ];

        return keywords.some(keyword => 
          normalizedMessage.includes(keyword.toLowerCase())
        );
      })
      .slice(0, 3);
  }

  /**
   * Get missing required parameters
   */
  private getMissingRequiredParameters(
    action: Action,
    providedParams: Record<string, any>
  ): string[] {
    return action.parameters
      .filter(p => p.required && !(p.name in providedParams))
      .map(p => p.name);
  }

  /**
   * Get missing parameter names from classification
   */
  private getMissingParameterNames(
    classification: IntentClassification
  ): string[] {
    const action = actionRegistry.getByName(classification.intent);
    if (!action) {
      return [];
    }

    return this.getMissingRequiredParameters(action, classification.parameters);
  }

  /**
   * Extract information from follow-up response
   */
  private extractFromFollowUp(
    response: string,
    originalClassification: IntentClassification,
    context: ClarificationContext
  ): IntentClassification {
    // Check if user is confirming the intent
    const isConfirmation = this.isConfirmation(response);
    const isRejection = this.isRejection(response);

    if (isRejection) {
      // User rejected the suggestion, treat as unknown
      return {
        intent: 'unknown',
        confidence: 0.3,
        parameters: {},
        requiresClarification: true,
        clarificationQuestion: "What would you like to do instead?"
      };
    }

    if (isConfirmation) {
      // User confirmed, increase confidence
      return {
        ...originalClassification,
        confidence: Math.min(1.0, originalClassification.confidence + 0.3),
        requiresClarification: context.missingParameters.length > 0
      };
    }

    // Try to extract missing parameters from response
    const updatedParams = { ...originalClassification.parameters };
    let extractedAny = false;

    for (const paramName of context.missingParameters) {
      const action = actionRegistry.getByName(originalClassification.intent);
      if (action) {
        const param = action.parameters.find(p => p.name === paramName);
        if (param) {
          const value = this.extractParameterValue(response, param.type);
          if (value !== null) {
            updatedParams[paramName] = value;
            extractedAny = true;
          }
        }
      }
    }

    return {
      ...originalClassification,
      parameters: updatedParams,
      confidence: extractedAny 
        ? Math.min(1.0, originalClassification.confidence + 0.2)
        : originalClassification.confidence
    };
  }

  /**
   * Check if response is a confirmation
   */
  private isConfirmation(response: string): boolean {
    const confirmations = ['yes', 'yeah', 'yep', 'sure', 'correct', 'right', 'exactly', 'ok', 'okay'];
    const normalized = response.toLowerCase().trim();
    return confirmations.some(c => normalized === c || normalized.startsWith(c + ' '));
  }

  /**
   * Check if response is a rejection
   */
  private isRejection(response: string): boolean {
    const rejections = ['no', 'nope', 'not', 'wrong', 'incorrect'];
    const normalized = response.toLowerCase().trim();
    return rejections.some(r => normalized === r || normalized.startsWith(r + ' '));
  }

  /**
   * Extract parameter value from response
   */
  private extractParameterValue(response: string, type: string): any {
    const normalized = response.trim();

    switch (type) {
      case 'string':
        return normalized;
      
      case 'number':
        const num = parseFloat(normalized);
        return isNaN(num) ? null : num;
      
      case 'boolean':
        if (this.isConfirmation(normalized)) return true;
        if (this.isRejection(normalized)) return false;
        return null;
      
      default:
        return normalized;
    }
  }

  /**
   * Store clarification context
   */
  private storeClarificationContext(
    userId: string,
    context: ClarificationContext
  ): void {
    this.clarificationStates.set(userId, {
      pending: true,
      context,
      lastQuestion: undefined
    });
  }

  /**
   * Get attempt count for user
   */
  private getAttemptCount(userId: string): number {
    const state = this.clarificationStates.get(userId);
    return state?.context?.attemptCount || 0;
  }

  /**
   * Clean up expired clarification contexts
   */
  cleanupExpiredContexts(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, state] of this.clarificationStates.entries()) {
      if (state.context && now - state.context.timestamp > this.contextTimeoutMs) {
        this.clarificationStates.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up expired clarification contexts', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Get statistics about clarification states
   */
  getStats(): {
    totalPending: number;
    averageAttempts: number;
    oldestContextAge: number;
  } {
    const pending = Array.from(this.clarificationStates.values())
      .filter(s => s.pending && s.context);

    const totalPending = pending.length;
    const averageAttempts = totalPending > 0
      ? pending.reduce((sum, s) => sum + (s.context?.attemptCount || 0), 0) / totalPending
      : 0;
    
    const now = Date.now();
    const oldestContextAge = totalPending > 0
      ? Math.max(...pending.map(s => now - (s.context?.timestamp || now)))
      : 0;

    return {
      totalPending,
      averageAttempts,
      oldestContextAge
    };
  }
}

/**
 * Create clarification handler instance
 */
export function createClarificationHandler(
  maxAttempts?: number,
  contextTimeoutMs?: number
): ClarificationHandler {
  return new ClarificationHandler(maxAttempts, contextTimeoutMs);
}
