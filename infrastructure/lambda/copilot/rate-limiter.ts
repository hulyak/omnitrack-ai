/**
 * Rate Limiter for AI Copilot
 * 
 * Implements rate limiting for copilot messages and Bedrock token usage
 * to prevent abuse and manage costs.
 * 
 * Requirements: 9.4 - Rate limiting and usage management
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE_NAME || 'omnitrack-copilot-rate-limits';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  messagesPerMinute: number;
  tokensPerDay: number;
  burstAllowance: number; // Allow short bursts above the limit
}

/**
 * Default rate limits
 */
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  messagesPerMinute: 20, // 20 messages per minute
  tokensPerDay: 100000, // 100k tokens per day
  burstAllowance: 5, // Allow 5 extra messages in burst
};

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  reason?: string;
  messagesRemaining: number;
  tokensRemaining: number;
  resetAt: number;
  retryAfter?: number; // Seconds until user can retry
}

/**
 * User rate limit data
 */
interface UserRateLimitData {
  userId: string;
  
  // Message rate limiting
  messageCount: number;
  messageWindowStart: number;
  lastMessageTime: number;
  
  // Token rate limiting
  tokenCount: number;
  tokenWindowStart: number; // Start of current day
  
  // Metadata
  updatedAt: number;
  ttl: number;
}

