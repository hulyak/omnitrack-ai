/**
 * Parameter Validator for AI Copilot Actions
 * 
 * Validates action parameters against their schemas.
 * Provides type checking, required field validation, and custom validation rules.
 */

import { logger } from '../utils/logger';
import { ParameterSchema, ValidationResult } from './action-registry';

/**
 * Parameter Validator class
 * 
 * Validates parameters against schemas with support for:
 * - Type checking (string, number, boolean, object, array)
 * - Required field validation
 * - Custom validation functions
 * - Default value handling
 */
export class ParameterValidator {
  /**
   * Validate parameters against a schema
   * 
   * @param params - The parameters to validate
   * @param schema - Array of parameter schemas
   * @returns ValidationResult with valid flag and error messages
   */
  validate(params: any, schema: ParameterSchema[]): ValidationResult {
    const errors: string[] = [];

    // Check if params is an object
    if (params === null || typeof params !== 'object' || Array.isArray(params)) {
      errors.push('Parameters must be an object');
      return { valid: false, errors };
    }

    // Validate each schema parameter
    for (const paramSchema of schema) {
      const value = params[paramSchema.name];
      
      // Check required fields
      if (paramSchema.required && (value === undefined || value === null)) {
        errors.push(`Required parameter '${paramSchema.name}' is missing`);
        continue;
      }

      // Skip validation if parameter is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type checking
      const typeError = this.validateType(value, paramSchema.type, paramSchema.name);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Custom validation
      if (paramSchema.validation) {
        try {
          const isValid = paramSchema.validation(value);
          if (!isValid) {
            errors.push(`Parameter '${paramSchema.name}' failed custom validation`);
          }
        } catch (error) {
          logger.error('Custom validation function threw error', error instanceof Error ? error : undefined, {
            parameterName: paramSchema.name,
            errorMessage: error instanceof Error ? error.message : String(error)
          });
          errors.push(`Parameter '${paramSchema.name}' validation error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Check for unexpected parameters
    const schemaParamNames = new Set(schema.map(s => s.name));
    const providedParamNames = Object.keys(params);
    
    for (const paramName of providedParamNames) {
      if (!schemaParamNames.has(paramName)) {
        logger.warning('Unexpected parameter provided', { parameterName: paramName });
        // Note: We don't add this to errors as it's just a warning
      }
    }

    const valid = errors.length === 0;
    
    if (!valid) {
      logger.debug('Parameter validation failed', { errors });
    }

    return { valid, errors };
  }

  /**
   * Validate parameter type
   * 
   * @param value - The value to check
   * @param expectedType - The expected type
   * @param paramName - The parameter name for error messages
   * @returns Error message if invalid, null if valid
   */
  private validateType(
    value: any,
    expectedType: ParameterSchema['type'],
    paramName: string
  ): string | null {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `Parameter '${paramName}' must be a string, got ${typeof value}`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Parameter '${paramName}' must be a number, got ${typeof value}`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Parameter '${paramName}' must be a boolean, got ${typeof value}`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `Parameter '${paramName}' must be an object, got ${Array.isArray(value) ? 'array' : typeof value}`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return `Parameter '${paramName}' must be an array, got ${typeof value}`;
        }
        break;

      default:
        logger.warning('Unknown parameter type in schema', { 
          paramName, 
          expectedType 
        });
        return `Unknown type '${expectedType}' for parameter '${paramName}'`;
    }

    return null;
  }

  /**
   * Apply default values to parameters
   * 
   * @param params - The parameters object
   * @param schema - Array of parameter schemas
   * @returns Parameters with defaults applied
   */
  applyDefaults(params: any, schema: ParameterSchema[]): any {
    const result = { ...params };

    for (const paramSchema of schema) {
      if (paramSchema.defaultValue !== undefined && 
          (result[paramSchema.name] === undefined || result[paramSchema.name] === null)) {
        result[paramSchema.name] = paramSchema.defaultValue;
        
        logger.debug('Applied default value', {
          parameterName: paramSchema.name,
          defaultValue: paramSchema.defaultValue
        });
      }
    }

    return result;
  }

  /**
   * Validate and apply defaults in one operation
   * 
   * @param params - The parameters to validate
   * @param schema - Array of parameter schemas
   * @returns Object with validation result and processed parameters
   */
  validateAndApplyDefaults(
    params: any,
    schema: ParameterSchema[]
  ): { validation: ValidationResult; params: any } {
    // First apply defaults
    const processedParams = this.applyDefaults(params, schema);
    
    // Then validate
    const validation = this.validate(processedParams, schema);
    
    return {
      validation,
      params: processedParams
    };
  }

  /**
   * Create a validation function for a specific schema
   * Useful for creating reusable validators
   * 
   * @param schema - Array of parameter schemas
   * @returns Validation function
   */
  createValidator(schema: ParameterSchema[]): (params: any) => ValidationResult {
    return (params: any) => this.validate(params, schema);
  }
}

/**
 * Singleton instance of the parameter validator
 */
export const parameterValidator = new ParameterValidator();

/**
 * Common validation functions for reuse
 */
export const commonValidations = {
  /**
   * Validate that a string is not empty
   */
  nonEmptyString: (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Validate that a number is positive
   */
  positiveNumber: (value: any): boolean => {
    return typeof value === 'number' && value > 0;
  },

  /**
   * Validate that a number is non-negative
   */
  nonNegativeNumber: (value: any): boolean => {
    return typeof value === 'number' && value >= 0;
  },

  /**
   * Validate that a number is within a range
   */
  numberInRange: (min: number, max: number) => (value: any): boolean => {
    return typeof value === 'number' && value >= min && value <= max;
  },

  /**
   * Validate that a string matches a pattern
   */
  matchesPattern: (pattern: RegExp) => (value: any): boolean => {
    return typeof value === 'string' && pattern.test(value);
  },

  /**
   * Validate that a value is one of allowed values
   */
  oneOf: <T>(allowedValues: T[]) => (value: any): boolean => {
    return allowedValues.includes(value);
  },

  /**
   * Validate that an array has minimum length
   */
  minLength: (min: number) => (value: any): boolean => {
    return Array.isArray(value) && value.length >= min;
  },

  /**
   * Validate that an array has maximum length
   */
  maxLength: (max: number) => (value: any): boolean => {
    return Array.isArray(value) && value.length <= max;
  },

  /**
   * Validate email format
   */
  email: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Validate URL format
   */
  url: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate that object has required keys
   */
  hasKeys: (requiredKeys: string[]) => (value: any): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    return requiredKeys.every(key => key in value);
  }
};
