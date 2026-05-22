/**
 * Example: Using Security Headers Middleware
 * 
 * This file demonstrates how to use the security headers middleware
 * in Lambda function handlers.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  withSecurityHeaders, 
  validateRequestHeaders, 
  sanitizeResponse,
  getSecurityHeaders 
} from './security-headers-middleware';

/**
 * Example 1: Basic usage with security headers wrapper
 */
export const basicHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Your business logic here
  const data = {
    message: 'Hello, World!',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
  // Security headers are automatically added by the wrapper
});

/**
 * Example 2: Manual security headers application
 */
export const manualHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Your business logic here
  const data = {
    message: 'Hello, World!',
    timestamp: new Date().toISOString(),
  };

  // Manually get and apply security headers
  const securityHeaders = getSecurityHeaders();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders,
    },
    body: JSON.stringify(data),
  };
};

/**
 * Example 3: Request validation with security checks
 */
export const validatedHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Validate request headers for security
  const validation = validateRequestHeaders(event.headers as Record<string, string>);
  
  if (!validation.valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid request',
        details: validation.errors,
      }),
    };
  }

  // Your business logic here
  const data = {
    message: 'Request validated successfully',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});

/**
 * Example 4: Response sanitization
 */
export const sanitizedHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Simulate fetching user data with sensitive fields
  const userData = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret123', // This should be removed
    apiKey: 'sk_live_abc123', // This should be removed
    role: 'admin',
  };

  // Sanitize response to remove sensitive fields
  const sanitizedData = sanitizeResponse(userData);

  return {
    statusCode: 200,
    body: JSON.stringify(sanitizedData),
  };
  // Result will not include 'password' or 'apiKey' fields
});

/**
 * Example 5: Accessing secrets from Secrets Manager
 * 
 * Note: Install @aws-sdk/client-secrets-manager package:
 * npm install @aws-sdk/client-secrets-manager
 */
// import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export const secretsHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Example: Get secrets from Secrets Manager
    // Uncomment when @aws-sdk/client-secrets-manager is installed
    /*
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const response = await client.send(
      new GetSecretValueCommand({ 
        SecretId: process.env.SECRETS_ARN 
      })
    );

    if (!response.SecretString) {
      throw new Error('Secret not found');
    }

    const secrets = JSON.parse(response.SecretString);
    const bedrockApiKey = secrets.bedrockApiKey;
    */

    // Your business logic using the secrets
    const data = {
      message: 'Secrets retrieved successfully',
      // Never return actual secrets in the response!
      hasBedrockKey: true, // !!bedrockApiKey
    };

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve secrets',
      }),
    };
  }
});

/**
 * Example 6: Using KMS for encryption/decryption
 * 
 * Note: Install @aws-sdk/client-kms package:
 * npm install @aws-sdk/client-kms
 */
// import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

export const kmsHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Example: Using KMS for encryption/decryption
    // Uncomment when @aws-sdk/client-kms is installed
    /*
    const kmsClient = new KMSClient({ region: process.env.AWS_REGION });
    const sensitiveData = 'This is sensitive data';

    // Encrypt data with KMS
    const encryptResponse = await kmsClient.send(
      new EncryptCommand({
        KeyId: process.env.KMS_KEY_ID,
        Plaintext: Buffer.from(sensitiveData),
      })
    );

    const encryptedData = encryptResponse.CiphertextBlob;

    // Decrypt data with KMS
    const decryptResponse = await kmsClient.send(
      new DecryptCommand({
        CiphertextBlob: encryptedData,
      })
    );

    const decryptedData = Buffer.from(decryptResponse.Plaintext!).toString('utf-8');
    */

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Encryption/decryption successful',
        dataMatches: true, // sensitiveData === decryptedData
      }),
    };
  } catch (error) {
    console.error('Error with KMS:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'KMS operation failed',
      }),
    };
  }
});

/**
 * Example 7: Complete secure handler with all features
 */
export const completeSecureHandler = withSecurityHeaders(async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // 1. Validate request headers
  const validation = validateRequestHeaders(event.headers as Record<string, string>);
  if (!validation.valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid request',
        details: validation.errors,
      }),
    };
  }

  // 2. Get secrets from Secrets Manager (example - uncomment when SDK is installed)
  /*
  const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const secretsResponse = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: process.env.SECRETS_ARN })
  );
  const secrets = JSON.parse(secretsResponse.SecretString!);
  */

  // 3. Process business logic
  const result = {
    message: 'Secure operation completed',
    timestamp: new Date().toISOString(),
    userId: event.requestContext.authorizer?.claims?.sub,
    // Include other non-sensitive data
  };

  // 4. Sanitize response
  const sanitizedResult = sanitizeResponse(result);

  // 5. Return response (security headers added automatically by wrapper)
  return {
    statusCode: 200,
    body: JSON.stringify(sanitizedResult),
  };
});
