import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';
import { BedrockService } from './bedrock-service';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONVERSATIONS_TABLE = process.env.CONVERSATIONS_TABLE || 'omnitrack-conversations';
const MAX_CONTEXT_TOKENS = 8000;
const SUMMARIZATION_THRESHOLD = 10; // messages

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SupplyChainContext {
  nodes?: any[];
  edges?: any[];
  configuration?: any;
  recentActions?: any[];
  activeSimulations?: any[];
}

export interface Conversation {
  id: string;
  userId: string;
  connectionId: string;
  messages: Message[];
  context: SupplyChainContext;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
  };
  summary?: string;
}

export class ConversationService {
  private bedrockService: BedrockService;

  constructor(bedrockService?: BedrockService) {
    // Use provided service or create default one
    if (bedrockService) {
      this.bedrockService = bedrockService;
    } else {
      const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
      this.bedrockService = new BedrockService({ modelId, region });
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    connectionId: string,
    context: SupplyChainContext = {}
  ): Promise<Conversation> {
    const conversationId = `conv_${userId}_${Date.now()}`;
    const now = new Date();

    const conversation: Conversation = {
      id: conversationId,
      userId,
      connectionId,
      messages: [],
      context,
      createdAt: now,
      updatedAt: now,
      metadata: {
        totalMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
      },
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: CONVERSATIONS_TABLE,
          Item: {
            ...conversation,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          },
        })
      );

