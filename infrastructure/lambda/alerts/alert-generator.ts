/**
 * Alert Generator - Triggered by digital twin updates to detect anomalies
 * 
 * This Lambda function monitors digital twin state changes and generates alerts
 * when thresholds are exceeded or anomalies are detected.
 * 
 * Requirements: 1.1, 1.3
 */

import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { AlertRepository } from '../repositories/alert-repository';
import { NodeRepository } from '../repositories/node-repository';
import {
  Alert,
  AlertType,
  AlertStatus,
  Severity,
  Node,
  NodeStatus,
  AlertMetadata
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface ThresholdConfig {
  utilizationRateHigh: number;
  utilizationRateCritical: number;
  inventoryLow: number;
  inventoryCritical: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  utilizationRateHigh: 0.85,
  utilizationRateCritical: 0.95,
  inventoryLow: 0.2,
  inventoryCritical: 0.1
};

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
 * Alert Generator Lambda handler
 * Triggered by DynamoDB streams when nodes are updated
 */
export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<void> => {
  const correlationId = `alert-gen-${Date.now()}`;
  const logger = new Logger(correlationId, context);

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('AlertGenerator');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Alert Generator invoked', {
      recordCount: event.Records.length
    });

    const alertRepository = new AlertRepository();
    const nodeRepository = new NodeRepository();
    const thresholds = DEFAULT_THRESHOLDS;

    const alertsGenerated: Alert[] = [];

    for (const record of event.Records) {
      if (record.eventName === 'MODIFY' || record.eventName === 'INSERT') {
        const newImage = record.dynamodb?.NewImage;
        
        if (!newImage || !newImage.PK?.S?.startsWith('NODE#')) {
          continue;
        }

        // Extract node data from DynamoDB stream
        const nodeId = newImage.nodeId?.S;
        if (!nodeId) {
          continue;
        }

        // Fetch full node data
        const node = await nodeRepository.getNodeById(nodeId);
        if (!node) {
          logger.warn('Node not found', { nodeId });
          continue;
        }

        logger.debug('Processing node update', { nodeId, status: node.status });

        // Detect anomalies and generate alerts
        const alerts = await detectAnomalies(node, thresholds, logger);
        
        for (const alertData of alerts) {
          const alert = await alertRepository.createAlert(alertData);
          alertsGenerated.push(alert);
          logger.info('Alert generated', {
            alertId: alert.alertId,
            type: alert.type,
            severity: alert.severity,
            nodeId: alert.nodeId
          });
        }
      }
    }

    logger.info('Alert generation completed', {
      alertsGenerated: alertsGenerated.length
    });

    subsegment?.close();

  } catch (error) {
    logger.error('Alert generation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    subsegment?.addError(error as Error);
    subsegment?.close();

    throw error;
  }
};

/**
 * Detect anomalies in node data and return alert specifications
 */
