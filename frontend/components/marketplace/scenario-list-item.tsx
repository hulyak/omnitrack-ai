'use client';

import { MarketplaceScenario } from '@/types/marketplace';
import Link from 'next/link';
import { StarRating } from './star-rating';

interface ScenarioListItemProps {
  scenario: MarketplaceScenario;
}

export function ScenarioListItem({ scenario }: ScenarioListItemProps) {
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Main Content */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {marketplaceMetadata.title}
            </h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{marketplaceMetadata.description}</p>

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium text-gray-900">
                  {formatDisruptionType(scenario.type)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Industry:</span>
                <span className="font-medium text-gray-900">{marketplaceMetadata.industry}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Geography:</span>
                <span className="font-medium text-gray-900">{marketplaceMetadata.geography}</span>
              </div>
              <div className="flex items-center gap-2">
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
              <div className="flex flex-wrap gap-1">
                {marketplaceMetadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="md:w-48 flex md:flex-col gap-4 md:gap-2 md:items-end">
            <div className="flex items-center gap-2">
              <StarRating rating={marketplaceMetadata.rating} size="sm" />
              <span className="text-sm text-gray-600">
                ({marketplaceMetadata.rating.toFixed(1)})
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {marketplaceMetadata.usageCount}{' '}
              {marketplaceMetadata.usageCount === 1 ? 'use' : 'uses'}
            </div>
            <div className="text-xs text-gray-500">
              by {marketplaceMetadata.originalAuthor || marketplaceMetadata.author}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
