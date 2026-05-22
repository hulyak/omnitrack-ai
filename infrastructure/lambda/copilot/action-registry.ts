/**
 * Action Registry for AI Copilot
 * 
 * Manages registration and lookup of copilot actions.
 * Actions are executable operations that the copilot can perform
 * in response to user intents.
 */

import { logger } from '../utils/logger';

/**
 * Parameter schema for action validation
 */
export interface ParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: (value: any) => boolean;
  defaultValue?: any;
}

/**
 * Validation result from parameter validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Result returned from action execution
 */
export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
}

/**
 * Supply chain context passed to actions
 */
export interface SupplyChainContext {
  userId: string;
  nodes: any[];
  edges: any[];
  configuration: any;
  recentActions: string[];
  activeSimulations: any[];
}

/**
 * Action definition interface
 */
export interface Action {
  name: string;
  category: 'build' | 'configure' | 'analyze' | 'simulate' | 'query';
  description: string;
  examples: string[];
  parameters: ParameterSchema[];
  execute: (params: any, context: SupplyChainContext) => Promise<ActionResult>;
  validate: (params: any) => ValidationResult;
}

/**
 * Action Registry class
 * 
 * Manages registration and lookup of copilot actions.
 * Provides methods to register actions, lookup by name or intent,
 * and retrieve all available actions.
 */
export class ActionRegistry {
  private actions: Map<string, Action>;
  private intentMapping: Map<string, string>; // Maps intent patterns to action names

  constructor() {
    this.actions = new Map();
    this.intentMapping = new Map();
    
    logger.info('ActionRegistry initialized');
  }

  /**
   * Register a new action in the registry
   * 
   * @param action - The action to register
   * @throws Error if action with same name already exists
   */
  register(action: Action): void {
    if (this.actions.has(action.name)) {
      const errorMsg = `Action with name '${action.name}' already registered`;
      logger.error('Action registration failed', undefined, { actionName: action.name, error: errorMsg });
      throw new Error(errorMsg);
    }

    // Validate action structure
    if (!action.name || !action.category || !action.description) {
      const errorMsg = 'Action must have name, category, and description';
      logger.error('Invalid action structure', undefined, { action: action.name });
      throw new Error(errorMsg);
    }

    if (typeof action.execute !== 'function') {
      const errorMsg = 'Action must have an execute function';
      logger.error('Invalid action structure', undefined, { actionName: action.name });
      throw new Error(errorMsg);
    }

    if (typeof action.validate !== 'function') {
      const errorMsg = 'Action must have a validate function';
      logger.error('Invalid action structure', undefined, { actionName: action.name });
      throw new Error(errorMsg);
    }

    this.actions.set(action.name, action);
    
    // Register intent mappings based on action name and examples
    this.registerIntentMappings(action);
    
    logger.info('Action registered', {
      actionName: action.name,
      category: action.category,
      parameterCount: action.parameters.length
    });
  }

  /**
   * Register intent mappings for an action
   * Maps various intent patterns to the action name
   */
  private registerIntentMappings(action: Action): void {
    // Map the action name itself
    this.intentMapping.set(action.name.toLowerCase(), action.name);
    
    // Map variations of the action name
    const nameVariations = this.generateNameVariations(action.name);
    nameVariations.forEach(variation => {
      this.intentMapping.set(variation.toLowerCase(), action.name);
    });
    
    // Map example phrases
    action.examples.forEach(example => {
      const key = this.normalizeIntent(example);
      this.intentMapping.set(key, action.name);
    });
  }

  /**
   * Generate name variations for better intent matching
   */
  private generateNameVariations(name: string): string[] {
    const variations: string[] = [];
    
    // Convert kebab-case to space-separated
    variations.push(name.replace(/-/g, ' '));
    
    // Convert kebab-case to camelCase
    variations.push(name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
    
    return variations;
  }

  /**
   * Normalize intent string for matching
   */
  private normalizeIntent(intent: string): string {
    return intent
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Lookup action by name
   * 
   * @param name - The action name
   * @returns The action if found, undefined otherwise
   */
  getByName(name: string): Action | undefined {
    const action = this.actions.get(name);
    
    if (!action) {
      logger.debug('Action not found by name', { name });
    }
    
    return action;
  }

  /**
   * Lookup action by intent
   * 
   * @param intent - The user intent string
   * @returns The action if found, undefined otherwise
   */
  getByIntent(intent: string): Action | undefined {
    const normalizedIntent = this.normalizeIntent(intent);
    
    // Try exact match first
    const actionName = this.intentMapping.get(normalizedIntent);
    if (actionName) {
      const action = this.actions.get(actionName);
      logger.debug('Action found by intent', { intent, actionName });
      return action;
    }
    
    // Try partial match
    for (const [key, name] of Array.from(this.intentMapping.entries())) {
      if (normalizedIntent.includes(key) || key.includes(normalizedIntent)) {
        const action = this.actions.get(name);
        logger.debug('Action found by partial intent match', { intent, actionName: name });
        return action;
      }
    }
    
    logger.debug('Action not found by intent', { intent });
    return undefined;
  }

  /**
   * Get all registered actions
   * 
   * @returns Array of all actions
   */
  getAllActions(): Action[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by category
   * 
   * @param category - The action category
   * @returns Array of actions in the category
   */
  getByCategory(category: Action['category']): Action[] {
    return this.getAllActions().filter(action => action.category === category);
  }

  /**
   * Get count of registered actions
   * 
   * @returns Number of registered actions
   */
  getActionCount(): number {
    return this.actions.size;
  }

  /**
   * Check if an action is registered
   * 
   * @param name - The action name
   * @returns True if action exists
   */
  hasAction(name: string): boolean {
    return this.actions.has(name);
  }

  /**
   * Unregister an action (useful for testing)
   * 
   * @param name - The action name to remove
   * @returns True if action was removed
   */
  unregister(name: string): boolean {
    const removed = this.actions.delete(name);
    
    if (removed) {
      // Remove intent mappings
      for (const [key, actionName] of Array.from(this.intentMapping.entries())) {
        if (actionName === name) {
          this.intentMapping.delete(key);
        }
      }
      
      logger.info('Action unregistered', { actionName: name });
    }
    
    return removed;
  }

  /**
   * Clear all registered actions (useful for testing)
   */
  clear(): void {
    this.actions.clear();
    this.intentMapping.clear();
    logger.info('ActionRegistry cleared');
  }
}

/**
 * Singleton instance of the action registry
 */
export const actionRegistry = new ActionRegistry();
