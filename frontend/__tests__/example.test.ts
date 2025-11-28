import * as fc from 'fast-check';

describe('Example Tests', () => {
  describe('Unit Tests', () => {
    it('should pass a basic unit test', () => {
      expect(1 + 1).toBe(2);
    });

    it('should validate string concatenation', () => {
      const result = 'Hello' + ' ' + 'World';
      expect(result).toBe('Hello World');
    });
  });

  describe('Property-Based Tests', () => {
    it('should verify addition is commutative', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          return a + b === b + a;
        }),
        { numRuns: 100 }
      );
    });

    it('should verify string concatenation length', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (str1, str2) => {
          const result = str1 + str2;
          return result.length === str1.length + str2.length;
        }),
        { numRuns: 100 }
      );
    });
  });
});
