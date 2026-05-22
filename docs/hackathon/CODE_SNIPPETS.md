# OmniTrack AI - Code Snippet Highlights

## Overview
This document contains key code snippets to showcase during the hackathon presentation. Each snippet demonstrates AWS service integration, serverless patterns, and production-ready code quality.

**Purpose**: Quick reference for live coding demonstrations and judge Q&A

---

## Table of Contents
1. [Lambda Handler with Bedrock Integration](#1-lambda-handler-with-bedrock-integration)
2. [DynamoDB Single-Table Design](#2-dynamodb-single-table-design)
3. [Step Functions State Machine](#3-step-functions-state-machine)
4. [Authentication Middleware](#4-authentication-middleware)
5. [Structured Logging with Correlation IDs](#5-structured-logging-with-correlation-ids)
6. [Error Handling Pattern](#6-error-handling-pattern)
7. [IoT Data Processing](#7-iot-data-processing)
8. [Redis Caching Strategy](#8-redis-caching-strategy)

---

## 1. Lambda Handler with Bedrock Integration

**File**: `infrastructure/lambda/agents/info-agent.ts`

**What it shows**: AI-powered anomaly detection using Amazon Bedrock Claude API


```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  const correlationId = event.requestContext?.requestId || crypto.randomUUID();
  
  logger.info('Info Agent invoked', { 
    correlationId,
    nodeId: event.nodeId 
  });

  try {
    // Fetch supply chain data from DynamoDB
    const supplyChainData = await fetchSupplyChainData(event.nodeId);
    
    // Invoke Amazon Bedrock for AI-powered anomaly detection
    const prompt = `Analyze this supply chain data for anomalies and risks:
    
Node: ${supplyChainData.name}
Type: ${supplyChainData.type}
Current Status: ${supplyChainData.status}
Recent Metrics: ${JSON.stringify(supplyChainData.metrics)}

Identify:
1. Any anomalies or unusual patterns
2. Potential risks or disruptions
3. Severity level (low/medium/high/critical)
4. Recommended immediate actions`;

    const bedrockResponse = await bedrockClient.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    }));

    // Parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const analysis = responseBody.content[0].text;
    
    // Store analysis results in DynamoDB
    const anomalyRecord = {
      PK: `ANOMALY#${event.nodeId}`,
      SK: `ANALYSIS#${Date.now()}`,
      nodeId: event.nodeId,
      analysis,
      timestamp: Date.now(),
      correlationId
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: anomalyRecord
    }));

    logger.info('Anomaly analysis completed', { 
      correlationId,
      nodeId: event.nodeId 
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        analysis,
        correlationId
      })
    };
    
  } catch (error) {
    logger.error('Info Agent failed', { 
      correlationId,
      error: error.message,
      stack: error.stack 
    });
    
    throw error;
  }
};
```

**Key Points to Highlight**:
- ✅ Amazon Bedrock integration with Claude 3 Sonnet
- ✅ Structured logging with correlation IDs
- ✅ DynamoDB integration for data persistence
- ✅ Proper error handling and logging
- ✅ TypeScript with AWS SDK v3

---

## 2. DynamoDB Single-Table Design

**File**: `infrastructure/lambda/repositories/base-repository.ts`

**What it shows**: Efficient single-table design pattern with optimistic locking

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';

export abstract class BaseRepository<T> {
  protected dynamodb: DynamoDBDocumentClient;
  protected tableName: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.dynamodb = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.TABLE_NAME!;
  }

  protected abstract getPK(item: T): string;
  protected abstract getSK(item: T): string;

  async save(item: T & { version?: number }): Promise<void> {
    const currentVersion = item.version || 0;
    
    await this.dynamodb.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.getPK(item),
        SK: this.getSK(item),
        ...item,
        version: currentVersion + 1,
        updatedAt: Date.now()
      },
      // Optimistic locking: only update if version matches
      ConditionExpression: 'attribute_not_exists(PK) OR #version = :currentVersion',
      ExpressionAttributeNames: {
        '#version': 'version'
      },
      ExpressionAttributeValues: {
        ':currentVersion': currentVersion
      }
    }));
  }

  async get(pk: string, sk: string): Promise<T | null> {
    const result = await this.dynamodb.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk }
    }));

    return result.Item as T || null;
  }

  async query(pk: string, skPrefix?: string): Promise<T[]> {
    const params: any = {
      TableName: this.tableName,
      KeyConditionExpression: skPrefix 
        ? 'PK = :pk AND begins_with(SK, :skPrefix)'
        : 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ...(skPrefix && { ':skPrefix': skPrefix })
      }
    };

    const result = await this.dynamodb.send(new QueryCommand(params));
    return (result.Items || []) as T[];
  }
}

// Example: Node Repository
export class NodeRepository extends BaseRepository<SupplyChainNode> {
  protected getPK(node: SupplyChainNode): string {
    return `NODE#${node.id}`;
  }

  protected getSK(node: SupplyChainNode): string {
    return 'METADATA';
  }

  async findByType(type: string): Promise<SupplyChainNode[]> {
    // Query using GSI
    const result = await this.dynamodb.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: {
        ':type': `TYPE#${type}`
      }
    }));

    return (result.Items || []) as SupplyChainNode[];
  }
}
```

**Key Points to Highlight**:
- ✅ Single-table design with PK/SK pattern
- ✅ Optimistic locking with version numbers
- ✅ Generic base repository for code reuse
- ✅ GSI for efficient querying by type
- ✅ Type-safe with TypeScript generics

---

## 3. Step Functions State Machine

**File**: `infrastructure/lambda/negotiation/state-machine-definition.json`

**What it shows**: Multi-agent orchestration with parallel execution and error handling

```json
{
  "Comment": "Multi-agent orchestration for supply chain scenario analysis",
  "StartAt": "ValidateInput",
  "States": {
    "ValidateInput": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-validate-input",
      "ResultPath": "$.validation",
      "Next": "ParallelAgentExecution",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "ResultPath": "$.error",
        "Next": "HandleValidationError"
      }]
    },
    
    "ParallelAgentExecution": {
      "Type": "Parallel",
      "ResultPath": "$.agentResults",
      "Next": "AggregateResults",
      "Branches": [
        {
          "StartAt": "InfoAgent",
          "States": {
            "InfoAgent": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-info-agent",
              "TimeoutSeconds": 30,
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "Catch": [{
                "ErrorEquals": ["States.ALL"],
                "ResultPath": "$.error",
                "Next": "InfoAgentFallback"
              }],
              "End": true
            },
            "InfoAgentFallback": {
              "Type": "Pass",
              "Result": {
                "status": "failed",
                "message": "Info Agent failed, using cached data"
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "ScenarioAgent",
          "States": {
            "ScenarioAgent": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-scenario-agent",
              "TimeoutSeconds": 45,
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "End": true
            }
          }
        },
        {
          "StartAt": "StrategyAgent",
          "States": {
            "StrategyAgent": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-strategy-agent",
              "TimeoutSeconds": 30,
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "End": true
            }
          }
        },
        {
          "StartAt": "ImpactAgent",
          "States": {
            "ImpactAgent": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-impact-agent",
              "TimeoutSeconds": 30,
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "End": true
            }
          }
        }
      ]
    },
    
    "AggregateResults": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-aggregate-results",
      "ResultPath": "$.finalResult",
      "Next": "StoreResults"
    },
    
    "StoreResults": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:omnitrack-store-results",
      "Next": "NotifyCompletion"
    },
    
    "NotifyCompletion": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:us-east-1:ACCOUNT_ID:omnitrack-notifications",
        "Message.$": "$.finalResult"
      },
      "End": true
    },
    
    "HandleValidationError": {
      "Type": "Fail",
      "Error": "ValidationError",
      "Cause": "Input validation failed"
    }
  }
}
```

**Key Points to Highlight**:
- ✅ Parallel execution of 4 agents (not sequential)
- ✅ Exponential backoff retry strategy (2s, 4s, 8s)
- ✅ Timeout handling (30-45 seconds per agent)
- ✅ Fallback states for graceful degradation
- ✅ SNS notification on completion

---

## 4. Authentication Middleware

**File**: `infrastructure/lambda/auth/middleware.ts`

**What it shows**: JWT token validation with Cognito and RBAC

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { logger } from '../utils/logger';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.USER_POOL_CLIENT_ID!
});

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: {
    sub: string;
    email: string;
    role: string;
    groups: string[];
  };
}

export const authenticate = async (
  event: APIGatewayProxyEvent
): Promise<AuthenticatedEvent | APIGatewayProxyResult> => {
  const correlationId = event.requestContext.requestId;
  
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header', { correlationId });
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization token',
          correlationId
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Cognito
    const payload = await verifier.verify(token);
    
    logger.info('Token verified successfully', {
      correlationId,
      userId: payload.sub,
      groups: payload['cognito:groups'] || []
    });

    // Attach user info to event
    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.user = {
      sub: payload.sub,
      email: payload.email || '',
      role: payload['custom:role'] || 'viewer',
      groups: payload['cognito:groups'] || []
    };

    return authenticatedEvent;
    
  } catch (error) {
    logger.error('Token verification failed', {
      correlationId,
      error: error.message
    });

    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        correlationId
      })
    };
  }
};

export const authorize = (requiredRole: string) => {
  return async (
    event: AuthenticatedEvent
  ): Promise<boolean | APIGatewayProxyResult> => {
    const correlationId = event.requestContext.requestId;
    
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      analyst: 2,
      admin: 3
    };

    const userRoleLevel = roleHierarchy[event.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;

    if (userRoleLevel < requiredRoleLevel) {
      logger.warn('Insufficient permissions', {
        correlationId,
        userId: event.user.sub,
        userRole: event.user.role,
        requiredRole
      });

      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden',
          message: `Requires ${requiredRole} role or higher`,
          correlationId
        })
      };
    }

    return true;
  };
};

// Example usage in Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Authenticate user
  const authResult = await authenticate(event);
  if ('statusCode' in authResult) {
    return authResult; // Return 401 error
  }

  const authenticatedEvent = authResult as AuthenticatedEvent;

  // Authorize for admin role
  const authzResult = await authorize('admin')(authenticatedEvent);
  if (typeof authzResult !== 'boolean') {
    return authzResult; // Return 403 error
  }

  // Proceed with business logic
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      user: authenticatedEvent.user
    })
  };
};
```

