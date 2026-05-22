/**
 * Unit tests for Query Actions
 */

import { actionRegistry, SupplyChainContext } from '../action-registry';
import {
  getNodeDetailsAction,
  getNetworkSummaryAction,
  getRecentAlertsAction,
  helpAction,
  registerQueryActions
} from './index';

describe('Query Actions', () => {
  let context: SupplyChainContext;

  beforeEach(() => {
    // Clear the singleton registry before each test
    actionRegistry.clear();
    
    context = {
      userId: 'test-user-123',
      nodes: [],
      edges: [],
      configuration: {},
      recentActions: [],
      activeSimulations: []
    };
  });

  describe('Action Registration', () => {
    it('should register all query actions', () => {
      registerQueryActions();
      
      expect(actionRegistry.hasAction('get-node-details')).toBe(true);
      expect(actionRegistry.hasAction('get-network-summary')).toBe(true);
      expect(actionRegistry.hasAction('get-recent-alerts')).toBe(true);
      expect(actionRegistry.hasAction('help')).toBe(true);
    });

    it('should categorize all actions as query', () => {
      registerQueryActions();
      
      const queryActions = actionRegistry.getByCategory('query');
      expect(queryActions.length).toBe(4);
    });
  });

  describe('getNodeDetailsAction', () => {
    it('should validate required nodeId parameter', () => {
      const result = getNodeDetailsAction.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: nodeId');
    });

    it('should validate nodeId is not empty', () => {
      const result = getNodeDetailsAction.validate({ nodeId: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'nodeId' failed validation");
    });

    it('should accept valid nodeId', () => {
      const result = getNodeDetailsAction.validate({ nodeId: 'node-123' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have example phrases', () => {
      expect(getNodeDetailsAction.examples).toBeDefined();
      expect(getNodeDetailsAction.examples.length).toBeGreaterThan(0);
    });
  });

  describe('getNetworkSummaryAction', () => {
    it('should accept no parameters', () => {
      const result = getNetworkSummaryAction.validate({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have example phrases', () => {
      expect(getNetworkSummaryAction.examples).toBeDefined();
      expect(getNetworkSummaryAction.examples.length).toBeGreaterThan(0);
    });

    it('should have description', () => {
      expect(getNetworkSummaryAction.description).toBeDefined();
      expect(getNetworkSummaryAction.description.length).toBeGreaterThan(0);
    });
  });

  describe('getRecentAlertsAction', () => {
    it('should accept no parameters', () => {
      const result = getRecentAlertsAction.validate({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate limit parameter is positive', () => {
      const result = getRecentAlertsAction.validate({ limit: -5 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'limit' failed validation");
    });

    it('should validate limit parameter is not too large', () => {
      const result = getRecentAlertsAction.validate({ limit: 200 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'limit' failed validation");
    });

    it('should accept valid limit parameter', () => {
      const result = getRecentAlertsAction.validate({ limit: 20 });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate status parameter', () => {
      const result = getRecentAlertsAction.validate({ status: 'invalid-status' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'status' failed validation");
    });

    it('should accept valid status values', () => {
      const validStatuses = ['active', 'acknowledged', 'resolved'];
      
      validStatuses.forEach(status => {
        const result = getRecentAlertsAction.validate({ status });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should accept both limit and status parameters', () => {
      const result = getRecentAlertsAction.validate({ 
        limit: 15, 
        status: 'active' 
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have example phrases', () => {
      expect(getRecentAlertsAction.examples).toBeDefined();
      expect(getRecentAlertsAction.examples.length).toBeGreaterThan(0);
    });
  });

  describe('helpAction', () => {
    it('should accept no parameters', () => {
      const result = helpAction.validate({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate category parameter', () => {
      const result = helpAction.validate({ category: 'invalid-category' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Parameter 'category' failed validation");
    });

    it('should accept valid category values', () => {
      const validCategories = ['build', 'configure', 'analyze', 'simulate', 'query'];
      
      validCategories.forEach(category => {
        const result = helpAction.validate({ category });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should have example phrases', () => {
      expect(helpAction.examples).toBeDefined();
      expect(helpAction.examples.length).toBeGreaterThan(0);
    });

    it('should have description', () => {
      expect(helpAction.description).toBeDefined();
      expect(helpAction.description.length).toBeGreaterThan(0);
    });
  });

  describe('Action Examples', () => {
    it('should have example phrases for each action', () => {
      const actions = [
        getNodeDetailsAction,
        getNetworkSummaryAction,
        getRecentAlertsAction,
        helpAction
      ];

      actions.forEach(action => {
        expect(action.examples).toBeDefined();
        expect(action.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Action Descriptions', () => {
    it('should have descriptions for each action', () => {
      const actions = [
        getNodeDetailsAction,
        getNetworkSummaryAction,
        getRecentAlertsAction,
        helpAction
      ];

      actions.forEach(action => {
        expect(action.description).toBeDefined();
        expect(action.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Action Categories', () => {
    it('should categorize all actions as query', () => {
      const actions = [
        getNodeDetailsAction,
        getNetworkSummaryAction,
        getRecentAlertsAction,
        helpAction
      ];

      actions.forEach(action => {
        expect(action.category).toBe('query');
      });
    });
  });
});
