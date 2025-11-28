/**
 * WebSocket API Handlers for Real-Time Updates
 * 
 * Handles WebSocket connections for real-time digital twin updates,
 * alert notifications, and scenario progress updates.
 * 
 * Requirements: All (WebSocket layer)
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || 'omnitrack-main';

/**
 * Connection management table structure:
 * PK: CONNECTION#{connectionId}
 * SK: METADATA
 * Attributes: userId, connectedAt, subscriptions[]
 */

/**
 * Helper to create API Gateway response
 */
function createResponse(statusCode: number, body?: any): APIGatewayProxyResult {
  return {
    statusCode,
    body: body ? JSON.stringify(body) : '',
  };
}

/**
 * $connect route handler
 * Called when a client connects to the WebSocket
 */
export async function connectHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  const userId = event.queryStringParameters?.userId || 'anonymous';

  console.log(`WebSocket connection established: ${connectionId} for user: ${userId}`);

  try {
    // Store connection in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CONNECTION#${connectionId}`,
          SK: 'METADATA',
          connectionId,
          userId,
          connectedAt: new Date().toISOString(),
          subscriptions: ['digital_twin_update', 'alert_notification'], // Default subscriptions
          ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hour TTL
        },
      })
    );

    return createResponse(200, { message: 'Connected' });
  } catch (error) {
    console.error('Error storing connection:', error);
    return createResponse(500, { error: 'Failed to connect' });
  }
}

/**
 * $disconnect route handler
 * Called when a client disconnects from the WebSocket
 */
export async function disconnectHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;

  console.log(`WebSocket connection closed: ${connectionId}`);

  try {
    // Remove connection from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CONNECTION#${connectionId}`,
          SK: 'METADATA',
        },
      })
    );

    return createResponse(200, { message: 'Disconnected' });
  } catch (error) {
    console.error('Error removing connection:', error);
    return createResponse(500, { error: 'Failed to disconnect' });
  }
}

/**
 * Default route handler
 * Handles custom messages from clients
 */
export async function defaultHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  const body = JSON.parse(event.body || '{}');

  console.log(`WebSocket message received from ${connectionId}:`, body);

  try {
    const action = body.action;

    switch (action) {
      case 'subscribe':
        return await handleSubscribe(connectionId, body.channels);
      case 'unsubscribe':
        return await handleUnsubscribe(connectionId, body.channels);
      case 'ping':
        return await handlePing(connectionId);
      default:
        return createResponse(400, { error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return createResponse(500, { error: 'Failed to process message' });
  }
}

/**
 * Handle subscription to channels
 */
async function handleSubscribe(
  connectionId: string,
  channels: string[]
): Promise<APIGatewayProxyResult> {
  try {
    // Get current connection
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `CONNECTION#${connectionId}`,
          ':sk': 'METADATA',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, { error: 'Connection not found' });
    }

    const connection = result.Items[0];
    const currentSubscriptions = connection.subscriptions || [];
    const newSubscriptions = Array.from(
      new Set([...currentSubscriptions, ...channels])
    );

    // Update subscriptions
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...connection,
          subscriptions: newSubscriptions,
        },
      })
    );

    return createResponse(200, {
      message: 'Subscribed',
      subscriptions: newSubscriptions,
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return createResponse(500, { error: 'Failed to subscribe' });
  }
}

/**
 * Handle unsubscription from channels
 */
async function handleUnsubscribe(
  connectionId: string,
  channels: string[]
): Promise<APIGatewayProxyResult> {
  try {
    // Get current connection
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `CONNECTION#${connectionId}`,
          ':sk': 'METADATA',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, { error: 'Connection not found' });
    }

    const connection = result.Items[0];
    const currentSubscriptions = connection.subscriptions || [];
    const newSubscriptions = currentSubscriptions.filter(
      (sub: string) => !channels.includes(sub)
    );

    // Update subscriptions
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...connection,
          subscriptions: newSubscriptions,
        },
      })
    );

    return createResponse(200, {
      message: 'Unsubscribed',
      subscriptions: newSubscriptions,
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return createResponse(500, { error: 'Failed to unsubscribe' });
  }
}

/**
 * Handle ping message (keep-alive)
 */
async function handlePing(connectionId: string): Promise<APIGatewayProxyResult> {
  return createResponse(200, { message: 'pong', timestamp: new Date().toISOString() });
}

/**
 * Broadcast message to all connected clients
 * This function is called by other services to push updates
 */
export async function broadcastMessage(
  channel: string,
  message: any,
  apiGatewayEndpoint: string
): Promise<void> {
  try {
    // Get all connections subscribed to this channel
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'CONNECTION',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log('No active connections found');
      return;
    }

    // Filter connections subscribed to this channel
    const subscribedConnections = result.Items.filter((item) =>
      item.subscriptions?.includes(channel)
    );

    console.log(
      `Broadcasting to ${subscribedConnections.length} connections on channel: ${channel}`
    );

    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: apiGatewayEndpoint,
    });

    // Send message to each connection
    const sendPromises = subscribedConnections.map(async (connection) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                channel,
                message,
                timestamp: new Date().toISOString(),
              })
            ),
          })
        );
      } catch (error: any) {
        // If connection is stale, remove it
        if (error.statusCode === 410) {
          console.log(`Removing stale connection: ${connection.connectionId}`);
          await docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `CONNECTION#${connection.connectionId}`,
                SK: 'METADATA',
              },
            })
          );
        } else {
          console.error(
            `Error sending to connection ${connection.connectionId}:`,
            error
          );
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

/**
 * Send message to specific user
 */
export async function sendToUser(
  userId: string,
  message: any,
  apiGatewayEndpoint: string
): Promise<void> {
  try {
    // Get all connections for this user
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'CONNECTION',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log('No active connections found');
      return;
    }

    // Filter connections for this user
    const userConnections = result.Items.filter((item) => item.userId === userId);

    console.log(`Sending to ${userConnections.length} connections for user: ${userId}`);

    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: apiGatewayEndpoint,
    });

    // Send message to each connection
    const sendPromises = userConnections.map(async (connection) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                message,
                timestamp: new Date().toISOString(),
              })
            ),
          })
        );
      } catch (error: any) {
        // If connection is stale, remove it
        if (error.statusCode === 410) {
          console.log(`Removing stale connection: ${connection.connectionId}`);
          await docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `CONNECTION#${connection.connectionId}`,
                SK: 'METADATA',
              },
            })
          );
        } else {
          console.error(
            `Error sending to connection ${connection.connectionId}:`,
            error
          );
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending to user:', error);
    throw error;
  }
}