**Key Points to Highlight**:
- ✅ JWT token verification with Cognito
- ✅ Role-based access control (RBAC)
- ✅ Hierarchical role system (viewer < analyst < admin)
- ✅ Proper error responses (401 vs 403)
- ✅ Correlation ID tracking

---

## 5. Structured Logging with Correlation IDs

**File**: `infrastructure/lambda/utils/logger.ts`

**What it shows**: Production-ready structured logging for observability

```typescript
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

interface LogContext {
  correlationId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'omnitrack';
    this.environment = process.env.ENVIRONMENT || 'development';
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
      // AWS Lambda context
      requestId: context.correlationId,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION
    };

    // Output as JSON for CloudWatch Logs Insights
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  critical(message: string, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context);
  }
}

export const logger = new Logger();

// Example usage
export const exampleHandler = async (event: any) => {
  const correlationId = event.requestContext.requestId;
  
  logger.info('Processing request', {
    correlationId,
    path: event.path,
    method: event.httpMethod
  });

  try {
    // Business logic
    const result = await processData(event.body);
    
    logger.info('Request completed successfully', {
      correlationId,
      resultSize: result.length
    });
    
    return { statusCode: 200, body: JSON.stringify(result) };
    
  } catch (error) {
    logger.error('Request failed', {
      correlationId,
      error: error.message,
      stack: error.stack,
      input: event.body
    });
    
    throw error;
  }
};
```

