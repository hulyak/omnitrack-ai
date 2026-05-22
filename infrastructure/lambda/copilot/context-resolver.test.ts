import { ContextResolver, TrackedEntity, EntityType } from './context-resolver';
import { Message } from './conversation-service';

jest.mock('../utils/logger');

describe('ContextResolver', () => {
  let resolver: ContextResolver;

  beforeEach(() => {
    resolver = new ContextResolver();
  });

  describe('extractEntities', () => {
    it('should extract node entities', () => {
      const message = 'Add a supplier named Acme Corp';
      const entities = resolver.extractEntities(message);

      expect(entities).toHaveLength(1);
      expect(entities[0].type).toBe('node');
      expect(entities[0].name).toBe('Acme');
    });

    it('should extract multiple entities', () => {
      const message =
        'Create a connection between supplier Acme and warehouse Boston';
      const entities = resolver.extractEntities(message);

      expect(entities.length).toBeGreaterThan(0);
    });

    it('should extract simulation entities', () => {
      const message = 'Run simulation port-closure-test';
      const entities = resolver.extractEntities(message);

      expect(entities).toHaveLength(1);
      expect(entities[0].type).toBe('simulation');
      expect(entities[0].name).toBe('port-closure-test');
    });

    it('should return empty array for no entities', () => {
      const message = 'Hello, how are you?';
      const entities = resolver.extractEntities(message);

      expect(entities).toHaveLength(0);
    });
  });

  describe('trackEntities', () => {
    it('should track entities from conversation history', () => {
      const messages: Message[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Add supplier Acme Corp',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Added supplier Acme Corp',
          timestamp: new Date(),
        },
        {
          id: 'msg3',
          role: 'user',
          content: 'Run simulation test-scenario',
          timestamp: new Date(),
        },
      ];

      const context = resolver.trackEntities(messages);

      expect(context.entities.length).toBeGreaterThan(0);
      expect(context.lastNode).toBeDefined();
      expect(context.lastSimulation).toBeDefined();
    });

    it('should update entity when mentioned multiple times', () => {
      const messages: Message[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Add supplier Acme',
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'msg2',
          role: 'user',
          content: 'Update supplier Acme',
          timestamp: new Date('2024-01-02'),
        },
      ];

      const context = resolver.trackEntities(messages);

      // Should have only one entity (updated)
      const acmeEntities = context.entities.filter((e) =>
        e.name.includes('Acme')
      );
      expect(acmeEntities.length).toBeLessThanOrEqual(1);
    });
  });

  describe('containsPronouns', () => {
    it('should detect "it" pronoun', () => {
      expect(resolver.containsPronouns('Update it')).toBe(true);
    });

    it('should detect "that" pronoun', () => {
      expect(resolver.containsPronouns('Remove that')).toBe(true);
    });

    it('should detect "this" pronoun', () => {
      expect(resolver.containsPronouns('Show me this')).toBe(true);
    });

    it('should detect "them" pronoun', () => {
      expect(resolver.containsPronouns('Delete them')).toBe(true);
    });

    it('should return false for no pronouns', () => {
      expect(resolver.containsPronouns('Add a new supplier')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(resolver.containsPronouns('Update IT')).toBe(true);
      expect(resolver.containsPronouns('Remove THAT')).toBe(true);
    });
  });

  describe('resolveReferences', () => {
    it('should resolve "it" to most recent entity', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_acme',
            name: 'Acme',
            mentionedAt: new Date(),
          },
        ],
        lastNode: {
          type: 'node' as EntityType,
          id: 'node_acme',
          name: 'Acme',
          mentionedAt: new Date(),
        },
      };

      const result = resolver.resolveReferences('Update it', context);

      expect(result.resolvedMessage).toContain('Acme');
      expect(result.references).toHaveLength(1);
      expect(result.references[0].pronoun.toLowerCase()).toBe('it');
      expect(result.references[0].entity.name).toBe('Acme');
    });

    it('should resolve "that" to most recent entity', () => {
      const context = {
        entities: [
          {
            type: 'simulation' as EntityType,
            id: 'simulation_test',
            name: 'test-scenario',
            mentionedAt: new Date(),
          },
        ],
        lastSimulation: {
          type: 'simulation' as EntityType,
          id: 'simulation_test',
          name: 'test-scenario',
          mentionedAt: new Date(),
        },
      };

      const result = resolver.resolveReferences('Run that again', context);

      expect(result.resolvedMessage).toContain('test-scenario');
      expect(result.references).toHaveLength(1);
    });

    it('should handle multiple pronouns', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_acme',
            name: 'Acme',
            mentionedAt: new Date(),
          },
        ],
        lastNode: {
          type: 'node' as EntityType,
          id: 'node_acme',
          name: 'Acme',
          mentionedAt: new Date(),
        },
      };

      const result = resolver.resolveReferences(
        'Update it and then remove it',
        context
      );

      expect(result.resolvedMessage).toContain('Acme');
      expect(result.references.length).toBeGreaterThan(0);
    });

    it('should return original message if no entities in context', () => {
      const context = {
        entities: [],
      };

      const result = resolver.resolveReferences('Update it', context);

      expect(result.resolvedMessage).toBe('Update it');
      expect(result.references).toHaveLength(0);
    });
  });

  describe('addEntity', () => {
    it('should add new entity to context', () => {
      const context = {
        entities: [],
      };

      const entity = {
        type: 'node' as EntityType,
        id: 'node_test',
        name: 'TestNode',
      };

      const updatedContext = resolver.addEntity(entity, context);

      expect(updatedContext.entities).toHaveLength(1);
      expect(updatedContext.entities[0].name).toBe('TestNode');
      expect(updatedContext.entities[0].mentionedAt).toBeInstanceOf(Date);
    });

    it('should update existing entity', () => {
      const oldDate = new Date('2024-01-01');
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_test',
            name: 'TestNode',
            mentionedAt: oldDate,
          },
        ],
      };

      const entity = {
        type: 'node' as EntityType,
        id: 'node_test',
        name: 'TestNode',
      };

      const updatedContext = resolver.addEntity(entity, context);

      expect(updatedContext.entities).toHaveLength(1);
      expect(updatedContext.entities[0].mentionedAt.getTime()).toBeGreaterThan(
        oldDate.getTime()
      );
    });

    it('should update lastNode for node entities', () => {
      const context = {
        entities: [],
      };

      const entity = {
        type: 'node' as EntityType,
        id: 'node_test',
        name: 'TestNode',
      };

      const updatedContext = resolver.addEntity(entity, context);

      expect(updatedContext.lastNode).toBeDefined();
      expect(updatedContext.lastNode?.name).toBe('TestNode');
    });
  });

  describe('pruneOldEntities', () => {
    it('should remove old entities', () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const recentDate = new Date();

      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_old',
            name: 'OldNode',
            mentionedAt: oldDate,
          },
          {
            type: 'node' as EntityType,
            id: 'node_recent',
            name: 'RecentNode',
            mentionedAt: recentDate,
          },
        ],
      };

      const prunedContext = resolver.pruneOldEntities(context, 10 * 60 * 1000);

      expect(prunedContext.entities).toHaveLength(1);
      expect(prunedContext.entities[0].name).toBe('RecentNode');
    });

    it('should keep all entities if within max age', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_1',
            name: 'Node1',
            mentionedAt: new Date(),
          },
          {
            type: 'node' as EntityType,
            id: 'node_2',
            name: 'Node2',
            mentionedAt: new Date(),
          },
        ],
      };

      const prunedContext = resolver.pruneOldEntities(context);

      expect(prunedContext.entities).toHaveLength(2);
    });
  });

  describe('createEnhancedMessage', () => {
    it('should create enhanced message with resolved references', () => {
      const messages: Message[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Add supplier Acme Corp',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Added supplier Acme Corp',
          timestamp: new Date(),
        },
      ];

      const result = resolver.createEnhancedMessage('Update it', messages);

      expect(result.hasReferences).toBe(true);
      expect(result.enhancedMessage).not.toBe(result.originalMessage);
      expect(result.context.entities.length).toBeGreaterThan(0);
    });

    it('should return original message if no references', () => {
      const messages: Message[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ];

      const result = resolver.createEnhancedMessage(
        'Add a new supplier',
        messages
      );

      expect(result.hasReferences).toBe(false);
      expect(result.enhancedMessage).toBe(result.originalMessage);
    });
  });

  describe('getEntity', () => {
    it('should retrieve entity by ID', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_test',
            name: 'TestNode',
            mentionedAt: new Date(),
          },
        ],
      };

      const entity = resolver.getEntity('node_test', context);

      expect(entity).toBeDefined();
      expect(entity?.name).toBe('TestNode');
    });

    it('should return null for non-existent entity', () => {
      const context = {
        entities: [],
      };

      const entity = resolver.getEntity('node_nonexistent', context);

      expect(entity).toBeNull();
    });
  });

  describe('getEntitiesByType', () => {
    it('should retrieve entities by type', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_1',
            name: 'Node1',
            mentionedAt: new Date(),
          },
          {
            type: 'simulation' as EntityType,
            id: 'sim_1',
            name: 'Sim1',
            mentionedAt: new Date(),
          },
          {
            type: 'node' as EntityType,
            id: 'node_2',
            name: 'Node2',
            mentionedAt: new Date(),
          },
        ],
      };

      const nodes = resolver.getEntitiesByType('node', context);

      expect(nodes).toHaveLength(2);
      expect(nodes.every((e) => e.type === 'node')).toBe(true);
    });

    it('should return empty array for type with no entities', () => {
      const context = {
        entities: [
          {
            type: 'node' as EntityType,
            id: 'node_1',
            name: 'Node1',
            mentionedAt: new Date(),
          },
        ],
      };

      const alerts = resolver.getEntitiesByType('alert', context);

      expect(alerts).toHaveLength(0);
    });
  });
});
