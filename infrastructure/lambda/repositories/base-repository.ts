/**
 * Base repository with common DynamoDB operations
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  BatchGetItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand as DocQueryCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBItem } from '../models/types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'omnitrack-main';

export interface QueryOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
  scanIndexForward?: boolean;
  indexName?: string;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
}

export class BaseRepository {
  protected tableName: string;

  constructor(tableName?: string) {
    this.tableName = tableName || TABLE_NAME;
  }

  /**
   * Get item by primary key
   */
  protected async getItem(pk: string, sk: string): Promise<DynamoDBItem | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk }
    });

    const response = await docClient.send(command);
    return response.Item as DynamoDBItem || null;
  }

  /**
   * Put item (create or replace)
   */
  protected async putItem(item: DynamoDBItem): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    await docClient.send(command);
  }

  /**
   * Update item with optimistic locking
   */
  protected async updateItem(
    pk: string,
    sk: string,
    updates: Record<string, any>,
    currentVersion: number
  ): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression
    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    // Increment version
    updateExpressions.push('#version = :newVersion');
    expressionAttributeNames['#version'] = 'version';
    expressionAttributeValues[':newVersion'] = currentVersion + 1;
    expressionAttributeValues[':currentVersion'] = currentVersion;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: '#version = :currentVersion'
    });

    await docClient.send(command);
  }

  /**
   * Delete item
   */
  protected async deleteItem(pk: string, sk: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk }
    });

    await docClient.send(command);
  }

  /**
   * Query items by partition key
   */
  protected async query(
    pk: string,
    skCondition?: { operator: string; value: string },
    options?: QueryOptions
  ): Promise<QueryResult<DynamoDBItem>> {
    let keyConditionExpression = 'PK = :pk';
    const expressionAttributeValues: Record<string, any> = { ':pk': pk };

    if (skCondition) {
      keyConditionExpression += ` AND SK ${skCondition.operator} :sk`;
      expressionAttributeValues[':sk'] = skCondition.value;
    }

    const command = new DocQueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: options?.limit,
      ExclusiveStartKey: options?.exclusiveStartKey,
      ScanIndexForward: options?.scanIndexForward,
      IndexName: options?.indexName
    });

    const response = await docClient.send(command);

    return {
      items: (response.Items as DynamoDBItem[]) || [],
      lastEvaluatedKey: response.LastEvaluatedKey
    };
  }

  /**
   * Query items using GSI
   */
  protected async queryGSI(
    gsiPK: string,
    gsiSK?: string,
    indexName: string = 'GSI1',
    options?: QueryOptions
  ): Promise<QueryResult<DynamoDBItem>> {
    const pkName = indexName === 'GSI1' ? 'GSI1PK' : 'GSI2PK';
    const skName = indexName === 'GSI1' ? 'GSI1SK' : 'GSI2SK';

    let keyConditionExpression = `${pkName} = :gsiPK`;
    const expressionAttributeValues: Record<string, any> = { ':gsiPK': gsiPK };

    if (gsiSK) {
      keyConditionExpression += ` AND ${skName} = :gsiSK`;
      expressionAttributeValues[':gsiSK'] = gsiSK;
    }

    const command = new DocQueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: options?.limit,
      ExclusiveStartKey: options?.exclusiveStartKey,
      ScanIndexForward: options?.scanIndexForward
    });

    const response = await docClient.send(command);

    return {
      items: (response.Items as DynamoDBItem[]) || [],
      lastEvaluatedKey: response.LastEvaluatedKey
    };
  }

  /**
   * Batch get items
   */
  protected async batchGetItems(keys: Array<{ pk: string; sk: string }>): Promise<DynamoDBItem[]> {
    if (keys.length === 0) {
      return [];
    }

    const command = new BatchGetCommand({
      RequestItems: {
        [this.tableName]: {
          Keys: keys.map(k => ({ PK: k.pk, SK: k.sk }))
        }
      }
    });

    const response = await docClient.send(command);
    return (response.Responses?.[this.tableName] as DynamoDBItem[]) || [];
  }

  /**
   * Generate timestamp in ISO format
   */
  protected generateTimestamp(): string {
    return new Date().toISOString();
  }
}