**CloudWatch Logs Insights Query Example**:
```
fields @timestamp, message, correlationId, level, error
| filter correlationId = "abc-123-def-456"
| sort @timestamp desc
| limit 100
```

**Key Points to Highlight**:
- ✅ Structured JSON logging for CloudWatch Logs Insights
- ✅ Correlation IDs for request tracing
- ✅ Automatic AWS Lambda context inclusion
- ✅ Multiple log levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- ✅ Easy querying with CloudWatch Logs Insights

---

## 6. Error Handling Pattern

**File**: `infrastructure/lambda/api/handlers.ts`

**What it shows**: Comprehensive error handling with typed errors

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../utils/logger';

// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public resourceType?: string, public resourceId?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Error response builder
const buildErrorResponse = (
  error: Error,
  correlationId: string
): APIGatewayProxyResult => {
  // Validation errors
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'ValidationError',
        message: error.message,
        field: error.field,
        correlationId
      })
    };
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'NotFoundError',
        message: error.message,
        resourceType: error.resourceType,
        resourceId: error.resourceId,
        correlationId
      })
    };
  }

  // Authentication errors
  if (error instanceof UnauthorizedError) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'UnauthorizedError',
        message: error.message,
        correlationId
      })
    };
  }

  // Authorization errors
  if (error instanceof ForbiddenError) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'ForbiddenError',
        message: error.message,
        correlationId
      })
    };
  }

  // Internal server errors (don't expose details to client)
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      correlationId
    })
  };
};

// Handler wrapper with error handling
export const withErrorHandling = (
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const correlationId = event.requestContext.requestId;

    try {
      logger.info('Request received', {
        correlationId,
        path: event.path,
        method: event.httpMethod
      });

      const result = await handler(event);

      logger.info('Request completed', {
        correlationId,
        statusCode: result.statusCode
      });

      return result;

    } catch (error) {
      logger.error('Request failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name
      });

      return buildErrorResponse(error, correlationId);
    }
  };
};

