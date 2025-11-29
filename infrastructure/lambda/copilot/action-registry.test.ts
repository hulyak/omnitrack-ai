/**
 * Unit tests for Action Registry
 */

import { ActionRegistry, Action, ActionResult, SupplyChainContext } from './action-registry';

describe('ActionRegistry', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    registry = new ActionRegistry();
  });

  describe('register', () => {
    it('should register a valid action', () => {
      const action: Action = {
        name: 'test-action',
        category: 'query',
        description: 'Test action',
        examples: ['test example'],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      expect(registry.hasAction('test-action')).toBe(true);
      expect(registry.getActionCount()).toBe(1);
    });

    it('should throw error when registering duplicate action', () => {
      const action: Action = {
        name: 'duplicate-action',
        category: 'query',
        description: 'Test action',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      expect(() => registry.register(action)).toThrow('already registered');
    });

    it('should throw error when action missing required fields', () => {
      const invalidAction = {
        name: 'invalid',
        // missing category and description
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      } as unknown as Action;

      expect(() => registry.register(invalidAction)).toThrow('must have name, category, and description');
    });

    it('should throw error when action missing execute function', () => {
      const invalidAction = {
        name: 'invalid',
        category: 'query',
        description: 'Test',
        examples: [],
        parameters: [],
        // missing execute
        validate: () => ({ valid: true, errors: [] })
      } as unknown as Action;

      expect(() => registry.register(invalidAction)).toThrow('must have an execute function');
    });
  });

  describe('getByName', () => {
    it('should retrieve action by exact name', () => {
      const action: Action = {
        name: 'get-node-details',
        category: 'query',
        description: 'Get node details',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      const retrieved = registry.getByName('get-node-details');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('get-node-details');
    });

    it('should return undefined for non-existent action', () => {
      const retrieved = registry.getByName('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getByIntent', () => {
    it('should retrieve action by intent matching action name', () => {
      const action: Action = {
        name: 'add-supplier',
        category: 'build',
        description: 'Add a supplier node',
        examples: ['add a supplier', 'create supplier'],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      const retrieved = registry.getByIntent('add supplier');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('add-supplier');
    });

    it('should retrieve action by intent matching example', () => {
      const action: Action = {
        name: 'add-supplier',
        category: 'build',
        description: 'Add a supplier node',
        examples: ['add a supplier', 'create supplier'],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      const retrieved = registry.getByIntent('create supplier');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('add-supplier');
    });

    it('should handle partial intent matches', () => {
      const action: Action = {
        name: 'scan-anomalies',
        category: 'analyze',
        description: 'Scan for anomalies',
        examples: ['scan for anomalies'],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      const retrieved = registry.getByIntent('scan');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('scan-anomalies');
    });
  });

  describe('getByCategory', () => {
    it('should retrieve all actions in a category', () => {
      const action1: Action = {
        name: 'add-supplier',
        category: 'build',
        description: 'Add supplier',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      const action2: Action = {
        name: 'add-warehouse',
        category: 'build',
        description: 'Add warehouse',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      const action3: Action = {
        name: 'scan-anomalies',
        category: 'analyze',
        description: 'Scan anomalies',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action1);
      registry.register(action2);
      registry.register(action3);

      const buildActions = registry.getByCategory('build');
      expect(buildActions).toHaveLength(2);
      expect(buildActions.map(a => a.name)).toContain('add-supplier');
      expect(buildActions.map(a => a.name)).toContain('add-warehouse');
    });
  });

  describe('unregister', () => {
    it('should remove an action', () => {
      const action: Action = {
        name: 'test-action',
        category: 'query',
        description: 'Test',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action);
      expect(registry.hasAction('test-action')).toBe(true);

      const removed = registry.unregister('test-action');
      expect(removed).toBe(true);
      expect(registry.hasAction('test-action')).toBe(false);
    });

    it('should return false when removing non-existent action', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all actions', () => {
      const action1: Action = {
        name: 'action1',
        category: 'query',
        description: 'Test',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      const action2: Action = {
        name: 'action2',
        category: 'query',
        description: 'Test',
        examples: [],
        parameters: [],
        execute: async () => ({ success: true }),
        validate: () => ({ valid: true, errors: [] })
      };

      registry.register(action1);
      registry.register(action2);
      expect(registry.getActionCount()).toBe(2);

      registry.clear();
      expect(registry.getActionCount()).toBe(0);
    });
  });
});
