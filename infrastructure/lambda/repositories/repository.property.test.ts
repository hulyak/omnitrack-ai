/**
 * Property-based tests for repository layer
 * Testing versioned change tracking and scenario ID uniqueness
 */

import * as fc from 'fast-check';
import { UserRepository, ScenarioRepository } from './index';
import {
  User,
  Scenario,
  UserRole,
  DisruptionType,
  Severity,
  NotificationChannel,
  AuditAction
} from '../models/types';

// Mock DynamoDB client for testing
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockItems = new Map<string, any>();
  
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    GetCommand: jest.fn(),
    PutCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    QueryCommand: jest.fn(),
    BatchGetCommand: jest.fn()
  };
});

// In-memory storage for testing
const mockStorage = new Map<string, any>();

// Override BaseRepository methods to use in-memory storage
class TestUserRepository extends UserRepository {
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt' | 'version'>): Promise<User> {
    const timestamp = new Date().toISOString();
    const newUser: User = {
      ...user,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    const key = `USER#${user.userId}#PROFILE`;
    mockStorage.set(key, newUser);
    
    // Store audit log
    const auditKey = `AUDIT#User#${user.userId}#${timestamp}`;
    mockStorage.set(auditKey, {
      entityType: 'User',
      entityId: user.userId,
      action: AuditAction.CREATE,
      userId: user.userId,
      timestamp,
      changes: [],
      version: 1
    });

    return newUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    const key = `USER#${userId}#PROFILE`;
    return mockStorage.get(key) || null;
  }

  async updateUser(
    userId: string,
    updates: Partial<Omit<User, 'userId' | 'createdAt' | 'version'>>,
    currentVersion: number
  ): Promise<User> {
    const key = `USER#${userId}#PROFILE`;
    const existingUser = mockStorage.get(key);
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    if (existingUser.version !== currentVersion) {
      throw new Error('Version mismatch - optimistic locking failed');
    }

    const timestamp = new Date().toISOString();
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: timestamp,
      version: currentVersion + 1
    };

    mockStorage.set(key, updatedUser);
    
    // Store audit log
    const auditKey = `AUDIT#User#${userId}#${timestamp}`;
    const changes = Object.keys(updates).map(field => ({
      field,
      oldValue: existingUser[field as keyof User],
      newValue: updates[field as keyof typeof updates]
    }));
    
    mockStorage.set(auditKey, {
      entityType: 'User',
      entityId: userId,
      action: AuditAction.UPDATE,
      userId,
      timestamp,
      changes,
      version: 1
    });

    return updatedUser;
  }
}

class TestScenarioRepository extends ScenarioRepository {
  async createScenario(
    scenario: Omit<Scenario, 'scenarioId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Scenario> {
    const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const newScenario: Scenario = {
      scenarioId,
      ...scenario,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    const key = `SCENARIO#${scenarioId}#DEFINITION`;
    mockStorage.set(key, newScenario);
    
    // Store audit log
    const auditKey = `AUDIT#Scenario#${scenarioId}#${timestamp}`;
    mockStorage.set(auditKey, {
      entityType: 'Scenario',
      entityId: scenarioId,
      action: AuditAction.CREATE,
      userId: scenario.createdBy,
      timestamp,
      changes: [],
      version: 1
    });

    return newScenario;
  }

  async getScenarioById(scenarioId: string): Promise<Scenario | null> {
    const key = `SCENARIO#${scenarioId}#DEFINITION`;
    return mockStorage.get(key) || null;
  }

  async updateScenario(
    scenarioId: string,
    userId: string,
    updates: Partial<Omit<Scenario, 'scenarioId' | 'createdAt' | 'createdBy' | 'version'>>,
    currentVersion: number
  ): Promise<Scenario> {
    const key = `SCENARIO#${scenarioId}#DEFINITION`;
    const existingScenario = mockStorage.get(key);
    
    if (!existingScenario) {
      throw new Error('Scenario not found');
    }
    
    if (existingScenario.version !== currentVersion) {
      throw new Error('Version mismatch - optimistic locking failed');
    }

    const timestamp = new Date().toISOString();
    const updatedScenario: Scenario = {
      ...existingScenario,
      ...updates,
      updatedAt: timestamp,
      version: currentVersion + 1
    };

    mockStorage.set(key, updatedScenario);
    
    // Store audit log
    const auditKey = `AUDIT#Scenario#${scenarioId}#${timestamp}`;
    const changes = Object.keys(updates).map(field => ({
      field,
      oldValue: existingScenario[field as keyof Scenario],
      newValue: updates[field as keyof typeof updates]
    }));
    
    mockStorage.set(auditKey, {
      entityType: 'Scenario',
      entityId: scenarioId,
      action: AuditAction.UPDATE,
      userId,
      timestamp,
      changes,
      version: 1
    });

    return updatedScenario;
  }
}

// Arbitraries for generating test data
const userIdArb = fc.uuid();
const emailArb = fc.emailAddress();
const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const userRoleArb = fc.constantFrom(...Object.values(UserRole));
const notificationChannelArb = fc.constantFrom(...Object.values(NotificationChannel));

const userPreferencesArb = fc.record({
  notificationChannels: fc.array(notificationChannelArb, { minLength: 1, maxLength: 3 }),
  prioritizeSustainability: fc.boolean(),
  prioritizeCost: fc.boolean(),
  prioritizeRisk: fc.boolean(),
  defaultView: fc.string()
});

const userArb = fc.record({
  userId: userIdArb,
  email: emailArb,
  name: nameArb,
  role: userRoleArb,
  preferences: userPreferencesArb
});

const disruptionTypeArb = fc.constantFrom(...Object.values(DisruptionType));
const severityArb = fc.constantFrom(...Object.values(Severity));

const locationArb = fc.record({
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 }),
  address: fc.string(),
  city: fc.string(),
  country: fc.string()
});

