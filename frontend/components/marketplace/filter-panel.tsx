'use client';

import { useState, useEffect } from 'react';
import { SearchFilters, MarketplaceScenario, DisruptionType } from '@/types/marketplace';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  scenarios: MarketplaceScenario[];
}

export function FilterPanel({ filters, onFilterChange, scenarios }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  // Extract unique values from scenarios
  const industries = Array.from(
    new Set(scenarios.map((s) => s.marketplaceMetadata.industry))
  ).sort();
  const geographies = Array.from(
    new Set(scenarios.map((s) => s.marketplaceMetadata.geography))
  ).sort();
  const allTags = Array.from(
    new Set(scenarios.flatMap((s) => s.marketplaceMetadata.tags))
  ).sort();

  const disruptionTypes: DisruptionType[] = [
    'NATURAL_DISASTER',
    'SUPPLIER_FAILURE',
    'TRANSPORTATION_DELAY',
    'DEMAND_SPIKE',
    'QUALITY_ISSUE',
    'GEOPOLITICAL',
    'CYBER_ATTACK',
    'LABOR_SHORTAGE',
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    setLocalFilters({ ...localFilters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const formatDisruptionType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Industry Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <select
            value={localFilters.industry || ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                industry: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Disruption Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Disruption Type
          </label>
          <select
            value={localFilters.disruptionType || ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                disruptionType: (e.target.value as DisruptionType) || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {disruptionTypes.map((type) => (
              <option key={type} value={type}>
                {formatDisruptionType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Geography Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Geography</label>
          <select
            value={localFilters.geography || ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                geography: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Regions</option>
            {geographies.map((geography) => (
              <option key={geography} value={geography}>
                {geography}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <select
            value={localFilters.minRating !== undefined ? localFilters.minRating : ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                minRating: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = localFilters.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
