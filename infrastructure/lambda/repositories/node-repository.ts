/**
 * Node repository for DynamoDB operations
 */

import { BaseRepository, QueryOptions, QueryResult } from './base-repository';
import { Node, DynamoDBItem } from '../models/types';
import { validateNode } from '../models/validation';
import { randomUUID } from 'crypto';

export class NodeRepository extends BaseRepository {
  /**
   * Create a new node
   */
  async createNode(
    node: Omit<Node, 'nodeId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Node> {
    const nodeId = randomUUID();
    const timestamp = this.generateTimestamp();

    const newNode: Node = {
      nodeId,
      ...node,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    validateNode(newNode);

    const item: DynamoDBItem = {
      PK: `NODE#${nodeId}`,
      SK: 'METADATA',
      ...newNode
    };

    await this.putItem(item);

    return newNode;
  }

  /**
   * Get node by ID
   */
  async getNodeById(nodeId: string): Promise<Node | null> {
    const item = await this.getItem(`NODE#${nodeId}`, 'METADATA');
    
    if (!item) {
      return null;
    }

    const { PK, SK, ...nodeData } = item;
    return nodeData as Node;
  }

  /**
   * Update node
   */
  async updateNode(
    nodeId: string,
    updates: Partial<Omit<Node, 'nodeId' | 'createdAt' | 'version'>>,
    currentVersion: number
  ): Promise<Node> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: this.generateTimestamp()
    };

    await this.updateItem(
      `NODE#${nodeId}`,
      'METADATA',
      updatesWithTimestamp,
      currentVersion
    );

    const updatedNode = await this.getNodeById(nodeId);
    if (!updatedNode) {
      throw new Error('Failed to retrieve updated node');
    }

    return updatedNode;
  }

  /**
   * Delete node
   */
  async deleteNode(nodeId: string): Promise<void> {
    await this.deleteItem(`NODE#${nodeId}`, 'METADATA');
  }

  /**
   * Get multiple nodes by IDs
   */
  async getNodesByIds(nodeIds: string[]): Promise<Node[]> {
    if (nodeIds.length === 0) {
      return [];
    }

    const keys = nodeIds.map(id => ({ pk: `NODE#${id}`, sk: 'METADATA' }));
    const items = await this.batchGetItems(keys);

    return items.map(item => {
      const { PK, SK, ...nodeData } = item;
      return nodeData as Node;
    });
  }

  /**
   * Update node status
   */
  async updateNodeStatus(
    nodeId: string,
    status: Node['status'],
    currentVersion: number
  ): Promise<Node> {
    return this.updateNode(nodeId, { status }, currentVersion);
  }

  /**
   * Update node metrics
   */
  async updateNodeMetrics(
    nodeId: string,
    metrics: Node['metrics'],
    currentVersion: number
  ): Promise<Node> {
    return this.updateNode(nodeId, { metrics }, currentVersion);
  }
}
