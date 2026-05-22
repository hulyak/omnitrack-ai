/**
 * Bedrock Service for AI Copilot
 * 
 * Integrates with Amazon Bedrock (Claude 3.5 Sonnet) for:
 * - Intent classification
 * - Response generation
 * - Streaming responses
 * 
 * Requirements: 1.2, 1.5, 2.1
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '../utils/logger';

/**
 * Retry configuration for Bedrock API calls
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export interface IntentClassification {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresClarification: boolean;
  clarificationQuestion?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ConversationContext {
  messages: Message[];
  supplyChainState?: any;
  userId: string;
}

export interface BedrockConfig {
  modelId: string;
  region: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export class BedrockService {
  private client: BedrockRuntimeClient;
  private config: BedrockConfig;
  private retryConfig: RetryConfig;

  constructor(config: BedrockConfig, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = {
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      ...config,
    };

    this.retryConfig = retryConfig;

    this.client = new BedrockRuntimeClient({
      region: this.config.region,
      maxAttempts: 1, // We handle retries manually for better control
    });

    logger.info('BedrockService initialized', {
      modelId: this.config.modelId,
      region: this.config.region,
      maxRetries: this.retryConfig.maxRetries,
    });
  }

  /**
   * Classify user intent from message
   * 
   * Property 1: Intent classification accuracy
   * For any valid user message, should return a valid intent with confidence > 0.5
   * 
   * @param message - User's message
   * @param history - Conversation history for context
   * @returns Intent classification with parameters
   */
  async classifyIntent(
    message: string,
    history: Message[] = []
  ): Promise<IntentClassification> {
    const startTime = Date.now();

    try {
      const prompt = this.buildIntentClassificationPrompt(message, history);

      const response = await this.invokeModel(prompt, {
        maxTokens: 500,
        temperature: 0.3, // Lower temperature for more deterministic classification
      });

      const classification = this.parseIntentClassification(response);

      const executionTime = Date.now() - startTime;
      const tokenCount = this.countTokens(prompt) + this.countTokens(response);
      
      logger.info('Intent classified', {
        intent: classification.intent,
        confidence: classification.confidence,
        executionTime,
        tokenCount,
      });

      // Log metrics
      logger.metric('BedrockIntentClassificationTime', executionTime, 'Milliseconds');
      logger.metric('BedrockIntentClassificationTokens', tokenCount, 'Count');

      return classification;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Intent classification failed', err, { message });
      throw new Error(`Failed to classify intent: ${err.message}`);
    }
  }

  /**
   * Generate natural language response from action result
   * 
   * Property 2: Response generation completeness
   * For any action result, should produce a non-empty natural language response
   * 
   * @param actionResult - Result from action execution
   * @param context - Conversation context
   * @returns Natural language response
   */
  async generateResponse(
    actionResult: any,
    context: ConversationContext
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const prompt = this.buildResponseGenerationPrompt(actionResult, context);

      const response = await this.invokeModel(prompt, {
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const executionTime = Date.now() - startTime;
      const tokenCount = this.countTokens(prompt) + this.countTokens(response);
      
      logger.info('Response generated', {
        responseLength: response.length,
        executionTime,
        tokenCount,
      });

      // Log metrics
      logger.metric('BedrockResponseGenerationTime', executionTime, 'Milliseconds');
      logger.metric('BedrockResponseGenerationTokens', tokenCount, 'Count');

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Response generation failed', err);
      throw new Error(`Failed to generate response: ${err.message}`);
    }
  }

  /**
   * Stream response generation
   * 
   * Property 8: Streaming response continuity
   * For any streamed response, tokens should arrive in order without gaps
   * 
   * @param prompt - Prompt for generation
   * @yields Response tokens as they're generated
   */
  async *streamResponse(prompt: string): AsyncGenerator<string> {
    try {
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: this.config.topP,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      let tokenCount = 0;

      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(
            new TextDecoder().decode(event.chunk.bytes)
          );

          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta?.text || '';
            if (text) {
              tokenCount++;
              yield text;
            }
          } else if (chunk.type === 'message_stop') {
            logger.info('Streaming complete', { tokenCount });
            break;
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error?.message || 'Streaming error');
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Streaming failed', err);
      throw new Error(`Failed to stream response: ${err.message}`);
    }
  }

  /**
   * Invoke Bedrock model with prompt
   * 
   * @param prompt - Prompt text
   * @param options - Model invocation options
   * @returns Generated text
   */
  private async invokeModel(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    return this.withRetry(async () => {
      const command = new InvokeModelCommand({
        modelId: this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: options.maxTokens || this.config.maxTokens,
          temperature: options.temperature || this.config.temperature,
          top_p: options.topP || this.config.topP,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      if (responseBody.content && responseBody.content.length > 0) {
        return responseBody.content[0].text;
      }

      throw new Error('Invalid response format from Bedrock');
    }, 'invokeModel');
  }

  /**
   * Build prompt for intent classification
   */
  private buildIntentClassificationPrompt(
    message: string,
    history: Message[]
  ): string {
    const contextMessages = history
      .slice(-5) // Last 5 messages for context
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    return `You are an AI assistant for a supply chain management system. Your job is to classify the user's intent and extract parameters.

Available intents:
- add-supplier: Add a supplier node
- add-manufacturer: Add a manufacturer node
- add-warehouse: Add a warehouse node
- add-distributor: Add a distributor node
- add-retailer: Add a retailer node
- remove-node: Remove a node
- connect-nodes: Connect two nodes
- disconnect-nodes: Disconnect two nodes
- update-node: Update node properties
- optimize-layout: Optimize network layout
- set-region: Set primary region
- set-industry: Set industry
- set-currency: Set currency
- add-shipping-method: Add shipping method
- set-risk-profile: Set risk profile
- scan-anomalies: Scan for anomalies
- identify-risks: Identify risks
- find-bottlenecks: Find bottlenecks
- run-simulation: Run simulation
- what-if-port-closure: Simulate port closure
- what-if-supplier-failure: Simulate supplier failure
- what-if-demand-spike: Simulate demand spike
- get-node-details: Get node details
- get-network-summary: Get network summary
- get-recent-alerts: Get recent alerts
- help: Show help

${contextMessages ? `Conversation history:\n${contextMessages}\n` : ''}
User message: ${message}

Respond with a JSON object containing:
{
  "intent": "the classified intent",
  "confidence": 0.0-1.0,
  "parameters": { extracted parameters },
  "requiresClarification": true/false,
  "clarificationQuestion": "optional question if clarification needed"
}

Only respond with the JSON object, no other text.`;
  }

  /**
   * Parse intent classification from Bedrock response
   */
  private parseIntentClassification(response: string): IntentClassification {
    try {
      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.5,
        parameters: parsed.parameters || {},
        requiresClarification: parsed.requiresClarification || false,
        clarificationQuestion: parsed.clarificationQuestion,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to parse intent classification', err, { response });
      
      // Fallback to unknown intent
      return {
        intent: 'unknown',
        confidence: 0.3,
        parameters: {},
        requiresClarification: true,
        clarificationQuestion: "I'm not sure what you want to do. Could you rephrase that?",
      };
    }
  }

  /**
   * Build prompt for response generation
   */
  private buildResponseGenerationPrompt(
    actionResult: any,
    context: ConversationContext
  ): string {
    const recentMessages = context.messages
      .slice(-3)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    return `You are an AI assistant for a supply chain management system. Generate a natural, helpful response based on the action result.

Recent conversation:
${recentMessages}

Action result:
${JSON.stringify(actionResult, null, 2)}

Generate a natural language response that:
1. Confirms what was done
2. Explains the result
3. Provides relevant insights
4. Suggests next steps if appropriate

Keep the response concise (2-3 sentences) and friendly. Use supply chain terminology appropriately.`;
  }

  /**
   * Count tokens in text (approximate)
   */
  countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Summarize conversation history to reduce token count
   */
  async summarizeHistory(messages: Message[]): Promise<string> {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize this conversation in 2-3 sentences, preserving key context:

${conversationText}

Summary:`;

    return await this.invokeModel(prompt, {
      maxTokens: 200,
      temperature: 0.5,
    });
  }

  /**
   * Execute function with exponential backoff retry
   * 
   * Requirements: 7.4 - Error handling with retries
   * 
   * @param fn - Function to execute
   * @param operationName - Name for logging
   * @returns Result from function
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.withTimeout(fn(), 30000); // 30 second timeout
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(`Non-retryable error in ${operationName}`, err, { attempt });
          throw error;
        }

        // Last attempt, throw error
        if (attempt === this.retryConfig.maxRetries) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(`All retries exhausted for ${operationName}`, err, {
            attempts: attempt + 1,
          });
          break;
        }

        // Log retry attempt
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warning(`Retrying ${operationName}`, {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          delayMs: delay,
          errorMessage: err.message,
        });

        // Wait before retrying
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    throw lastError || new Error(`${operationName} failed after retries`);
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.name || '';

    // Don't retry validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorCode === 'ValidationException'
    ) {
      return true;
    }

    // Don't retry access denied errors
    if (
      errorMessage.includes('access denied') ||
      errorMessage.includes('unauthorized') ||
      errorCode === 'AccessDeniedException'
    ) {
      return true;
    }

    // Don't retry model not found errors
    if (
      errorMessage.includes('model not found') ||
      errorCode === 'ResourceNotFoundException'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Add timeout to promise
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create Bedrock service instance from environment variables
 */
export function createBedrockService(): BedrockService {
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

  return new BedrockService({
    modelId,
    region,
  });
}
