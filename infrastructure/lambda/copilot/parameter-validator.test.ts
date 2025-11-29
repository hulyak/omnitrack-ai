/**
 * Unit tests for Parameter Validator
 */

import { ParameterValidator, commonValidations } from './parameter-validator';
import { ParameterSchema } from './action-registry';

describe('ParameterValidator', () => {
  let validator: ParameterValidator;

  beforeEach(() => {
    validator = new ParameterValidator();
  });

  describe('validate', () => {
    it('should validate required string parameter', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'nodeName',
          type: 'string',
          required: true,
          description: 'Name of the node'
        }
      ];

      const result = validator.validate({ nodeName: 'Supplier1' }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required parameter is missing', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'nodeName',
          type: 'string',
          required: true,
          description: 'Name of the node'
        }
      ];

      const result = validator.validate({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required parameter 'nodeName' is missing");
    });

    it('should validate number type', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'capacity',
          type: 'number',
          required: true,
          description: 'Node capacity'
        }
      ];

      const result = validator.validate({ capacity: 100 }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail when number type is incorrect', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'capacity',
          type: 'number',
          required: true,
          description: 'Node capacity'
        }
      ];

      const result = validator.validate({ capacity: 'not a number' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must be a number');
    });

    it('should validate boolean type', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'isActive',
          type: 'boolean',
          required: true,
          description: 'Is active'
        }
      ];

      const result = validator.validate({ isActive: true }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate object type', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'location',
          type: 'object',
          required: true,
          description: 'Location object'
        }
      ];

      const result = validator.validate({ location: { lat: 10, lng: 20 } }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail when object type is array', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'location',
          type: 'object',
          required: true,
          description: 'Location object'
        }
      ];

      const result = validator.validate({ location: [1, 2, 3] }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must be an object');
    });

    it('should validate array type', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'nodeIds',
          type: 'array',
          required: true,
          description: 'Array of node IDs'
        }
      ];

      const result = validator.validate({ nodeIds: ['id1', 'id2'] }, schema);
      expect(result.valid).toBe(true);
    });

    it('should apply custom validation', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'email',
          type: 'string',
          required: true,
          description: 'Email address',
          validation: (value) => value.includes('@')
        }
      ];

      const validResult = validator.validate({ email: 'test@example.com' }, schema);
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validate({ email: 'invalid-email' }, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toContain('failed custom validation');
    });

    it('should skip validation for optional missing parameters', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'optionalParam',
          type: 'string',
          required: false,
          description: 'Optional parameter'
        }
      ];

      const result = validator.validate({}, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate multiple parameters', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Name'
        },
        {
          name: 'count',
          type: 'number',
          required: true,
          description: 'Count'
        },
        {
          name: 'active',
          type: 'boolean',
          required: false,
          description: 'Active flag'
        }
      ];

      const result = validator.validate({ name: 'Test', count: 5 }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail when params is not an object', () => {
      const schema: ParameterSchema[] = [];
      
      const result = validator.validate('not an object', schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Parameters must be an object');
    });
  });

  describe('applyDefaults', () => {
    it('should apply default values', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Timeout',
          defaultValue: 30
        }
      ];

      const result = validator.applyDefaults({}, schema);
      expect(result.timeout).toBe(30);
    });

    it('should not override provided values', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Timeout',
          defaultValue: 30
        }
      ];

      const result = validator.applyDefaults({ timeout: 60 }, schema);
      expect(result.timeout).toBe(60);
    });
  });

  describe('validateAndApplyDefaults', () => {
    it('should apply defaults and validate', () => {
      const schema: ParameterSchema[] = [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Name'
        },
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Timeout',
          defaultValue: 30
        }
      ];

      const result = validator.validateAndApplyDefaults({ name: 'Test' }, schema);
      expect(result.validation.valid).toBe(true);
      expect(result.params.timeout).toBe(30);
    });
  });

  describe('commonValidations', () => {
    it('should validate non-empty string', () => {
      expect(commonValidations.nonEmptyString('test')).toBe(true);
      expect(commonValidations.nonEmptyString('')).toBe(false);
      expect(commonValidations.nonEmptyString('   ')).toBe(false);
    });

    it('should validate positive number', () => {
      expect(commonValidations.positiveNumber(5)).toBe(true);
      expect(commonValidations.positiveNumber(0)).toBe(false);
      expect(commonValidations.positiveNumber(-5)).toBe(false);
    });

    it('should validate non-negative number', () => {
      expect(commonValidations.nonNegativeNumber(5)).toBe(true);
      expect(commonValidations.nonNegativeNumber(0)).toBe(true);
      expect(commonValidations.nonNegativeNumber(-5)).toBe(false);
    });

    it('should validate number in range', () => {
      const validator = commonValidations.numberInRange(0, 100);
      expect(validator(50)).toBe(true);
      expect(validator(0)).toBe(true);
      expect(validator(100)).toBe(true);
      expect(validator(-1)).toBe(false);
      expect(validator(101)).toBe(false);
    });

    it('should validate email', () => {
      expect(commonValidations.email('test@example.com')).toBe(true);
      expect(commonValidations.email('invalid')).toBe(false);
      expect(commonValidations.email('test@')).toBe(false);
    });

    it('should validate URL', () => {
      expect(commonValidations.url('https://example.com')).toBe(true);
      expect(commonValidations.url('http://example.com')).toBe(true);
      expect(commonValidations.url('not a url')).toBe(false);
    });

    it('should validate oneOf', () => {
      const validator = commonValidations.oneOf(['red', 'green', 'blue']);
      expect(validator('red')).toBe(true);
      expect(validator('yellow')).toBe(false);
    });

    it('should validate array min length', () => {
      const validator = commonValidations.minLength(2);
      expect(validator([1, 2, 3])).toBe(true);
      expect(validator([1])).toBe(false);
    });

    it('should validate array max length', () => {
      const validator = commonValidations.maxLength(3);
      expect(validator([1, 2])).toBe(true);
      expect(validator([1, 2, 3, 4])).toBe(false);
    });

    it('should validate object has keys', () => {
      const validator = commonValidations.hasKeys(['name', 'age']);
      expect(validator({ name: 'John', age: 30 })).toBe(true);
      expect(validator({ name: 'John' })).toBe(false);
    });
  });
});
