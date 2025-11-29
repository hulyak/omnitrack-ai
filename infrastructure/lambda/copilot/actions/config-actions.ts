/**
 * Configuration Management Actions for AI Copilot
 * 
 * Implements actions for managing supply chain configuration settings.
 * These actions handle the "Configure" category of copilot operations.
 */

import { Action, ActionResult, ParameterSchema, SupplyChainContext, ValidationResult } from '../action-registry';
import { logger } from '../../utils/logger';

/**
 * Helper function to create validation function for parameters
 */
function createValidator(parameters: ParameterSchema[]): (params: any) => ValidationResult {
  return (params: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!params || typeof params !== 'object') {
      return { valid: false, errors: ['Parameters must be an object'] };
    }
    
    for (const param of parameters) {
      const value = params[param.name];
      
      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }
      
      // Skip validation if parameter is optional and not provided
      if (!param.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== param.type) {
        errors.push(`Parameter '${param.name}' must be of type ${param.type}, got ${actualType}`);
        continue;
      }
      
      // Custom validation
      if (param.validation && !param.validation(value)) {
        errors.push(`Parameter '${param.name}' failed validation`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
}

/**
 * Valid regions for supply chain configuration
 */
const VALID_REGIONS = [
  'asia-pacific',
  'north-america',
  'europe',
  'latin-america',
  'middle-east'
];

/**
 * Valid industries for supply chain configuration
 */
const VALID_INDUSTRIES = [
  'electronics',
  'automotive',
  'pharmaceuticals',
  'food-beverage',
  'fashion',
  'chemicals'
];

/**
 * Valid currencies for supply chain configuration
 */
const VALID_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CNY',
  'JPY'
];

/**
 * Valid shipping methods for supply chain configuration
 */
const VALID_SHIPPING_METHODS = [
  'sea-freight',
  'air-freight',
  'rail',
  'truck',
  'express'
];

/**
 * Valid risk profiles for supply chain configuration
 */
const VALID_RISK_PROFILES = [
  'low',
  'medium',
  'high'
];

/**
 * Set Region Action
 */
export const setRegionAction: Action = {
  name: 'set-region',
  category: 'configure',
  description: 'Change the primary region for the supply chain network',
  examples: [
    'Set region to Asia-Pacific',
    'Change region to North America',
    'Update primary region to Europe'
  ],
  parameters: [
    {
      name: 'region',
      type: 'string',
      required: true,
      description: `Primary region (${VALID_REGIONS.join(', ')})`,
      validation: (value: string) => VALID_REGIONS.includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'region',
      type: 'string',
      required: true,
      description: 'Primary region',
      validation: (value: string) => VALID_REGIONS.includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing set-region action', { userId: context.userId, params });
      
      const region = params.region.toLowerCase();
      
      // Update configuration
      const updatedConfig = {
        ...context.configuration,
        region
      };
      
      logger.info('Region updated', { region, userId: context.userId });
      
      return {
        success: true,
        data: {
          region,
          previousRegion: context.configuration?.region,
          configuration: updatedConfig
        },
        suggestions: [
          'Review node locations for regional alignment',
          'Update shipping routes for the new region',
          'Check regulatory requirements for this region'
        ]
      };
    } catch (error) {
      logger.error('Failed to set region', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to update region. Please try again.'
      };
    }
  }
};

/**
 * Set Industry Action
 */
export const setIndustryAction: Action = {
  name: 'set-industry',
  category: 'configure',
  description: 'Change the industry type for the supply chain network',
  examples: [
    'Set industry to electronics',
    'Change industry to automotive',
    'Update industry to pharmaceuticals'
  ],
  parameters: [
    {
      name: 'industry',
      type: 'string',
      required: true,
      description: `Industry type (${VALID_INDUSTRIES.join(', ')})`,
      validation: (value: string) => VALID_INDUSTRIES.includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'industry',
      type: 'string',
      required: true,
      description: 'Industry type',
      validation: (value: string) => VALID_INDUSTRIES.includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing set-industry action', { userId: context.userId, params });
      
      const industry = params.industry.toLowerCase();
      
      // Update configuration
      const updatedConfig = {
        ...context.configuration,
        industry
      };
      
      logger.info('Industry updated', { industry, userId: context.userId });
      
      return {
        success: true,
        data: {
          industry,
          previousIndustry: context.configuration?.industry,
          configuration: updatedConfig
        },
        suggestions: [
          'Review industry-specific compliance requirements',
          'Update node capacities for industry standards',
          'Configure industry-specific risk factors'
        ]
      };
    } catch (error) {
      logger.error('Failed to set industry', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to update industry. Please try again.'
      };
    }
  }
};

/**
 * Set Currency Action
 */
export const setCurrencyAction: Action = {
  name: 'set-currency',
  category: 'configure',
  description: 'Change the currency for cost calculations in the supply chain',
  examples: [
    'Set currency to USD',
    'Change currency to EUR',
    'Update currency to CNY'
  ],
  parameters: [
    {
      name: 'currency',
      type: 'string',
      required: true,
      description: `Currency code (${VALID_CURRENCIES.join(', ')})`,
      validation: (value: string) => VALID_CURRENCIES.includes(value.toUpperCase())
    }
  ],
  validate: createValidator([
    {
      name: 'currency',
      type: 'string',
      required: true,
      description: 'Currency code',
      validation: (value: string) => VALID_CURRENCIES.includes(value.toUpperCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing set-currency action', { userId: context.userId, params });
      
      const currency = params.currency.toUpperCase();
      
      // Update configuration
      const updatedConfig = {
        ...context.configuration,
        currency
      };
      
      logger.info('Currency updated', { currency, userId: context.userId });
      
      return {
        success: true,
        data: {
          currency,
          previousCurrency: context.configuration?.currency,
          configuration: updatedConfig
        },
        suggestions: [
          'Recalculate cost metrics in the new currency',
          'Update pricing for all nodes',
          'Review exchange rate impacts'
        ]
      };
    } catch (error) {
      logger.error('Failed to set currency', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to update currency. Please try again.'
      };
    }
  }
};

/**
 * Add Shipping Method Action
 */
export const addShippingMethodAction: Action = {
  name: 'add-shipping-method',
  category: 'configure',
  description: 'Add a shipping method to the available transportation options',
  examples: [
    'Add sea freight shipping',
    'Enable air freight',
    'Add rail shipping method'
  ],
  parameters: [
    {
      name: 'method',
      type: 'string',
      required: true,
      description: `Shipping method (${VALID_SHIPPING_METHODS.join(', ')})`,
      validation: (value: string) => VALID_SHIPPING_METHODS.includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'method',
      type: 'string',
      required: true,
      description: 'Shipping method',
      validation: (value: string) => VALID_SHIPPING_METHODS.includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing add-shipping-method action', { userId: context.userId, params });
      
      const method = params.method.toLowerCase();
      
      // Get current shipping methods
      const currentMethods = context.configuration?.shippingMethods || [];
      
      // Check if method already exists
      if (currentMethods.includes(method)) {
        return {
          success: false,
          error: `Shipping method '${method}' is already enabled.`
        };
      }
      
      // Add new method
      const updatedMethods = [...currentMethods, method];
      
      // Update configuration
      const updatedConfig = {
        ...context.configuration,
        shippingMethods: updatedMethods
      };
      
      logger.info('Shipping method added', { method, userId: context.userId });
      
      return {
        success: true,
        data: {
          method,
          shippingMethods: updatedMethods,
          configuration: updatedConfig
        },
        suggestions: [
          'Configure cost parameters for this shipping method',
          'Set transit time estimates',
          'Update route optimization with new method'
        ]
      };
    } catch (error) {
      logger.error('Failed to add shipping method', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to add shipping method. Please try again.'
      };
    }
  }
};

/**
 * Set Risk Profile Action
 */
export const setRiskProfileAction: Action = {
  name: 'set-risk-profile',
  category: 'configure',
  description: 'Change the risk profile for supply chain analysis and simulations',
  examples: [
    'Set risk profile to high',
    'Change risk profile to low',
    'Update risk profile to medium'
  ],
  parameters: [
    {
      name: 'profile',
      type: 'string',
      required: true,
      description: `Risk profile level (${VALID_RISK_PROFILES.join(', ')})`,
      validation: (value: string) => VALID_RISK_PROFILES.includes(value.toLowerCase())
    }
  ],
  validate: createValidator([
    {
      name: 'profile',
      type: 'string',
      required: true,
      description: 'Risk profile level',
      validation: (value: string) => VALID_RISK_PROFILES.includes(value.toLowerCase())
    }
  ]),
  execute: async (params: any, context: SupplyChainContext): Promise<ActionResult> => {
    try {
      logger.info('Executing set-risk-profile action', { userId: context.userId, params });
      
      const profile = params.profile.toLowerCase();
      
      // Update configuration
      const updatedConfig = {
        ...context.configuration,
        riskProfile: profile
      };
      
      // Get risk profile description
      const riskDescriptions: Record<string, string> = {
        low: 'Stable suppliers, minimal disruptions expected',
        medium: 'Occasional delays, moderate volatility expected',
        high: 'Frequent disruptions, high volatility expected'
      };
      
      logger.info('Risk profile updated', { profile, userId: context.userId });
      
      return {
        success: true,
        data: {
          profile,
          previousProfile: context.configuration?.riskProfile,
          description: riskDescriptions[profile],
          configuration: updatedConfig
        },
        suggestions: [
          'Run scenario simulations with the new risk profile',
          'Review mitigation strategies for this risk level',
          'Update alert thresholds based on risk profile'
        ]
      };
    } catch (error) {
      logger.error('Failed to set risk profile', error as Error, { userId: context.userId, params });
      return {
        success: false,
        error: 'Failed to update risk profile. Please try again.'
      };
    }
  }
};
