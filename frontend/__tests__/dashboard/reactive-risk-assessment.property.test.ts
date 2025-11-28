/**
 * Property-based test for reactive risk assessment
 *
 * Feature: omnitrack-ai-supply-chain, Property 5: Reactive risk assessment
 *
 * For any digital twin state change, if the change is material (exceeds configured thresholds),
 * the system should trigger risk reassessment.
 *
 * Validates: Requirements 1.5, 9.5
 */

import * as fc from 'fast-check';

// Types for digital twin state
interface DigitalTwinState {
  nodeCount: number;
  healthyNodes: number;
  degradedNodes: number;
  disruptedNodes: number;
  lastSync: string;
  status: 'active' | 'syncing' | 'error';
}

interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  timestamp: string;
  triggeredBy: string;
}

// Configuration for material change thresholds
interface MaterialChangeThresholds {
  nodeCountChange: number;
  statusDegradationThreshold: number;
  disruptionThreshold: number;
}

const DEFAULT_THRESHOLDS: MaterialChangeThresholds = {
  nodeCountChange: 5, // 5% change in node count
  statusDegradationThreshold: 1, // Any node becoming degraded or disrupted
  disruptionThreshold: 1, // Any disrupted node
};

/**
 * Determines if a change between two digital twin states is material
 */
function isMaterialChange(
  oldState: DigitalTwinState,
  newState: DigitalTwinState,
  thresholds: MaterialChangeThresholds = DEFAULT_THRESHOLDS
): boolean {
  // Check if node count changed significantly
  const nodeCountChangePercent =
    (Math.abs(newState.nodeCount - oldState.nodeCount) / oldState.nodeCount) * 100;
  if (nodeCountChangePercent >= thresholds.nodeCountChange) {
    return true;
  }

  // Check if any nodes became degraded
  if (newState.degradedNodes > oldState.degradedNodes) {
    return true;
  }

  // Check if any nodes became disrupted
  if (newState.disruptedNodes > oldState.disruptedNodes) {
    return true;
  }

  // Check if overall health decreased significantly
  const oldHealthyPercent = oldState.healthyNodes / oldState.nodeCount;
  const newHealthyPercent = newState.healthyNodes / newState.nodeCount;
  if (oldHealthyPercent - newHealthyPercent >= 0.05) {
    // 5% decrease in healthy nodes
    return true;
  }

  return false;
}

/**
 * Simulates triggering a risk reassessment
 */
function triggerRiskReassessment(
  state: DigitalTwinState,
  previousAssessment: RiskAssessment | null
): RiskAssessment {
  // Calculate risk score based on state
  const disruptedPercent = state.disruptedNodes / state.nodeCount;
  const degradedPercent = state.degradedNodes / state.nodeCount;
  const healthyPercent = state.healthyNodes / state.nodeCount;

  let riskScore = 0;
  riskScore += disruptedPercent * 100; // Disrupted nodes contribute most
  riskScore += degradedPercent * 50; // Degraded nodes contribute less
  riskScore += (1 - healthyPercent) * 30; // Unhealthy nodes contribute

  // Determine risk level
  let riskLevel: RiskAssessment['riskLevel'];
  if (riskScore >= 75) {
    riskLevel = 'CRITICAL';
  } else if (riskScore >= 50) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 25) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    timestamp: new Date().toISOString(),
    triggeredBy: 'digital_twin_update',
  };
}

/**
 * Simulates the reactive risk assessment system
 */
function reactiveRiskAssessmentSystem(
  oldState: DigitalTwinState,
  newState: DigitalTwinState,
  currentAssessment: RiskAssessment | null,
  thresholds: MaterialChangeThresholds = DEFAULT_THRESHOLDS
): { assessment: RiskAssessment; wasTriggered: boolean } {
  const materialChange = isMaterialChange(oldState, newState, thresholds);

  if (materialChange) {
    // Trigger risk reassessment
    const newAssessment = triggerRiskReassessment(newState, currentAssessment);
    return { assessment: newAssessment, wasTriggered: true };
  }

  // No material change, return existing assessment
  return {
    assessment: currentAssessment || triggerRiskReassessment(newState, null),
    wasTriggered: false,
  };
}