      logger.info('Conversation created', {
        conversationId,
        userId,
        connectionId,
      });

      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', 
        error instanceof Error ? error : new Error(String(error)),
        { conversationId, userId }
      );
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
        })
      );

      if (!result.Item) {
        return null;
      }

      return {
        ...result.Item,
        createdAt: new Date(result.Item.createdAt),
        updatedAt: new Date(result.Item.updatedAt),
        messages: result.Item.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      } as Conversation;
    } catch (error) {
      logger.error('Failed to get conversation',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Get conversation by connection ID
   */
  async getConversationByConnectionId(
    connectionId: string
  ): Promise<Conversation | null> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: CONVERSATIONS_TABLE,
          IndexName: 'ConnectionIdIndex',
          KeyConditionExpression: 'connectionId = :connectionId',
          ExpressionAttributeValues: {
            ':connectionId': connectionId,
          },
          Limit: 1,
          ScanIndexForward: false, // Get most recent
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0];
      return {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        messages: item.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      } as Conversation;
    } catch (error) {
      logger.error('Failed to get conversation by connection',
        error instanceof Error ? error : new Error(String(error)),
        { connectionId }
      );
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    const fullMessage: Message = {
      id: messageId,
      ...message,
      timestamp,
    };

    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Check if summarization is needed
      // Re-summarize every 10 messages to keep context fresh
      const shouldSummarize =
        conversation.messages.length >= SUMMARIZATION_THRESHOLD &&
        conversation.messages.length % SUMMARIZATION_THRESHOLD === 0;

      let summary = conversation.summary;
      if (shouldSummarize) {
        logger.info('Triggering conversation summarization', {
          conversationId,
          messageCount: conversation.messages.length,
        });
        summary = await this.summarizeConversation(conversation.messages);
      }

      // Update conversation with new message
      await docClient.send(
        new UpdateCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
          UpdateExpression:
            'SET messages = list_append(messages, :message), updatedAt = :updatedAt, metadata.totalMessages = metadata.totalMessages + :one' +
            (summary ? ', summary = :summary' : ''),
          ExpressionAttributeValues: {
            ':message': [
              {
                ...fullMessage,
                timestamp: timestamp.toISOString(),
              },
            ],
            ':updatedAt': timestamp.toISOString(),
            ':one': 1,
            ...(summary ? { ':summary': summary } : {}),
          },
        })
      );

      logger.info('Message added to conversation', {
        conversationId,
        messageId,
        role: message.role,
        summarized: shouldSummarize,
      });

      return fullMessage;
    } catch (error) {
      logger.error('Failed to add message',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Get conversation history with context
   */
  async getConversationHistory(
    conversationId: string,
    limit?: number
  ): Promise<Message[]> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        return [];
      }

      const messages = conversation.messages;

      // If limit specified, return most recent messages
      if (limit && messages.length > limit) {
        return messages.slice(-limit);
      }

      return messages;
    } catch (error) {
      logger.error('Failed to get conversation history',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Summarize conversation for context management
   * 
   * Requirement 4.4: When a conversation exceeds 10 messages, summarize older messages
   * to maintain context while keeping recent messages verbatim
   */
  async summarizeConversation(messages: Message[]): Promise<string> {
    try {
      // Keep last 5 messages verbatim, summarize the rest
      const RECENT_MESSAGE_COUNT = 5;
      const messagesToSummarize = messages.slice(0, -RECENT_MESSAGE_COUNT);

      if (messagesToSummarize.length === 0) {
        logger.info('No messages to summarize', {
          totalMessages: messages.length,
        });
        return '';
      }

      // Use BedrockService to summarize
      const bedrockMessages = messagesToSummarize.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const summary = await this.bedrockService.summarizeHistory(bedrockMessages);

      logger.info('Conversation summarized', {
        totalMessages: messages.length,
        summarizedMessages: messagesToSummarize.length,
        recentMessages: RECENT_MESSAGE_COUNT,
        summaryLength: summary.length,
        estimatedTokensSaved: this.estimateTokenCount(messagesToSummarize) - this.estimateTokenCount([{ 
          id: 'summary', 
          role: 'assistant', 
          content: summary, 
          timestamp: new Date() 
        }]),
      });

      return summary;
    } catch (error) {
      logger.error('Failed to summarize conversation',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return empty string on error to not block conversation
      return '';
    }
  }

  /**
   * Get conversation context for intent classification
   * 
   * Returns summary of old messages + recent messages verbatim
   * This keeps context size manageable while preserving important information
   */
  async getConversationContext(conversationId: string): Promise<{
    recentMessages: Message[];
    summary?: string;
    supplyChainContext: SupplyChainContext;
  }> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        return {
          recentMessages: [],
          supplyChainContext: {},
        };
      }

      // Get recent messages (last 5)
      const recentMessages = conversation.messages.slice(-5);

      // Check if context size is within limits
      const contextTokens = this.estimateTokenCount(recentMessages) + 
        (conversation.summary ? this.estimateTokenCount([{
          id: 'summary',
          role: 'assistant',
          content: conversation.summary,
          timestamp: new Date()
        }]) : 0);

      logger.info('Retrieved conversation context', {
        conversationId,
        totalMessages: conversation.messages.length,
        recentMessages: recentMessages.length,
        hasSummary: !!conversation.summary,
        estimatedTokens: contextTokens,
        withinLimit: contextTokens <= MAX_CONTEXT_TOKENS,
      });

      return {
        recentMessages,
        summary: conversation.summary,
        supplyChainContext: conversation.context,
      };
    } catch (error) {
      logger.error('Failed to get conversation context',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      return {
        recentMessages: [],
        supplyChainContext: {},
      };
    }
  }

  /**
   * Update supply chain context
   */
  async updateSupplyChainContext(
    conversationId: string,
    context: Partial<SupplyChainContext>
  ): Promise<void> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
          UpdateExpression: 'SET #context = :context, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#context': 'context',
          },
          ExpressionAttributeValues: {
            ':context': context,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );

      logger.info('Supply chain context updated', { conversationId });
    } catch (error) {
      logger.error('Failed to update supply chain context',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Update conversation metadata
   */
  async updateMetadata(
    conversationId: string,
    metadata: Partial<Conversation['metadata']>
  ): Promise<void> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': new Date().toISOString(),
      };

      if (metadata.totalTokens !== undefined) {
        updateExpressions.push('metadata.totalTokens = :totalTokens');
        expressionAttributeValues[':totalTokens'] = metadata.totalTokens;
      }

      if (metadata.averageResponseTime !== undefined) {
        updateExpressions.push(
          'metadata.averageResponseTime = :averageResponseTime'
        );
        expressionAttributeValues[':averageResponseTime'] =
          metadata.averageResponseTime;
      }

      if (updateExpressions.length === 0) {
        return;
      }

      await docClient.send(
        new UpdateCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
          UpdateExpression:
            'SET ' + updateExpressions.join(', ') + ', updatedAt = :updatedAt',
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );

      logger.info('Conversation metadata updated', { conversationId });
    } catch (error) {
      logger.error('Failed to update metadata',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Clear conversation (start new session)
   */
  async clearConversation(conversationId: string): Promise<void> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
          UpdateExpression:
            'SET messages = :empty, summary = :null, updatedAt = :updatedAt, metadata.totalMessages = :zero',
          ExpressionAttributeValues: {
            ':empty': [],
            ':null': null,
            ':updatedAt': new Date().toISOString(),
            ':zero': 0,
          },
        })
      );

      logger.info('Conversation cleared', { conversationId });
    } catch (error) {
      logger.error('Failed to clear conversation',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Estimate token count for context management
   */
  estimateTokenCount(messages: Message[]): number {
    // Rough estimation: ~4 characters per token
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }

  /**
   * Check if context size is within limits
   */
  isContextSizeValid(messages: Message[]): boolean {
    const tokenCount = this.estimateTokenCount(messages);
    return tokenCount <= MAX_CONTEXT_TOKENS;
  }

  /**
   * Manually trigger conversation summarization
   * Useful for forcing summarization before context size becomes an issue
   */
  async triggerSummarization(conversationId: string): Promise<string> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      if (conversation.messages.length < SUMMARIZATION_THRESHOLD) {
        logger.info('Conversation too short to summarize', {
          conversationId,
          messageCount: conversation.messages.length,
          threshold: SUMMARIZATION_THRESHOLD,
        });
        return '';
      }

      const summary = await this.summarizeConversation(conversation.messages);

      // Update conversation with summary
      await docClient.send(
        new UpdateCommand({
          TableName: CONVERSATIONS_TABLE,
          Key: { id: conversationId },
          UpdateExpression: 'SET summary = :summary, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':summary': summary,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );

      logger.info('Manual summarization completed', {
        conversationId,
        summaryLength: summary.length,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to trigger summarization',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }

  /**
   * Get context size information for monitoring
   */
  async getContextSizeInfo(conversationId: string): Promise<{
    totalMessages: number;
    recentMessages: number;
    hasSummary: boolean;
    estimatedTokens: number;
    withinLimit: boolean;
    maxTokens: number;
  }> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        return {
          totalMessages: 0,
          recentMessages: 0,
          hasSummary: false,
          estimatedTokens: 0,
          withinLimit: true,
          maxTokens: MAX_CONTEXT_TOKENS,
        };
      }

      const recentMessages = conversation.messages.slice(-5);
      const recentTokens = this.estimateTokenCount(recentMessages);
      const summaryTokens = conversation.summary
        ? this.estimateTokenCount([{
            id: 'summary',
            role: 'assistant',
            content: conversation.summary,
            timestamp: new Date(),
          }])
        : 0;

      const totalTokens = recentTokens + summaryTokens;

      return {
        totalMessages: conversation.messages.length,
        recentMessages: recentMessages.length,
        hasSummary: !!conversation.summary,
        estimatedTokens: totalTokens,
        withinLimit: totalTokens <= MAX_CONTEXT_TOKENS,
        maxTokens: MAX_CONTEXT_TOKENS,
      };
    } catch (error) {
      logger.error('Failed to get context size info',
        error instanceof Error ? error : new Error(String(error)),
        { conversationId }
      );
      throw error;
    }
  }
}
