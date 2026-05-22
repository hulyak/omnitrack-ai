'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { StrategyComparison } from '@/types/sustainability';

interface StrategyComparisonViewProps {
  strategies: StrategyComparison[];
}

export function StrategyComparisonView({ strategies }: StrategyComparisonViewProps) {
  // Prepare data for comparison bar chart
  const comparisonData = strategies.map((strategy) => ({
    name: strategy.strategyName.length > 15
      ? strategy.strategyName.substring(0, 15) + '...'
      : strategy.strategyName,
    fullName: strategy.strategyName,
    carbonReduction: strategy.environmental.carbonReduction,
    costChange: strategy.cost.change,
    riskScore: strategy.risk.score,
    sustainabilityScore: strategy.environmental.sustainabilityScore,
  }));

  // Prepare data for radar chart (normalized to 0-100 scale)
  const radarData = strategies.slice(0, 3).map((strategy) => {
    // Normalize values to 0-100 scale
    const normalizedCost = Math.max(0, 100 + strategy.cost.change); // Assuming change is negative for savings
    const normalizedRisk = 100 - strategy.risk.score; // Lower risk is better
    const normalizedSustainability = strategy.environmental.sustainabilityScore;

    return {
      strategy: strategy.strategyName.length > 20
        ? strategy.strategyName.substring(0, 20) + '...'
        : strategy.strategyName,
      Cost: normalizedCost,
      Risk: normalizedRisk,
      Sustainability: normalizedSustainability,
    };
  });

  const getRiskColor = (level: StrategyComparison['risk']['level']) => {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const strategy = strategies.find((s) => s.strategyName.startsWith(label));
      if (strategy) {
        return (
          <div className="rounded-lg bg-white p-3 shadow-lg dark:bg-zinc-800">
            <p className="font-semibold text-text-primary dark:text-zinc-200">
              {strategy.strategyName}
            </p>
            <p className="text-sm text-text-secondary dark:text-zinc-400">
              Carbon Reduction: {strategy.environmental.carbonReduction}%
            </p>
            <p className="text-sm text-text-secondary dark:text-zinc-400">
              Cost Change: {strategy.cost.change}%
            </p>
            <p className="text-sm text-text-secondary dark:text-zinc-400">
              Risk Score: {strategy.risk.score}
            </p>
            <p className="text-sm text-text-secondary dark:text-zinc-400">
              Sustainability: {strategy.environmental.sustainabilityScore}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Strategy Comparison
      </h2>

      <div className="space-y-6">
        {/* Strategy Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.strategyId}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <h3 className="mb-3 font-semibold text-text-primary dark:text-zinc-200">
                {strategy.strategyName}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-zinc-400">
                    Carbon Reduction
                  </span>
                  <span className="font-medium text-success">
                    {strategy.environmental.carbonReduction}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-zinc-400">
                    Emissions Reduction
                  </span>
                  <span className="text-sm font-medium text-text-primary dark:text-zinc-200">
                    {strategy.environmental.emissionsReduction.toLocaleString()} kg CO₂
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-zinc-400">
                    Cost Change
                  </span>
                  <span
                    className={`font-medium ${
                      strategy.cost.change <= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {strategy.cost.change > 0 ? '+' : ''}
                    {strategy.cost.change}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-zinc-400">
                    Risk Level
                  </span>
                  <span className={`text-sm font-medium ${getRiskColor(strategy.risk.level)}`}>
                    {strategy.risk.level}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-zinc-400">
                    Sustainability Score
                  </span>
                  <span className="font-medium text-text-primary dark:text-zinc-200">
                    {strategy.environmental.sustainabilityScore}/100
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Bar Chart */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Environmental KPIs Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="carbonReduction" fill="#10b981" name="Carbon Reduction %" />
              <Bar dataKey="sustainabilityScore" fill="#3b82f6" name="Sustainability Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Multi-dimensional Comparison */}
        {radarData.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
              Multi-dimensional Comparison (Top 3 Strategies)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="strategy"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                <Radar
                  name={strategies[0]?.strategyName || 'Strategy 1'}
                  dataKey="Cost"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Radar
                  name={strategies[1]?.strategyName || 'Strategy 2'}
                  dataKey="Risk"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Radar
                  name={strategies[2]?.strategyName || 'Strategy 3'}
                  dataKey="Sustainability"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-text-tertiary dark:text-zinc-500">
              Note: Values are normalized to 0-100 scale. Higher values indicate better performance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