describe('Reactive Risk Assessment Property Tests', () => {
  /**
   * Property 5: Reactive risk assessment
   *
   * For any digital twin state change, if the change is material (exceeds configured thresholds),
   * the system should trigger risk reassessment.
   */
  describe('Property 5: Reactive risk assessment', () => {
    it('should trigger risk reassessment for any material change in digital twin state', () => {
      fc.assert(
        fc.property(
          // Generate old state
          fc.record({
            nodeCount: fc.integer({ min: 10, max: 100 }),
            healthyNodes: fc.integer({ min: 5, max: 100 }),
            degradedNodes: fc.integer({ min: 0, max: 20 }),
            disruptedNodes: fc.integer({ min: 0, max: 10 }),
            lastSync: fc
              .integer({ min: 1704067200000, max: 1735689600000 })
              .map((ms) => new Date(ms).toISOString()),
            status: fc.constantFrom('active' as const, 'syncing' as const),
          }),
          // Generate new state with potential material changes
          fc.record({
            nodeCountDelta: fc.integer({ min: -10, max: 10 }),
            healthyNodesDelta: fc.integer({ min: -20, max: 10 }),
            degradedNodesDelta: fc.integer({ min: -5, max: 10 }),
            disruptedNodesDelta: fc.integer({ min: -5, max: 10 }),
            lastSync: fc
              .integer({ min: 1704067200000, max: 1735689600000 })
              .map((ms) => new Date(ms).toISOString()),
            status: fc.constantFrom('active' as const, 'syncing' as const, 'error' as const),
          }),
          (oldStateBase, newStateDeltas) => {
            // Ensure old state is valid
            const oldState: DigitalTwinState = {
              ...oldStateBase,
              healthyNodes: Math.min(oldStateBase.healthyNodes, oldStateBase.nodeCount),
              degradedNodes: Math.min(oldStateBase.degradedNodes, oldStateBase.nodeCount),
              disruptedNodes: Math.min(oldStateBase.disruptedNodes, oldStateBase.nodeCount),
            };

            // Ensure total nodes don't exceed nodeCount
            const totalOldNodes =
              oldState.healthyNodes + oldState.degradedNodes + oldState.disruptedNodes;
            if (totalOldNodes > oldState.nodeCount) {
              const scale = oldState.nodeCount / totalOldNodes;
              oldState.healthyNodes = Math.floor(oldState.healthyNodes * scale);
              oldState.degradedNodes = Math.floor(oldState.degradedNodes * scale);
              oldState.disruptedNodes = Math.floor(oldState.disruptedNodes * scale);
            }

            // Create new state with deltas
            const newState: DigitalTwinState = {
              nodeCount: Math.max(1, oldState.nodeCount + newStateDeltas.nodeCountDelta),
              healthyNodes: Math.max(0, oldState.healthyNodes + newStateDeltas.healthyNodesDelta),
              degradedNodes: Math.max(
                0,
                oldState.degradedNodes + newStateDeltas.degradedNodesDelta
              ),
              disruptedNodes: Math.max(
                0,
                oldState.disruptedNodes + newStateDeltas.disruptedNodesDelta
              ),
              lastSync: newStateDeltas.lastSync,
              status: newStateDeltas.status,
            };

            // Ensure new state is valid
            newState.healthyNodes = Math.min(newState.healthyNodes, newState.nodeCount);
            newState.degradedNodes = Math.min(newState.degradedNodes, newState.nodeCount);
            newState.disruptedNodes = Math.min(newState.disruptedNodes, newState.nodeCount);

            const totalNewNodes =
              newState.healthyNodes + newState.degradedNodes + newState.disruptedNodes;
            if (totalNewNodes > newState.nodeCount) {
              const scale = newState.nodeCount / totalNewNodes;
              newState.healthyNodes = Math.floor(newState.healthyNodes * scale);
              newState.degradedNodes = Math.floor(newState.degradedNodes * scale);
              newState.disruptedNodes = Math.floor(newState.disruptedNodes * scale);
            }

            // Initial assessment
            const initialAssessment = triggerRiskReassessment(oldState, null);

            // Run reactive risk assessment system
            const result = reactiveRiskAssessmentSystem(
              oldState,
              newState,
              initialAssessment,
              DEFAULT_THRESHOLDS
            );

            // Verify property: if change is material, risk reassessment should be triggered
            const materialChange = isMaterialChange(oldState, newState, DEFAULT_THRESHOLDS);

            if (materialChange) {
              // Material change detected, should trigger reassessment
              expect(result.wasTriggered).toBe(true);
              expect(result.assessment).toBeDefined();
              expect(result.assessment.timestamp).toBeDefined();
              expect(result.assessment.triggeredBy).toBe('digital_twin_update');
            } else {
              // No material change, should not trigger new reassessment
              expect(result.wasTriggered).toBe(false);
            }

            // Verify assessment is always present
            expect(result.assessment).toBeDefined();
            expect(result.assessment.riskLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
            expect(result.assessment.riskScore).toBeGreaterThanOrEqual(0);
            expect(result.assessment.riskScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always trigger reassessment when disrupted nodes increase', () => {
      fc.assert(
        fc.property(
          // Generate base state
          fc.record({
            nodeCount: fc.integer({ min: 20, max: 100 }),
            healthyNodes: fc.integer({ min: 10, max: 90 }),
            degradedNodes: fc.integer({ min: 0, max: 10 }),
            disruptedNodes: fc.integer({ min: 0, max: 5 }),
            lastSync: fc
              .integer({ min: 1704067200000, max: 1735689600000 })
              .map((ms) => new Date(ms).toISOString()),
            status: fc.constantFrom('active' as const, 'syncing' as const),
          }),
          // Generate increase in disrupted nodes
          fc.integer({ min: 1, max: 10 }),
          (baseState, disruptedIncrease) => {
            const oldState: DigitalTwinState = {
              ...baseState,
              healthyNodes: Math.min(baseState.healthyNodes, baseState.nodeCount),
              degradedNodes: Math.min(baseState.degradedNodes, baseState.nodeCount),
              disruptedNodes: Math.min(baseState.disruptedNodes, baseState.nodeCount),
            };

            const newState: DigitalTwinState = {
              ...oldState,
              disruptedNodes: Math.min(
                oldState.disruptedNodes + disruptedIncrease,
                oldState.nodeCount
              ),
              healthyNodes: Math.max(0, oldState.healthyNodes - disruptedIncrease),
              lastSync: new Date().toISOString(),
            };

            const initialAssessment = triggerRiskReassessment(oldState, null);
            const result = reactiveRiskAssessmentSystem(
              oldState,
              newState,
              initialAssessment,
              DEFAULT_THRESHOLDS
            );

            // Property: Any increase in disrupted nodes should trigger reassessment
            if (newState.disruptedNodes > oldState.disruptedNodes) {
              expect(result.wasTriggered).toBe(true);
              expect(result.assessment.triggeredBy).toBe('digital_twin_update');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger reassessment for immaterial changes', () => {
      fc.assert(
        fc.property(
          // Generate state
          fc.record({
            nodeCount: fc.integer({ min: 100, max: 200 }),
            healthyNodes: fc.integer({ min: 90, max: 190 }),
            degradedNodes: fc.integer({ min: 0, max: 5 }),
            disruptedNodes: fc.integer({ min: 0, max: 2 }),
            lastSync: fc
              .integer({ min: 1704067200000, max: 1735689600000 })
              .map((ms) => new Date(ms).toISOString()),
            status: fc.constantFrom('active' as const, 'syncing' as const),
          }),
          (baseState) => {
            const oldState: DigitalTwinState = {
              ...baseState,
              healthyNodes: Math.min(baseState.healthyNodes, baseState.nodeCount),
            };

            // Create new state with only timestamp change (immaterial)
            const newState: DigitalTwinState = {
              ...oldState,
              lastSync: new Date(Date.now() + 1000).toISOString(), // 1 second later
            };

            const initialAssessment = triggerRiskReassessment(oldState, null);
            const result = reactiveRiskAssessmentSystem(
              oldState,
              newState,
              initialAssessment,
              DEFAULT_THRESHOLDS
            );

            // Property: Immaterial changes (only timestamp) should not trigger reassessment
            expect(result.wasTriggered).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger reassessment when healthy node percentage drops significantly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 200 }),
          fc.integer({ min: 5, max: 20 }),
          (nodeCount, healthyDrop) => {
            const oldState: DigitalTwinState = {
              nodeCount,
              healthyNodes: Math.floor(nodeCount * 0.9), // 90% healthy
              degradedNodes: Math.floor(nodeCount * 0.08),
              disruptedNodes: Math.floor(nodeCount * 0.02),
              lastSync: new Date().toISOString(),
              status: 'active',
            };

            // Drop healthy nodes by at least 10% (material change)
            const healthyDropCount = Math.max(Math.floor(nodeCount * 0.1), healthyDrop);

            const newState: DigitalTwinState = {
              ...oldState,
              healthyNodes: Math.max(0, oldState.healthyNodes - healthyDropCount),
              degradedNodes: oldState.degradedNodes + Math.floor(healthyDropCount / 2),
              disruptedNodes: oldState.disruptedNodes + Math.floor(healthyDropCount / 2),
              lastSync: new Date().toISOString(),
            };

            const initialAssessment = triggerRiskReassessment(oldState, null);
            const result = reactiveRiskAssessmentSystem(
              oldState,
              newState,
              initialAssessment,
              DEFAULT_THRESHOLDS
            );

            // Property: Significant drop in healthy nodes should trigger reassessment
            const oldHealthyPercent = oldState.healthyNodes / oldState.nodeCount;
            const newHealthyPercent = newState.healthyNodes / newState.nodeCount;

            if (oldHealthyPercent - newHealthyPercent >= 0.05) {
              expect(result.wasTriggered).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
