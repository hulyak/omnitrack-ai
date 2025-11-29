/**
 * Queue Processor for Rate-Limited Copilot Requests
 * 
 * Background Lambda function that processes queued copilot requests
 * when rate limits allow.
 * 
 * Requirements: 9.4 - Process queue in background
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ApiGatewayManagementApi, PostToConnectionCommand, GoneException } from '@aws-sdk/client-apigatewaymanagementapi';
import { logger } from '../utils/logger';
import { requestQueue, QueuedRequest } from './request-queue';
import { rateLimiter } from './rate-limiter';
import { getConversationService, getActionRegistry, getIntentClassifier } from './websocket-handler';
import { createBedrockService } from './bedrock-service';
import { analyticsService, AnalyticsEventType } from './analytics-service';

const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT || '';

/**
 * Process queued copilot requests from SQS
 * 
 * This Lambda is triggered by SQS messages containing queued requests.
 * It checks if the user's rate limits allow processing, and if so,
 * processes the request and sends the response back via WebSocket.
 * 
 * Requirements: 9.4 - Process queue in background
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  logger.info('Processing queued requests', {
    recordCount: event.Records.length,
  });

  for (const record of event.Records) {
    await processRecord(record);
  }
};

/**
 * Process a single SQS record
 */
async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const queuedRequest: QueuedRequest = JSON.parse(record.body);
    
    logger.info('Processing queued request', {
      requestId: queuedRequest.id,
      userId: queuedRequest.userId,
      queuedAt: queuedRequest.queuedAt,
      waitTime: Date.now() - queuedRequest.queuedAt,
    });

    // Mark as processing
    await requestQueue.processQueuedRequest(queuedRequest.id);

    // Check if rate limits now allow processing
    const messageRateLimit = await rateLimiter.checkMessageRateLimit(queuedRequest.userId);
    const tokenRateLimit = await rateLimiter.checkTokenRateLimit(queuedRequest.userId, 1000);

    if (!messageRateLimit.allowed || !tokenRateLimit.allowed) {
      // Still rate limited - requeue for later
      logger.info('Request still rate limited, will retry', {
        requestId: queuedRequest.id,
        userId: queuedRequest.userId,
        messageAllowed: messageRateLimit.allowed,
        tokenAllowed: tokenRateLimit.allowed,
      });

      // Don't mark as failed - let SQS retry
      return;
    }

    // Process the request
    await processRequest(queuedRequest);

    // Mark as completed
    await requestQueue.completeRequest(queuedRequest.id);

    logger.info('Queued request processed successfully', {
      requestId: queuedRequest.id,
      userId: queuedRequest.userId,
      totalTime: Date.now() - queuedRequest.queuedAt,
    });
  } catch (error) {
    logger.error('Failed to process queued request', error as Error, {
      messageId: record.messageId,
    });

    // Try to parse request ID for failure tracking
    try {
      const queuedRequest: QueuedRequest = JSON.parse(record.body);
      await requestQueue.failRequest(
        queuedRequest.id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (parseError) {
      logger.error('Failed to parse queued request for failure tracking', parseError as Error);
    }

    // Throw to let SQS handle retry
    throw error;
  }
}

/**
 * Process a queued request
 */
async function processRequest(queuedRequest: QueuedRequest): Promise<void> {
  const { userId, connectionId, message, conversationId } = queuedRequest;
  const startTime = Date.now();

  try {
    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApi({
      endpoint: WEBSOCKET_API_ENDPOINT,
    });

    // Helper to send messages to client
    const sendToClient = async (data: any) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(data),
          })
        );
      } catch (error) {
        if (error instanceof GoneException) {
          logger.warning('Connection gone while processing queued request', {
            connectionId,
            requestId: queuedRequest.id,
          });
          throw new Error('Connection closed');
        }
        throw error;
      }
    };

    // Notify client that processing has started
    await sendToClient({
      type: 'queue_processing_started',
      requestId: queuedRequest.id,
      message: 'Your queued request is now being processed.',
      timestamp: Date.now(),
    });

    // Get conversation service
    const convService = getConversationService();
    let conversation = conversationId
      ? await convService.getConversation(conversationId)
      : await convService.getConversationByConnectionId(connectionId);

    if (!conversation) {
      conversation = await convService.createConversation(userId, connectionId);
    }

    const finalConversationId = conversation.id;

    // Add user message to conversation
    await convService.addMessage(finalConversationId, {
      role: 'user',
      content: message,
    });

    // Get conversation history
    const history = await convService.getConversationHistory(finalConversationId, 5);

    // Classify intent
    const classifier = getIntentClassifier();
    const bedrockMessages = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
    }));
    
    const classification = await classifier.classify(message, bedrockMessages);

    // Handle clarification if needed
    if (classification.requiresClarification && classification.clarificationQuestion) {
      await sendToClient({
        type: 'message',
        content: classification.clarificationQuestion,
        conversationId: finalConversationId,
        timestamp: Date.now(),
        metadata: {
          intent: classification.intent,
          confidence: classification.confidence,
          requiresClarification: true,
        },
      });

      await convService.addMessage(finalConversationId, {
        role: 'assistant',
        content: classification.clarificationQuestion,
      });

      return;
    }

    // Execute action
    const registry = getActionRegistry();
    const action = registry.getByName(classification.intent);
    
    if (!action) {
      throw new Error(`Action not found: ${classification.intent}`);
    }
    
    const actionResult = await action.execute(
      classification.parameters,
      {
        userId,
        nodes: conversation.context.nodes || [],
        edges: conversation.context.edges || [],
        configuration: conversation.context.configuration || {},
        recentActions: conversation.context.recentActions || [],
        activeSimulations: conversation.context.activeSimulations || [],
      }
    );

    // Track analytics
    await analyticsService.trackCommandExecution(
      userId,
      classification.intent,
      actionResult.success,
      Date.now() - startTime,
      finalConversationId
    );

    // Generate response
    const bedrockService = createBedrockService();
    const bedrockHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
    }));
    
    const responseContent = await bedrockService.generateResponse(actionResult, {
      messages: bedrockHistory,
      userId,
    });

    // Send response to client
    await sendToClient({
      type: 'message',
      content: responseContent,
      conversationId: finalConversationId,
      timestamp: Date.now(),
      metadata: {
        intent: classification.intent,
        confidence: classification.confidence,
        actionSuccess: actionResult.success,
        fromQueue: true,
      },
    });

    // Add assistant message to conversation
    await convService.addMessage(finalConversationId, {
      role: 'assistant',
      content: responseContent,
    });

    // Send suggestions if available
    if (actionResult.suggestions && actionResult.suggestions.length > 0) {
      await sendToClient({
        type: 'suggestions',
        suggestions: actionResult.suggestions,
        conversationId: finalConversationId,
        timestamp: Date.now(),
      });
    }

    // Send completion signal
    await sendToClient({
      type: 'complete',
      conversationId: finalConversationId,
      fromQueue: true,
      timestamp: Date.now(),
    });

    // Record token usage
    const estimatedTokens = Math.ceil((message.length + responseContent.length) / 4);
    await rateLimiter.recordTokenUsage(userId, estimatedTokens);

    logger.info('Queued request processed', {
      requestId: queuedRequest.id,
      userId,
      conversationId: finalConversationId,
      processingTime: Date.now() - startTime,
      tokensUsed: estimatedTokens,
    });
  } catch (error) {
    logger.error('Failed to process queued request', error as Error, {
      requestId: queuedRequest.id,
      userId,
    });

    // Try to send error to client
    try {
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: WEBSOCKET_API_ENDPOINT,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process queued request',
            requestId: queuedRequest.id,
            timestamp: Date.now(),
          }),
        })
      );
    } catch (sendError) {
      logger.error('Failed to send error to client', sendError as Error, {
        connectionId,
        requestId: queuedRequest.id,
      });
    }

    throw error;
  }
}