// Example usage
export const getScenarioHandler = withErrorHandling(async (event) => {
  const scenarioId = event.pathParameters?.id;

  if (!scenarioId) {
    throw new ValidationError('Scenario ID is required', 'id');
  }

  const scenario = await scenarioRepository.get(scenarioId);

  if (!scenario) {
    throw new NotFoundError(
      `Scenario not found`,
      'Scenario',
      scenarioId
    );
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario)
  };
});
```

**Key Points to Highlight**:
- ✅ Custom typed error classes
- ✅ Consistent error response format
- ✅ Proper HTTP status codes (400, 401, 403, 404, 500)
- ✅ Error details hidden from clients (security)
- ✅ Handler wrapper for DRY error handling

---

## 7. IoT Data Processing

**File**: `infrastructure/lambda/iot/iot-processor.ts`

**What it shows**: Real-time IoT data ingestion and anomaly detection

```typescript
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const iotClient = new IoTDataPlaneClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface SensorData {
  sensorId: string;
  nodeId: string;
  type: 'temperature' | 'delay' | 'inventory';
  value: number;
  threshold: number;
  unit: string;
  timestamp: number;
  location?: {
    lat: number;
    lon: number;
  };
}

export const handler = async (event: any) => {
  const correlationId = crypto.randomUUID();
  
  logger.info('IoT data received', {
    correlationId,
    sensorId: event.sensorId,
    type: event.type
  });

  try {
    const sensorData: SensorData = {
      sensorId: event.sensorId,
      nodeId: event.nodeId,
      type: event.type,
      value: event.value,
      threshold: event.threshold,
      unit: event.unit,
      timestamp: event.timestamp || Date.now(),
      location: event.location
    };

    // Store sensor data in DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `SENSOR#${sensorData.sensorId}`,
        SK: `DATA#${sensorData.timestamp}`,
        GSI1PK: `NODE#${sensorData.nodeId}`,
        GSI1SK: `${sensorData.type}#${sensorData.timestamp}`,
        ...sensorData
      }
    }));

    // Check for anomalies
    const isAnomaly = sensorData.value > sensorData.threshold;

    if (isAnomaly) {
      logger.warn('Anomaly detected', {
        correlationId,
        sensorId: sensorData.sensorId,
        value: sensorData.value,
        threshold: sensorData.threshold
      });

      // Create alert
      const alert = {
        PK: `ALERT#${crypto.randomUUID()}`,
        SK: `${Date.now()}`,
        type: 'threshold',
        severity: calculateSeverity(sensorData.value, sensorData.threshold),
        nodeId: sensorData.nodeId,
        sensorId: sensorData.sensorId,
        message: `${sensorData.type} exceeded threshold: ${sensorData.value}${sensorData.unit} > ${sensorData.threshold}${sensorData.unit}`,
        acknowledged: false,
        createdAt: Date.now(),
        correlationId
      };

      await dynamoClient.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: alert
      }));

      // Publish alert to IoT topic for real-time notifications
      await iotClient.send(new PublishCommand({
        topic: `omnitrack/alerts/${sensorData.nodeId}`,
        payload: Buffer.from(JSON.stringify(alert)),
        qos: 1
      }));

      logger.info('Alert created and published', {
        correlationId,
        alertId: alert.PK,
        severity: alert.severity
      });
    }

    logger.info('IoT data processed successfully', {
      correlationId,
      sensorId: sensorData.sensorId,
      isAnomaly
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        isAnomaly,
        correlationId
      })
    };

  } catch (error) {
    logger.error('IoT data processing failed', {
      correlationId,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
};

function calculateSeverity(value: number, threshold: number): string {
  const ratio = value / threshold;
  
  if (ratio >= 2.0) return 'critical';
  if (ratio >= 1.5) return 'high';
  if (ratio >= 1.2) return 'medium';
  return 'low';
}
```

**Key Points to Highlight**:
- ✅ Real-time IoT data ingestion
- ✅ Automatic anomaly detection
- ✅ Alert generation and publishing
- ✅ GSI for efficient querying by node and type
- ✅ IoT Core integration for real-time notifications

---

## 8. Redis Caching Strategy

**File**: `infrastructure/lambda/cache/cache-service.ts`

**What it shows**: ElastiCache Redis integration for performance optimization

```typescript
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 5000
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      await this.client.connect();
      this.isConnected = true;
      
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed', { error: error.message });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) await this.connect();

    try {
      const value = await this.client!.get(key);
      
      if (!value) {
        logger.debug('Cache miss', { key });
        return null;
      }

      logger.debug('Cache hit', { key });
      return JSON.parse(value) as T;
      
    } catch (error) {
      logger.error('Cache get failed', { key, error: error.message });
      return null; // Fail gracefully
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.client) await this.connect();

    try {
      await this.client!.setEx(
        key,
        ttlSeconds,
        JSON.stringify(value)
      );
      
      logger.debug('Cache set', { key, ttl: ttlSeconds });
      
    } catch (error) {
      logger.error('Cache set failed', { key, error: error.message });
      // Don't throw - caching is optional
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) await this.connect();

    try {
      await this.client!.del(key);
      logger.debug('Cache deleted', { key });
      
    } catch (error) {
      logger.error('Cache delete failed', { key, error: error.message });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) await this.connect();

    try {
      const keys = await this.client!.keys(pattern);
      
      if (keys.length > 0) {
        await this.client!.del(keys);
        logger.info('Cache pattern invalidated', { pattern, count: keys.length });
      }
      
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error: error.message });
    }
  }
}

