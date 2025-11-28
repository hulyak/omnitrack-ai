'use client';

import { MarketplaceScenario } from '@/types/marketplace';
import Link from 'next/link';
import { StarRating } from './star-rating';

interface ScenarioCardProps {
  scenario: MarketplaceScenario;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
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
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/marketplace/${scenario.scenarioId}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {marketplaceMetadata.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3">{marketplaceMetadata.description}</p>
        </div>

        {/* Metadata */}
        <div className="mb-4 space-y-2 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Type:</span>
            <span className="font-medium text-gray-900">
              {formatDisruptionType(scenario.type)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Industry:</span>
            <span className="font-medium text-gray-900">{marketplaceMetadata.industry}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Geography:</span>
            <span className="font-medium text-gray-900">{marketplaceMetadata.geography}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Severity:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                scenario.parameters.severity
              )}`}
            >
              {scenario.parameters.severity}
            </span>
          </div>
        </div>

        {/* Tags */}
        {marketplaceMetadata.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {marketplaceMetadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {marketplaceMetadata.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                  +{marketplaceMetadata.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarRating rating={marketplaceMetadata.rating} size="sm" />
            <span className="text-sm text-gray-600">
              ({marketplaceMetadata.rating.toFixed(1)})
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {marketplaceMetadata.usageCount} {marketplaceMetadata.usageCount === 1 ? 'use' : 'uses'}
          </div>
        </div>

        {/* Author */}
        <div className="mt-2 text-xs text-gray-500">
          by {marketplaceMetadata.originalAuthor || marketplaceMetadata.author}
        </div>
      </div>
    </Link>
  );
}
