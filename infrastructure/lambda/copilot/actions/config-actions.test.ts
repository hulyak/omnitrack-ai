/**
 * Configuration Actions Tests
 * 
 * Tests for configuration management actions.
 */

import { actionRegistry } from '../action-registry';
import {
  setRegionAction,
  setIndustryAction,
  setCurrencyAction,
  addShippingMethodAction,
  setRiskProfileAction
} from './config-actions';
import { configActions, registerConfigActions } from './index';

describe('Configuration Actions', () => {
  beforeEach(() => {
    actionRegistry.clear();
  });

  describe('Action Registration', () => {
    it('should register all configuration actions', () => {
      registerConfigActions();
      
      expect(actionRegistry.getActionCount()).toBe(5);
      expect(actionRegistry.hasAction('set-region')).toBe(true);
      expect(actionRegistry.hasAction('set-industry')).toBe(true);
      expect(actionRegistry.hasAction('set-currency')).toBe(true);
      expect(actionRegistry.hasAction('add-shipping-method')).toBe(true);
      expect(actionRegistry.hasAction('set-risk-profile')).toBe(true);
    });

    it('should categorize all actions as configure', () => {
      configActions.forEach(action => {
        expect(action.category).toBe('configure');
      });
    });
  });

  describe('Set Region Action', () => {
    describe('Validation', () => {
      it('should validate required parameters', () => {
        const result = setRegionAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: region');
      });

      it('should validate region is valid', () => {
        const result = setRegionAction.validate({ region: 'invalid-region' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('failed validation'))).toBe(true);
      });

      it('should accept valid regions', () => {
        const validRegions = ['asia-pacific', 'north-america', 'europe', 'latin-america', 'middle-east'];
        
        validRegions.forEach(region => {
          const result = setRegionAction.validate({ region });
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe('Set Industry Action', () => {
    describe('Validation', () => {
      it('should validate required parameters', () => {
        const result = setIndustryAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: industry');
      });

      it('should validate industry is valid', () => {
        const result = setIndustryAction.validate({ industry: 'invalid-industry' });
        expect(result.valid).toBe(false);
      });

      it('should accept valid industries', () => {
        const validIndustries = ['electronics', 'automotive', 'pharmaceuticals', 'food-beverage', 'fashion', 'chemicals'];
        
        validIndustries.forEach(industry => {
          const result = setIndustryAction.validate({ industry });
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe('Set Currency Action', () => {
    describe('Validation', () => {
      it('should validate required parameters', () => {
        const result = setCurrencyAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: currency');
      });

      it('should validate currency is valid', () => {
        const result = setCurrencyAction.validate({ currency: 'INVALID' });
        expect(result.valid).toBe(false);
      });

      it('should accept valid currencies', () => {
        const validCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'];
        
        validCurrencies.forEach(currency => {
          const result = setCurrencyAction.validate({ currency });
          expect(result.valid).toBe(true);
        });
      });

      it('should handle lowercase currency codes', () => {
        const result = setCurrencyAction.validate({ currency: 'usd' });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Add Shipping Method Action', () => {
    describe('Validation', () => {
      it('should validate required parameters', () => {
        const result = addShippingMethodAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: method');
      });

      it('should validate method is valid', () => {
        const result = addShippingMethodAction.validate({ method: 'invalid-method' });
        expect(result.valid).toBe(false);
      });

      it('should accept valid shipping methods', () => {
        const validMethods = ['sea-freight', 'air-freight', 'rail', 'truck', 'express'];
        
        validMethods.forEach(method => {
          const result = addShippingMethodAction.validate({ method });
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe('Set Risk Profile Action', () => {
    describe('Validation', () => {
      it('should validate required parameters', () => {
        const result = setRiskProfileAction.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required parameter: profile');
      });

      it('should validate profile is valid', () => {
        const result = setRiskProfileAction.validate({ profile: 'invalid-profile' });
        expect(result.valid).toBe(false);
      });

      it('should accept valid risk profiles', () => {
        const validProfiles = ['low', 'medium', 'high'];
        
        validProfiles.forEach(profile => {
          const result = setRiskProfileAction.validate({ profile });
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe('Action Examples', () => {
    it('should have example phrases for each action', () => {
      configActions.forEach(action => {
        expect(action.examples).toBeDefined();
        expect(action.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Action Execution', () => {
    const mockContext = {
      userId: 'test-user',
      nodes: [],
      edges: [],
      configuration: {
        region: 'asia-pacific',
        industry: 'electronics',
        currency: 'USD',
        shippingMethods: ['sea-freight'],
        riskProfile: 'medium'
      },
      recentActions: [],
      activeSimulations: []
    };

    it('should execute set-region action successfully', async () => {
      const result = await setRegionAction.execute({ region: 'europe' }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.region).toBe('europe');
      expect(result.data.previousRegion).toBe('asia-pacific');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should execute set-industry action successfully', async () => {
      const result = await setIndustryAction.execute({ industry: 'automotive' }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.industry).toBe('automotive');
      expect(result.data.previousIndustry).toBe('electronics');
    });

    it('should execute set-currency action successfully', async () => {
      const result = await setCurrencyAction.execute({ currency: 'EUR' }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.currency).toBe('EUR');
      expect(result.data.previousCurrency).toBe('USD');
    });

    it('should execute add-shipping-method action successfully', async () => {
      const result = await addShippingMethodAction.execute({ method: 'air-freight' }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.method).toBe('air-freight');
      expect(result.data.shippingMethods).toContain('sea-freight');
      expect(result.data.shippingMethods).toContain('air-freight');
    });

    it('should prevent adding duplicate shipping method', async () => {
      const result = await addShippingMethodAction.execute({ method: 'sea-freight' }, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already enabled');
    });

    it('should execute set-risk-profile action successfully', async () => {
      const result = await setRiskProfileAction.execute({ profile: 'high' }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.profile).toBe('high');
      expect(result.data.previousProfile).toBe('medium');
      expect(result.data.description).toBeDefined();
    });
  });
});
