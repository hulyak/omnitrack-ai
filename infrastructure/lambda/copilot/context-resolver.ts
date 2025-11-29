import { Message } from './conversation-service';
import { logger } from '../utils/logger';

/**
 * Entity types that can be tracked in conversation
 */
export type EntityType =
  | 'node'
  | 'edge'
  | 'simulation'
  | 'configuration'
  | 'action'
  | 'alert';

/**
 * Tracked entity in conversation
 */
export interface TrackedEntity {
  type: EntityType;
  id: string;
  name: string;
  mentionedAt: Date;
  properties?: Record<string, any>;
}

/**
 * Context for reference resolution
 */
export interface ResolutionContext {
  entities: TrackedEntity[];
  lastAction?: string;
  lastNode?: TrackedEntity;
  lastSimulation?: TrackedEntity;
}

/**
 * Service for resolving pronoun references in conversation
 */
export class ContextResolver {
  private pronouns = ['it', 'that', 'this', 'them', 'those', 'these'];
  private entityPatterns: Record<EntityType, RegExp[]> = {
    node: [
      /(?:supplier|manufacturer|warehouse|distributor|retailer)\s+(?:named\s+)?["']?([^"'\s,]+)["']?/gi,
      /node\s+["']?([^"'\s,]+)["']?/gi,
    ],
    edge: [/connection\s+(?:between\s+)?["']?([^"'\s,]+)["']?/gi],
    simulation: [
      /simulation\s+["']?([^"'\s,]+)["']?/gi,
      /scenario\s+["']?([^"'\s,]+)["']?/gi,
    ],
    configuration: [/configuration\s+["']?([^"'\s,]+)["']?/gi],
    action: [/action\s+["']?([^"'\s,]+)["']?/gi],
    alert: [/alert\s+["']?([^"'\s,]+)["']?/gi],
  };

