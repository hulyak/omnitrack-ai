import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { 
  ApiGatewayManagementApi, 
  PostToConnectionCommand,
  GoneException
} from '@aws-sdk/client-apigatewaymanagementapi';
import { logger } from '../utils/logger';
import { createCopilotLogger, CopilotLogger } from './copilot-logger';
import { ConversationService } from './conversation-service';
import { createBedrockService } from './bedrock-service';
import { ActionRegistry } from './action-registry';
import { IntentClassifier } from './intent-classifier';
import { registerAllActions } from './actions';
import { analyticsService, AnalyticsEventType } from './analytics-service';
import { rateLimiter } from './rate-limiter';
import { requestQueue } from './request-queue';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE_NAME || 'omnitrack-connections';
const CONVERSATIONS_TABLE = process.env.CONVERSATIONS_TABLE_NAME || 'omnitrack-conversations';

// Initialize services (reused across invocations)
let conversationService: ConversationService | null = null;
let actionRegistry: ActionRegistry | null = null;
let intentClassifier: IntentClassifier | null = null;

export function getConversationService(): ConversationService {
  if (!conversationService) {
    const bedrockService = createBedrockService();
    conversationService = new ConversationService(bedrockService);
  }
  return conversationService;
}

export function getActionRegistry(): ActionRegistry {
  if (!actionRegistry) {
    actionRegistry = new ActionRegistry();
    // Register all actions
    try {
      registerAllActions();
    } catch (error) {
      logger.warning('Failed to register all actions', { error: error instanceof Error ? error.message : String(error) });
    }
  }
  return actionRegistry;
}

export function getIntentClassifier(): IntentClassifier {
  if (!intentClassifier) {
    const bedrockService = createBedrockService();
    intentClassifier = new IntentClassifier(bedrockService);
  }
  return intentClassifier;
}

/**
 * WebSocket Connect Handler
 * Handles new WebSocket connections and stores connection info
 * 
 * Requirements: 2.1 - WebSocket connection management
 */
export const connectHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const copilotLogger = createCopilotLogger(event);

  try {
    // Extract user info from query parameters
    const queryParams = event.queryStringParameters || {};
    const userId = queryParams.userId || 'anonymous';
    
    copilotLogger.setUserId(userId);
    
    // TODO: Validate JWT token from Cognito in production
    // const token = queryParams.token;
    // await validateToken(token);

    // Store connection in DynamoDB
    const ttl = Math.floor(Date.now() / 1000) + 7200; // 2 hour TTL
    await docClient.send(
      new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: {
          connectionId,
          userId,
          connectedAt: Date.now(),
          ttl,
        },
      })
    );

    // Create initial conversation for this connection
    const convService = getConversationService();
    await convService.createConversation(userId, connectionId);

    // Log connection event
    copilotLogger.logConnection(connectionId, userId, 'connect');

    // Track analytics event
    await analyticsService.trackEvent({
      eventType: AnalyticsEventType.WEBSOCKET_CONNECTED,
      userId,
      connectionId,
      timestamp: Date.now(),
      metadata: {},
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to establish WebSocket connection',
      error instanceof Error ? error : new Error('Unknown error'),
      { connectionId }
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' }),
    };
  }
};

/**
 * WebSocket Disconnect Handler
 * Handles WebSocket disconnections and cleans up connection info
 * 
 * Requirements: 2.1 - WebSocket connection management
 */
export const disconnectHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const copilotLogger = createCopilotLogger(event);

  try {
    // Get connection info before deleting
    const connectionResult = await docClient.send(
      new GetCommand({
        TableName: CONNECTIONS_TABLE,
        Key: {
          connectionId,
        },
      })
    );

    const userId = connectionResult.Item?.userId || 'unknown';

    // Remove connection from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: {
          connectionId,
        },
      })
    );

    // Log disconnection event
    copilotLogger.logConnection(connectionId, userId, 'disconnect');

    // Track analytics event
    await analyticsService.trackEvent({
      eventType: AnalyticsEventType.WEBSOCKET_DISCONNECTED,
      userId,
      connectionId,
      timestamp: Date.now(),
      metadata: {},
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to handle WebSocket disconnection',
      error instanceof Error ? error : new Error('Unknown error'),
      { connectionId }
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' }),
    };
  }
};

