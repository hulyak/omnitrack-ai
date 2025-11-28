/**
 * Property-based tests for Audit Logging Service
 * Feature: omnitrack-ai-supply-chain
 */

import * as fc from 'fast-check';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { AwsStub } from 'aws-sdk-client-mock';
import {
  logDataAccess,
  logDataModification,
  queryAuditLogs,
  DataClassification,
  AuditEventType,
  ChangeRecord,
} from './audit-service';

const dynamoMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

describe('Audit Service Property Tests', () => {
  beforeEach(() => {
    dynamoMock.reset();
    snsMock.reset();
    // Set environment variable for SNS topic
    process.env.SECURITY_ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:security-alerts';
  });

  afterEach(() => {
    delete process.env.SECURITY_ALERT_TOPIC_ARN;
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 42: Access audit trail
   * 
   * For any access to sensitive supply chain data, the system should record
   * the access in audit logs with data classification level.
   * 
   * Validates: Requirements 12.2
   */
  describe('Property 42: Access audit trail', () => {
    it('should record all sensitive data access with classification level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            resourceType: fc.constantFrom('SCENARIO', 'NODE', 'ALERT', 'FEEDBACK'),
            resourceId: fc.uuid(),
            dataClassification: fc.constantFrom(
              DataClassification.CONFIDENTIAL,
              DataClassification.RESTRICTED
            ),
            sourceIp: fc.ipV4(),
            action: fc.constantFrom('READ', 'QUERY', 'EXPORT'),
            userAgent: fc.string({ minLength: 10, maxLength: 100 }),
          }),
          async (accessData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            dynamoMock.on(PutCommand).resolves({});
            dynamoMock.on(QueryCommand).resolves({ Items: [] });

            await logDataAccess(
              accessData.userIdentity,
              accessData.resourceType,
              accessData.resourceId,
              accessData.dataClassification,
              accessData.sourceIp,
              accessData.action,
              accessData.userAgent
            );

            // Verify that PutCommand was called
            const putCalls = dynamoMock.commandCalls(PutCommand);
            expect(putCalls.length).toBeGreaterThanOrEqual(1);

            // Verify the audit log entry contains all required fields
            const auditEntry = putCalls[0].args[0].input.Item;
            expect(auditEntry).toBeDefined();
            if (auditEntry) {
              expect(auditEntry.eventType).toBe(AuditEventType.DATA_ACCESS);
              expect(auditEntry.userIdentity).toBe(accessData.userIdentity);
              expect(auditEntry.resourceType).toBe(accessData.resourceType);
              expect(auditEntry.resourceId).toBe(accessData.resourceId);
              expect(auditEntry.dataClassification).toBe(accessData.dataClassification);
              expect(auditEntry.sourceIp).toBe(accessData.sourceIp);
              expect(auditEntry.action).toBe(accessData.action);
              expect(auditEntry.timestamp).toBeDefined();
              expect(auditEntry.success).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data classification in all access logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            resourceType: fc.string({ minLength: 3, maxLength: 20 }),
            resourceId: fc.uuid(),
            dataClassification: fc.constantFrom(
              DataClassification.PUBLIC,
              DataClassification.INTERNAL,
              DataClassification.CONFIDENTIAL,
              DataClassification.RESTRICTED
            ),
            sourceIp: fc.ipV4(),
            action: fc.string({ minLength: 3, maxLength: 20 }),
          }),
          async (accessData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            dynamoMock.on(PutCommand).resolves({});
            dynamoMock.on(QueryCommand).resolves({ Items: [] });

            await logDataAccess(
              accessData.userIdentity,
              accessData.resourceType,
              accessData.resourceId,
              accessData.dataClassification,
              accessData.sourceIp,
              accessData.action
            );

            const putCalls = dynamoMock.commandCalls(PutCommand);
            const auditEntry = putCalls[0].args[0].input.Item;

            // Property: dataClassification must always be present and match input
            expect(auditEntry).toBeDefined();
            if (auditEntry) {
              expect(auditEntry.dataClassification).toBe(accessData.dataClassification);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 44: Audit query performance
   * 
   * For any audit log query spanning up to 90 days, the system should return
   * results within 10 seconds.
   * 
   * Validates: Requirements 12.4
   */
  describe('Property 44: Audit query performance', () => {
    it('should complete queries within 10 seconds for any valid filter combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.option(fc.emailAddress(), { nil: undefined }),
            eventType: fc.option(
              fc.constantFrom(
                AuditEventType.AUTHENTICATION,
                AuditEventType.DATA_ACCESS,
                AuditEventType.DATA_MODIFICATION
              ),
              { nil: undefined }
            ),
            resourceType: fc.option(fc.constantFrom('SCENARIO', 'NODE', 'ALERT'), {
              nil: undefined,
            }),
            resourceId: fc.option(fc.uuid(), { nil: undefined }),
            daysAgo: fc.integer({ min: 1, max: 90 }),
            limit: fc.integer({ min: 10, max: 500 }),
          }),
          async (queryParams) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            // Generate mock data
            const mockResults = Array.from({ length: Math.min(queryParams.limit, 100) }, (_, i) => ({
              PK: 'AUDIT#ACCESS',
              SK: `${new Date().toISOString()}#user${i}`,
              eventType: AuditEventType.DATA_ACCESS,
              timestamp: new Date().toISOString(),
              userIdentity: `user${i}@example.com`,
              sourceIp: '192.168.1.1',
              success: true,
              action: 'READ',
            }));

            dynamoMock.on(QueryCommand).resolves({ Items: mockResults });

            const startDate = new Date(Date.now() - queryParams.daysAgo * 24 * 60 * 60 * 1000).toISOString();

            // Build filters, ensuring at least one valid combination is provided
            const filters: any = {};
            if (queryParams.userIdentity) filters.userIdentity = queryParams.userIdentity;
            if (queryParams.eventType) filters.eventType = queryParams.eventType;
            
            // resourceType and resourceId must be provided together
            if (queryParams.resourceType && queryParams.resourceId) {
              filters.resourceType = queryParams.resourceType;
              filters.resourceId = queryParams.resourceId;
            }
            
            // Ensure at least one valid filter is provided (required by queryAuditLogs)
            if (!filters.userIdentity && !filters.eventType && !filters.resourceType) {
              filters.eventType = AuditEventType.DATA_ACCESS; // Default filter
            }
            
            filters.startDate = startDate;

            const startTime = Date.now();
            const results = await queryAuditLogs(filters, queryParams.limit);
            const queryTime = Date.now() - startTime;

            // Property: Query must complete within 10 seconds (10000ms)
            expect(queryTime).toBeLessThan(10000);
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle 90-day queries efficiently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            limit: fc.integer({ min: 50, max: 200 }),
          }),
          async (queryParams) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            const mockResults = Array.from({ length: queryParams.limit }, (_, i) => ({
              PK: `AUDIT#USER#${queryParams.userIdentity}`,
              SK: `${new Date(Date.now() - i * 60000).toISOString()}#event${i}`,
              GSI1PK: `AUDIT#USER#${queryParams.userIdentity}`,
              GSI1SK: new Date(Date.now() - i * 60000).toISOString(),
              eventType: AuditEventType.DATA_ACCESS,
              timestamp: new Date(Date.now() - i * 60000).toISOString(),
              userIdentity: queryParams.userIdentity,
              sourceIp: '192.168.1.1',
              success: true,
              action: 'READ',
            }));

            dynamoMock.on(QueryCommand).resolves({ Items: mockResults });

            // Query for exactly 90 days
            const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            const endDate = new Date().toISOString();

            const startTime = Date.now();
            const results = await queryAuditLogs(
              {
                userIdentity: queryParams.userIdentity,
                startDate,
                endDate,
              },
              queryParams.limit
            );
            const queryTime = Date.now() - startTime;

            // Property: 90-day queries must complete within 10 seconds
            expect(queryTime).toBeLessThan(10000);
            expect(results.length).toBeLessThanOrEqual(queryParams.limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 45: Security automation
   * 
   * For any detected suspicious activity pattern, the system should generate
   * security alerts and temporarily restrict the affected account.
   * 
   * Validates: Requirements 12.5
   */
  describe('Property 45: Security automation', () => {
    it('should generate security alerts for multiple failed login attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            sourceIp: fc.ipV4(),
            failedAttempts: fc.integer({ min: 5, max: 20 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            // Mock recent failed authentication events
            const recentFailedEvents = Array.from(
              { length: testData.failedAttempts },
              (_, i) => ({
                PK: `AUDIT#USER#${testData.userIdentity}`,
                SK: `${new Date(Date.now() - i * 10000).toISOString()}#${testData.userIdentity}`,
                GSI1PK: `AUDIT#USER#${testData.userIdentity}`,
                GSI1SK: new Date(Date.now() - i * 10000).toISOString(),
                eventType: AuditEventType.AUTHENTICATION,
                timestamp: new Date(Date.now() - i * 10000).toISOString(),
                userIdentity: testData.userIdentity,
                sourceIp: testData.sourceIp,
                success: false,
                action: 'LOGIN',
              })
            );

            dynamoMock.on(QueryCommand).resolves({ Items: recentFailedEvents });
            dynamoMock.on(PutCommand).resolves({});
            snsMock.on(PublishCommand).resolves({ MessageId: 'test-message-id' });

            // Import the function that triggers suspicious activity check
            const { logAuthenticationEvent } = await import('./audit-service');

            await logAuthenticationEvent(
              testData.userIdentity,
              testData.sourceIp,
              'LOGIN',
              false, // Failed login
              'Mozilla/5.0'
            );

            // Property: Security alert should be generated for 5+ failed attempts
            const putCalls = dynamoMock.commandCalls(PutCommand);
            const securityEvents = putCalls.filter(
              (call: any) => call.args[0].input.Item?.eventType === AuditEventType.SECURITY_EVENT
            );

            if (testData.failedAttempts >= 5) {
              // Property: Security alert should be generated for 5+ failed attempts
              expect(securityEvents.length).toBeGreaterThan(0);

              // Verify at least one alert contains complete pattern information
              const hasValidAlert = securityEvents.some((call: any) => {
                const event = call.args[0].input.Item;
                return (
                  event &&
                  event.eventType === AuditEventType.SECURITY_EVENT &&
                  event.metadata?.patternType &&
                  event.metadata?.severity &&
                  event.metadata?.description &&
                  event.metadata?.eventCount > 0
                );
              });
              expect(hasValidAlert).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect and alert on distributed attack patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            ipAddresses: fc.uniqueArray(fc.ipV4(), { minLength: 3, maxLength: 10 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            // Mock failed login attempts from multiple IPs
            const recentFailedEvents = testData.ipAddresses.map((ip, i) => ({
              PK: `AUDIT#USER#${testData.userIdentity}`,
              SK: `${new Date(Date.now() - i * 10000).toISOString()}#${testData.userIdentity}`,
              GSI1PK: `AUDIT#USER#${testData.userIdentity}`,
              GSI1SK: new Date(Date.now() - i * 10000).toISOString(),
              eventType: AuditEventType.AUTHENTICATION,
              timestamp: new Date(Date.now() - i * 10000).toISOString(),
              userIdentity: testData.userIdentity,
              sourceIp: ip,
              success: false,
              action: 'LOGIN',
            }));

            dynamoMock.on(QueryCommand).resolves({ Items: recentFailedEvents });
            dynamoMock.on(PutCommand).resolves({});
            snsMock.on(PublishCommand).resolves({ MessageId: 'test-message-id' });

            const { logAuthenticationEvent } = await import('./audit-service');

            await logAuthenticationEvent(
              testData.userIdentity,
              testData.ipAddresses[0],
              'LOGIN',
              false,
              'Mozilla/5.0'
            );

            // Property: Alert should be generated for attacks from 3+ different IPs
            const putCalls = dynamoMock.commandCalls(PutCommand);
            const securityEvents = putCalls.filter(
              (call: any) => call.args[0].input.Item?.eventType === AuditEventType.SECURITY_EVENT
            );

            if (testData.ipAddresses.length >= 3) {
              expect(securityEvents.length).toBeGreaterThan(0);

              // Check if any security event has the DISTRIBUTED pattern
              // (there may be multiple alerts including MULTIPLE_FAILED_LOGINS)
              const hasDistributedAlert = securityEvents.some((call: any) => {
                const event = call.args[0].input.Item;
                return event && event.metadata?.patternType === 'DISTRIBUTED_FAILED_LOGINS';
              });
              expect(hasDistributedAlert).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log security events with complete metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            sourceIp: fc.ipV4(),
            patternType: fc.constantFrom(
              'MULTIPLE_FAILED_LOGINS',
              'DISTRIBUTED_FAILED_LOGINS',
              'EXCESSIVE_SENSITIVE_ACCESS'
            ),
            eventCount: fc.integer({ min: 5, max: 50 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            snsMock.reset();
            const mockEvents = Array.from({ length: testData.eventCount }, (_, i) => ({
              PK: `AUDIT#USER#${testData.userIdentity}`,
              SK: `${new Date(Date.now() - i * 10000).toISOString()}#event${i}`,
              GSI1PK: `AUDIT#USER#${testData.userIdentity}`,
              GSI1SK: new Date(Date.now() - i * 10000).toISOString(),
              eventType: AuditEventType.AUTHENTICATION,
              timestamp: new Date(Date.now() - i * 10000).toISOString(),
              userIdentity: testData.userIdentity,
              sourceIp: testData.sourceIp,
              success: false,
              action: 'LOGIN',
            }));

            dynamoMock.on(QueryCommand).resolves({ Items: mockEvents });
            dynamoMock.on(PutCommand).resolves({});
            snsMock.on(PublishCommand).resolves({ MessageId: 'test-message-id' });

            const { logAuthenticationEvent } = await import('./audit-service');

            await logAuthenticationEvent(
              testData.userIdentity,
              testData.sourceIp,
              'LOGIN',
              false,
              'Mozilla/5.0'
            );

            // Property: Security events must contain complete metadata
            const putCalls = dynamoMock.commandCalls(PutCommand);
            const securityEvents = putCalls.filter(
              (call: any) => call.args[0].input.Item?.eventType === AuditEventType.SECURITY_EVENT
            );

            if (securityEvents.length > 0) {
              const securityEvent = securityEvents[0].args[0].input.Item;
              if (securityEvent) {
                expect(securityEvent.userIdentity).toBe(testData.userIdentity);
                expect(securityEvent.timestamp).toBeDefined();
                expect(securityEvent.metadata).toBeDefined();
                expect(securityEvent.metadata.patternType).toBeDefined();
                expect(securityEvent.metadata.severity).toBeDefined();
                expect(securityEvent.metadata.description).toBeDefined();
                expect(securityEvent.metadata.eventCount).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional test: Versioned change tracking
   * Validates: Requirements 12.3
   */
  describe('Versioned change tracking', () => {
    it('should create versioned records with change attribution', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userIdentity: fc.emailAddress(),
            resourceType: fc.constantFrom('SCENARIO', 'NODE', 'ALERT'),
            resourceId: fc.uuid(),
            version: fc.integer({ min: 1, max: 100 }),
            changes: fc.array(
              fc.record({
                field: fc.constantFrom('severity', 'status', 'duration', 'location'),
                oldValue: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
                newValue: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            sourceIp: fc.ipV4(),
            action: fc.constantFrom('UPDATE', 'MODIFY', 'EDIT'),
          }),
          async (modData) => {
            // Reset mocks for each iteration
            dynamoMock.reset();
            dynamoMock.on(PutCommand).resolves({});

            await logDataModification(
              modData.userIdentity,
              modData.resourceType,
              modData.resourceId,
              modData.changes as ChangeRecord[],
              modData.sourceIp,
              modData.action,
              modData.version
            );

            const putCalls = dynamoMock.commandCalls(PutCommand);
            expect(putCalls.length).toBe(1);

            const auditEntry = putCalls[0].args[0].input.Item;

            // Property: Versioned records must include all change details
            expect(auditEntry).toBeDefined();
            if (auditEntry) {
              expect(auditEntry.eventType).toBe(AuditEventType.DATA_MODIFICATION);
              expect(auditEntry.userIdentity).toBe(modData.userIdentity);
              expect(auditEntry.resourceType).toBe(modData.resourceType);
              expect(auditEntry.resourceId).toBe(modData.resourceId);
              expect(auditEntry.changes).toEqual(modData.changes);
              expect(auditEntry.metadata?.version).toBe(modData.version);
              expect(auditEntry.SK).toContain(`v${modData.version}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
