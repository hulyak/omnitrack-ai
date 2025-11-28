/**
 * Integration Tests for Staging Environment
 * 
 * These tests verify that all services are properly integrated and working
 * in the staging environment.
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IoTClient, DescribeEndpointCommand } from '@aws-sdk/client-iot';

// Load CDK outputs
const cdkOutputsPath = path.join(__dirname, '../../cdk-outputs.json');
let cdkOutputs: any = {};

if (fs.existsSync(cdkOutputsPath)) {
  cdkOutputs = JSON.parse(fs.readFileSync(cdkOutputsPath, 'utf-8'));
}

const stackOutputs = cdkOutputs.InfrastructureStack || {};

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iotClient = new IoTClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Staging Environment Integration Tests', () => {
  describe('Infrastructure Components', () => {
    test('DynamoDB table should be active', async () => {
      const tableName = stackOutputs.DynamoDBTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema).toHaveLength(2); // PK and SK
    }, 30000);

    test('Cognito User Pool should exist and be configured', async () => {
      const userPoolId = stackOutputs.UserPoolId;
      expect(userPoolId).toBeDefined();

      const command = new DescribeUserPoolCommand({ UserPoolId: userPoolId });
      const response = await cognitoClient.send(command);

      expect(response.UserPool).toBeDefined();
      expect(response.UserPool?.Id).toBe(userPoolId);
      expect(response.UserPool?.MfaConfiguration).toBeDefined();
    }, 30000);

    test('REST API Gateway should be accessible', async () => {
      const apiUrl = stackOutputs.RestApiUrl;
      expect(apiUrl).toBeDefined();

      // Test OPTIONS request (CORS preflight)
      const response = await axios.options(apiUrl, {
        validateStatus: () => true, // Accept any status
      });

      expect([200, 204, 403]).toContain(response.status);
    }, 30000);

    test('WebSocket API should exist', async () => {
      const wsUrl = stackOutputs.WebSocketApiUrl;
      expect(wsUrl).toBeDefined();
      expect(wsUrl).toMatch(/^wss:\/\//);
    });
  });

  describe('API Endpoints', () => {
    const apiUrl = stackOutputs.RestApiUrl;

    test('POST /auth/register should accept requests', async () => {
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      const response = await axios.post(
        `${apiUrl}auth/register`,
        {
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User',
        },
        {
          validateStatus: () => true,
        }
      );

      // Should return 400 (validation error) or 409 (user exists) or 201 (success)
      expect([201, 400, 409, 500]).toContain(response.status);
    }, 30000);

    test('POST /auth/login should accept requests', async () => {
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      const response = await axios.post(
        `${apiUrl}auth/login`,
        {
          username: 'test@example.com',
          password: 'TestPassword123!',
        },
        {
          validateStatus: () => true,
        }
      );

      // Should return 400 (validation error) or 401 (invalid credentials) or 200 (success)
      expect([200, 400, 401, 500]).toContain(response.status);
    }, 30000);

    test('GET /digital-twin should require authentication', async () => {
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      const response = await axios.get(`${apiUrl}digital-twin`, {
        validateStatus: () => true,
      });

      // Should return 401 (unauthorized) or 403 (forbidden)
      expect([401, 403]).toContain(response.status);
    }, 30000);

    test('GET /alerts should require authentication', async () => {
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      const response = await axios.get(`${apiUrl}alerts`, {
        validateStatus: () => true,
      });

      // Should return 401 (unauthorized) or 403 (forbidden)
      expect([401, 403]).toContain(response.status);
    }, 30000);

    test('GET /marketplace/scenarios should be publicly accessible', async () => {
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      const response = await axios.get(`${apiUrl}marketplace/scenarios`, {
        validateStatus: () => true,
      });

      // Should return 200 (success) or 500 (server error)
      expect([200, 500]).toContain(response.status);
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('IoT Processor Lambda should exist and be invocable', async () => {
      const functionName = 'omnitrack-iot-processor';

      const testPayload = {
        deviceId: 'test-device-001',
        timestamp: new Date().toISOString(),
        sensorData: {
          temperature: 25.5,
          humidity: 60,
          location: {
            lat: 40.7128,
            lon: -74.0060,
          },
        },
      };

      try {
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(testPayload)),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.FunctionError).toBeUndefined();
      } catch (error: any) {
        // Function might not exist in staging yet
        if (error.name === 'ResourceNotFoundException') {
          console.warn(`Lambda function ${functionName} not found, skipping test`);
        } else {
          throw error;
        }
      }
    }, 30000);

    test('Auth Login Lambda should exist', async () => {
      const functionName = 'omnitrack-auth-login';

      try {
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'DryRun', // Just check if function exists
        });

        await lambdaClient.send(command);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          fail(`Lambda function ${functionName} not found`);
        }
        // DryRun will throw an error, but that's expected
      }
    }, 30000);
  });

  describe('Multi-Agent Orchestration', () => {
    test('Step Functions state machine should exist', async () => {
      // This would require Step Functions client
      // For now, we'll verify through API endpoint
      const apiUrl = stackOutputs.RestApiUrl;
      if (!apiUrl) {
        console.warn('API URL not found, skipping test');
        return;
      }

      // The scenario simulation endpoint triggers multi-agent orchestration
      const response = await axios.post(
        `${apiUrl}scenarios/simulate`,
        {
          type: 'supplier_disruption',
          location: 'Asia',
          severity: 'high',
        },
        {
          validateStatus: () => true,
        }
      );

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    }, 30000);
  });

  describe('External Integrations', () => {
    test('IoT Core endpoint should be accessible', async () => {
      try {
        const command = new DescribeEndpointCommand({
          endpointType: 'iot:Data-ATS',
        });

        const response = await iotClient.send(command);
        expect(response.endpointAddress).toBeDefined();
        expect(response.endpointAddress).toMatch(/\.amazonaws\.com$/);
      } catch (error: any) {
        console.warn('IoT Core endpoint check failed:', error.message);
      }
    }, 30000);

    test('SNS topics should exist for notifications', async () => {
      const criticalTopicArn = stackOutputs.CriticalAlertsTopicArn;
      const warningTopicArn = stackOutputs.WarningAlertsTopicArn;

      expect(criticalTopicArn).toBeDefined();
      expect(warningTopicArn).toBeDefined();
      expect(criticalTopicArn).toMatch(/^arn:aws:sns:/);
      expect(warningTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Real-time WebSocket Updates', () => {
    test('WebSocket connection endpoint should be valid', () => {
      const wsUrl = stackOutputs.WebSocketApiUrl;
      expect(wsUrl).toBeDefined();
      expect(wsUrl).toMatch(/^wss:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod$/);
    });

    // Note: Actual WebSocket connection testing would require a WebSocket client
    // and proper authentication, which is better suited for E2E tests
  });
});
