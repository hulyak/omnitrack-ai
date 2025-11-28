/**
 * Input validation and sanitization functions
 */

import {
  User,
  Node,
  Scenario,
  Alert,
  Feedback,
  UserRole,
  NodeType,
  NodeStatus,
  DisruptionType,
  Severity,
  AlertType,
  AlertStatus,
  NotificationChannel
} from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates UUID format
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitizes string input by removing potentially harmful characters
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validates User entity
 */
export function validateUser(user: Partial<User>): void {
  if (!user.userId || !validateUUID(user.userId)) {
    throw new ValidationError('Invalid user ID format');
  }
  
  if (!user.email || !validateEmail(user.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  if (!user.name || user.name.trim().length === 0) {
    throw new ValidationError('Name is required');
  }
  
  if (!user.role || !Object.values(UserRole).includes(user.role)) {
    throw new ValidationError('Invalid user role');
  }
  
  if (user.preferences) {
    if (!Array.isArray(user.preferences.notificationChannels)) {
      throw new ValidationError('Notification channels must be an array');
    }
    
    for (const channel of user.preferences.notificationChannels) {
      if (!Object.values(NotificationChannel).includes(channel)) {
        throw new ValidationError(`Invalid notification channel: ${channel}`);
      }
    }
  }
}

/**
 * Validates Node entity
 */
export function validateNode(node: Partial<Node>): void {
  if (!node.nodeId || !validateUUID(node.nodeId)) {
    throw new ValidationError('Invalid node ID format');
  }
  
  if (!node.type || !Object.values(NodeType).includes(node.type)) {
    throw new ValidationError('Invalid node type');
  }
  
  if (!node.status || !Object.values(NodeStatus).includes(node.status)) {
    throw new ValidationError('Invalid node status');
  }
  
  if (!node.location) {
    throw new ValidationError('Location is required');
  }
  
  if (typeof node.location.latitude !== 'number' || 
      node.location.latitude < -90 || 
      node.location.latitude > 90) {
    throw new ValidationError('Invalid latitude');
  }
  
  if (typeof node.location.longitude !== 'number' || 
      node.location.longitude < -180 || 
      node.location.longitude > 180) {
    throw new ValidationError('Invalid longitude');
  }
  
  if (typeof node.capacity !== 'number' || node.capacity < 0) {
    throw new ValidationError('Capacity must be a non-negative number');
  }
  
  if (!Array.isArray(node.connections)) {
    throw new ValidationError('Connections must be an array');
  }
}

/**
 * Validates Scenario entity
 */
export function validateScenario(scenario: Partial<Scenario>): void {
  if (!scenario.scenarioId || !validateUUID(scenario.scenarioId)) {
    throw new ValidationError('Invalid scenario ID format');
  }
  
  if (!scenario.type || !Object.values(DisruptionType).includes(scenario.type)) {
    throw new ValidationError('Invalid disruption type');
  }
  
  if (!scenario.createdBy || !validateUUID(scenario.createdBy)) {
    throw new ValidationError('Invalid creator user ID');
  }
  
  if (!scenario.parameters) {
    throw new ValidationError('Scenario parameters are required');
  }
  
  if (!scenario.parameters.severity || !Object.values(Severity).includes(scenario.parameters.severity)) {
    throw new ValidationError('Invalid severity level');
  }
  
  if (typeof scenario.parameters.duration !== 'number' || scenario.parameters.duration <= 0) {
    throw new ValidationError('Duration must be a positive number');
  }
  
  if (!Array.isArray(scenario.parameters.affectedNodes)) {
    throw new ValidationError('Affected nodes must be an array');
  }
  
  if (scenario.parameters.location) {
    if (typeof scenario.parameters.location.latitude !== 'number' || 
        scenario.parameters.location.latitude < -90 || 
        scenario.parameters.location.latitude > 90) {
      throw new ValidationError('Invalid latitude in scenario parameters');
    }
    
    if (typeof scenario.parameters.location.longitude !== 'number' || 
        scenario.parameters.location.longitude < -180 || 
        scenario.parameters.location.longitude > 180) {
      throw new ValidationError('Invalid longitude in scenario parameters');
    }
  }
  
  if (typeof scenario.isPublic !== 'boolean') {
    throw new ValidationError('isPublic must be a boolean');
  }
}

/**
 * Validates Alert entity
 */
export function validateAlert(alert: Partial<Alert>): void {
  if (!alert.alertId || !validateUUID(alert.alertId)) {
    throw new ValidationError('Invalid alert ID format');
  }
  
  if (!alert.type || !Object.values(AlertType).includes(alert.type)) {
    throw new ValidationError('Invalid alert type');
  }
  
  if (!alert.severity || !Object.values(Severity).includes(alert.severity)) {
    throw new ValidationError('Invalid severity level');
  }
  
  if (!alert.nodeId || !validateUUID(alert.nodeId)) {
    throw new ValidationError('Invalid node ID format');
  }
  
  if (!alert.status || !Object.values(AlertStatus).includes(alert.status)) {
    throw new ValidationError('Invalid alert status');
  }
  
  if (!alert.message || alert.message.trim().length === 0) {
    throw new ValidationError('Alert message is required');
  }
  
  if (alert.metadata) {
    if (typeof alert.metadata.priority !== 'number' || 
        alert.metadata.priority < 1 || 
        alert.metadata.priority > 10) {
      throw new ValidationError('Priority must be between 1 and 10');
    }
    
    if (!Array.isArray(alert.metadata.affectedNodes)) {
      throw new ValidationError('Affected nodes must be an array');
    }
  }
}

/**
 * Validates Feedback entity
 */
export function validateFeedback(feedback: Partial<Feedback>): void {
  if (!feedback.feedbackId || !validateUUID(feedback.feedbackId)) {
    throw new ValidationError('Invalid feedback ID format');
  }
  
  if (!feedback.scenarioId || !validateUUID(feedback.scenarioId)) {
    throw new ValidationError('Invalid scenario ID format');
  }
  
  if (!feedback.userId || !validateUUID(feedback.userId)) {
    throw new ValidationError('Invalid user ID format');
  }
  
  if (!feedback.actualOutcome || feedback.actualOutcome.trim().length === 0) {
    throw new ValidationError('Actual outcome is required');
  }
  
  if (typeof feedback.accuracy !== 'number' || 
      feedback.accuracy < 1 || 
      feedback.accuracy > 5) {
    throw new ValidationError('Accuracy must be between 1 and 5');
  }
  
  if (!feedback.comments || feedback.comments.trim().length === 0) {
    throw new ValidationError('Comments are required');
  }
}

/**
 * Validates and sanitizes user input for scenarios
 */
export function sanitizeScenarioInput(input: any): Partial<Scenario> {
  return {
    ...input,
    parameters: {
      ...input.parameters,
      location: input.parameters?.location ? {
        ...input.parameters.location,
        address: sanitizeString(input.parameters.location.address || ''),
        city: sanitizeString(input.parameters.location.city || ''),
        country: sanitizeString(input.parameters.location.country || '')
      } : undefined
    },
    marketplaceMetadata: input.marketplaceMetadata ? {
      ...input.marketplaceMetadata,
      title: sanitizeString(input.marketplaceMetadata.title || ''),
      description: sanitizeString(input.marketplaceMetadata.description || ''),
      author: sanitizeString(input.marketplaceMetadata.author || ''),
      industry: sanitizeString(input.marketplaceMetadata.industry || ''),
      geography: sanitizeString(input.marketplaceMetadata.geography || '')
    } : undefined
  };
}
