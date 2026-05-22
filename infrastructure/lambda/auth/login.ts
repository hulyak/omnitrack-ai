import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const TABLE_NAME = process.env.TABLE_NAME!;

interface LoginRequest {
  username: string;
  password: string;
}

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
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body: LoginRequest = JSON.parse(event.body);
    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Username and password are required',
        }),
      };
    }

    // Authenticate with Cognito
    const authCommand = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    // Log successful authentication
    await logAuthenticationEvent(
      'USER_LOGIN',
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
        accessToken: authResult.AuthenticationResult?.AccessToken,
        idToken: authResult.AuthenticationResult?.IdToken,
        refreshToken: authResult.AuthenticationResult?.RefreshToken,
        expiresIn: authResult.AuthenticationResult?.ExpiresIn,
        tokenType: authResult.AuthenticationResult?.TokenType,
      }),
    };
  } catch (error: any) {
    console.error('Login error:', error);

    // Extract username from body for logging if available
    let username = 'unknown';
    try {
      if (event.body) {
        const body = JSON.parse(event.body);
        username = body.username || 'unknown';
      }
    } catch {
      // Ignore parsing errors
    }

    // Log failed authentication
    await logAuthenticationEvent(
      'USER_LOGIN',
      username,
      sourceIp,
      false,
      userAgent,
      error.message
    );

    return {
      statusCode: error.name === 'NotAuthorizedException' ? 401 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Authentication failed',
      }),
    };
  }
};