/**
 * WebSocket Message Handler
 * Handles incoming messages from the copilot interface
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1
 */
export const messageHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const domainName = event.requestContext.domainName!;
  const stage = event.requestContext.stage!;
  const copilotLogger = createCopilotLogger(event);
  const startTime = Date.now();

  try {
    // Parse message body
    const body = JSON.parse(event.body || '{}');
    const { action, message, conversationId: providedConversationId } = body;

    // Get connection info to retrieve userId
    const connectionResult = await docClient.send(
      new GetCommand({
        TableName: CONNECTIONS_TABLE,
        Key: {
          connectionId,
        },
      })
    );

    if (!connectionResult.Item) {
      copilotLogger.logWarning('Connection not found', { connectionId });

      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' }),
      };
    }

    const userId = connectionResult.Item.userId;
    copilotLogger.setUserId(userId);

    // Check message rate limit
    const messageRateLimit = await rateLimiter.checkMessageRateLimit(userId);
    if (!messageRateLimit.allowed) {
      logger.warning('Message rate limit exceeded, queueing request', {
        userId,
        connectionId,
        reason: messageRateLimit.reason,
        retryAfter: messageRateLimit.retryAfter,
      });

      // Queue the request for later processing
      const { request: queuedRequest, position } = await requestQueue.enqueueRequest(
        userId,
        connectionId,
        message,
        providedConversationId
      );

      // Send queue notification to client
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'request_queued',
            message: 'Your request has been queued due to rate limiting.',
            requestId: queuedRequest.id,
            position: position.position,
            totalInQueue: position.totalInQueue,
            estimatedWaitTime: position.estimatedWaitTime,
            timestamp: Date.now(),
          }),
        })
      );

      return {
        statusCode: 202, // Accepted
        body: JSON.stringify({
          message: 'Request queued',
          requestId: queuedRequest.id,
          position: position.position,
        }),
      };
    }

    // Check token rate limit (estimate ~1000 tokens per message)
    const tokenRateLimit = await rateLimiter.checkTokenRateLimit(userId, 1000);
    if (!tokenRateLimit.allowed) {
      logger.warning('Token rate limit exceeded, queueing request', {
        userId,
        connectionId,
        reason: tokenRateLimit.reason,
        retryAfter: tokenRateLimit.retryAfter,
      });

      // Queue the request for later processing
      const { request: queuedRequest, position } = await requestQueue.enqueueRequest(
        userId,
        connectionId,
        message,
        providedConversationId
      );

      // Send queue notification to client
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'request_queued',
            message: 'Your request has been queued due to token limit.',
            requestId: queuedRequest.id,
            position: position.position,
            totalInQueue: position.totalInQueue,
            estimatedWaitTime: position.estimatedWaitTime,
            timestamp: Date.now(),
          }),
        })
      );

      return {
        statusCode: 202, // Accepted
        body: JSON.stringify({
          message: 'Request queued',
          requestId: queuedRequest.id,
          position: position.position,
        }),
      };
    }

    // Create API Gateway Management API client for sending messages back
    const apiGatewayClient = new ApiGatewayManagementApi({
      endpoint: `https://${domainName}/${stage}`,
    });

    // Helper function to send message to client
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
          logger.warning('Connection gone, cleaning up', { connectionId });
          await disconnectHandler(event);
        } else {
          throw error;
        }
      }
    };

    // Send acknowledgment
    await sendToClient({
      type: 'acknowledgment',
      message: 'Message received. Processing...',
      timestamp: Date.now(),
    });

    // Get or create conversation
    const convService = getConversationService();
    let conversation = providedConversationId
      ? await convService.getConversation(providedConversationId)
      : await convService.getConversationByConnectionId(connectionId);

    if (!conversation) {
      conversation = await convService.createConversation(userId, connectionId);
    }

    const conversationId = conversation.id;

    // Log copilot interaction
    copilotLogger.logInteraction({
      userId,
      conversationId,
      connectionId,
      message,
      messageLength: message.length,
      timestamp: Date.now(),
    });

    // Add user message to conversation
    await convService.addMessage(conversationId, {
      role: 'user',
      content: message,
    });

    // Get conversation history for context
    const history = await convService.getConversationHistory(conversationId, 5);

    // Classify intent
    const classifier = getIntentClassifier();
    const bedrockMessages = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
    }));
    
    const classifyStartTime = Date.now();
    const classification = await classifier.classify(message, bedrockMessages);
    const classifyDuration = Date.now() - classifyStartTime;

    // Log intent classification
    copilotLogger.logIntentClassification({
      intent: classification.intent,
      confidence: classification.confidence,
      parameters: classification.parameters,
      requiresClarification: classification.requiresClarification,
      classificationTime: classifyDuration,
    });

    // Handle clarification if needed
    if (classification.requiresClarification && classification.clarificationQuestion) {
      copilotLogger.logClarification(classification.intent, classification.clarificationQuestion);

      const clarificationMessage = {
        type: 'message',
        content: classification.clarificationQuestion,
        conversationId,
        timestamp: Date.now(),
        metadata: {
          intent: classification.intent,
          confidence: classification.confidence,
          requiresClarification: true,
        },
      };

      await sendToClient(clarificationMessage);

      // Add assistant message to conversation
      await convService.addMessage(conversationId, {
        role: 'assistant',
        content: classification.clarificationQuestion,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Clarification requested' }),
      };
    }

    // Execute action
    const registry = getActionRegistry();
    const actionToExecute = registry.getByName(classification.intent);
    
    if (!actionToExecute) {
      throw new Error(`Action not found: ${classification.intent}`);
    }
    
    const actionStartTime = Date.now();
    const actionResult = await actionToExecute.execute(
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
    const actionDuration = Date.now() - actionStartTime;

    // Log action execution
    copilotLogger.logActionExecution({
      actionName: classification.intent,
      parameters: classification.parameters,
      success: actionResult.success,
      executionTime: actionDuration,
      error: actionResult.error,
      resultData: actionResult.data,
    });

    // Track command execution analytics
    await analyticsService.trackCommandExecution(
      userId,
      classification.intent,
      actionResult.success,
      actionDuration,
      conversationId
    );

    // Track error if action failed
    if (!actionResult.success && actionResult.error) {
      await analyticsService.trackError(
        userId,
        'ActionExecutionError',
        actionResult.error,
        conversationId,
        {
          actionName: classification.intent,
          parameters: classification.parameters,
        }
      );
    }

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
    const response = {
      type: 'message',
      content: responseContent,
      conversationId,
      timestamp: Date.now(),
      metadata: {
        intent: classification.intent,
        confidence: classification.confidence,
        actionSuccess: actionResult.success,
        executionTime: Date.now() - event.requestContext.requestTimeEpoch,
      },
    };

    await sendToClient(response);

    // Add assistant message to conversation
    await convService.addMessage(conversationId, {
      role: 'assistant',
      content: responseContent,
    });

    // Send suggestions if available
    if (actionResult.suggestions && actionResult.suggestions.length > 0) {
      await sendToClient({
        type: 'suggestions',
        suggestions: actionResult.suggestions,
        conversationId,
        timestamp: Date.now(),
      });
    }

    // Send completion signal
    await sendToClient({
      type: 'complete',
      conversationId,
      timestamp: Date.now(),
    });

    // Record actual token usage (estimate based on response length)
    const estimatedTokens = Math.ceil((message.length + responseContent.length) / 4);
    await rateLimiter.recordTokenUsage(userId, estimatedTokens);

    const totalDuration = Date.now() - startTime;
    copilotLogger.getLogger().metric('MessageProcessingTime', totalDuration, 'Milliseconds');
    copilotLogger.getLogger().info('Copilot message processed successfully', {
      connectionId,
      userId,
      conversationId,
      totalDuration,
      tokensUsed: estimatedTokens,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message processed' }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to process WebSocket message',
      error instanceof Error ? error : new Error('Unknown error'),
      { connectionId }
    );

    // Try to send error message back to client
    try {
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process message',
            timestamp: Date.now(),
          }),
        })
      );
    } catch (sendError) {
      logger.error(
        'Failed to send error message to client',
        sendError instanceof Error ? sendError : new Error('Unknown error'),
        {
          connectionId,
        }
      );
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process message' }),
    };
  }
};

