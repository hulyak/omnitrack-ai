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
        <div className="rounded-lg bg-slate-800/95 backdrop-blur-sm p-3 shadow-xl border border-slate-700">
          <p className="font-semibold text-white mb-1">{data.name}</p>
          <p className="text-sm text-slate-300">
            Emissions: <span className="font-bold text-blue-400">{(data.value || data.emissions).toLocaleString()}</span> kg CO₂
          </p>
          {data.percentage && (
            <p className="text-sm text-slate-300">
              <span className="font-bold text-purple-400">{data.percentage.toFixed(1)}%</span> of total
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Mode: <span className="font-medium text-slate-300">{data.mode}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 shadow-lg">
      <h2 className="mb-6 text-xl font-bold text-white">
        Carbon Footprint by Route
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Distribution */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-white">
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
          <h3 className="mb-2 text-sm font-medium text-white">
            Top 10 Routes by Emissions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="horizontal" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                label={{ value: 'Emissions (kg CO₂)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 10 }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="emissions" radius={[0, 4, 4, 0]}>
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
      <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap gap-4">
        <span className="text-sm font-medium text-slate-400 mr-2">Transport Modes:</span>
        {Object.entries(TRANSPORT_COLORS).map(([mode, color]) => (
          <div key={mode} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
            <span className="text-sm text-slate-300 font-medium">{mode}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
