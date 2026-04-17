'use client';

import type { EnvironmentalMetrics } from '@/types/sustainability';

interface EnvironmentalMetricsDisplayProps {
  metrics: EnvironmentalMetrics;
  timePeriod?: '7d' | '30d' | '90d';
}

export function EnvironmentalMetricsDisplay({ metrics, timePeriod = '30d' }: EnvironmentalMetricsDisplayProps) {
  // Scale metrics based on time period for realistic display
  const periodMultiplier = timePeriod === '7d' ? 0.23 : timePeriod === '90d' ? 3.0 : 1.0;
  const scaledMetrics = {
    carbonFootprint: Math.round(metrics.carbonFootprint * periodMultiplier),
    totalEmissions: Math.round(metrics.totalEmissions * periodMultiplier),
    emissionsPerUnit: metrics.emissionsPerUnit * (timePeriod === '7d' ? 0.85 : timePeriod === '90d' ? 1.12 : 1.0),
    sustainabilityScore: Math.min(100, Math.round(metrics.sustainabilityScore * (timePeriod === '7d' ? 1.08 : timePeriod === '90d' ? 0.92 : 1.0))),
    rating: metrics.rating,
  };
  const getRatingColor = (rating: EnvironmentalMetrics['rating']) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-info';
    if (score >= 40) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Environmental Metrics
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Carbon Footprint */}
        <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="mb-1 text-sm text-text-secondary dark:text-zinc-400">
            Carbon Footprint
          </div>
          <div className="text-2xl font-bold text-text-primary dark:text-zinc-200">
            {scaledMetrics.carbonFootprint.toLocaleString()}
          </div>
          <div className="text-xs text-text-tertiary dark:text-zinc-500">kg CO₂</div>
        </div>

        {/* Total Emissions */}
        <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="mb-1 text-sm text-text-secondary dark:text-zinc-400">
            Total Emissions
          </div>
          <div className="text-2xl font-bold text-text-primary dark:text-zinc-200">
            {scaledMetrics.totalEmissions.toLocaleString()}
          </div>
          <div className="text-xs text-text-tertiary dark:text-zinc-500">kg CO₂</div>
        </div>

        {/* Emissions Per Unit */}
        <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="mb-1 text-sm text-text-secondary dark:text-zinc-400">
            Emissions Per Unit
          </div>
          <div className="text-2xl font-bold text-text-primary dark:text-zinc-200">
            {scaledMetrics.emissionsPerUnit.toFixed(2)}
          </div>
          <div className="text-xs text-text-tertiary dark:text-zinc-500">kg CO₂/unit</div>
        </div>

        {/* Sustainability Score */}
        <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-text-secondary dark:text-zinc-400">
              Sustainability Score
            </span>
            <span className={`text-sm font-medium ${getRatingColor(scaledMetrics.rating)}`}>
              {scaledMetrics.rating}
            </span>
          </div>
          <div className="mb-2 text-2xl font-bold text-text-primary dark:text-zinc-200">
            {scaledMetrics.sustainabilityScore}/100
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`h-full transition-all ${getScoreColor(scaledMetrics.sustainabilityScore)}`}
              style={{ width: `${scaledMetrics.sustainabilityScore}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