async function detectAnomalies(
  node: Node,
  thresholds: ThresholdConfig,
  logger: Logger
): Promise<Array<Omit<Alert, 'alertId' | 'createdAt' | 'version'>>> {
  const alerts: Array<Omit<Alert, 'alertId' | 'createdAt' | 'version'>> = [];

  // Check node status
  if (node.status === NodeStatus.DISRUPTED || node.status === NodeStatus.OFFLINE) {
    const severity = node.status === NodeStatus.OFFLINE ? Severity.CRITICAL : Severity.HIGH;
    const priority = node.status === NodeStatus.OFFLINE ? 10 : 8;

    alerts.push({
      type: AlertType.ANOMALY_DETECTED,
      severity,
      nodeId: node.nodeId,
      status: AlertStatus.ACTIVE,
      message: `Node ${node.nodeId} status changed to ${node.status}`,
      metadata: {
        priority,
        affectedNodes: [node.nodeId],
        estimatedImpact: `Node ${node.nodeId} is ${node.status.toLowerCase()}`,
        recommendedActions: [
          'Investigate node status',
          'Check connected nodes',
          'Review recent changes'
        ]
      }
    });

    logger.info('Node status anomaly detected', {
      nodeId: node.nodeId,
      status: node.status,
      severity
    });
  }

  // Check utilization rate thresholds
  if (node.metrics?.utilizationRate !== undefined) {
    if (node.metrics.utilizationRate >= thresholds.utilizationRateCritical) {
      alerts.push({
        type: AlertType.THRESHOLD_EXCEEDED,
        severity: Severity.CRITICAL,
        nodeId: node.nodeId,
        status: AlertStatus.ACTIVE,
        message: `Critical utilization rate: ${(node.metrics.utilizationRate * 100).toFixed(1)}%`,
        metadata: {
          priority: 9,
          affectedNodes: [node.nodeId, ...node.connections],
          estimatedImpact: 'Capacity constraints may cause delays',
          recommendedActions: [
            'Redistribute load to connected nodes',
            'Increase capacity',
            'Activate backup suppliers'
          ]
        }
      });

      logger.info('Critical utilization threshold exceeded', {
        nodeId: node.nodeId,
        utilizationRate: node.metrics.utilizationRate
      });
    } else if (node.metrics.utilizationRate >= thresholds.utilizationRateHigh) {
      alerts.push({
        type: AlertType.THRESHOLD_EXCEEDED,
        severity: Severity.HIGH,
        nodeId: node.nodeId,
        status: AlertStatus.ACTIVE,
        message: `High utilization rate: ${(node.metrics.utilizationRate * 100).toFixed(1)}%`,
        metadata: {
          priority: 7,
          affectedNodes: [node.nodeId],
          estimatedImpact: 'Approaching capacity limits',
          recommendedActions: [
            'Monitor closely',
            'Prepare contingency plans'
          ]
        }
      });

      logger.info('High utilization threshold exceeded', {
        nodeId: node.nodeId,
        utilizationRate: node.metrics.utilizationRate
      });
    }
  }

  // Check inventory levels
  if (node.metrics?.currentInventory !== undefined && node.capacity > 0) {
    const inventoryRatio = node.metrics.currentInventory / node.capacity;

    if (inventoryRatio <= thresholds.inventoryCritical) {
      alerts.push({
        type: AlertType.THRESHOLD_EXCEEDED,
        severity: Severity.CRITICAL,
        nodeId: node.nodeId,
        status: AlertStatus.ACTIVE,
        message: `Critical inventory level: ${(inventoryRatio * 100).toFixed(1)}%`,
        metadata: {
          priority: 10,
          affectedNodes: [node.nodeId, ...node.connections],
          estimatedImpact: 'Risk of stockout',
          recommendedActions: [
            'Expedite replenishment',
            'Activate emergency suppliers',
            'Notify downstream nodes'
          ]
        }
      });

      logger.info('Critical inventory threshold exceeded', {
        nodeId: node.nodeId,
        inventoryRatio
      });
    } else if (inventoryRatio <= thresholds.inventoryLow) {
      alerts.push({
        type: AlertType.THRESHOLD_EXCEEDED,
        severity: Severity.MEDIUM,
        nodeId: node.nodeId,
        status: AlertStatus.ACTIVE,
        message: `Low inventory level: ${(inventoryRatio * 100).toFixed(1)}%`,
        metadata: {
          priority: 6,
          affectedNodes: [node.nodeId],
          estimatedImpact: 'Inventory running low',
          recommendedActions: [
            'Schedule replenishment',
            'Review demand forecast'
          ]
        }
      });

      logger.info('Low inventory threshold exceeded', {
        nodeId: node.nodeId,
        inventoryRatio
      });
    }
  }

  return alerts;
}

/**
 * Calculate alert priority based on severity and business criticality
 * Used by the prioritization algorithm
 */
export function calculatePriority(
  severity: Severity,
  businessCriticality: number = 5
): number {
  const severityWeights = {
    [Severity.LOW]: 2,
    [Severity.MEDIUM]: 5,
    [Severity.HIGH]: 8,
    [Severity.CRITICAL]: 10
  };

  const severityScore = severityWeights[severity];
  const criticalityScore = Math.min(Math.max(businessCriticality, 1), 10);

  // Weighted average: 70% severity, 30% criticality
  return Math.round(severityScore * 0.7 + criticalityScore * 0.3);
}

/**
 * Prioritize alerts based on severity and business criticality
 * Returns alerts sorted by priority (highest first)
 */
export function prioritizeAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    // First sort by priority
    if (b.metadata.priority !== a.metadata.priority) {
      return b.metadata.priority - a.metadata.priority;
    }

    // Then by severity
    const severityOrder = {
      [Severity.CRITICAL]: 4,
      [Severity.HIGH]: 3,
      [Severity.MEDIUM]: 2,
      [Severity.LOW]: 1
    };

    if (severityOrder[b.severity] !== severityOrder[a.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }

    // Finally by creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
