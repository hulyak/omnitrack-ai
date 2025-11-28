'use client';

import { useState } from 'react';
import { MarketplaceScenario, SeverityLevel } from '@/types/marketplace';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface ForkScenarioModalProps {
  scenario: MarketplaceScenario;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForkScenarioModal({ scenario, onClose, onSuccess }: ForkScenarioModalProps) {
  const router = useRouter();
  const [severity, setSeverity] = useState<SeverityLevel>(scenario.parameters.severity);
  const [duration, setDuration] = useState(scenario.parameters.duration);
  const [forking, setForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFork = async () => {
    try {
      setForking(true);
      setError(null);

      const modifications =
        severity !== scenario.parameters.severity || duration !== scenario.parameters.duration
          ? {
              parameters: {
                ...scenario.parameters,
                severity,
                duration,
              },
            }
          : undefined;

      const forkedScenario = await apiClient.post<MarketplaceScenario>(
        `/marketplace/scenarios/${scenario.scenarioId}/fork`,
        { modifications }
      );

      onSuccess();
      // Navigate to the forked scenario or scenarios page
      router.push(`/scenarios`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork scenario');
    } finally {
      setForking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Fork & Customize Scenario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={forking}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Create your own version of this scenario. You can modify parameters while preserving
            attribution to the original author.
          </p>
        </div>

        {/* Original Scenario Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Original Scenario</h3>
          <p className="text-sm text-gray-600 mb-2">{scenario.marketplaceMetadata.title}</p>
          <div className="text-xs text-gray-500">
            by {scenario.marketplaceMetadata.originalAuthor || scenario.marketplaceMetadata.author}
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={forking}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="1"
              max="8760"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={forking}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(duration / 24).toFixed(1)} days
            </p>
          </div>
        </div>

        {/* Attribution Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Attribution Preserved</p>
              <p>
                Your forked scenario will maintain a reference to the original author. This helps
                build community trust and recognition.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={forking}
            className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFork}
            disabled={forking}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {forking ? 'Forking...' : 'Fork Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}
