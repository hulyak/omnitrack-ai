'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/websocket-context';
import { apiClient } from '@/lib/api/client';

interface Alert {
  alertId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  metadata: {
    priority: number;
    affectedNodes: string[];
    estimatedImpact: string;
    recommendedActions: string[];
  };
}

interface ActiveAlertsProps {
  data?: Alert[];
  isLoading: boolean;
  error?: Error;
  onRefresh?: () => void;
}

export function ActiveAlerts({ data, isLoading, error, onRefresh }: ActiveAlertsProps) {
  const { subscribe } = useWebSocket();
  const [alerts, setAlerts] = useState<Alert[]>(data || []);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setAlerts(data);
    }
  }, [data]);

  useEffect(() => {
    const unsubscribe = subscribe('alert_notification', (message) => {
      const newAlert = message.data as Alert;
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return unsubscribe;
  }, [subscribe]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      await apiClient.put(`/alerts/${alertId}/acknowledge`);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.alertId === alertId ? { ...alert, status: 'ACKNOWLEDGED' as const } : alert
        )
      );
      onRefresh?.();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-error text-white';
      case 'HIGH':
        return 'bg-warning text-white';
      case 'MEDIUM':
        return 'bg-info text-white';
      case 'LOW':
        return 'bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Active Alerts
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Active Alerts
        </h2>
        <p className="text-error">Error loading alerts</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter((alert) => alert.status === 'ACTIVE');

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary dark:text-zinc-50">Active Alerts</h2>
        {activeAlerts.length > 0 && (
          <span className="rounded-full bg-error px-2 py-1 text-xs font-medium text-white">
            {activeAlerts.length}
          </span>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <div className="text-center text-text-secondary dark:text-zinc-400">
          <p>No active alerts</p>
          <p className="text-xs text-text-tertiary dark:text-zinc-500">All systems operational</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeAlerts.slice(0, 5).map((alert) => (
            <div
              key={alert.alertId}
              className="rounded-md border border-border p-3 dark:border-zinc-700"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-text-tertiary dark:text-zinc-500">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary dark:text-zinc-300">{alert.message}</p>
                </div>
              </div>

              {alert.metadata.estimatedImpact && (
                <p className="mb-2 text-xs text-text-secondary dark:text-zinc-400">
                  Impact: {alert.metadata.estimatedImpact}
                </p>
              )}

              <button
                onClick={() => handleAcknowledge(alert.alertId)}
                disabled={acknowledging === alert.alertId}
                className="text-xs text-info hover:underline disabled:opacity-50"
              >
                {acknowledging === alert.alertId ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            </div>
          ))}
          {activeAlerts.length > 5 && (
            <p className="text-center text-xs text-text-tertiary dark:text-zinc-500">
              +{activeAlerts.length - 5} more alerts
            </p>
          )}
        </div>
      )}
    </div>
  );
}
