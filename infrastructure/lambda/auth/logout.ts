import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;

interface AuditLogEntry {
  PK: string;
  SK: string;
  eventType: string;
  timestamp: string;
  userIdentity: string;
  sourceIp: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

async function logAuthenticationEvent(
  eventType: string,
  userIdentity: string,
  sourceIp: string,
  success: boolean,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const auditEntry: AuditLogEntry = {
    PK: `AUDIT#AUTH`,
    SK: `${timestamp}#${userIdentity}`,
    eventType,
    timestamp,
    userIdentity,
    sourceIp,
    success,
  };

  if (userAgent) {
    auditEntry.userAgent = userAgent;
  }

  if (errorMessage) {
    auditEntry.errorMessage = errorMessage;
  }

  await dynamoClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: auditEntry,
    })
  );
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const sourceIp = event.requestContext.identity.sourceIp;
  const userAgent = event.headers['User-Agent'];

  try {
    // Extract access token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
      };
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get username from request context (set by authorizer)
    const username = event.requestContext.authorizer?.claims?.['cognito:username'] || 'unknown';

    // Sign out user globally (invalidates all tokens)
    await cognitoClient.send(
      new GlobalSignOutCommand({
        AccessToken: accessToken,
      })
    );

    // Log successful logout
    await logAuthenticationEvent(
      'USER_LOGOUT',
      username,
      sourceIp,
      true,
      userAgent
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Logged out successfully',
      }),
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    const username = event.requestContext.authorizer?.claims?.['cognito:username'] || 'unknown';

    // Log failed logout
    await logAuthenticationEvent(
      'USER_LOGOUT',
      username,
      sourceIp,
      false,
      userAgent,
      error.message
    );

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Logout failed',
      }),
    };
  }
};
