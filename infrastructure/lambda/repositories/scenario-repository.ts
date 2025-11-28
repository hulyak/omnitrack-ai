/**
 * Scenario repository for DynamoDB operations
 */

import { BaseRepository, QueryOptions, QueryResult } from './base-repository';
import { Scenario, ScenarioResult, DynamoDBItem, AuditLog, AuditAction } from '../models/types';
import { validateScenario } from '../models/validation';
import { randomUUID } from 'crypto';

export class ScenarioRepository extends BaseRepository {
  /**
   * Create a new scenario
   */
  async createScenario(
    scenario: Omit<Scenario, 'scenarioId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Scenario> {
    const scenarioId = randomUUID();
    const timestamp = this.generateTimestamp();

    const newScenario: Scenario = {
      scenarioId,
      ...scenario,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    validateScenario(newScenario);

    const item: DynamoDBItem = {
      PK: `SCENARIO#${scenarioId}`,
      SK: 'DEFINITION',
      GSI1PK: 'SCENARIO',
      GSI1SK: timestamp,
      ...newScenario
    };

    await this.putItem(item);
    await this.createAuditLog(scenario.createdBy, 'Scenario', scenarioId, AuditAction.CREATE, {});

    return newScenario;
  }

  /**
   * Get scenario by ID
   */
  async getScenarioById(scenarioId: string): Promise<Scenario | null> {
    const item = await this.getItem(`SCENARIO#${scenarioId}`, 'DEFINITION');
    
    if (!item) {
      return null;
    }

    const { PK, SK, GSI1PK, GSI1SK, ...scenarioData } = item;
    return scenarioData as Scenario;
  }

  /**
   * Update scenario
   */
  async updateScenario(
    scenarioId: string,
    userId: string,
    updates: Partial<Omit<Scenario, 'scenarioId' | 'createdAt' | 'createdBy' | 'version'>>,
    currentVersion: number
  ): Promise<Scenario> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: this.generateTimestamp()
    };

    await this.updateItem(
      `SCENARIO#${scenarioId}`,
      'DEFINITION',
      updatesWithTimestamp,
      currentVersion
    );

    const changes = Object.keys(updates).map(field => ({
      field,
      oldValue: null,
      newValue: updates[field as keyof typeof updates]
    }));

    await this.createAuditLog(userId, 'Scenario', scenarioId, AuditAction.UPDATE, changes);

    const updatedScenario = await this.getScenarioById(scenarioId);
    if (!updatedScenario) {
      throw new Error('Failed to retrieve updated scenario');
    }

    return updatedScenario;
  }

  /**
   * Delete scenario
   */
  async deleteScenario(scenarioId: string, userId: string): Promise<void> {
    await this.deleteItem(`SCENARIO#${scenarioId}`, 'DEFINITION');
    await this.createAuditLog(userId, 'Scenario', scenarioId, AuditAction.DELETE, {});
  }

  /**
   * List scenarios with pagination
   */
  async listScenarios(options?: QueryOptions): Promise<QueryResult<Scenario>> {
    const result = await this.queryGSI('SCENARIO', undefined, 'GSI1', options);

    const scenarios = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, ...scenarioData } = item;
      return scenarioData as Scenario;
    });

    return {
      items: scenarios,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Get scenarios by user
   */
  async getScenariosByUser(userId: string, options?: QueryOptions): Promise<QueryResult<Scenario>> {
    const result = await this.query(
      `USER#${userId}`,
      { operator: 'begins_with', value: 'SCENARIO#' },
      options
    );

    const scenarioIds = result.items.map(item => item.SK.replace('SCENARIO#', ''));
    
    if (scenarioIds.length === 0) {
      return { items: [], lastEvaluatedKey: result.lastEvaluatedKey };
    }

    const scenarios = await Promise.all(
      scenarioIds.map(id => this.getScenarioById(id))
    );

    return {
      items: scenarios.filter((s): s is Scenario => s !== null),
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Save scenario result
   */
  async saveScenarioResult(result: ScenarioResult): Promise<void> {
    const item: DynamoDBItem = {
      PK: `SCENARIO#${result.scenarioId}`,
      SK: `RESULT#${result.timestamp}`,
      ...result
    };

    await this.putItem(item);
  }

  /**
   * Get scenario results
   */
  async getScenarioResults(
    scenarioId: string,
    options?: QueryOptions
  ): Promise<QueryResult<ScenarioResult>> {
    const result = await this.query(
      `SCENARIO#${scenarioId}`,
      { operator: 'begins_with', value: 'RESULT#' },
      options
    );

    const results = result.items.map(item => {
      const { PK, SK, ...resultData } = item;
      return resultData as ScenarioResult;
    });

    return {
      items: results,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    entityType: string,
    entityId: string,
    action: AuditAction,
    changes: any
  ): Promise<void> {
    const auditId = randomUUID();
    const timestamp = this.generateTimestamp();

    const auditLog: AuditLog = {
      auditId,
      entityType,
      entityId,
      action,
      userId,
      timestamp,
      changes: Array.isArray(changes) ? changes : [],
      version: 1,
      metadata: {}
    };

    const item: DynamoDBItem = {
      PK: `AUDIT#${entityType}#${entityId}`,
      SK: `LOG#${timestamp}`,
      GSI1PK: 'AUDIT',
      GSI1SK: timestamp,
      ...auditLog
    };

    await this.putItem(item);
  }
}
