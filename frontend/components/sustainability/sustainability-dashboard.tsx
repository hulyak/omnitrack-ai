'use client';

import { useState } from 'react';
import { EnvironmentalMetricsDisplay } from './environmental-metrics-display';
import { CarbonFootprintVisualization } from './carbon-footprint-visualization';
import { TrendAnalysisCharts } from './trend-analysis-charts';
import { StrategyComparisonView } from './strategy-comparison-view';
import { ThresholdAlertIndicators } from './threshold-alert-indicators';
import type { SustainabilityData } from '@/types/sustainability';

interface SustainabilityDashboardProps {
  data?: SustainabilityData;
  isLoading?: boolean;
  error?: Error;
  onRefresh?: () => void;
}

export function SustainabilityDashboard({
  data,
  isLoading = false,
  error,
  onRefresh,
}: SustainabilityDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary dark:text-zinc-50">
            Sustainability Dashboard
          </h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-lg bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-64 rounded-lg bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-96 rounded-lg bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary dark:text-zinc-50">
          Sustainability Dashboard
        </h1>
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
          <p className="text-error">Error loading sustainability data: {error.message}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary dark:text-zinc-50">
          Sustainability Dashboard
        </h1>
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
          <p className="text-text-secondary dark:text-zinc-400">No sustainability data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-zinc-50">
            Sustainability Dashboard
          </h1>
          <p className="text-sm text-text-secondary dark:text-zinc-400">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as '7d' | '30d' | '90d')}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Threshold Alerts */}
      {data.thresholdAlerts.length > 0 && (
        <ThresholdAlertIndicators alerts={data.thresholdAlerts} />
      )}

      {/* Environmental Metrics */}
      <EnvironmentalMetricsDisplay metrics={data.metrics} />

      {/* Carbon Footprint Visualization */}
      <CarbonFootprintVisualization
        metrics={data.metrics}
        routeEmissions={data.metrics.emissionsByRoute}
      />

      {/* Trend Analysis */}
      <TrendAnalysisCharts trends={data.trends} timePeriod={timePeriod} />

      {/* Strategy Comparison */}
      {data.strategyComparisons.length > 0 && (
        <StrategyComparisonView strategies={data.strategyComparisons} />
      )}
    </div>
  );
}
