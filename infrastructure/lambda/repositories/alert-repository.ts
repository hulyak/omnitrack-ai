/**
 * Alert repository for DynamoDB operations
 */

import { BaseRepository, QueryOptions, QueryResult } from './base-repository';
import { Alert, DynamoDBItem, AlertStatus, Severity } from '../models/types';
import { validateAlert } from '../models/validation';
import { randomUUID } from 'crypto';

export class AlertRepository extends BaseRepository {
  /**
   * Create a new alert
   */
  async createAlert(
    alert: Omit<Alert, 'alertId' | 'createdAt' | 'version'>
  ): Promise<Alert> {
    const alertId = randomUUID();
    const timestamp = this.generateTimestamp();

    const newAlert: Alert = {
      alertId,
      ...alert,
      createdAt: timestamp,
      version: 1
    };

    validateAlert(newAlert);

    const item: DynamoDBItem = {
      PK: `ALERT#${alertId}`,
      SK: 'METADATA',
      GSI1PK: `ALERT#${alert.status}`,
      GSI1SK: timestamp,
      GSI2PK: `ALERT#${alert.severity}`,
      GSI2SK: timestamp,
      ...newAlert
    };

    await this.putItem(item);

    return newAlert;
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string): Promise<Alert | null> {
    const item = await this.getItem(`ALERT#${alertId}`, 'METADATA');
    
    if (!item) {
      return null;
    }

    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...alertData } = item;
    return alertData as Alert;
  }

  /**
   * Update alert (e.g., acknowledge)
   */
  async updateAlert(
    alertId: string,
    updates: Partial<Omit<Alert, 'alertId' | 'createdAt' | 'version'>>,
    currentVersion: number
  ): Promise<Alert> {
    // Update the main item
    await this.updateItem(
      `ALERT#${alertId}`,
      'METADATA',
      updates,
      currentVersion
    );

    // If status changed, update GSI1PK
    if (updates.status) {
      const alert = await this.getAlertById(alertId);
      if (alert) {
        const item: DynamoDBItem = {
          PK: `ALERT#${alertId}`,
          SK: 'METADATA',
          GSI1PK: `ALERT#${updates.status}`,
          GSI1SK: alert.createdAt,
          GSI2PK: `ALERT#${alert.severity}`,
          GSI2SK: alert.createdAt,
          ...alert,
          ...updates,
          version: currentVersion + 1
        };
        await this.putItem(item);
      }
    }

    const updatedAlert = await this.getAlertById(alertId);
    if (!updatedAlert) {
      throw new Error('Failed to retrieve updated alert');
    }

    return updatedAlert;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    await this.deleteItem(`ALERT#${alertId}`, 'METADATA');
  }

  /**
   * Get alerts by status
   */
  async getAlertsByStatus(
    status: AlertStatus,
    options?: QueryOptions
  ): Promise<QueryResult<Alert>> {
    const result = await this.queryGSI(`ALERT#${status}`, undefined, 'GSI1', options);

    const alerts = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...alertData } = item;
      return alertData as Alert;
    });

    return {
      items: alerts,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(
    severity: Severity,
    options?: QueryOptions
  ): Promise<QueryResult<Alert>> {
    const result = await this.queryGSI(`ALERT#${severity}`, undefined, 'GSI2', options);

    const alerts = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...alertData } = item;
      return alertData as Alert;
    });

    return {
      items: alerts,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Get alerts for a specific node
   */
  async getAlertsByNode(nodeId: string): Promise<Alert[]> {
    // This would require a scan or a separate GSI in production
    // For now, we'll get all active alerts and filter
    const result = await this.getAlertsByStatus(AlertStatus.ACTIVE);
    return result.items.filter(alert => alert.nodeId === nodeId);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string, currentVersion: number): Promise<Alert> {
    const updates = {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: userId,
      acknowledgedAt: this.generateTimestamp()
    };

    return this.updateAlert(alertId, updates, currentVersion);
  }
}
