/**
 * User repository for DynamoDB operations
 */

import { BaseRepository } from './base-repository';
import { User, DynamoDBItem, AuditLog, AuditAction } from '../models/types';
import { validateUser } from '../models/validation';
import { randomUUID } from 'crypto';

export class UserRepository extends BaseRepository {
  /**
   * Create a new user
   */
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt' | 'version'>): Promise<User> {
    validateUser(user);

    const timestamp = this.generateTimestamp();
    const newUser: User = {
      ...user,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    const item: DynamoDBItem = {
      PK: `USER#${user.userId}`,
      SK: 'PROFILE',
      ...newUser
    };

    await this.putItem(item);
    await this.createAuditLog(user.userId, 'User', user.userId, AuditAction.CREATE, {});

    return newUser;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const item = await this.getItem(`USER#${userId}`, 'PROFILE');
    
    if (!item) {
      return null;
    }

    const { PK, SK, ...userData } = item;
    return userData as User;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updates: Partial<Omit<User, 'userId' | 'createdAt' | 'version'>>,
    currentVersion: number
  ): Promise<User> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: this.generateTimestamp()
    };

    await this.updateItem(
      `USER#${userId}`,
      'PROFILE',
      updatesWithTimestamp,
      currentVersion
    );

    const changes = Object.keys(updates).map(field => ({
      field,
      oldValue: null, // Would need to fetch old value first
      newValue: updates[field as keyof typeof updates]
    }));

    await this.createAuditLog(userId, 'User', userId, AuditAction.UPDATE, changes);

    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.deleteItem(`USER#${userId}`, 'PROFILE');
    await this.createAuditLog(userId, 'User', userId, AuditAction.DELETE, {});
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
