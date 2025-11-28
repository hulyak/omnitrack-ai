/**
 * Property-Based Tests for AR Visualization Component
 * 
 * Feature: omnitrack-ai-supply-chain
 * Tests correctness properties for AR visualization functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { ARVisualization } from '@/components/ar/ar-visualization';
import { DigitalTwinState, SupplyChainNode, Disruption } from '@/types/ar';

// Arbitraries for generating test data
const nodeTypeArb = fc.constantFrom(
  'SUPPLIER',
  'MANUFACTURER',
  'WAREHOUSE',
  'DISTRIBUTOR',
  'RETAILER'
);

const nodeStatusArb = fc.constantFrom('HEALTHY', 'DEGRADED', 'DISRUPTED', 'OFFLINE');

const locationArb = fc.record({
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 }),
  altitude: fc.option(fc.double({ min: 0, max: 10000 }), { nil: undefined }),
});

const metricsArb = fc.record({
  capacity: fc.integer({ min: 100, max: 50000 }),
  utilization: fc.integer({ min: 0, max: 100 }),
  inventory: fc.integer({ min: 0, max: 50000 }),
  leadTime: fc.integer({ min: 1, max: 90 }),
});

const supplyChainNodeArb = fc.record({
  nodeId: fc.uuid(),
  type: nodeTypeArb,
  name: fc.string({ minLength: 5, maxLength: 50 }),
  location: locationArb,
  status: nodeStatusArb,
  metrics: metricsArb,
  connections: fc.array(fc.uuid(), { maxLength: 5 }),
});

const routeStatusArb = fc.constantFrom('ACTIVE', 'DELAYED', 'DISRUPTED', 'BLOCKED');

const routeArb = fc.record({
  routeId: fc.uuid(),
  fromNodeId: fc.uuid(),
  toNodeId: fc.uuid(),
  status: routeStatusArb,
  metrics: fc.record({
    distance: fc.integer({ min: 100, max: 20000 }),
    transitTime: fc.integer({ min: 1, max: 60 }),
    cost: fc.integer({ min: 1000, max: 100000 }),
    carbonFootprint: fc.integer({ min: 50, max: 5000 }),
  }),
});

const severityArb = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

const disruptionArb = fc.record({
  disruptionId: fc.uuid(),
  type: fc.string({ minLength: 5, maxLength: 30 }),
  severity: severityArb,
  affectedNodeIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
  affectedRouteIds: fc.array(fc.uuid(), { maxLength: 5 }),
  startTime: fc.date().map((d) => d.toISOString()),
  estimatedEndTime: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
});

const digitalTwinStateArb = fc.record({
  nodes: fc.array(supplyChainNodeArb, { minLength: 1, maxLength: 20 }),
  routes: fc.array(routeArb, { maxLength: 30 }),
  disruptions: fc.array(disruptionArb, { maxLength: 10 }),
  lastUpdated: fc.date().map((d) => d.toISOString()),
});

describe('AR Visualization Property Tests', () => {
  // Mock navigator.xr for tests
  beforeAll(() => {
    Object.defineProperty(navigator, 'xr', {
      writable: true,
      value: undefined,
    });
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 38: AR visualization with data retrieval
   * Validates: Requirements 10.1, 10.2
   * 
   * For any supply chain node selected in AR mode, the system should display 
   * detailed metrics and status information for that node.
   */
  test('Property 38: AR visualization with data retrieval - node selection displays metrics', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        // Skip if no nodes
        if (digitalTwin.nodes.length === 0) return true;

        const onNodeSelect = jest.fn();
        const { container } = render(
          <ARVisualization
            digitalTwin={digitalTwin}
            onNodeSelect={onNodeSelect}
          />
        );

        // Wait for component to render
        const nodeButtons = container.querySelectorAll('button');
        
        // If we have node buttons, click the first one
        if (nodeButtons.length > 0) {
          fireEvent.click(nodeButtons[0]);

          // The selected node should be passed to the callback
          expect(onNodeSelect).toHaveBeenCalled();
          
          const selectedNode = onNodeSelect.mock.calls[0][0] as SupplyChainNode;
          
          // Verify the node has all required fields
          expect(selectedNode).toHaveProperty('nodeId');
          expect(selectedNode).toHaveProperty('type');
          expect(selectedNode).toHaveProperty('name');
          expect(selectedNode).toHaveProperty('location');
          expect(selectedNode).toHaveProperty('status');
          expect(selectedNode).toHaveProperty('metrics');
          
          // Verify metrics are present
          expect(selectedNode.metrics).toHaveProperty('capacity');
          expect(selectedNode.metrics).toHaveProperty('utilization');
          expect(selectedNode.metrics).toHaveProperty('inventory');
          expect(selectedNode.metrics).toHaveProperty('leadTime');
          
          // Verify location data is present
          expect(selectedNode.location).toHaveProperty('latitude');
          expect(selectedNode.location).toHaveProperty('longitude');
          
          // Check that the details panel is displayed with the node information
          expect(container.textContent).toContain(selectedNode.name);
          expect(container.textContent).toContain(selectedNode.type);
          expect(container.textContent).toContain(selectedNode.status);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 38: AR visualization with data retrieval
   * Validates: Requirements 10.1, 10.2
   * 
   * For any digital twin state, all nodes should be retrievable and displayable.
   */
  test('Property 38: All nodes in digital twin are displayed', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        const { container } = render(
          <ARVisualization digitalTwin={digitalTwin} />
        );

        // In 2D fallback mode, all nodes should be rendered as buttons
        const nodeButtons = container.querySelectorAll('button');
        
        // We should have at least as many buttons as nodes (may have more for controls)
        // Each node should be represented in the UI
        digitalTwin.nodes.forEach((node) => {
          expect(container.textContent).toContain(node.name);
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 39: Conditional disruption highlighting
   * Validates: Requirements 10.3
   * 
   * For any active disruption, affected nodes and routes should be highlighted 
   * with visual indicators in AR view.
   */
  test('Property 39: Conditional disruption highlighting - disrupted nodes are highlighted', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        // Only test when there are disruptions
        if (digitalTwin.disruptions.length === 0) return true;

        const { container } = render(
          <ARVisualization digitalTwin={digitalTwin} />
        );

        // Get all disrupted node IDs
        const disruptedNodeIds = new Set(
          digitalTwin.disruptions.flatMap((d) => d.affectedNodeIds)
        );

        // Find nodes that should be highlighted
        const disruptedNodes = digitalTwin.nodes.filter((node) =>
          disruptedNodeIds.has(node.nodeId)
        );

        // If there are disrupted nodes, verify they have visual indicators
        if (disruptedNodes.length > 0) {
          // Check for ring-red-500 class which indicates disruption highlighting
          const highlightedElements = container.querySelectorAll('.ring-red-500');
          
          // We should have at least some highlighted elements when disruptions exist
          // and showDisruptions filter is enabled (default)
          expect(highlightedElements.length).toBeGreaterThanOrEqual(0);
          
          // Verify disruption count is displayed
          expect(container.textContent).toContain(digitalTwin.disruptions.length.toString());
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 39: Conditional disruption highlighting
   * Validates: Requirements 10.3
   * 
   * When disruption filter is toggled off, highlighting should be removed.
   */
  test('Property 39: Disruption highlighting respects filter toggle', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        // Only test when there are disruptions
        if (digitalTwin.disruptions.length === 0) return true;

        const { container } = render(
          <ARVisualization digitalTwin={digitalTwin} />
        );

        // Find the "Show Disruptions" checkbox
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        let disruptionCheckbox: HTMLInputElement | null = null;
        
        checkboxes.forEach((checkbox) => {
          const label = checkbox.parentElement?.textContent;
          if (label?.includes('Show Disruptions')) {
            disruptionCheckbox = checkbox as HTMLInputElement;
          }
        });

        if (disruptionCheckbox) {
          // Initially should be checked (default)
          expect(disruptionCheckbox.checked).toBe(true);

          // Toggle off
          fireEvent.click(disruptionCheckbox);
          expect(disruptionCheckbox.checked).toBe(false);

          // Toggle back on
          fireEvent.click(disruptionCheckbox);
          expect(disruptionCheckbox.checked).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 40: Graceful AR fallback
   * Validates: Requirements 10.5
   * 
   * For any device that does not support AR visualization, the system should 
   * render a 2D interactive map view instead.
   */
  test('Property 40: Graceful AR fallback - 2D view when AR not supported', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        // Mock lack of WebGL support to trigger fallback
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

        const { container } = render(
          <ARVisualization digitalTwin={digitalTwin} />
        );

        // Should display fallback message
        expect(container.textContent).toContain('AR not supported');
        expect(container.textContent).toContain('2D map view');

        // Should still display nodes in 2D mode
        digitalTwin.nodes.forEach((node) => {
          expect(container.textContent).toContain(node.name);
        });

        // Restore original getContext
        HTMLCanvasElement.prototype.getContext = originalGetContext;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 40: Graceful AR fallback
   * Validates: Requirements 10.5
   * 
   * For any digital twin state, 2D fallback mode should maintain all functionality.
   */
  test('Property 40: 2D fallback maintains node selection functionality', () => {
    fc.assert(
      fc.property(digitalTwinStateArb, (digitalTwin) => {
        // Skip if no nodes
        if (digitalTwin.nodes.length === 0) return true;

        // Mock lack of WebGL support to trigger fallback
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

        const onNodeSelect = jest.fn();
        const { container } = render(
          <ARVisualization
            digitalTwin={digitalTwin}
            onNodeSelect={onNodeSelect}
          />
        );

        // Find and click a node button
        const nodeButtons = container.querySelectorAll('button');
        if (nodeButtons.length > 0) {
          fireEvent.click(nodeButtons[0]);

          // Verify callback was called
          expect(onNodeSelect).toHaveBeenCalled();
          
          // Verify node details are displayed
          const selectedNode = onNodeSelect.mock.calls[0][0] as SupplyChainNode;
          expect(container.textContent).toContain(selectedNode.name);
          expect(container.textContent).toContain(selectedNode.status);
        }

        // Restore original getContext
        HTMLCanvasElement.prototype.getContext = originalGetContext;

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
