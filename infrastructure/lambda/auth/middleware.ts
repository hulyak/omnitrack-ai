import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

// Create JWT verifier for access tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
  clientId: USER_POOL_CLIENT_ID,
});

export interface AuthenticatedUser {
  username: string;
  sub: string;
  email?: string;
  role?: string;
  groups?: string[];
}

/**
 * Validates JWT token from Authorization header
 * Returns authenticated user information or throws error
 */
export async function validateToken(
  event: APIGatewayProxyEvent
): Promise<AuthenticatedUser> {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify JWT token
    const payload = await verifier.verify(token);

    // Extract user information from token
    const user: AuthenticatedUser = {
      username: payload['cognito:username'] as string,
      sub: payload.sub,
      email: payload.email as string | undefined,
      groups: payload['cognito:groups'] as string[] | undefined,
    };

    // Get additional user attributes if needed
    try {
      const getUserResult = await cognitoClient.send(
        new GetUserCommand({
          AccessToken: token,
        })
      );

      // Extract custom role attribute
      const roleAttr = getUserResult.UserAttributes?.find(
        (attr: { Name?: string; Value?: string }) => attr.Name === 'custom:role'
      );
      if (roleAttr) {
        user.role = roleAttr.Value;
      }
    } catch (error) {
      console.warn('Failed to fetch user attributes:', error);
      // Continue without additional attributes
    }

    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  statusCode: number,
  data: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Middleware wrapper that validates authentication before executing handler
 */
export function withAuth(
  handler: (
    event: APIGatewayProxyEvent,
    user: AuthenticatedUser
  ) => Promise<APIGatewayProxyResult>
) {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = await validateToken(event);
      return await handler(event, user);
    } catch (error: any) {
      return createErrorResponse(401, error.message || 'Unauthorized');
    }
  };
}
