/**
 * Info Agent - Aggregates and synthesizes supply chain data
 * 
 * This agent gathers data from multiple sources (DynamoDB, IoT Core, ERP integrations)
 * and provides a unified view of the current supply chain state.
 * 
 * Requirements: 9.1, 9.2, 9.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { NodeRepository } from '../repositories/node-repository';
import { AlertRepository } from '../repositories/alert-repository';

// X-Ray SDK (types not available, using any)
const AWSXRay = require('aws-xray-sdk-core');

interface InfoAgentRequest {
  nodeIds?: string[];
  includeAlerts?: boolean;
  includeMetrics?: boolean;
  correlationId?: string;
}

interface InfoAgentResponse {
  digitalTwinState: {
    nodes: any[];
    alerts?: any[];
    lastUpdated: string;
  };
  metadata: {
    correlationId: string;
    executionTime: number;
    dataSourcesQueried: string[];
  };
}

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
 * Info Agent Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `info-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('InfoAgent');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Info Agent invoked', {
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Parse request body
    const request: InfoAgentRequest = event.body ? JSON.parse(event.body) : {};
    
    logger.debug('Request parsed', { request });

    // Initialize repositories
    const nodeRepository = new NodeRepository();
    const alertRepository = new AlertRepository();
    
    const dataSourcesQueried: string[] = ['DynamoDB'];

    // Fetch supply chain nodes
    let nodes: any[] = [];
    
    if (request.nodeIds && request.nodeIds.length > 0) {
      logger.info('Fetching specific nodes', { nodeIds: request.nodeIds });
      nodes = await nodeRepository.getNodesByIds(request.nodeIds);
      logger.info('Nodes fetched', { count: nodes.length });
    } else {
      logger.info('No specific nodes requested, returning empty state');
      // In a real implementation, we might fetch all nodes or a default set
      // For now, we return empty to avoid scanning the entire table
    }

    // Fetch active alerts if requested
    let alerts: any[] | undefined;
    if (request.includeAlerts) {
      logger.info('Fetching active alerts');
      const { AlertStatus } = await import('../models/types.js');
      const alertResult = await alertRepository.getAlertsByStatus(AlertStatus.ACTIVE);
      alerts = alertResult.items;
      logger.info('Alerts fetched', { count: alerts.length });
    }

    // Build response
    const response: InfoAgentResponse = {
      digitalTwinState: {
        nodes,
        alerts,
        lastUpdated: new Date().toISOString()
      },
      metadata: {
        correlationId,
        executionTime: Date.now() - startTime,
        dataSourcesQueried
      }
    };

    logger.info('Info Agent completed successfully', {
      executionTime: response.metadata.executionTime,
      nodesReturned: nodes.length,
      alertsReturned: alerts?.length || 0
    });

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    logger.error('Info Agent failed', {
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

/**
 * Fetch data from IoT Core (placeholder for future implementation)
 */
async function fetchIoTData(logger: Logger): Promise<any[]> {
  logger.info('Fetching IoT sensor data');
  // TODO: Implement IoT Core integration in task 6
  return [];
}

/**
 * Fetch data from ERP systems (placeholder for future implementation)
 */
async function fetchERPData(logger: Logger): Promise<any[]> {
  logger.info('Fetching ERP system data');
  // TODO: Implement ERP integration
  return [];
}