export const cacheService = new CacheService();

// Example usage in Lambda handler
export const getDigitalTwinHandler = async (event: any) => {
  const correlationId = event.requestContext.requestId;
  const cacheKey = 'digital-twin:state';

  try {
    // Try cache first
    const cachedState = await cacheService.get<DigitalTwinState>(cacheKey);
    
    if (cachedState) {
      logger.info('Returning cached digital twin state', { correlationId });
      return {
        statusCode: 200,
        headers: { 'X-Cache': 'HIT' },
        body: JSON.stringify(cachedState)
      };
    }

    // Cache miss - fetch from DynamoDB
    logger.info('Cache miss - fetching from DynamoDB', { correlationId });
    const state = await fetchDigitalTwinState();

    // Store in cache (5-minute TTL)
    await cacheService.set(cacheKey, state, 300);

    return {
      statusCode: 200,
      headers: { 'X-Cache': 'MISS' },
      body: JSON.stringify(state)
    };

  } catch (error) {
    logger.error('Get digital twin failed', {
      correlationId,
      error: error.message
    });

    throw error;
  }
};

// Cache invalidation on updates
export const updateNodeHandler = async (event: any) => {
  const nodeId = event.pathParameters.id;

  // Update node in DynamoDB
  await updateNode(nodeId, event.body);

  // Invalidate related caches
  await cacheService.invalidatePattern('digital-twin:*');
  await cacheService.delete(`node:${nodeId}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

**Key Points to Highlight**:
- ✅ ElastiCache Redis integration
- ✅ Graceful degradation (cache failures don't break app)
- ✅ TTL-based expiration (5 minutes for digital twin)
- ✅ Pattern-based cache invalidation
- ✅ X-Cache header for debugging

---

## Presentation Tips

### When to Show Each Snippet

1. **Lambda + Bedrock** (Minute 2)
   - Show during agent workflow demonstration
   - Highlight AI integration
   - Emphasize Claude 3 Sonnet model

2. **DynamoDB Single-Table** (Minute 3)
   - Show when discussing data layer
   - Highlight PK/SK pattern
   - Mention optimistic locking

3. **Step Functions** (Minute 2)
   - Show during parallel execution demo
   - Highlight retry logic
   - Emphasize orchestration

4. **Authentication** (Minute 4)
   - Show during security discussion
   - Highlight JWT validation
   - Mention RBAC

5. **Logging** (Minute 4)
   - Show during observability discussion
   - Highlight correlation IDs
   - Mention CloudWatch Logs Insights

6. **Error Handling** (Minute 4)
   - Show during reliability discussion
   - Highlight typed errors
   - Mention proper HTTP status codes

7. **IoT Processing** (Minute 3)
   - Show during data flow discussion
   - Highlight real-time processing
   - Mention anomaly detection

8. **Redis Caching** (Minute 3)
   - Show during performance discussion
   - Highlight cache hit/miss
   - Mention graceful degradation

### Code Highlighting Tips

- Use syntax highlighting in your editor
- Zoom in to 150-200% for readability
- Highlight key lines with cursor or annotations
- Keep code on screen for 5-10 seconds
- Explain what the code does, not how it works

### Judge Q&A

Be prepared to show:
- Full Lambda function implementations
- CDK infrastructure code
- Test files (property-based tests)
- CloudWatch Logs with correlation IDs
- X-Ray traces

---

**Last Updated**: November 28, 2025
**Version**: 1.0
**Purpose**: Hackathon code demonstration
