/**
 * Request Queue for Rate-Limited Copilot Requests
 * 
 * Queues excess requests when rate limits are exceeded and processes
 * them in the background when capacity becomes available.
 * 
 * Requirements: 9.4 - Queue and process rate-limited requests
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const QUEUE_TABLE = process.env.QUEUE_TABLE_NAME || 'omnitrack-copilot-queue';

/**
 * Queued request data
 */
export interface QueuedRequest {
  id: string;
  userId: string;
  connectionId: string;
  conversationId?: string;
  message: string;
  timestamp: number;
  queuedAt: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  position?: number;
  estimatedProcessTime?: number;
  error?: string;
  retryCount: number;
  ttl: number;
}

/**
 * Queue position info
 */
export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // seconds
}

/**
 * Request Queue Service
 * 
 * Manages queuing and processing of rate-limited copilot requests.
 */
export class RequestQueue {
  /**
   * Add request to queue
   * 
   * Requirements: 9.4 - Queue excess requests
   * 
   * @param userId - User identifier
   * @param connectionId - WebSocket connection ID
   * @param message - User message
   * @param conversationId - Optional conversation ID
   * @returns Queued request with position info
   */
  async enqueueRequest(
    userId: string,
    connectionId: string,
    message: string,
    conversationId?: string
  ): Promise<{ request: QueuedRequest; position: QueuePosition }> {
    try {
      const now = Date.now();
      const requestId = `req_${userId}_${now}_${Math.random().toString(36).substring(2, 9)}`;
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        userId,
        connectionId,
        conversationId,
        message,
        timestamp: now,
        queuedAt: now,
        status: 'queued',
        retryCount: 0,
        ttl: Math.floor(now / 1000) + 3600, // 1 hour TTL
      };
      
      // Store in DynamoDB for tracking and processing
      await docClient.send(
        new PutCommand({
          TableName: QUEUE_TABLE,
          Item: queuedRequest,
        })
      );
      
      // Note: In production, you would also send to SQS for background processing
      // For now, we rely on DynamoDB TTL and periodic polling
      
      // Get queue position
      const position = await this.getQueuePosition(userId);
      
      logger.info('Request queued', {
        requestId,
        userId,
        position: position.position,
        totalInQueue: position.totalInQueue,
      });
      
      return {
        request: queuedRequest,
        position,
      };
    } catch (error) {
      logger.error('Failed to enqueue request', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get queue position for user
   * 
   * Requirements: 9.4 - Notify user of queue position
   * 
   * @param userId - User identifier
   * @returns Queue position info
   */
  async getQueuePosition(userId: string): Promise<QueuePosition> {
    try {
      // Query all queued requests for this user
      const result = await docClient.send(
        new QueryCommand({
          TableName: QUEUE_TABLE,
          IndexName: 'UserIdStatusIndex',
          KeyConditionExpression: 'userId = :userId AND #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':status': 'queued',
          },
        })
      );
      
      const userRequests = result.Items || [];
      
      // Query total queued requests (simplified - in production use a counter)
      const totalResult = await docClient.send(
        new QueryCommand({
          TableName: QUEUE_TABLE,
          IndexName: 'StatusIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'queued',
          },
          Select: 'COUNT',
        })
      );
      
      const totalInQueue = totalResult.Count || 0;
      
      // Estimate position (simplified - assumes FIFO)
      const position = userRequests.length > 0 ? Math.max(1, totalInQueue - userRequests.length + 1) : 0;
      
      // Estimate wait time (assume ~2 seconds per request)
      const estimatedWaitTime = position * 2;
      
      return {
        position,
        totalInQueue,
        estimatedWaitTime,
      };
    } catch (error) {
      logger.error('Failed to get queue position', error as Error, { userId });
      
      // Return default on error
      return {
        position: 0,
        totalInQueue: 0,
        estimatedWaitTime: 0,
      };
    }
  }

