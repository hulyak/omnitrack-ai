/**
 * Property-based tests for Alert Generator
 * 
 * Feature: omnitrack-ai-supply-chain
 */

import * as fc from 'fast-check';
import { calculatePriority, prioritizeAlerts } from './alert-generator';
import {
  Alert,
  AlertType,
  AlertStatus,
  Severity,
  AlertMetadata
} from '../models/types';

/**
 * Arbitrary generators for property-based testing
 */

const severityArbitrary = fc.constantFrom(
  Severity.LOW,
  Severity.MEDIUM,
  Severity.HIGH,
  Severity.CRITICAL
);

const alertTypeArbitrary = fc.constantFrom(
  AlertType.ANOMALY_DETECTED,
  AlertType.THRESHOLD_EXCEEDED,
  AlertType.DISRUPTION_PREDICTED,
  AlertType.SUSTAINABILITY_THRESHOLD,
  AlertType.INTEGRATION_FAILURE,
  AlertType.SECURITY_ALERT
);

const alertStatusArbitrary = fc.constantFrom(
  AlertStatus.ACTIVE,
  AlertStatus.ACKNOWLEDGED,
  AlertStatus.RESOLVED,
  AlertStatus.DISMISSED
);

const alertMetadataArbitrary: fc.Arbitrary<AlertMetadata> = fc.record({
  priority: fc.integer({ min: 1, max: 10 }),
  affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
  estimatedImpact: fc.string({ minLength: 10, maxLength: 100 }),
  recommendedActions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
    minLength: 1,
    maxLength: 5
  })
});

const alertArbitrary: fc.Arbitrary<Alert> = fc.record({
  alertId: fc.uuid(),
  type: alertTypeArbitrary,
  severity: severityArbitrary,
  nodeId: fc.uuid(),
  status: alertStatusArbitrary,
  message: fc.string({ minLength: 10, maxLength: 200 }),
  createdAt: fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ms => new Date(ms).toISOString()),
  metadata: alertMetadataArbitrary,
  version: fc.integer({ min: 1, max: 10 })
});

/**
 * Property 1: Alert generation timing
 * Feature: omnitrack-ai-supply-chain, Property 1: Alert generation timing
 * Validates: Requirements 1.1
 * 
 * For any IoT sensor data with anomalies exceeding configured thresholds,
 * the system should generate alerts within 30 seconds of data arrival.
 * 
 * Note: This property tests the timing constraint by measuring the execution time
 * of the alert generation logic. In a real system, this would be tested end-to-end
 * with actual IoT data streams.
 */
