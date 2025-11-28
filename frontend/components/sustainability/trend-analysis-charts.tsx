'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TrendDataPoint } from '@/types/sustainability';

interface TrendAnalysisChartsProps {
  trends: TrendDataPoint[];
  timePeriod: '7d' | '30d' | '90d';
}

export function TrendAnalysisCharts({ trends, timePeriod }: TrendAnalysisChartsProps) {
  // Filter trends based on time period
  const now = new Date();
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[timePeriod];

  const filteredTrends = trends.filter((trend) => {
    const trendDate = new Date(trend.timestamp);
    const diffTime = Math.abs(now.getTime() - trendDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  });

  // Format data for charts
  const chartData = filteredTrends.map((trend) => ({
    date: new Date(trend.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    carbonFootprint: trend.carbonFootprint,
    sustainabilityScore: trend.sustainabilityScore,
    totalEmissions: trend.totalEmissions,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg dark:bg-zinc-800">
          <p className="font-semibold text-text-primary dark:text-zinc-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm text-text-secondary dark:text-zinc-400"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toLocaleString()}
              {entry.name === 'Sustainability Score' ? '' : ' kg CO₂'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Trend Analysis
        </h2>
        <p className="text-text-secondary dark:text-zinc-400">
          No trend data available for the selected time period
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Trend Analysis
      </h2>

      <div className="space-y-6">
        {/* Carbon Footprint Trend */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Carbon Footprint Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{
                  value: 'kg CO₂',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af', fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="carbonFootprint"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCarbon)"
                name="Carbon Footprint"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sustainability Score Trend */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Sustainability Score Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{
                  value: 'Score',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af', fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="sustainabilityScore"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Sustainability Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Total Emissions Trend */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Total Emissions Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{
                  value: 'kg CO₂',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af', fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="totalEmissions"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                name="Total Emissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
