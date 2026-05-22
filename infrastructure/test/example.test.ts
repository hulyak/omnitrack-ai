import * as fc from 'fast-check';

describe('Infrastructure Example Tests', () => {
  describe('Unit Tests', () => {
    it('should pass a basic unit test', () => {
      expect(true).toBe(true);
    });
  });

  describe('Property-Based Tests', () => {
    it('should verify array reverse is involutive', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const reversed = [...arr].reverse();
          const doubleReversed = [...reversed].reverse();
          return JSON.stringify(arr) === JSON.stringify(doubleReversed);
        }),
        { numRuns: 100 }
      );
    });
  });
});
