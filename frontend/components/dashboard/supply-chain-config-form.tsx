'use client';

import { useState } from 'react';

export interface SupplyChainConfig {
  region: string;
  industry: string;
  currency: string;
  shippingMethods: string[];
  nodeCount: number;
  riskProfile: string;
}

interface SupplyChainConfigFormProps {
  onConfigSubmit: (config: SupplyChainConfig) => void;
  currentConfig?: SupplyChainConfig;
}

export function SupplyChainConfigForm({ onConfigSubmit, currentConfig }: SupplyChainConfigFormProps) {
  const [config, setConfig] = useState<SupplyChainConfig>(
    currentConfig || {
      region: 'asia-pacific',
      industry: 'electronics',
      currency: 'USD',
      shippingMethods: ['sea-freight'],
      nodeCount: 6,
      riskProfile: 'medium',
    }
  );

  const [isExpanded, setIsExpanded] = useState(!currentConfig);

  const regions = [
    { value: 'asia-pacific', label: 'Asia-Pacific' },
    { value: 'north-america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'latin-america', label: 'Latin America' },
    { value: 'middle-east', label: 'Middle East' },
  ];

  const industries = [
    { value: 'electronics', label: 'Electronics Manufacturing' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'food-beverage', label: 'Food & Beverage' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'chemicals', label: 'Chemicals' },
  ];

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
  ];

  const shippingOptions = [
    { value: 'sea-freight', label: 'Sea Freight' },
    { value: 'air-freight', label: 'Air Freight' },
    { value: 'rail', label: 'Rail' },
    { value: 'truck', label: 'Truck' },
    { value: 'express', label: 'Express Delivery' },
  ];

  const riskProfiles = [
    { value: 'low', label: 'Low Risk', description: 'Stable suppliers, minimal disruptions' },
    { value: 'medium', label: 'Medium Risk', description: 'Occasional delays, moderate volatility' },
    { value: 'high', label: 'High Risk', description: 'Frequent disruptions, high volatility' },
  ];

  const handleShippingMethodToggle = (method: string) => {
    setConfig(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.includes(method)
        ? prev.shippingMethods.filter(m => m !== method)
        : [...prev.shippingMethods, method],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSubmit(config);
    setIsExpanded(false);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary dark:text-zinc-50">
          Supply Chain Configuration
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? 'Collapse' : 'Edit Configuration'}
        </button>
      </div>

      {!isExpanded && currentConfig && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-tertiary dark:text-zinc-400">Region:</span>
            <span className="font-medium text-text-primary dark:text-zinc-200">
              {regions.find(r => r.value === currentConfig.region)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary dark:text-zinc-400">Industry:</span>
            <span className="font-medium text-text-primary dark:text-zinc-200">
              {industries.find(i => i.value === currentConfig.industry)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary dark:text-zinc-400">Currency:</span>
            <span className="font-medium text-text-primary dark:text-zinc-200">
              {currentConfig.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary dark:text-zinc-400">Risk Profile:</span>
            <span className="font-medium text-text-primary dark:text-zinc-200 capitalize">
              {currentConfig.riskProfile}
            </span>
          </div>
        </div>
      )}

      {isExpanded && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Primary Region
            </label>
            <select
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
              className="w-full bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-text-primary dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Industry
            </label>
            <select
              value={config.industry}
              onChange={(e) => setConfig({ ...config, industry: e.target.value })}
              className="w-full bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-text-primary dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {industries.map((industry) => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Currency
            </label>
            <select
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value })}
              className="w-full bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-text-primary dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shipping Methods */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Shipping Methods
            </label>
            <div className="space-y-2">
              {shippingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.shippingMethods.includes(option.value)}
                    onChange={() => handleShippingMethodToggle(option.value)}
                    className="rounded border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-text-primary dark:text-zinc-200">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Node Count */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Supply Chain Nodes: {config.nodeCount}
            </label>
            <input
              type="range"
              min="3"
              max="12"
              value={config.nodeCount}
              onChange={(e) => setConfig({ ...config, nodeCount: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-tertiary dark:text-zinc-400 mt-1">
              <span>Simple (3)</span>
              <span>Complex (12)</span>
            </div>
          </div>

          {/* Risk Profile */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-zinc-200 mb-2">
              Risk Profile
            </label>
            <div className="space-y-2">
              {riskProfiles.map((profile) => (
                <label key={profile.value} className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="riskProfile"
                    value={profile.value}
                    checked={config.riskProfile === profile.value}
                    onChange={(e) => setConfig({ ...config, riskProfile: e.target.value })}
                    className="mt-1 border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-text-primary dark:text-zinc-200">
                      {profile.label}
                    </div>
                    <div className="text-xs text-text-tertiary dark:text-zinc-400">
                      {profile.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Apply Configuration
          </button>
        </form>
      )}
    </div>
  );
}
