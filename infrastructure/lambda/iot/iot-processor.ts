/**
 * IoT Processor Lambda - Processes IoT sensor data and updates digital twin
 * 
 * This Lambda is triggered by AWS IoT Core rules when sensor data arrives.
 * It processes the data, updates the digital twin state in DynamoDB, and
 * triggers risk reassessment if material changes are detected.
 * 
 * Requirements: 9.1, 9.3, 9.4
 */

import { Context } from 'aws-lambda';
import { NodeRepository } from '../repositories/node-repository';
import { NodeStatus, NodeMetrics } from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

/**
 * IoT sensor data structure
 */
interface IoTSensorData {
  nodeId: string;
  timestamp: string;
  sensorType: string;
  metrics: {
    currentInventory?: number;
    utilizationRate?: number;
    temperature?: number;
    humidity?: number;
    [key: string]: any;
  };
  source: string;
  messageId: string;
}

/**
 * Conflict resolution configuration
 */
interface ConflictResolutionRule {
  strategy: 'latest_timestamp' | 'highest_priority' | 'average';
  priorityOrder?: string[]; // For highest_priority strategy
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
 * Integration error class for external service failures
 */
class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

/**
 * Data conflict error class
 */
class DataConflictError extends Error {
  constructor(
    message: string,
    public readonly conflictingData: any[]
  ) {
    super(message);
    this.name = 'DataConflictError';
  }
}

/**
 * IoT Processor Lambda handler
 */
export const handler = async (
  event: any,
  context: Context
): Promise<void> => {
  const startTime = Date.now();
  const correlationId = `iot-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const logger = new Logger(correlationId, context);

  // Start X-Ray subsegment
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('IoTProcessor');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('IoT Processor invoked', {
      eventType: typeof event,
      hasData: !!event
    });

    // Parse IoT sensor data
    const sensorData = parseSensorData(event, logger);
    
    logger.info('Sensor data parsed', {
      nodeId: sensorData.nodeId,
      sensorType: sensorData.sensorType,
      source: sensorData.source,
      messageId: sensorData.messageId
    });

    // Initialize repository
    const nodeRepository = new NodeRepository();

    // Fetch current node state
    const currentNode = await nodeRepository.getNodeById(sensorData.nodeId);
    
    if (!currentNode) {
      logger.warn('Node not found in digital twin', {
        nodeId: sensorData.nodeId
      });
      throw new IntegrationError(
        `Node ${sensorData.nodeId} not found in digital twin`,
        'DynamoDB'
      );
    }

    logger.debug('Current node state retrieved', {
      nodeId: currentNode.nodeId,
      status: currentNode.status,
      version: currentNode.version
    });

    // Check for conflicting data (simulated - in real system would check multiple sources)
    const hasConflict = await detectDataConflict(sensorData, currentNode, logger);
    
    if (hasConflict) {
      logger.warn('Data conflict detected', {
        nodeId: sensorData.nodeId,
        currentTimestamp: currentNode.metrics.lastUpdateTimestamp,
        newTimestamp: sensorData.timestamp
      });
      
      // Apply conflict resolution rules
      const resolvedData = await resolveDataConflict(
        sensorData,
        currentNode,
        logger
      );
      
      // Update with resolved data
      await updateDigitalTwin(nodeRepository, resolvedData, currentNode, logger);
    } else {
      // No conflict, proceed with update
      await updateDigitalTwin(nodeRepository, sensorData, currentNode, logger);
    }

    const executionTime = Date.now() - startTime;
    logger.info('IoT Processor completed successfully', {
      executionTime,
      nodeId: sensorData.nodeId
    });

    subsegment?.close();

  } catch (error) {
    logger.error('IoT Processor failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });

    // Handle integration errors
    if (error instanceof IntegrationError) {
      logger.error('Integration failure detected', {
        service: error.service,
        originalError: error.originalError?.message
      });
      
      // Send alert to administrators
      await sendAdministratorAlert(error, logger);
    }

    subsegment?.addError(error as Error);
    subsegment?.close();

    // Re-throw to trigger Lambda retry mechanism
    throw error;
  }
};

/**
 * Parse IoT sensor data from event
 */
function parseSensorData(event: any, logger: Logger): IoTSensorData {
  try {
    // IoT Core sends data in various formats, handle common cases
    let data: any;
    
    if (typeof event === 'string') {
      data = JSON.parse(event);
    } else if (event.body) {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      data = event;
    }

    // Validate required fields
    if (!data.nodeId) {
      throw new Error('Missing required field: nodeId');
    }
    if (!data.metrics) {
      throw new Error('Missing required field: metrics');
    }

    return {
      nodeId: data.nodeId,
      timestamp: data.timestamp || new Date().toISOString(),
      sensorType: data.sensorType || 'unknown',
      metrics: data.metrics,
      source: data.source || 'iot-core',
      messageId: data.messageId || `msg-${Date.now()}`
    };
  } catch (error) {
    logger.error('Failed to parse sensor data', {
      error: error instanceof Error ? error.message : String(error),
      rawEvent: JSON.stringify(event).substring(0, 500)
    });
    throw new IntegrationError(
      'Failed to parse IoT sensor data',
      'IoT Core',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Detect data conflicts from multiple sources
 */
async function detectDataConflict(
  sensorData: IoTSensorData,
  currentNode: any,
  logger: Logger
): Promise<boolean> {
  // Check if current node has recent updates from different source
  const currentTimestamp = new Date(currentNode.metrics.lastUpdateTimestamp).getTime();
  const newTimestamp = new Date(sensorData.timestamp).getTime();
  
  // If timestamps are within 5 seconds and from different sources, it's a potential conflict
  const timeDiff = Math.abs(newTimestamp - currentTimestamp);
  const isDifferentSource = currentNode.metrics.lastUpdateSource !== sensorData.source;
  
  return timeDiff < 5000 && isDifferentSource;
}

/**
 * Resolve data conflicts using configured resolution rules
 */
async function resolveDataConflict(
  sensorData: IoTSensorData,
  currentNode: any,
  logger: Logger
): Promise<IoTSensorData> {
  // Get conflict resolution rule from environment or use default
  const resolutionStrategy = process.env.CONFLICT_RESOLUTION_STRATEGY || 'latest_timestamp';
  
  logger.info('Applying conflict resolution', {
    strategy: resolutionStrategy,
    nodeId: sensorData.nodeId
  });

  // Flag the discrepancy in logs (Requirement 9.4)
  logger.warn('Data discrepancy flagged', {
    nodeId: sensorData.nodeId,
    currentSource: currentNode.metrics.lastUpdateSource,
    newSource: sensorData.source,
    currentTimestamp: currentNode.metrics.lastUpdateTimestamp,
    newTimestamp: sensorData.timestamp,
    resolutionStrategy
  });

  switch (resolutionStrategy) {
    case 'latest_timestamp':
      // Use data with latest timestamp
      const currentTime = new Date(currentNode.metrics.lastUpdateTimestamp).getTime();
      const newTime = new Date(sensorData.timestamp).getTime();
      
      if (newTime >= currentTime) {
        logger.info('Using new data (latest timestamp)', {
          nodeId: sensorData.nodeId
        });
        return sensorData;
      } else {
        logger.info('Keeping current data (latest timestamp)', {
          nodeId: sensorData.nodeId
        });
        // Return current data as sensor data format
        return {
          nodeId: currentNode.nodeId,
          timestamp: currentNode.metrics.lastUpdateTimestamp,
          sensorType: 'existing',
          metrics: {
            currentInventory: currentNode.metrics.currentInventory,
            utilizationRate: currentNode.metrics.utilizationRate
          },
          source: currentNode.metrics.lastUpdateSource || 'unknown',
          messageId: `existing-${Date.now()}`
        };
      }

    case 'average':
      // Average numeric values
      logger.info('Averaging conflicting values', {
        nodeId: sensorData.nodeId
      });
      
      const averagedMetrics: any = {};
      for (const key in sensorData.metrics) {
        if (typeof sensorData.metrics[key] === 'number' && 
            typeof currentNode.metrics[key] === 'number') {
          averagedMetrics[key] = (sensorData.metrics[key] + currentNode.metrics[key]) / 2;
        } else {
          averagedMetrics[key] = sensorData.metrics[key];
        }
      }
      
      return {
        ...sensorData,
        metrics: averagedMetrics,
        source: 'conflict-resolved-average'
      };

    default:
      logger.warn('Unknown resolution strategy, using latest timestamp', {
        strategy: resolutionStrategy
      });
      return sensorData;
  }
}

/**
 * Update digital twin with sensor data
 */
async function updateDigitalTwin(
  nodeRepository: NodeRepository,
  sensorData: IoTSensorData,
  currentNode: any,
  logger: Logger
): Promise<void> {
  try {
    // Build updated metrics
    const updatedMetrics: NodeMetrics = {
      currentInventory: sensorData.metrics.currentInventory ?? currentNode.metrics.currentInventory,
      utilizationRate: sensorData.metrics.utilizationRate ?? currentNode.metrics.utilizationRate,
      lastUpdateTimestamp: sensorData.timestamp,
      lastUpdateSource: sensorData.source
    } as any;

    // Determine if this is a material change (threshold-based)
    const isMaterialChange = detectMaterialChange(
      currentNode.metrics,
      updatedMetrics,
      logger
    );

    // Update node metrics
    await nodeRepository.updateNodeMetrics(
      sensorData.nodeId,
      updatedMetrics,
      currentNode.version
    );

    logger.info('Digital twin updated', {
      nodeId: sensorData.nodeId,
      isMaterialChange,
      metrics: updatedMetrics
    });

    // Trigger risk reassessment if material change detected (Requirement 9.5)
    if (isMaterialChange) {
      logger.info('Material change detected, triggering risk reassessment', {
        nodeId: sensorData.nodeId
      });
      
      // In a real implementation, this would publish to SNS/EventBridge
      // For now, we just log the intent
      await triggerRiskReassessment(sensorData.nodeId, logger);
    }

  } catch (error) {
    logger.error('Failed to update digital twin', {
      error: error instanceof Error ? error.message : String(error),
      nodeId: sensorData.nodeId
    });
    
    throw new IntegrationError(
      'Failed to update digital twin in DynamoDB',
      'DynamoDB',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Detect if change is material (exceeds thresholds)
 */
function detectMaterialChange(
  currentMetrics: NodeMetrics,
  newMetrics: NodeMetrics,
  logger: Logger
): boolean {
  // Define thresholds for material changes
  const INVENTORY_THRESHOLD = 0.1; // 10% change
  const UTILIZATION_THRESHOLD = 0.15; // 15% change

  let isMaterial = false;

  // Check inventory change
  if (currentMetrics.currentInventory && newMetrics.currentInventory) {
    const inventoryChange = Math.abs(
      (newMetrics.currentInventory - currentMetrics.currentInventory) / 
      currentMetrics.currentInventory
    );
    
    if (inventoryChange >= INVENTORY_THRESHOLD) {
      logger.info('Material inventory change detected', {
        change: inventoryChange,
        threshold: INVENTORY_THRESHOLD
      });
      isMaterial = true;
    }
  }

  // Check utilization change
  if (currentMetrics.utilizationRate && newMetrics.utilizationRate) {
    const utilizationChange = Math.abs(
      newMetrics.utilizationRate - currentMetrics.utilizationRate
    );
    
    if (utilizationChange >= UTILIZATION_THRESHOLD) {
      logger.info('Material utilization change detected', {
        change: utilizationChange,
        threshold: UTILIZATION_THRESHOLD
      });
      isMaterial = true;
    }
  }

  return isMaterial;
}

/**
 * Trigger risk reassessment (placeholder for future implementation)
 */
async function triggerRiskReassessment(nodeId: string, logger: Logger): Promise<void> {
  logger.info('Risk reassessment triggered', {
    nodeId,
    note: 'This would publish to SNS/EventBridge in production'
  });
  
  // TODO: Implement SNS/EventBridge publication in future tasks
  // await sns.publish({
  //   TopicArn: process.env.RISK_ASSESSMENT_TOPIC_ARN,
  //   Message: JSON.stringify({ nodeId, timestamp: new Date().toISOString() })
  // });
}

/**
 * Send alert to administrators about integration failure
 */
async function sendAdministratorAlert(error: IntegrationError, logger: Logger): Promise<void> {
  logger.error('Sending administrator alert', {
    service: error.service,
    error: error.message
  });
  
  // TODO: Implement SNS notification in future tasks
  // await sns.publish({
  //   TopicArn: process.env.ADMIN_ALERT_TOPIC_ARN,
  //   Subject: `Integration Failure: ${error.service}`,
  //   Message: JSON.stringify({
  //     error: error.message,
  //     service: error.service,
  //     timestamp: new Date().toISOString()
  //   })
  // });
}