  /**
   * Process queued request
   * 
   * Requirements: 9.4 - Process queue in background
   * 
   * This would typically be called by a separate Lambda function
   * that polls the SQS queue.
   * 
   * @param requestId - Request identifier
   * @returns Processed request
   */
  async processQueuedRequest(requestId: string): Promise<QueuedRequest | null> {
    try {
      // Get request from DynamoDB
      const result = await docClient.send(
        new QueryCommand({
          TableName: QUEUE_TABLE,
          KeyConditionExpression: 'id = :id',
          ExpressionAttributeValues: {
            ':id': requestId,
          },
        })
      );
      
      if (!result.Items || result.Items.length === 0) {
        logger.warning('Queued request not found', { requestId });
        return null;
      }
      
      const request = result.Items[0] as QueuedRequest;
      
      // Update status to processing
      await docClient.send(
        new UpdateCommand({
          TableName: QUEUE_TABLE,
          Key: { id: requestId },
          UpdateExpression: 'SET #status = :processing, estimatedProcessTime = :now',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':processing': 'processing',
            ':now': Date.now(),
          },
        })
      );
      
      logger.info('Processing queued request', {
        requestId,
        userId: request.userId,
        queuedAt: request.queuedAt,
        waitTime: Date.now() - request.queuedAt,
      });
      
      return request;
    } catch (error) {
      logger.error('Failed to process queued request', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Mark request as completed
   * 
   * @param requestId - Request identifier
   */
  async completeRequest(requestId: string): Promise<void> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: QUEUE_TABLE,
          Key: { id: requestId },
          UpdateExpression: 'SET #status = :completed',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':completed': 'completed',
          },
        })
      );
      
      logger.info('Request completed', { requestId });
    } catch (error) {
      logger.error('Failed to complete request', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Mark request as failed
   * 
   * @param requestId - Request identifier
   * @param error - Error message
   */
  async failRequest(requestId: string, error: string): Promise<void> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: QUEUE_TABLE,
          Key: { id: requestId },
          UpdateExpression: 'SET #status = :failed, #error = :error, retryCount = retryCount + :one',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#error': 'error',
          },
          ExpressionAttributeValues: {
            ':failed': 'failed',
            ':error': error,
            ':one': 1,
          },
        })
      );
      
      logger.warning('Request failed', { requestId, error });
    } catch (err) {
      logger.error('Failed to mark request as failed', err as Error, { requestId });
      throw err;
    }
  }

  /**
   * Get user's queued requests
   * 
   * @param userId - User identifier
   * @returns List of queued requests
   */
  async getUserQueuedRequests(userId: string): Promise<QueuedRequest[]> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: QUEUE_TABLE,
          IndexName: 'UserIdStatusIndex',
          KeyConditionExpression: 'userId = :userId AND #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':status': 'queued',
          },
        })
      );
      
      return (result.Items || []) as QueuedRequest[];
    } catch (error) {
      logger.error('Failed to get user queued requests', error as Error, { userId });
      return [];
    }
  }

  /**
   * Cancel queued request
   * 
   * @param requestId - Request identifier
   * @param userId - User identifier (for verification)
   */
  async cancelRequest(requestId: string, userId: string): Promise<boolean> {
    try {
      // Verify request belongs to user
      const result = await docClient.send(
        new QueryCommand({
          TableName: QUEUE_TABLE,
          KeyConditionExpression: 'id = :id',
          ExpressionAttributeValues: {
            ':id': requestId,
          },
        })
      );
      
      if (!result.Items || result.Items.length === 0) {
        return false;
      }
      
      const request = result.Items[0] as QueuedRequest;
      
      if (request.userId !== userId) {
        logger.warning('User attempted to cancel another user\'s request', {
          requestId,
          userId,
          requestUserId: request.userId,
        });
        return false;
      }
      
      if (request.status !== 'queued') {
        logger.warning('Cannot cancel request that is not queued', {
          requestId,
          status: request.status,
        });
        return false;
      }
      
      // Delete from DynamoDB
      await docClient.send(
        new DeleteCommand({
          TableName: QUEUE_TABLE,
          Key: { id: requestId },
        })
      );
      
      logger.info('Request cancelled', { requestId, userId });
      
      return true;
    } catch (error) {
      logger.error('Failed to cancel request', error as Error, { requestId, userId });
      return false;
    }
  }

  /**
   * Clean up old completed/failed requests
   * 
   * This should be called periodically (e.g., via CloudWatch Events)
   */
  async cleanupOldRequests(): Promise<number> {
    try {
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
      
      // Query old completed/failed requests
      const statuses = ['completed', 'failed'];
      let deletedCount = 0;
      
      for (const status of statuses) {
        const result = await docClient.send(
          new QueryCommand({
            TableName: QUEUE_TABLE,
            IndexName: 'StatusIndex',
            KeyConditionExpression: '#status = :status',
            FilterExpression: 'queuedAt < :cutoff',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': status,
              ':cutoff': cutoff,
            },
          })
        );
        
        const items = result.Items || [];
        
        // Delete old items
        for (const item of items) {
          await docClient.send(
            new DeleteCommand({
              TableName: QUEUE_TABLE,
              Key: { id: item.id },
            })
          );
          deletedCount++;
        }
      }
      
      logger.info('Cleaned up old requests', { deletedCount });
      
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old requests', error as Error);
      return 0;
    }
  }
}

/**
 * Create request queue instance
 */
export function createRequestQueue(): RequestQueue {
  return new RequestQueue();
}

/**
 * Default request queue instance
 */
export const requestQueue = new RequestQueue();
