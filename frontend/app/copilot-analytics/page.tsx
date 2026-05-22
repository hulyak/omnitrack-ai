/**
 * Copilot Analytics Page
 * 
 * Admin page for viewing copilot usage analytics.
 * 
 * Requirements: 9.5 - Build admin dashboard
 */

import { AnalyticsDashboard } from '@/components/copilot/analytics-dashboard';

export default function CopilotAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Copilot Analytics</h1>
          <p className="mt-2 text-gray-600">
            Monitor usage patterns, popular commands, and error trends
          </p>
        </div>

        <AnalyticsDashboard apiEndpoint="/api/copilot/analytics" />
      </div>
    </div>
  );
}
