'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { EnvironmentalMetrics, RouteEmission } from '@/types/sustainability';

interface CarbonFootprintVisualizationProps {
  metrics: EnvironmentalMetrics;
  routeEmissions: RouteEmission[];
}

const TRANSPORT_COLORS: Record<string, string> = {
  AIR: '#ef4444',
  SEA: '#3b82f6',
  RAIL: '#10b981',
  ROAD: '#f59e0b',
};

export function CarbonFootprintVisualization({
  metrics,
  routeEmissions,
}: CarbonFootprintVisualizationProps) {
  // Prepare data for pie chart
  const pieData = routeEmissions.map((route) => ({
    name: route.routeName,
    value: route.emissions,
    percentage: route.percentage,
    mode: route.transportMode,
  }));

  // Prepare data for bar chart
  const barData = routeEmissions
    .sort((a, b) => b.emissions - a.emissions)
    .slice(0, 10)
    .map((route) => ({
      name: route.routeName.length > 20 ? route.routeName.substring(0, 20) + '...' : route.routeName,
      emissions: route.emissions,
      mode: route.transportMode,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg dark:bg-zinc-800">
          <p className="font-semibold text-text-primary dark:text-zinc-200">{data.name}</p>
          <p className="text-sm text-text-secondary dark:text-zinc-400">
            Emissions: {data.value || data.emissions} kg CO₂
          </p>
          {data.percentage && (
            <p className="text-sm text-text-secondary dark:text-zinc-400">
              {data.percentage.toFixed(1)}% of total
            </p>
          )}
          <p className="text-xs text-text-tertiary dark:text-zinc-500">
            Mode: {data.mode}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Carbon Footprint by Route
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Distribution */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Emissions Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(1) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={TRANSPORT_COLORS[entry.mode] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string, entry: any) => {
                  const data = entry.payload;
                  return `${data.name} (${data.mode})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Top Routes */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-zinc-400">
            Top 10 Routes by Emissions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="emissions" fill="#3b82f6">
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={TRANSPORT_COLORS[entry.mode] || '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transport Mode Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(TRANSPORT_COLORS).map(([mode, color]) => (
          <div key={mode} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-sm text-text-secondary dark:text-zinc-400">{mode}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
