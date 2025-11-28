'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/auth-context';
import { useWebSocket } from '@/lib/websocket/websocket-context';
import { useDigitalTwin, useAlerts, useAPI } from '@/lib/api/hooks';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DigitalTwinStatus } from '@/components/dashboard/digital-twin-status';
import { ActiveAlerts } from '@/components/dashboard/active-alerts';
import { KeyMetrics } from '@/components/dashboard/key-metrics';
import type { DigitalTwinData, Alert, MetricsData } from '@/types/dashboard';

function DashboardContent() {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const {
    data: digitalTwin,
    error: dtError,
    isLoading: dtLoading,
    mutate: refreshDT,
  } = useDigitalTwin();
  const {
    data: alerts,
    error: alertsError,
    isLoading: alertsLoading,
    mutate: refreshAlerts,
  } = useAlerts();
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useAPI<MetricsData>('/dashboard/metrics');

  return (
    <div className="min-h-screen bg-surface dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-border bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary dark:text-zinc-50">OmniTrack AI</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
              <span className="text-sm text-text-secondary dark:text-zinc-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="hidden text-sm text-text-secondary dark:text-zinc-400 sm:block">
              {user?.name}
            </div>
            <button
              onClick={logout}
              className="rounded-md bg-zinc-100 px-3 py-1 text-sm text-text-primary hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <DashboardNav />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Dashboard Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Digital Twin Status */}
          <DigitalTwinStatus
            data={digitalTwin as DigitalTwinData | undefined}
            isLoading={dtLoading}
            error={dtError}
          />

          {/* Active Alerts */}
          <ActiveAlerts
            data={alerts as Alert[] | undefined}
            isLoading={alertsLoading}
            error={alertsError}
            onRefresh={refreshAlerts}
          />

          {/* Key Metrics */}
          <KeyMetrics data={metrics} isLoading={metricsLoading} error={metricsError} />
        </div>

        {/* Additional Dashboard Sections */}
        <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
              Recent Activity
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 border-b border-border pb-3 dark:border-zinc-700">
                <div className="mt-1 h-2 w-2 rounded-full bg-info"></div>
                <div className="flex-1">
                  <p className="text-text-primary dark:text-zinc-300">
                    Scenario simulation completed
                  </p>
                  <p className="text-xs text-text-tertiary dark:text-zinc-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-b border-border pb-3 dark:border-zinc-700">
                <div className="mt-1 h-2 w-2 rounded-full bg-success"></div>
                <div className="flex-1">
                  <p className="text-text-primary dark:text-zinc-300">Digital twin synchronized</p>
                  <p className="text-xs text-text-tertiary dark:text-zinc-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-warning"></div>
                <div className="flex-1">
                  <p className="text-text-primary dark:text-zinc-300">Risk assessment updated</p>
                  <p className="text-xs text-text-tertiary dark:text-zinc-500">15 minutes ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
              Quick Actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-md bg-info px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-info/90">
                <div className="mb-1">🎯 Run Scenario</div>
                <div className="text-xs opacity-90">Simulate disruption</div>
              </button>
              <button className="rounded-md bg-success px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-success/90">
                <div className="mb-1">🔄 Refresh Twin</div>
                <div className="text-xs opacity-90">Sync latest data</div>
              </button>
              <button className="rounded-md bg-warning px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-warning/90">
                <div className="mb-1">📊 View Reports</div>
                <div className="text-xs opacity-90">Analytics dashboard</div>
              </button>
              <button className="rounded-md bg-zinc-600 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-zinc-700">
                <div className="mb-1">🏪 Marketplace</div>
                <div className="text-xs opacity-90">Browse scenarios</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