/**
 * Rate Limiter Service
 * 
 * Tracks and enforces rate limits for copilot usage.
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_RATE_LIMITS) {
    this.config = config;
    
    logger.info('RateLimiter initialized', {
      messagesPerMinute: config.messagesPerMinute,
      tokensPerDay: config.tokensPerDay,
      burstAllowance: config.burstAllowance,
    });
  }

  /**
   * Check if user can send a message
   * 
   * Requirements: 9.4 - Limit messages per user per minute
   * 
   * @param userId - User identifier
   * @returns Rate limit status
   */
  async checkMessageRateLimit(userId: string): Promise<RateLimitStatus> {
    try {
      const now = Date.now();
      const windowDuration = 60 * 1000; // 1 minute in milliseconds
      
      // Get current rate limit data
      const data = await this.getUserRateLimitData(userId);
      
      // Check if we need to reset the message window
      const windowAge = now - data.messageWindowStart;
      if (windowAge >= windowDuration) {
        // Reset window
        data.messageCount = 0;
        data.messageWindowStart = now;
      }
      
      // Calculate remaining messages
      const messagesRemaining = Math.max(
        0,
        this.config.messagesPerMinute + this.config.burstAllowance - data.messageCount
      );
      
      // Check if limit exceeded
      if (data.messageCount >= this.config.messagesPerMinute + this.config.burstAllowance) {
        const resetAt = data.messageWindowStart + windowDuration;
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        
        logger.warning('Message rate limit exceeded', {
          userId,
          messageCount: data.messageCount,
          limit: this.config.messagesPerMinute,
          retryAfter,
        });
        
        return {
          allowed: false,
          reason: `Message rate limit exceeded. You can send ${this.config.messagesPerMinute} messages per minute.`,
          messagesRemaining: 0,
          tokensRemaining: this.config.tokensPerDay - data.tokenCount,
          resetAt,
          retryAfter,
        };
      }
      
      // Increment message count
      data.messageCount++;
      data.lastMessageTime = now;
      data.updatedAt = now;
      
      // Save updated data
      await this.saveUserRateLimitData(data);
      
      logger.debug('Message rate limit check passed', {
        userId,
        messageCount: data.messageCount,
        messagesRemaining: messagesRemaining - 1,
      });
      
      return {
        allowed: true,
        messagesRemaining: messagesRemaining - 1,
        tokensRemaining: this.config.tokensPerDay - data.tokenCount,
        resetAt: data.messageWindowStart + windowDuration,
      };
    } catch (error) {
      logger.error('Failed to check message rate limit', error as Error, { userId });
      
      // Fail open - allow the request on error
      return {
        allowed: true,
        messagesRemaining: -1,
        tokensRemaining: -1,
        resetAt: Date.now() + 60000,
      };
    }
  }

  /**
   * Check if user has enough token quota
   * 
   * Requirements: 9.4 - Limit Bedrock tokens per user per day
   * 
   * @param userId - User identifier
   * @param estimatedTokens - Estimated tokens for this request
   * @returns Rate limit status
   */
  async checkTokenRateLimit(userId: string, estimatedTokens: number = 1000): Promise<RateLimitStatus> {
    try {
      const now = Date.now();
      const dayStart = this.getDayStart(now);
      
      // Get current rate limit data
      const data = await this.getUserRateLimitData(userId);
      
      // Check if we need to reset the token window (new day)
      if (data.tokenWindowStart < dayStart) {
        // Reset token count for new day
        data.tokenCount = 0;
        data.tokenWindowStart = dayStart;
      }
      
      // Calculate remaining tokens
      const tokensRemaining = Math.max(0, this.config.tokensPerDay - data.tokenCount);
      
      // Check if adding estimated tokens would exceed limit
      if (data.tokenCount + estimatedTokens > this.config.tokensPerDay) {
        const resetAt = this.getDayStart(now + 24 * 60 * 60 * 1000); // Next day
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        
        logger.warning('Token rate limit exceeded', {
          userId,
          tokenCount: data.tokenCount,
          estimatedTokens,
          limit: this.config.tokensPerDay,
          retryAfter,
        });
        
        return {
          allowed: false,
          reason: `Daily token limit exceeded. You have used ${data.tokenCount} of ${this.config.tokensPerDay} tokens today.`,
          messagesRemaining: this.config.messagesPerMinute - data.messageCount,
          tokensRemaining: 0,
          resetAt,
          retryAfter,
        };
      }
      
      logger.debug('Token rate limit check passed', {
        userId,
        tokenCount: data.tokenCount,
        estimatedTokens,
        tokensRemaining: tokensRemaining - estimatedTokens,
      });
      
      return {
        allowed: true,
        messagesRemaining: this.config.messagesPerMinute - data.messageCount,
        tokensRemaining: tokensRemaining - estimatedTokens,
        resetAt: this.getDayStart(now + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Failed to check token rate limit', error as Error, { userId });
      
      // Fail open - allow the request on error
      return {
        allowed: true,
        messagesRemaining: -1,
        tokensRemaining: -1,
        resetAt: Date.now() + 24 * 60 * 60 * 1000,
      };
    }
  }

  /**
   * Record actual token usage after request completes
   * 
   * Requirements: 9.4 - Track Bedrock token usage
   * 
   * @param userId - User identifier
   * @param tokensUsed - Actual tokens used
   */
  async recordTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    try {
      const now = Date.now();
      const dayStart = this.getDayStart(now);
      
      // Get current rate limit data
      const data = await this.getUserRateLimitData(userId);
      
      // Check if we need to reset the token window (new day)
      if (data.tokenWindowStart < dayStart) {
        data.tokenCount = 0;
        data.tokenWindowStart = dayStart;
      }
      
      // Add tokens used
      data.tokenCount += tokensUsed;
      data.updatedAt = now;
      
      // Save updated data
      await this.saveUserRateLimitData(data);
      
      logger.debug('Token usage recorded', {
        userId,
        tokensUsed,
        totalTokens: data.tokenCount,
      });
    } catch (error) {
      logger.error('Failed to record token usage', error as Error, { userId, tokensUsed });
      // Don't throw - token tracking failure shouldn't break the flow
    }
  }

  /**
   * Get user rate limit data from DynamoDB
   */
  private async getUserRateLimitData(userId: string): Promise<UserRateLimitData> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: RATE_LIMIT_TABLE,
          Key: { userId },
        })
      );
      
      if (result.Item) {
        return result.Item as UserRateLimitData;
      }
      
      // Return default data for new user
      const now = Date.now();
      return {
        userId,
        messageCount: 0,
        messageWindowStart: now,
        lastMessageTime: 0,
        tokenCount: 0,
        tokenWindowStart: this.getDayStart(now),
        updatedAt: now,
        ttl: Math.floor(now / 1000) + 7 * 24 * 60 * 60, // 7 days
      };
    } catch (error) {
      logger.error('Failed to get user rate limit data', error as Error, { userId });
      
      // Return default data on error
      const now = Date.now();
      return {
        userId,
        messageCount: 0,
        messageWindowStart: now,
        lastMessageTime: 0,
        tokenCount: 0,
        tokenWindowStart: this.getDayStart(now),
        updatedAt: now,
        ttl: Math.floor(now / 1000) + 7 * 24 * 60 * 60,
      };
    }
  }

  /**
   * Save user rate limit data to DynamoDB
   */
  private async saveUserRateLimitData(data: UserRateLimitData): Promise<void> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: RATE_LIMIT_TABLE,
          Item: data,
        })
      );
    } catch (error) {
      logger.error('Failed to save user rate limit data', error as Error, { userId: data.userId });
      throw error;
    }
  }

  /**
   * Get start of current day (midnight UTC)
   */
  private getDayStart(timestamp: number): number {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const data: UserRateLimitData = {
        userId,
        messageCount: 0,
        messageWindowStart: now,
        lastMessageTime: 0,
        tokenCount: 0,
        tokenWindowStart: this.getDayStart(now),
        updatedAt: now,
        ttl: Math.floor(now / 1000) + 7 * 24 * 60 * 60,
      };
      
      await this.saveUserRateLimitData(data);
      
      logger.info('User rate limits reset', { userId });
    } catch (error) {
      logger.error('Failed to reset user limits', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get current rate limit status for a user
   */
  async getUserStatus(userId: string): Promise<{
    messageCount: number;
    messagesRemaining: number;
    tokenCount: number;
    tokensRemaining: number;
    messageResetAt: number;
    tokenResetAt: number;
  }> {
    try {
      const now = Date.now();
      const data = await this.getUserRateLimitData(userId);
      
      // Check if message window needs reset
      const messageWindowAge = now - data.messageWindowStart;
      const messageWindowDuration = 60 * 1000;
      let messageCount = data.messageCount;
      let messageWindowStart = data.messageWindowStart;
      
      if (messageWindowAge >= messageWindowDuration) {
        messageCount = 0;
        messageWindowStart = now;
      }
      
      // Check if token window needs reset
      const dayStart = this.getDayStart(now);
      let tokenCount = data.tokenCount;
      let tokenWindowStart = data.tokenWindowStart;
      
      if (tokenWindowStart < dayStart) {
        tokenCount = 0;
        tokenWindowStart = dayStart;
      }
      
      return {
        messageCount,
        messagesRemaining: Math.max(0, this.config.messagesPerMinute - messageCount),
        tokenCount,
        tokensRemaining: Math.max(0, this.config.tokensPerDay - tokenCount),
        messageResetAt: messageWindowStart + messageWindowDuration,
        tokenResetAt: this.getDayStart(now + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Failed to get user status', error as Error, { userId });
      throw error;
    }
  }
}

/**
 * Create rate limiter instance
 */
export function createRateLimiter(config?: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Default rate limiter instance
 */
export const rateLimiter = new RateLimiter();
