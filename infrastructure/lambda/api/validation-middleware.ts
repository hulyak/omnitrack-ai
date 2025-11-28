/**
 * Request Validation Middleware
 * 
 * Provides validation for API requests to ensure data integrity
 * and security before processing.
 * 
 * Requirements: All (API layer)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    items?: ValidationSchema;
    properties?: ValidationSchema;
  };
}

/**
 * Validate request body against schema
 */
export function validateBody(
  body: any,
  schema: ValidationSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Field '${field}' is required`);
      continue;
    }

    // Skip validation if field is not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(`Field '${field}' must be of type ${rules.type}, got ${actualType}`);
      continue;
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min} characters`);
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`Field '${field}' must be at most ${rules.max} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`Field '${field}' does not match required pattern`);
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field '${field}' must be at most ${rules.max}`);
      }
    }

    // Array validations
    if (rules.type === 'array') {
      if (rules.min !== undefined && value.length < rules.min) {
        errors.push(`Field '${field}' must have at least ${rules.min} items`);
      }
      if (rules.max !== undefined && value.length > rules.max) {
        errors.push(`Field '${field}' must have at most ${rules.max} items`);
      }
      if (rules.items) {
        value.forEach((item: any, index: number) => {
          const itemValidation = validateBody(item, rules.items!);
          if (!itemValidation.valid) {
            errors.push(
              ...itemValidation.errors.map((e) => `${field}[${index}]: ${e}`)
            );
          }
        });
      }
    }

    // Object validations
    if (rules.type === 'object' && rules.properties) {
      const objectValidation = validateBody(value, rules.properties);
      if (!objectValidation.valid) {
        errors.push(...objectValidation.errors.map((e) => `${field}.${e}`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Middleware wrapper for request validation
 */
export function withValidation(
  schema: ValidationSchema,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Parse body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const body = JSON.parse(event.body);

      // Validate body
      const validation = validateBody(body, schema);

      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Validation failed',
            details: validation.errors,
          }),
        };
      }

      // Call handler if validation passes
      return await handler(event);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }

      throw error;
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Scenario simulation request
  simulateScenario: {
    disruptionType: {
      type: 'string' as const,
      required: true,
      enum: [
        'supplier_failure',
        'transportation_delay',
        'natural_disaster',
        'demand_spike',
        'quality_issue',
        'geopolitical_event',
      ],
    },
    location: {
      type: 'string' as const,
      required: true,
      min: 1,
      max: 200,
    },
    severity: {
      type: 'string' as const,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    duration: {
      type: 'number' as const,
      required: false,
      min: 1,
      max: 365,
    },
    affectedNodes: {
      type: 'array' as const,
      required: false,
      items: {
        nodeId: {
          type: 'string' as const,
          required: true,
        },
      },
    },
  },

  // Feedback submission
  submitFeedback: {
    scenarioId: {
      type: 'string' as const,
      required: true,
      pattern: /^SCENARIO#[a-zA-Z0-9-]+$/,
    },
    userId: {
      type: 'string' as const,
      required: true,
    },
    actualOutcome: {
      type: 'string' as const,
      required: true,
      min: 10,
      max: 5000,
    },
    accuracy: {
      type: 'number' as const,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: 'string' as const,
      required: true,
      min: 1,
      max: 2000,
    },
  },

  // Marketplace scenario publication
  publishScenario: {
    scenarioId: {
      type: 'string' as const,
      required: true,
    },
    title: {
      type: 'string' as const,
      required: true,
      min: 5,
      max: 200,
    },
    description: {
      type: 'string' as const,
      required: true,
      min: 20,
      max: 2000,
    },
    tags: {
      type: 'array' as const,
      required: true,
      min: 1,
      max: 10,
    },
    industry: {
      type: 'string' as const,
      required: true,
    },
    disruptionType: {
      type: 'string' as const,
      required: true,
    },
    geography: {
      type: 'string' as const,
      required: true,
    },
  },

  // Rating submission
  rateScenario: {
    rating: {
      type: 'number' as const,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: 'string' as const,
      required: false,
      max: 1000,
    },
  },

  // User preferences update
  updatePreferences: {
    notificationChannels: {
      type: 'array' as const,
      required: false,
    },
    defaultView: {
      type: 'string' as const,
      required: false,
      enum: ['dashboard', 'scenarios', 'marketplace', 'sustainability'],
    },
    sustainabilityPriority: {
      type: 'number' as const,
      required: false,
      min: 0,
      max: 1,
    },
    costPriority: {
      type: 'number' as const,
      required: false,
      min: 0,
      max: 1,
    },
    riskPriority: {
      type: 'number' as const,
      required: false,
      min: 0,
      max: 1,
    },
  },
};

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (ISO 8601)
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
