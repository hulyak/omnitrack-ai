'use client';

import { useState } from 'react';
import type { ThresholdAlert } from '@/types/sustainability';

interface ThresholdAlertIndicatorsProps {
  alerts: ThresholdAlert[];
}

export function ThresholdAlertIndicators({ alerts }: ThresholdAlertIndicatorsProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleAlert = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getSeverityColor = (severity: ThresholdAlert['severity']) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    }
  };

  const getSeverityTextColor = (severity: ThresholdAlert['severity']) => {
    switch (severity) {
      case 'LOW':
        return 'text-blue-700 dark:text-blue-300';
      case 'MEDIUM':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'HIGH':
        return 'text-orange-700 dark:text-orange-300';
      case 'CRITICAL':
        return 'text-red-700 dark:text-red-300';
    }
  };

  const getSeverityIcon = (severity: ThresholdAlert['severity']) => {
    switch (severity) {
      case 'LOW':
        return 'ℹ️';
      case 'MEDIUM':
        return '⚠️';
      case 'HIGH':
        return '⚠️';
      case 'CRITICAL':
        return '🚨';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary dark:text-zinc-50">
          Threshold Alerts
        </h2>
        <span className="rounded-full bg-error px-3 py-1 text-sm font-medium text-white">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.alertId}
            className={`rounded-lg border p-4 transition-all ${getSeverityColor(alert.severity)}`}
          >
            <div
              className="flex cursor-pointer items-start justify-between"
              onClick={() => toggleAlert(alert.alertId)}
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                  <span
                    className={`text-xs font-semibold uppercase ${getSeverityTextColor(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs text-text-tertiary dark:text-zinc-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="mb-1 font-semibold text-text-primary dark:text-zinc-200">
                  {alert.metric}
                </h3>
                <p className="text-sm text-text-secondary dark:text-zinc-400">{alert.message}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-tertiary dark:text-zinc-500">
                  <span>
                    Current: <strong>{alert.currentValue.toLocaleString()}</strong>
                  </span>
                  <span>
                    Threshold: <strong>{alert.thresholdValue.toLocaleString()}</strong>
                  </span>
                  <span>
                    Exceeded by:{' '}
                    <strong className={getSeverityTextColor(alert.severity)}>
                      {(
                        ((alert.currentValue - alert.thresholdValue) / alert.thresholdValue) *
                        100
                      ).toFixed(1)}
                      %
                    </strong>
                  </span>
                </div>
              </div>
              <button
                className="ml-4 text-text-secondary hover:text-text-primary dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-label={expandedAlerts.has(alert.alertId) ? 'Collapse' : 'Expand'}
              >
                {expandedAlerts.has(alert.alertId) ? '▼' : '▶'}
              </button>
            </div>

            {expandedAlerts.has(alert.alertId) && (
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <h4 className="mb-2 text-sm font-semibold text-text-primary dark:text-zinc-200">
                  Recommended Actions:
                </h4>
                <ul className="space-y-1">
                  {alert.recommendedActions.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-text-secondary dark:text-zinc-400"
                    >
                      <span className="mt-1 text-xs">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
