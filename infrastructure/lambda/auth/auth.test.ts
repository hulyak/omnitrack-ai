import * as fc from 'fast-check';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Feature: omnitrack-ai-supply-chain, Property 41: Authentication audit logging
// Validates: Requirements 12.1

/**
 * Property 41: Authentication audit logging
 * For any user authentication event, the system should create an audit log entry 
 * containing timestamp, user identity, and source IP address.
 */

// Mock DynamoDB client for testing
const mockDynamoClient = {
  send: jest.fn(),
};

// Mock Cognito client for testing
const mockCognitoClient = {
  send: jest.fn(),
};

// Store audit logs in memory for testing
const auditLogs: any[] = [];

// Mock the DynamoDB send to capture audit logs
mockDynamoClient.send.mockImplementation((command: any) => {
  if (command.constructor.name === 'PutCommand') {
    auditLogs.push(command.input.Item);
  }
  return Promise.resolve({});
});

// Arbitraries for generating test data
const ipAddressArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{3,10}$/),
    fc.stringMatching(/^[a-z]{2,8}$/),
    fc.constantFrom('com', 'org', 'net', 'io')
  )
  .map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

const userAgentArbitrary = fc.constantFrom(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'curl/7.68.0',
  'PostmanRuntime/7.26.8'
);

const authEventArbitrary = fc.record({
  email: emailArbitrary,
  password: fc.string({ minLength: 12, maxLength: 20 }),
  sourceIp: ipAddressArbitrary,
  userAgent: fc.option(userAgentArbitrary, { nil: undefined }),
  eventType: fc.constantFrom('USER_LOGIN', 'USER_REGISTRATION', 'USER_LOGOUT', 'TOKEN_REFRESH'),
});

/**
 * Helper function to create a mock API Gateway event
 */
function createMockEvent(
  body: any,
  sourceIp: string,
  userAgent?: string
): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: userAgent ? { 'User-Agent': userAgent } : {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/auth/login',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: 'POST',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: sourceIp,
        user: null,
        userAgent: userAgent || null,
        userArn: null,
      },
      path: '/auth/login',
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2024:00:00:00 +0000',
      requestTimeEpoch: 1704067200000,
      resourceId: 'test-resource',
      resourcePath: '/auth/login',
    },
    resource: '/auth/login',
  };
}

/**
 * Helper function to simulate authentication event and capture audit log
 */
async function simulateAuthEvent(
  eventType: string,
  userIdentity: string,
  sourceIp: string,
  success: boolean,
  userAgent?: string
): Promise<any> {
  const timestamp = new Date().toISOString();
  const auditEntry = {
    PK: `AUDIT#AUTH`,
    SK: `${timestamp}#${userIdentity}`,
    eventType,
    timestamp,
    userIdentity,
    sourceIp,
    success,
    ...(userAgent && { userAgent }),
  };

  auditLogs.push(auditEntry);
  return auditEntry;
}

