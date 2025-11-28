import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const TABLE_NAME = process.env.TABLE_NAME!;

interface RegisterRequest {
  email: string;
  password: string;
  fullname: string;
  role?: string;
  organization?: string;
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

    const body: RegisterRequest = JSON.parse(event.body);
    const { email, password, fullname, role, organization } = body;

    if (!email || !password || !fullname) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Email, password, and fullname are required',
        }),
      };
    }

    // Register user in Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: fullname },
        ...(role ? [{ Name: 'custom:role', Value: role }] : []),
        ...(organization
          ? [{ Name: 'custom:organization', Value: organization }]
          : []),
      ],
    });

    const signUpResult = await cognitoClient.send(signUpCommand);

    // If role is specified, add user to corresponding group
    if (role && signUpResult.UserSub) {
      try {
        await cognitoClient.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            GroupName: role,
          })
        );
      } catch (error) {
        console.warn(`Failed to add user to group ${role}:`, error);
        // Continue even if group assignment fails
      }
    }

    // Log successful registration
    await logAuthenticationEvent(
      'USER_REGISTRATION',
      email,
      sourceIp,
      true,
      userAgent
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        userSub: signUpResult.UserSub,
        userConfirmed: signUpResult.UserConfirmed,
      }),
    };
  } catch (error: any) {
    console.error('Registration error:', error);

    // Extract email from body for logging if available
    let email = 'unknown';
    try {
      if (event.body) {
        const body = JSON.parse(event.body);
        email = body.email || 'unknown';
      }
    } catch {
      // Ignore parsing errors
    }

    // Log failed registration
    await logAuthenticationEvent(
      'USER_REGISTRATION',
      email,
      sourceIp,
      false,
      userAgent,
      error.message
    );

    return {
      statusCode: error.name === 'UsernameExistsException' ? 409 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Registration failed',
      }),
    };
  }
};