  /**
   * Extract entities mentioned in a message
   */
  extractEntities(message: string): TrackedEntity[] {
    const entities: TrackedEntity[] = [];
    const now = new Date();

    for (const [type, patterns] of Object.entries(this.entityPatterns)) {
      for (const pattern of patterns) {
        const matches = message.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            entities.push({
              type: type as EntityType,
              id: this.generateEntityId(type as EntityType, match[1]),
              name: match[1],
              mentionedAt: now,
            });
          }
        }
      }
    }

    return entities;
  }

  /**
   * Track entities from conversation history
   */
  trackEntities(messages: Message[]): ResolutionContext {
    const entities: TrackedEntity[] = [];
    let lastAction: string | undefined;
    let lastNode: TrackedEntity | undefined;
    let lastSimulation: TrackedEntity | undefined;

    // Process messages in chronological order
    for (const message of messages) {
      const messageEntities = this.extractEntities(message.content);

      for (const entity of messageEntities) {
        // Update or add entity
        const existingIndex = entities.findIndex((e) => e.id === entity.id);
        if (existingIndex >= 0) {
          entities[existingIndex] = entity;
        } else {
          entities.push(entity);
        }

        // Track last mentioned entities by type
        if (entity.type === 'node') {
          lastNode = entity;
        } else if (entity.type === 'simulation') {
          lastSimulation = entity;
        } else if (entity.type === 'action') {
          lastAction = entity.name;
        }
      }
    }

    return {
      entities,
      lastAction,
      lastNode,
      lastSimulation,
    };
  }

  /**
   * Check if message contains pronouns that need resolution
   */
  containsPronouns(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.pronouns.some((pronoun) => {
      const pattern = new RegExp(`\\b${pronoun}\\b`, 'i');
      return pattern.test(lowerMessage);
    });
  }

  /**
   * Resolve pronoun references in a message
   */
  resolveReferences(
    message: string,
    context: ResolutionContext
  ): {
    resolvedMessage: string;
    references: Array<{ pronoun: string; entity: TrackedEntity }>;
  } {
    let resolvedMessage = message;
    const references: Array<{ pronoun: string; entity: TrackedEntity }> = [];

    // Sort entities by most recently mentioned
    const sortedEntities = [...context.entities].sort(
      (a, b) => b.mentionedAt.getTime() - a.mentionedAt.getTime()
    );

    // Resolve each pronoun
    for (const pronoun of this.pronouns) {
      const pattern = new RegExp(`\\b${pronoun}\\b`, 'gi');
      const matches = message.match(pattern);

      if (matches) {
        // Get most recent entity for this pronoun
        const entity = this.selectEntityForPronoun(
          pronoun,
          sortedEntities,
          context
        );

        if (entity) {
          // Replace pronoun with entity reference
          resolvedMessage = resolvedMessage.replace(
            pattern,
            `${entity.type} "${entity.name}"`
          );

          references.push({ pronoun, entity });

          logger.debug('Resolved pronoun reference', {
            pronoun,
            entity: entity.name,
            type: entity.type,
          });
        }
      }
    }

    return { resolvedMessage, references };
  }

  /**
   * Select appropriate entity for pronoun based on context
   */
  private selectEntityForPronoun(
    pronoun: string,
    entities: TrackedEntity[],
    context: ResolutionContext
  ): TrackedEntity | null {
    const lowerPronoun = pronoun.toLowerCase();

    // Singular pronouns (it, that, this) -> most recent entity
    if (['it', 'that', 'this'].includes(lowerPronoun)) {
      // Prefer specific types based on context
      if (context.lastNode) {
        return context.lastNode;
      }
      if (context.lastSimulation) {
        return context.lastSimulation;
      }
      return entities[0] || null;
    }

    // Plural pronouns (them, those, these) -> most recent plural entity
    if (['them', 'those', 'these'].includes(lowerPronoun)) {
      // For now, return most recent entity
      // Could be enhanced to handle multiple entities
      return entities[0] || null;
    }

    return null;
  }

  /**
   * Generate consistent entity ID
   */
  private generateEntityId(type: EntityType, name: string): string {
    return `${type}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Get entity by ID
   */
  getEntity(
    entityId: string,
    context: ResolutionContext
  ): TrackedEntity | null {
    return context.entities.find((e) => e.id === entityId) || null;
  }

  /**
   * Get entities by type
   */
  getEntitiesByType(
    type: EntityType,
    context: ResolutionContext
  ): TrackedEntity[] {
    return context.entities.filter((e) => e.type === type);
  }

  /**
   * Add entity to context
   */
  addEntity(
    entity: Omit<TrackedEntity, 'mentionedAt'>,
    context: ResolutionContext
  ): ResolutionContext {
    const trackedEntity: TrackedEntity = {
      ...entity,
      mentionedAt: new Date(),
    };

    const existingIndex = context.entities.findIndex(
      (e) => e.id === entity.id
    );

    if (existingIndex >= 0) {
      context.entities[existingIndex] = trackedEntity;
    } else {
      context.entities.push(trackedEntity);
    }

    // Update last mentioned entities
    if (entity.type === 'node') {
      context.lastNode = trackedEntity;
    } else if (entity.type === 'simulation') {
      context.lastSimulation = trackedEntity;
    } else if (entity.type === 'action') {
      context.lastAction = entity.name;
    }

    return context;
  }

  /**
   * Clear old entities (older than 10 messages)
   */
  pruneOldEntities(
    context: ResolutionContext,
    maxAge: number = 10 * 60 * 1000 // 10 minutes
  ): ResolutionContext {
    const now = Date.now();
    context.entities = context.entities.filter(
      (e) => now - e.mentionedAt.getTime() < maxAge
    );
    return context;
  }

  /**
   * Create enhanced message with resolved references
   */
  createEnhancedMessage(
    originalMessage: string,
    conversationHistory: Message[]
  ): {
    originalMessage: string;
    enhancedMessage: string;
    context: ResolutionContext;
    hasReferences: boolean;
  } {
    // Track entities from history
    const context = this.trackEntities(conversationHistory);

    // Check if message contains pronouns
    const hasReferences = this.containsPronouns(originalMessage);

    if (!hasReferences) {
      return {
        originalMessage,
        enhancedMessage: originalMessage,
        context,
        hasReferences: false,
      };
    }

    // Resolve references
    const { resolvedMessage } = this.resolveReferences(originalMessage, context);

    logger.info('Enhanced message with context', {
      original: originalMessage,
      enhanced: resolvedMessage,
      entitiesTracked: context.entities.length,
    });

    return {
      originalMessage,
      enhancedMessage: resolvedMessage,
      context,
      hasReferences: true,
    };
  }
}