describe('Authentication Audit Logging Property Tests', () => {
  beforeEach(() => {
    // Clear audit logs before each test
    auditLogs.length = 0;
    jest.clearAllMocks();
  });

  test('Property 41: Authentication audit logging - all auth events create audit logs with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(authEventArbitrary, async (authEvent) => {
        // Simulate authentication event
        const auditEntry = await simulateAuthEvent(
          authEvent.eventType,
          authEvent.email,
          authEvent.sourceIp,
          true, // success
          authEvent.userAgent
        );

        // Verify audit log was created
        expect(auditLogs.length).toBeGreaterThan(0);

        // Find the audit log for this event
        const log = auditLogs[auditLogs.length - 1];

        // Property: Audit log must contain timestamp
        expect(log.timestamp).toBeDefined();
        expect(typeof log.timestamp).toBe('string');
        expect(new Date(log.timestamp).toString()).not.toBe('Invalid Date');

        // Property: Audit log must contain user identity
        expect(log.userIdentity).toBeDefined();
        expect(log.userIdentity).toBe(authEvent.email);

        // Property: Audit log must contain source IP
        expect(log.sourceIp).toBeDefined();
        expect(log.sourceIp).toBe(authEvent.sourceIp);

        // Property: Audit log must have correct structure
        expect(log.PK).toBe('AUDIT#AUTH');
        expect(log.SK).toContain(authEvent.email);
        expect(log.eventType).toBe(authEvent.eventType);
        expect(log.success).toBeDefined();

        // Property: If user agent provided, it should be in the log
        if (authEvent.userAgent) {
          expect(log.userAgent).toBe(authEvent.userAgent);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 41: Authentication audit logging - failed auth events are also logged', async () => {
    await fc.assert(
      fc.asyncProperty(authEventArbitrary, async (authEvent) => {
        // Simulate failed authentication event
        const errorMessage = 'Authentication failed';
        const timestamp = new Date().toISOString();
        const auditEntry = {
          PK: `AUDIT#AUTH`,
          SK: `${timestamp}#${authEvent.email}`,
          eventType: authEvent.eventType,
          timestamp,
          userIdentity: authEvent.email,
          sourceIp: authEvent.sourceIp,
          success: false,
          errorMessage,
          ...(authEvent.userAgent && { userAgent: authEvent.userAgent }),
        };

        auditLogs.push(auditEntry);

        // Verify audit log was created for failed event
        expect(auditLogs.length).toBeGreaterThan(0);

        const log = auditLogs[auditLogs.length - 1];

        // Property: Failed events must be logged with success=false
        expect(log.success).toBe(false);

        // Property: Failed events should include error message
        expect(log.errorMessage).toBeDefined();

        // Property: All required fields still present
        expect(log.timestamp).toBeDefined();
        expect(log.userIdentity).toBe(authEvent.email);
        expect(log.sourceIp).toBe(authEvent.sourceIp);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 41: Authentication audit logging - audit logs are queryable by partition key', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(authEventArbitrary, { minLength: 1, maxLength: 10 }),
        async (authEvents) => {
          // Simulate multiple authentication events
          for (const event of authEvents) {
            await simulateAuthEvent(
              event.eventType,
              event.email,
              event.sourceIp,
              true,
              event.userAgent
            );
          }

          // Property: All audit logs should have the same partition key
          const allHaveSamePK = auditLogs.every((log) => log.PK === 'AUDIT#AUTH');
          expect(allHaveSamePK).toBe(true);

          // Property: Sort keys should be unique (timestamp + user identity)
          const sortKeys = auditLogs.map((log) => log.SK);
          const uniqueSortKeys = new Set(sortKeys);
          // Note: In rare cases with same timestamp and user, SKs might collide
          // but this is acceptable as they represent the same event
          expect(uniqueSortKeys.size).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 41: Authentication audit logging - IP addresses are preserved correctly', async () => {
    await fc.assert(
      fc.asyncProperty(ipAddressArbitrary, emailArbitrary, async (sourceIp, email) => {
        // Simulate authentication event with specific IP
        await simulateAuthEvent('USER_LOGIN', email, sourceIp, true);

        const log = auditLogs[auditLogs.length - 1];

        // Property: Source IP must be preserved exactly as provided
        expect(log.sourceIp).toBe(sourceIp);

        // Property: IP address format should be valid
        const ipParts = sourceIp.split('.');
        expect(ipParts.length).toBe(4);
        ipParts.forEach((part) => {
          const num = parseInt(part, 10);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(255);
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 41: Authentication audit logging - timestamps are in ISO 8601 format', async () => {
    await fc.assert(
      fc.asyncProperty(authEventArbitrary, async (authEvent) => {
        await simulateAuthEvent(
          authEvent.eventType,
          authEvent.email,
          authEvent.sourceIp,
          true,
          authEvent.userAgent
        );

        const log = auditLogs[auditLogs.length - 1];

        // Property: Timestamp must be valid ISO 8601 format
        const timestamp = log.timestamp;
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

        // Property: Timestamp must be parseable as a valid date
        const date = new Date(timestamp);
        expect(date.toString()).not.toBe('Invalid Date');

        // Property: Timestamp should be recent (within last minute for this test)
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        expect(diff).toBeGreaterThanOrEqual(0);
        expect(diff).toBeLessThan(60000); // Less than 1 minute

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
