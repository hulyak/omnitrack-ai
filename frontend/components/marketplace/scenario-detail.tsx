'use client';

import { useState, useEffect } from 'react';
import { MarketplaceScenario } from '@/types/marketplace';
import { apiClient } from '@/lib/api/client';
import { StarRating } from './star-rating';
import { RatingForm } from './rating-form';
import { ForkScenarioModal } from './fork-scenario-modal';
import Link from 'next/link';

interface ScenarioDetailProps {
  scenarioId: string;
}

export function ScenarioDetail({ scenarioId }: ScenarioDetailProps) {
  const [scenario, setScenario] = useState<MarketplaceScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);

  useEffect(() => {
    loadScenario();
  }, [scenarioId]);

  const loadScenario = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<MarketplaceScenario>(
        `/marketplace/scenarios/${scenarioId}`
      );
      setScenario(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    // Reload scenario to get updated rating
    await loadScenario();
    setShowRatingForm(false);
  };

  const handleForkSuccess = () => {
    setShowForkModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium">Failed to load scenario</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link
            href="/marketplace"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const { marketplaceMetadata } = scenario;

  const formatDisruptionType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{marketplaceMetadata.title}</h1>
            <p className="text-gray-600">{marketplaceMetadata.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRatingForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rate Scenario
            </button>
            <button
              onClick={() => setShowForkModal(true)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fork & Customize
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-6 items-center pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <StarRating rating={marketplaceMetadata.rating} size="md" />
            <span className="text-lg font-medium text-gray-900">
              {marketplaceMetadata.rating.toFixed(1)}
            </span>
          </div>
          <div className="text-gray-600">
            <span className="font-medium">{marketplaceMetadata.usageCount}</span>{' '}
            {marketplaceMetadata.usageCount === 1 ? 'use' : 'uses'}
          </div>
          <div className="text-gray-600">
            by{' '}
            <span className="font-medium">
              {marketplaceMetadata.originalAuthor || marketplaceMetadata.author}
            </span>
          </div>
          {marketplaceMetadata.originalAuthor && (
            <div className="text-sm text-gray-500">
              (Forked from {marketplaceMetadata.originalAuthor})
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Scenario Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scenario Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Disruption Type</span>
              <p className="font-medium text-gray-900">{formatDisruptionType(scenario.type)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Severity</span>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                    scenario.parameters.severity
                  )}`}
                >
                  {scenario.parameters.severity}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Duration</span>
              <p className="font-medium text-gray-900">
                {scenario.parameters.duration} hours (
                {(scenario.parameters.duration / 24).toFixed(1)} days)
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Affected Nodes</span>
              <p className="font-medium text-gray-900">
                {scenario.parameters.affectedNodes.length} node
                {scenario.parameters.affectedNodes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Marketplace Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Marketplace Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Industry</span>
              <p className="font-medium text-gray-900">{marketplaceMetadata.industry}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Geography</span>
              <p className="font-medium text-gray-900">{marketplaceMetadata.geography}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Tags</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {marketplaceMetadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Published</span>
              <p className="font-medium text-gray-900">
                {new Date(scenario.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Address</span>
            <p className="font-medium text-gray-900">{scenario.parameters.location.address}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">City</span>
            <p className="font-medium text-gray-900">{scenario.parameters.location.city}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Country</span>
            <p className="font-medium text-gray-900">{scenario.parameters.location.country}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Coordinates</span>
            <p className="font-medium text-gray-900">
              {scenario.parameters.location.latitude.toFixed(4)},{' '}
              {scenario.parameters.location.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <RatingForm
          scenarioId={scenarioId}
          onClose={() => setShowRatingForm(false)}
          onSuccess={handleRatingSubmit}
        />
      )}

      {/* Fork Modal */}
      {showForkModal && (
        <ForkScenarioModal
          scenario={scenario}
          onClose={() => setShowForkModal(false)}
          onSuccess={handleForkSuccess}
        />
      )}
    </div>
  );
}
