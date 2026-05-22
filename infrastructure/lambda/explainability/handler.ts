/**
 * Explainability Handler - Lambda function for generating explanations
 * 
 * This handler provides an API endpoint for generating comprehensive
 * explanations of AI-driven decisions.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ExplainabilityService, ExplanationRequest } from './explainability-service';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

/**
 * Structured logger with correlation ID support
 */
class Logger {
  private correlationId: string;
  private context: Context;

  constructor(correlationId: string, context: Context) {
    this.correlationId = correlationId;
    this.context = context;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      requestId: this.context.awsRequestId,
      functionName: this.context.functionName,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARNING', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }
}

/**
 * Explainability Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `explain-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('ExplainabilityService');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Explainability Service invoked', {
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'Request body is required',
          correlationId
        })
      };
    }

    const request: ExplanationRequest = JSON.parse(event.body);
    
    logger.debug('Request parsed', { 
      scenarioId: request.scenarioId,
      agentContributionsCount: request.agentContributions?.length || 0
    });

    // Validate required fields
    if (!request.scenarioId) {
      logger.warn('Request validation failed: missing scenarioId');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'scenarioId is required',
          correlationId
        })
      };
    }

    if (!request.agentContributions || request.agentContributions.length === 0) {
      logger.warn('Request validation failed: missing agentContributions');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'agentContributions is required and must not be empty',
          correlationId
        })
      };
    }

    // Initialize service
    const explainabilityService = new ExplainabilityService();
    
    // Generate explanation
    logger.info('Generating explanation', { scenarioId: request.scenarioId });
    const explanation = await explainabilityService.generateExplanation(request);

    const executionTime = Date.now() - startTime;

    logger.info('Explainability Service completed successfully', {
      executionTime,
      scenarioId: request.scenarioId,
      completeness: explanation.metadata.completeness,
      agentAttributionsCount: explanation.agentAttributions.length
    });

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify({
        ...explanation,
        metadata: {
          ...explanation.metadata,
          executionTime
        }
      })
    };

  } catch (error) {
    logger.error('Explainability Service failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify({
        error: 'Internal server error',
        correlationId,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
