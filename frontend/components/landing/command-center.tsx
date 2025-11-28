'use client';

/**
 * Live Command Center Component
 * Real-time stats with sparklines and simulator controls
 */

import React, { useState, useEffect } from 'react';

interface Metric {
  label: string;
  value: number;
  unit: string;
  trend: number[];
  color: string;
  icon: React.ReactNode;
}

export function CommandCenter() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [riskIntensity, setRiskIntensity] = useState(50);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Sensors Active',
      value: 15,
      unit: '',
      trend: [12, 13, 14, 15, 15],
      color: 'cyan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      label: 'Critical Alerts',
      value: 2,
      unit: '',
      trend: [1, 3, 2, 2, 2],
      color: 'red',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Chain Integrity',
      value: 99.2,
      unit: '%',
      trend: [98.5, 98.8, 99.0, 99.1, 99.2],
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: 'Scenarios Active',
      value: 28,
      unit: '',
      trend: [24, 25, 26, 27, 28],
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      label: 'Agent Response',
      value: 47,
      unit: 'ms',
      trend: [52, 50, 48, 47, 47],
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ]);

  // Update metrics when simulating
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const change = (Math.random() - 0.5) * 2 * simulationSpeed;
          const newValue = Math.max(0, metric.value + change);
          const newTrend = [...metric.trend.slice(1), newValue];
          return { ...metric, value: newValue, trend: newTrend };
        })
      );
    }, 1000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed]);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      red: 'text-red-400 border-red-500/30 bg-red-500/10',
      green: 'text-green-400 border-green-500/30 bg-green-500/10',
      purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Live Command Center
          </h2>
          <p className="text-xl text-slate-400">
            Real-time supply chain intelligence at your fingertips
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {metrics.map((metric, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-xl border backdrop-blur-sm ${getColorClass(metric.color)}`}
              style={{
                boxShadow: `0 0 20px ${metric.color === 'cyan' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              {/* Icon */}
              <div className="mb-4">{metric.icon}</div>

              {/* Value */}
              <div className="text-3xl font-bold mb-1">
                {metric.value.toFixed(metric.unit === 'ms' || metric.unit === '%' ? 1 : 0)}
                {metric.unit}
              </div>

              {/* Label */}
              <div className="text-sm text-slate-400 mb-3">{metric.label}</div>

              {/* Sparkline */}
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <polyline
                  points={metric.trend
                    .map((val, idx) => `${(idx / (metric.trend.length - 1)) * 100},${20 - (val / Math.max(...metric.trend)) * 15}`)
                    .join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-50"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Simulator Dashboard */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Play/Pause Control */}
            <div className="flex items-center gap-4">
              <button
                id="simulator-play-button"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  isSimulating
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                    : 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                }`}
                style={{
                  boxShadow: isSimulating ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(6, 182, 212, 0.3)',
                }}
              >
                {isSimulating ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <div>
                <div className="text-white font-bold text-lg">
                  {isSimulating ? 'Simulation Running' : 'Simulation Paused'}
                </div>
                <div className="text-slate-400 text-sm">
                  {isSimulating ? 'Live data streaming' : 'Click play to start'}
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="flex-1 max-w-2xl space-y-6">
              {/* Risk Intensity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-semibold">Risk Intensity</label>
                  <span className="text-cyan-400 font-mono">{riskIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskIntensity}
                  onChange={(e) => setRiskIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Simulation Speed */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-semibold">Simulation Speed</label>
                  <span className="text-purple-400 font-mono">{simulationSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