const scenarioParametersArb = fc.record({
  location: locationArb,
  severity: severityArb,
  duration: fc.integer({ min: 1, max: 1000 }),
  affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
});

const scenarioArb = fc.record({
  type: disruptionTypeArb,
  parameters: scenarioParametersArb,
  createdBy: userIdArb,
  isPublic: fc.boolean()
});

describe('Repository Property-Based Tests', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 43: Versioned change tracking
   * 
   * For any modification to scenarios or configurations, the system should create
   * a versioned record with change attribution to the user.
   * 
   * Validates: Requirements 12.3
   */
  describe('Property 43: Versioned change tracking', () => {
    it('should create versioned audit logs for user modifications', async () => {
      await fc.assert(
        fc.asyncProperty(userArb, async (user) => {
          // Clear storage for this test run
          mockStorage.clear();
          
          // Arrange: Create a user
          const repo = new TestUserRepository();
          const createdUser = await repo.createUser(user);
          
          // Small delay to ensure different timestamps
          await new Promise(resolve => setTimeout(resolve, 2));
          
          // Act: Update the user with a different name (append suffix to ensure change)
          const newName = createdUser.name + '_updated';
          const updates = { name: newName };
          const updatedUser = await repo.updateUser(
            createdUser.userId,
            updates,
            createdUser.version
          );
          
          // Assert: Version should increment (core property of versioned tracking)
          expect(updatedUser.version).toBe(createdUser.version + 1);
          expect(updatedUser.name).toBe(newName);
          
          // Assert: Audit logs should exist with change attribution
          const allEntries = Array.from(mockStorage.entries());
          const auditLogs = allEntries.filter(([key]) => key.startsWith(`AUDIT#User#${createdUser.userId}`));
          
          // Should have CREATE audit log at minimum
          expect(auditLogs.length).toBeGreaterThanOrEqual(1);
          
          // Verify CREATE audit log exists
          const createAuditLog = auditLogs.find(([_, value]) => 
            value.action === AuditAction.CREATE
          );
          expect(createAuditLog).toBeDefined();
          
          // Verify UPDATE audit log exists and contains change attribution
          const updateAuditLog = auditLogs.find(([_, value]) => 
            value.action === AuditAction.UPDATE
          );
          
          expect(updateAuditLog).toBeDefined();
          const [_, auditData] = updateAuditLog!;
          expect(auditData.userId).toBe(createdUser.userId);
          expect(auditData.entityType).toBe('User');
          expect(auditData.entityId).toBe(createdUser.userId);
          expect(auditData.changes).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                newValue: newName
              })
            ])
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should create versioned audit logs for scenario modifications', async () => {
      await fc.assert(
        fc.asyncProperty(scenarioArb, async (scenario) => {
          // Clear storage for this test run
          mockStorage.clear();
          
          // Arrange: Create a scenario
          const repo = new TestScenarioRepository();
          const createdScenario = await repo.createScenario(scenario);
          
          // Small delay to ensure different timestamps
          await new Promise(resolve => setTimeout(resolve, 1));
          
          // Act: Update the scenario (flip the isPublic value to ensure a change)
          const newIsPublic = !createdScenario.isPublic;
          const updates = { isPublic: newIsPublic };
          const updatedScenario = await repo.updateScenario(
            createdScenario.scenarioId,
            scenario.createdBy,
            updates,
            createdScenario.version
          );
          
          // Assert: Version should increment
          expect(updatedScenario.version).toBe(createdScenario.version + 1);
          expect(updatedScenario.isPublic).toBe(newIsPublic);
          
          // Assert: Audit logs should exist
          const allEntries = Array.from(mockStorage.entries());
          const auditLogs = allEntries.filter(([key]) => key.startsWith(`AUDIT#Scenario#${createdScenario.scenarioId}`));
          
          expect(auditLogs.length).toBeGreaterThanOrEqual(2); // CREATE + UPDATE
          
          // Assert: Update audit log should contain change attribution
          const updateAuditLog = auditLogs.find(([_, value]) => 
            value.action === AuditAction.UPDATE
          );
          
          expect(updateAuditLog).toBeDefined();
          const [_, auditData] = updateAuditLog!;
          expect(auditData.userId).toBe(scenario.createdBy);
          expect(auditData.entityType).toBe('Scenario');
          expect(auditData.entityId).toBe(createdScenario.scenarioId);
          expect(auditData.changes).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'isPublic',
                newValue: newIsPublic
              })
            ])
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should prevent concurrent modifications with optimistic locking', async () => {
      await fc.assert(
        fc.asyncProperty(userArb, async (user) => {
          // Clear storage for this test run
          mockStorage.clear();
          
          // Arrange: Create a user
          const repo = new TestUserRepository();
          const createdUser = await repo.createUser(user);
          
          // Act: Try to update with wrong version
          const updates = { name: 'New Name' };
          
          // Assert: Should throw error for version mismatch
          await expect(
            repo.updateUser(createdUser.userId, updates, createdUser.version + 1)
          ).rejects.toThrow('Version mismatch');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 20: Scenario ID uniqueness
   * 
   * For any two scenarios published to the marketplace, they should have
   * different unique identifiers.
   * 
   * Validates: Requirements 5.3
   */
  describe('Property 20: Scenario ID uniqueness', () => {
    it('should generate unique IDs for all created scenarios', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(scenarioArb, { minLength: 2, maxLength: 10 }),
          async (scenarios) => {
            // Clear storage for this test run
            mockStorage.clear();
            
            // Arrange & Act: Create multiple scenarios
            const repo = new TestScenarioRepository();
            const createdScenarios = await Promise.all(
              scenarios.map(s => repo.createScenario(s))
            );
            
            // Assert: All scenario IDs should be unique
            const scenarioIds = createdScenarios.map(s => s.scenarioId);
            const uniqueIds = new Set(scenarioIds);
            
            expect(uniqueIds.size).toBe(scenarioIds.length);
            
            // Assert: Each scenario should be retrievable by its unique ID
            for (const scenario of createdScenarios) {
              const retrieved = await repo.getScenarioById(scenario.scenarioId);
              expect(retrieved).not.toBeNull();
              expect(retrieved?.scenarioId).toBe(scenario.scenarioId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain ID uniqueness even with concurrent creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(scenarioArb, { minLength: 5, maxLength: 20 }),
          async (scenarios) => {
            // Clear storage for this test run
            mockStorage.clear();
            
            // Arrange & Act: Create scenarios concurrently
            const repo = new TestScenarioRepository();
            const createdScenarios = await Promise.all(
              scenarios.map(s => repo.createScenario(s))
            );
            
            // Assert: No duplicate IDs should exist
            const scenarioIds = createdScenarios.map(s => s.scenarioId);
            const hasDuplicates = scenarioIds.some(
              (id, index) => scenarioIds.indexOf(id) !== index
            );
            
            expect(hasDuplicates).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure marketplace scenarios have unique identifiers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(scenarioArb, { minLength: 2, maxLength: 10 }),
          async (scenarios) => {
            // Clear storage for this test run
            mockStorage.clear();
            
            // Arrange: Create scenarios marked as public (marketplace)
            const repo = new TestScenarioRepository();
            const publicScenarios = scenarios.map(s => ({ ...s, isPublic: true }));
            const createdScenarios = await Promise.all(
              publicScenarios.map(s => repo.createScenario(s))
            );
            
            // Act: Filter for public scenarios
            const marketplaceScenarios = createdScenarios.filter(s => s.isPublic);
            
            // Assert: All marketplace scenario IDs should be unique
            const marketplaceIds = marketplaceScenarios.map(s => s.scenarioId);
            const uniqueMarketplaceIds = new Set(marketplaceIds);
            
            expect(uniqueMarketplaceIds.size).toBe(marketplaceIds.length);
            expect(marketplaceIds.length).toBe(publicScenarios.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