/**
 * WebSocket Streaming Message Handler
 * Handles incoming messages with streaming response support
 * 
 * Requirements: 2.1, 2.2 - Streaming responses
 * Property 8: Streaming response continuity
 */
export const streamingMessageHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const domainName = event.requestContext.domainName!;
  const stage = event.requestContext.stage!;
  const copilotLogger = createCopilotLogger(event);
  const startTime = Date.now();

  try {
    // Parse message body
    const body = JSON.parse(event.body || '{}');
    const { message, conversationId: providedConversationId, streaming = true } = body;

    // Get connection info to retrieve userId
    const connectionResult = await docClient.send(
      new GetCommand({
        TableName: CONNECTIONS_TABLE,
        Key: {
          connectionId,
        },
      })
    );

    if (!connectionResult.Item) {
      copilotLogger.logWarning('Connection not found', { connectionId });

      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' }),
      };
    }

    const userId = connectionResult.Item.userId;
    copilotLogger.setUserId(userId);

    // Check message rate limit
    const messageRateLimitStreaming = await rateLimiter.checkMessageRateLimit(userId);
    if (!messageRateLimitStreaming.allowed) {
      logger.warning('Message rate limit exceeded (streaming), queueing request', {
        userId,
        connectionId,
        reason: messageRateLimitStreaming.reason,
        retryAfter: messageRateLimitStreaming.retryAfter,
      });

      // Queue the request for later processing
      const { request: queuedRequestStreaming, position: positionStreaming } = await requestQueue.enqueueRequest(
        userId,
        connectionId,
        message,
        providedConversationId
      );

      // Send queue notification to client
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'request_queued',
            message: 'Your request has been queued due to rate limiting.',
            requestId: queuedRequestStreaming.id,
            position: positionStreaming.position,
            totalInQueue: positionStreaming.totalInQueue,
            estimatedWaitTime: positionStreaming.estimatedWaitTime,
            timestamp: Date.now(),
          }),
        })
      );

      return {
        statusCode: 202, // Accepted
        body: JSON.stringify({
          message: 'Request queued',
          requestId: queuedRequestStreaming.id,
          position: positionStreaming.position,
        }),
      };
    }

    // Check token rate limit (estimate ~1000 tokens per message)
    const tokenRateLimitStreaming = await rateLimiter.checkTokenRateLimit(userId, 1000);
    if (!tokenRateLimitStreaming.allowed) {
      logger.warning('Token rate limit exceeded (streaming), queueing request', {
        userId,
        connectionId,
        reason: tokenRateLimitStreaming.reason,
        retryAfter: tokenRateLimitStreaming.retryAfter,
      });

      // Queue the request for later processing
      const { request: queuedRequestTokenStreaming, position: positionTokenStreaming } = await requestQueue.enqueueRequest(
        userId,
        connectionId,
        message,
        providedConversationId
      );

      // Send queue notification to client
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'request_queued',
            message: 'Your request has been queued due to token limit.',
            requestId: queuedRequestTokenStreaming.id,
            position: positionTokenStreaming.position,
            totalInQueue: positionTokenStreaming.totalInQueue,
            estimatedWaitTime: positionTokenStreaming.estimatedWaitTime,
            timestamp: Date.now(),
          }),
        })
      );

      return {
        statusCode: 202, // Accepted
        body: JSON.stringify({
          message: 'Request queued',
          requestId: queuedRequestTokenStreaming.id,
          position: positionTokenStreaming.position,
        }),
      };
    }

    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApi({
      endpoint: `https://${domainName}/${stage}`,
    });

    // Helper function to send message to client
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
          logger.warning('Connection gone during streaming', { connectionId });
          await disconnectHandler(event);
          throw new Error('Connection closed');
        } else {
          throw error;
        }
      }
    };

    // Send typing indicator
    await sendToClient({
      type: 'typing',
      timestamp: Date.now(),
    });

    // Get or create conversation
    const convService = getConversationService();
    let conversation = providedConversationId
      ? await convService.getConversation(providedConversationId)
      : await convService.getConversationByConnectionId(connectionId);

    if (!conversation) {
      conversation = await convService.createConversation(userId, connectionId);
    }

    const conversationId = conversation.id;

    // Log copilot interaction
    copilotLogger.logInteraction({
      userId,
      conversationId,
      connectionId,
      message,
      messageLength: message.length,
      timestamp: Date.now(),
    });

    // Add user message to conversation
    await convService.addMessage(conversationId, {
      role: 'user',
      content: message,
    });

    // Get conversation history for context
    const history = await convService.getConversationHistory(conversationId, 5);

    // Classify intent
    const classifier = getIntentClassifier();
    const bedrockMessages = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
    }));
    
    const classifyStartTime = Date.now();
    const classification = await classifier.classify(message, bedrockMessages);
    const classifyDuration = Date.now() - classifyStartTime;

    // Log intent classification
    copilotLogger.logIntentClassification({
      intent: classification.intent,
      confidence: classification.confidence,
      parameters: classification.parameters,
      requiresClarification: classification.requiresClarification,
      classificationTime: classifyDuration,
    });

    // Handle clarification if needed
    if (classification.requiresClarification && classification.clarificationQuestion) {
      copilotLogger.logClarification(classification.intent, classification.clarificationQuestion);
      copilotLogger.logStreaming('start', { conversationId });

      // Stream clarification question
      await sendToClient({
        type: 'stream_start',
        conversationId,
        timestamp: Date.now(),
      });

      const question = classification.clarificationQuestion;
      for (let i = 0; i < question.length; i += 5) {
        const chunk = question.slice(i, i + 5);
        await sendToClient({
          type: 'stream_token',
          token: chunk,
          conversationId,
          timestamp: Date.now(),
        });
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await sendToClient({
        type: 'stream_complete',
        conversationId,
        timestamp: Date.now(),
      });

      copilotLogger.logStreaming('complete', { conversationId, tokenCount: Math.ceil(question.length / 5) });

      // Add assistant message to conversation
      await convService.addMessage(conversationId, {
        role: 'assistant',
        content: question,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Clarification streamed' }),
      };
    }

    // Execute action
    const registry = getActionRegistry();
    const actionToExecuteStreaming = registry.getByName(classification.intent);
    
    if (!actionToExecuteStreaming) {
      throw new Error(`Action not found: ${classification.intent}`);
    }
    
    const actionStartTime = Date.now();
    const actionResult = await actionToExecuteStreaming.execute(
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
    const actionDuration = Date.now() - actionStartTime;

    // Log action execution
    copilotLogger.logActionExecution({
      actionName: classification.intent,
      parameters: classification.parameters,
      success: actionResult.success,
      executionTime: actionDuration,
      error: actionResult.error,
      resultData: actionResult.data,
    });

    // Track command execution analytics
    await analyticsService.trackCommandExecution(
      userId,
      classification.intent,
      actionResult.success,
      actionDuration,
      conversationId
    );

    // Track error if action failed
    if (!actionResult.success && actionResult.error) {
      await analyticsService.trackError(
        userId,
        'ActionExecutionError',
        actionResult.error,
        conversationId,
        {
          actionName: classification.intent,
          parameters: classification.parameters,
        }
      );
    }

    // Stream response
    if (streaming) {
      copilotLogger.logStreaming('start', { conversationId });

      await sendToClient({
        type: 'stream_start',
        conversationId,
        timestamp: Date.now(),
        metadata: {
          intent: classification.intent,
          confidence: classification.confidence,
        },
      });

      let fullResponse = '';
      let tokenCount = 0;

      try {
        // Build prompt for streaming
        const bedrockService = createBedrockService();
        const prompt = buildResponsePrompt(actionResult, history);

        const streamStartTime = Date.now();

        // Stream tokens
        for await (const token of bedrockService.streamResponse(prompt)) {
          fullResponse += token;
          tokenCount++;

          await sendToClient({
            type: 'stream_token',
            token,
            conversationId,
            timestamp: Date.now(),
          });
        }

        const streamDuration = Date.now() - streamStartTime;

        // Log Bedrock streaming call
        copilotLogger.logBedrockCall('stream', streamDuration, tokenCount);
        copilotLogger.logStreaming('complete', { conversationId, tokenCount, responseLength: fullResponse.length });

        // Send completion signal
        await sendToClient({
          type: 'stream_complete',
          conversationId,
          timestamp: Date.now(),
          metadata: {
            tokenCount,
            actionSuccess: actionResult.success,
          },
        });

        // Add assistant message to conversation
        await convService.addMessage(conversationId, {
          role: 'assistant',
          content: fullResponse,
        });

        // Send suggestions if available
        if (actionResult.suggestions && actionResult.suggestions.length > 0) {
          await sendToClient({
            type: 'suggestions',
            suggestions: actionResult.suggestions,
            conversationId,
            timestamp: Date.now(),
          });
        }

        // Record actual token usage for streaming
        const estimatedTokensStreaming = Math.ceil((message.length + fullResponse.length) / 4);
        await rateLimiter.recordTokenUsage(userId, estimatedTokensStreaming);

      } catch (streamError) {
        copilotLogger.logStreaming('interrupted', { conversationId, tokensSent: tokenCount });
        copilotLogger.logError(
          'Streaming interrupted',
          streamError instanceof Error ? streamError : new Error(String(streamError)),
          { tokensSent: tokenCount }
        );

        // Send interruption signal
        await sendToClient({
          type: 'stream_interrupted',
          conversationId,
          timestamp: Date.now(),
          error: 'Streaming was interrupted',
          partialResponse: fullResponse,
        });

        throw streamError;
      }
    } else {
      // Non-streaming fallback
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

      await sendToClient({
        type: 'message',
        content: responseContent,
        conversationId,
        timestamp: Date.now(),
        metadata: {
          intent: classification.intent,
          confidence: classification.confidence,
          actionSuccess: actionResult.success,
        },
      });

      // Add assistant message to conversation
      await convService.addMessage(conversationId, {
        role: 'assistant',
        content: responseContent,
      });

      // Record actual token usage for non-streaming
      const estimatedTokensNonStreaming = Math.ceil((message.length + responseContent.length) / 4);
      await rateLimiter.recordTokenUsage(userId, estimatedTokensNonStreaming);
    }

    const totalDuration = Date.now() - startTime;
    copilotLogger.getLogger().metric('StreamingMessageProcessingTime', totalDuration, 'Milliseconds');
    copilotLogger.getLogger().info('Streaming message processed successfully', {
      connectionId,
      userId,
      conversationId,
      totalDuration,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Streaming message processed' }),
    };
  } catch (error) {
    copilotLogger.logError(
      'Failed to process streaming message',
      error instanceof Error ? error : new Error('Unknown error'),
      { connectionId }
    );

    // Try to send error message back to client
    try {
      const apiGatewayClient = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process streaming message',
            timestamp: Date.now(),
          }),
        })
      );
    } catch (sendError) {
      logger.error(
        'Failed to send error message to client',
        sendError instanceof Error ? sendError : new Error('Unknown error'),
        {
          connectionId,
        }
      );
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process streaming message' }),
    };
  }
};

/**
 * Build prompt for response generation
 */
function buildResponsePrompt(actionResult: any, history: any[]): string {
  const recentMessages = history
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
