'use client';

import { useEffect, useState } from 'react';

interface MetricsData {
  cost: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  risk: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    change: number;
  };
  sustainability: {
    score: number;
    rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    carbonFootprint: number;
  };
}

interface KeyMetricsProps {
  data?: MetricsData;
  isLoading: boolean;
  error?: Error;
}

export function KeyMetrics({ data, isLoading, error }: KeyMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | undefined>(data);

  useEffect(() => {
    if (data) {
      setMetrics(data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Key Metrics
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Key Metrics
        </h2>
        <p className="text-error">Error loading metrics</p>
      </div>
    );
  }

  const getRiskColor = (level: MetricsData['risk']['level']) => {
    switch (level) {
      case 'LOW':
        return 'text-success';
      case 'MEDIUM':
        return 'text-warning';
      case 'HIGH':
        return 'text-error';
      case 'CRITICAL':
        return 'text-error font-bold';
    }
  };

  const getSustainabilityColor = (rating: MetricsData['sustainability']['rating']) => {
    switch (rating) {
      case 'Excellent':
        return 'text-success';
      case 'Good':
        return 'text-info';
      case 'Fair':
        return 'text-warning';
      case 'Poor':
        return 'text-error';
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Key Metrics
      </h2>

      {metrics && (
        <div className="space-y-4">
          {/* Cost Efficiency */}
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-text-secondary dark:text-zinc-400">
                Cost Efficiency
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-sm font-medium ${
                    metrics.cost.change >= 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {metrics.cost.change >= 0 ? '+' : ''}
                  {metrics.cost.change}%
                </span>
                <span className="text-xs">
                  {metrics.cost.trend === 'up' ? '↑' : metrics.cost.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-text-primary dark:text-zinc-200">
              ${metrics.cost.value.toLocaleString()}
            </div>
          </div>

          {/* Risk Level */}
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-text-secondary dark:text-zinc-400">Risk Level</span>
              <span className={`text-sm font-medium ${getRiskColor(metrics.risk.level)}`}>
                {metrics.risk.level}
              </span>
            </div>
            <div className="mb-2 text-2xl font-bold text-text-primary dark:text-zinc-200">
              {metrics.risk.score}/100
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={`h-full transition-all ${
                  metrics.risk.level === 'LOW'
                    ? 'bg-success'
                    : metrics.risk.level === 'MEDIUM'
                      ? 'bg-warning'
                      : 'bg-error'
                }`}
                style={{ width: `${metrics.risk.score}%` }}
              ></div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-text-secondary dark:text-zinc-400">Sustainability</span>
              <span
                className={`text-sm font-medium ${getSustainabilityColor(
                  metrics.sustainability.rating
                )}`}
              >
                {metrics.sustainability.rating}
              </span>
            </div>
            <div className="mb-1 text-2xl font-bold text-text-primary dark:text-zinc-200">
              {metrics.sustainability.score}/100
            </div>
            <p className="text-xs text-text-tertiary dark:text-zinc-500">
              Carbon: {metrics.sustainability.carbonFootprint.toLocaleString()} kg CO₂
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
