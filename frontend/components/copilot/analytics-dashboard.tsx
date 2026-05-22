'use client';

/**
 * Analytics Dashboard Component
 * 
 * Displays copilot usage analytics including popular commands,
 * error patterns, and performance metrics.
 * 
 * Requirements: 9.5 - Show usage statistics and performance metrics
 */

import React, { useState, useEffect } from 'react';

interface CommandStats {
  commandName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted: number;
}

interface ErrorPattern {
  errorType: string;
  errorMessage: string;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  affectedUsers: string[];
}

interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalExecutions: number;
    totalSuccessful: number;
    totalFailed: number;
    successRate: number;
    averageExecutionTime: number;
    totalErrors: number;
    uniqueErrorTypes: number;
  };
  popularCommands: CommandStats[];
  topErrors: ErrorPattern[];
}

interface AnalyticsDashboardProps {
  apiEndpoint?: string;
}

export function AnalyticsDashboard({ apiEndpoint = '/api/copilot/analytics' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiEndpoint}/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(
        `${apiEndpoint}/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${dateRange.startDate}-${dateRange.endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Copilot Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Executions"
          value={data.summary.totalExecutions.toLocaleString()}
          subtitle={`${data.summary.totalSuccessful} successful, ${data.summary.totalFailed} failed`}
          color="blue"
        />
        <SummaryCard
          title="Success Rate"
          value={`${data.summary.successRate.toFixed(1)}%`}
          subtitle="Overall success rate"
          color="green"
        />
        <SummaryCard
          title="Avg Response Time"
          value={`${data.summary.averageExecutionTime.toFixed(0)}ms`}
          subtitle="Average execution time"
          color="purple"
        />
        <SummaryCard
          title="Total Errors"
          value={data.summary.totalErrors.toLocaleString()}
          subtitle={`${data.summary.uniqueErrorTypes} unique types`}
          color="red"
        />
      </div>

      {/* Popular Commands */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Popular Commands</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Command
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.popularCommands.map((cmd) => (
                  <tr key={cmd.commandName}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cmd.commandName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {cmd.totalExecutions}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {cmd.totalExecutions > 0
                        ? ((cmd.successfulExecutions / cmd.totalExecutions) * 100).toFixed(1)
                        : '0'}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {cmd.averageExecutionTime.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cmd.lastExecuted).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Errors */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Error Patterns</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {data.topErrors.map((error, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">
                      {error.errorType}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {error.count} occurrences
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {error.affectedUsers.length} users affected
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{error.errorMessage}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>First: {new Date(error.firstOccurrence).toLocaleString()}</span>
                  <span>Last: {new Date(error.lastOccurrence).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function SummaryCard({ title, value, subtitle, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium opacity-75 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-75">{subtitle}</p>
    </div>
  );
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}