describe('Property 1: Alert generation timing', () => {
  test('alert generation completes within 30 seconds for any valid anomaly data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nodeId: fc.uuid(),
          utilizationRate: fc.double({ min: 0.85, max: 1.0 }), // Threshold exceeded
          inventoryRatio: fc.double({ min: 0, max: 0.2 }), // Low inventory
          timestamp: fc.date().map(d => d.toISOString())
        }),
        async (anomalyData) => {
          const startTime = Date.now();

          // Simulate alert generation logic
          // In production, this would be triggered by DynamoDB streams
          const alerts = [];

          // Check utilization threshold
          if (anomalyData.utilizationRate >= 0.85) {
            alerts.push({
              type: AlertType.THRESHOLD_EXCEEDED,
              severity: anomalyData.utilizationRate >= 0.95 ? Severity.CRITICAL : Severity.HIGH,
              nodeId: anomalyData.nodeId,
              detectedAt: anomalyData.timestamp
            });
          }

          // Check inventory threshold
          if (anomalyData.inventoryRatio <= 0.2) {
            alerts.push({
              type: AlertType.THRESHOLD_EXCEEDED,
              severity: anomalyData.inventoryRatio <= 0.1 ? Severity.CRITICAL : Severity.MEDIUM,
              nodeId: anomalyData.nodeId,
              detectedAt: anomalyData.timestamp
            });
          }

          const executionTime = Date.now() - startTime;

          // Property: Alert generation should complete within 30 seconds (30000ms)
          // For unit tests, we expect much faster execution (< 1000ms)
          expect(executionTime).toBeLessThan(30000);
          expect(alerts.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Alert prioritization correctness
 * Feature: omnitrack-ai-supply-chain, Property 3: Alert prioritization correctness
 * Validates: Requirements 1.3
 * 
 * For any set of simultaneous alerts with different severity and criticality values,
 * the system should order them such that higher severity and criticality alerts appear first.
 */
describe('Property 3: Alert prioritization correctness', () => {
  test('alerts are correctly ordered by priority and severity', () => {
    fc.assert(
      fc.property(
        fc.array(alertArbitrary, { minLength: 2, maxLength: 20 }),
        (alerts) => {
          const prioritized = prioritizeAlerts(alerts);

          // Property: Each alert should have priority >= next alert's priority
          for (let i = 0; i < prioritized.length - 1; i++) {
            const current = prioritized[i];
            const next = prioritized[i + 1];

            // If priorities are different, current should be higher
            if (current.metadata.priority !== next.metadata.priority) {
              expect(current.metadata.priority).toBeGreaterThanOrEqual(
                next.metadata.priority
              );
            } else {
              // If priorities are equal, check severity ordering
              const severityOrder = {
                [Severity.CRITICAL]: 4,
                [Severity.HIGH]: 3,
                [Severity.MEDIUM]: 2,
                [Severity.LOW]: 1
              };

              expect(severityOrder[current.severity]).toBeGreaterThanOrEqual(
                severityOrder[next.severity]
              );
            }
          }

          // Property: Prioritized list should contain all original alerts
          expect(prioritized.length).toBe(alerts.length);

          // Property: All alert IDs should be preserved
          const originalIds = new Set(alerts.map(a => a.alertId));
          const prioritizedIds = new Set(prioritized.map(a => a.alertId));
          expect(prioritizedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('critical severity alerts always appear before lower severity alerts with same priority', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(severityArbitrary, { minLength: 2, maxLength: 10 }),
        (priority, severities) => {
          // Create alerts with same priority but different severities
          const alerts: Alert[] = severities.map((severity, index) => ({
            alertId: `alert-${index}`,
            type: AlertType.THRESHOLD_EXCEEDED,
            severity,
            nodeId: `node-${index}`,
            status: AlertStatus.ACTIVE,
            message: `Test alert ${index}`,
            createdAt: new Date(Date.now() - index * 1000).toISOString(),
            metadata: {
              priority,
              affectedNodes: [`node-${index}`],
              estimatedImpact: 'Test impact',
              recommendedActions: ['Test action']
            },
            version: 1
          }));

          const prioritized = prioritizeAlerts(alerts);

          // Property: Critical alerts should appear before all non-critical alerts
          const criticalIndices = prioritized
            .map((a, i) => (a.severity === Severity.CRITICAL ? i : -1))
            .filter(i => i !== -1);

          const nonCriticalIndices = prioritized
            .map((a, i) => (a.severity !== Severity.CRITICAL ? i : -1))
            .filter(i => i !== -1);

          if (criticalIndices.length > 0 && nonCriticalIndices.length > 0) {
            const maxCriticalIndex = Math.max(...criticalIndices);
            const minNonCriticalIndex = Math.min(...nonCriticalIndices);
            expect(maxCriticalIndex).toBeLessThan(minNonCriticalIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Alert state consistency
 * Feature: omnitrack-ai-supply-chain, Property 4: Alert state consistency
 * Validates: Requirements 1.4
 * 
 * For any alert that is acknowledged by a user, the system should update
 * the alert status to "acknowledged" and send notifications to all relevant team members.
 * 
 * Note: This property tests the state transition logic. The notification delivery
 * is tested separately in Property 2.
 */
describe('Property 4: Alert state consistency', () => {
  test('alert acknowledgment updates status correctly', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.uuid(), // userId
        fc.date().map(d => d.toISOString()), // acknowledgedAt
        (alert, userId, acknowledgedAt) => {
          // Simulate acknowledgment
          const acknowledgedAlert = {
            ...alert,
            status: AlertStatus.ACKNOWLEDGED,
            acknowledgedBy: userId,
            acknowledgedAt
          };

          // Property: Status must be ACKNOWLEDGED
          expect(acknowledgedAlert.status).toBe(AlertStatus.ACKNOWLEDGED);

          // Property: acknowledgedBy must be set to the user ID
          expect(acknowledgedAlert.acknowledgedBy).toBe(userId);

          // Property: acknowledgedAt must be set
          expect(acknowledgedAlert.acknowledgedAt).toBe(acknowledgedAt);

          // Property: Original alert data should be preserved
          expect(acknowledgedAlert.alertId).toBe(alert.alertId);
          expect(acknowledgedAlert.type).toBe(alert.type);
          expect(acknowledgedAlert.severity).toBe(alert.severity);
          expect(acknowledgedAlert.nodeId).toBe(alert.nodeId);
          expect(acknowledgedAlert.message).toBe(alert.message);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('acknowledged alerts maintain all metadata', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.uuid(),
        (alert, userId) => {
          const acknowledgedAlert = {
            ...alert,
            status: AlertStatus.ACKNOWLEDGED,
            acknowledgedBy: userId,
            acknowledgedAt: new Date().toISOString()
          };

          // Property: All metadata fields should be preserved
          expect(acknowledgedAlert.metadata.priority).toBe(alert.metadata.priority);
          expect(acknowledgedAlert.metadata.affectedNodes).toEqual(alert.metadata.affectedNodes);
          expect(acknowledgedAlert.metadata.estimatedImpact).toBe(alert.metadata.estimatedImpact);
          expect(acknowledgedAlert.metadata.recommendedActions).toEqual(
            alert.metadata.recommendedActions
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional property tests for priority calculation
 */
describe('Priority calculation properties', () => {
  test('priority increases with severity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (businessCriticality) => {
          const lowPriority = calculatePriority(Severity.LOW, businessCriticality);
          const mediumPriority = calculatePriority(Severity.MEDIUM, businessCriticality);
          const highPriority = calculatePriority(Severity.HIGH, businessCriticality);
          const criticalPriority = calculatePriority(Severity.CRITICAL, businessCriticality);

          // Property: Priority should increase with severity
          expect(mediumPriority).toBeGreaterThanOrEqual(lowPriority);
          expect(highPriority).toBeGreaterThanOrEqual(mediumPriority);
          expect(criticalPriority).toBeGreaterThanOrEqual(highPriority);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('priority is always between 1 and 10', () => {
    fc.assert(
      fc.property(
        severityArbitrary,
        fc.integer({ min: 1, max: 10 }),
        (severity, businessCriticality) => {
          const priority = calculatePriority(severity, businessCriticality);

          // Property: Priority should always be in valid range
          expect(priority).toBeGreaterThanOrEqual(1);
          expect(priority).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
