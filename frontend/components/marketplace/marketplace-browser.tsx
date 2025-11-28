'use client';

import { useState, useEffect } from 'react';
import { MarketplaceScenario, SearchFilters, ViewMode } from '@/types/marketplace';
import { apiClient } from '@/lib/api/client';
import { ScenarioCard } from './scenario-card';
import { ScenarioListItem } from './scenario-list-item';
import { SearchBar } from './search-bar';
import { FilterPanel } from './filter-panel';

export function MarketplaceBrowser() {
  const [scenarios, setScenarios] = useState<MarketplaceScenario[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<MarketplaceScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scenarios, filters]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<MarketplaceScenario[]>('/marketplace/scenarios');
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scenarios];

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.marketplaceMetadata.title.toLowerCase().includes(query) ||
          s.marketplaceMetadata.description.toLowerCase().includes(query) ||
          s.marketplaceMetadata.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply industry filter
    if (filters.industry) {
      filtered = filtered.filter((s) => s.marketplaceMetadata.industry === filters.industry);
    }

    // Apply disruption type filter
    if (filters.disruptionType) {
      filtered = filtered.filter((s) => s.type === filters.disruptionType);
    }

    // Apply geography filter
    if (filters.geography) {
      filtered = filtered.filter((s) => s.marketplaceMetadata.geography === filters.geography);
    }

    // Apply minimum rating filter
    if (filters.minRating !== undefined) {
      filtered = filtered.filter((s) => s.marketplaceMetadata.rating >= filters.minRating!);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((s) =>
        filters.tags!.some((tag) => s.marketplaceMetadata.tags.includes(tag))
      );
    }

    setFilteredScenarios(filtered);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, searchQuery: query });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium">Failed to load marketplace</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={loadScenarios}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scenario Marketplace</h1>
        <p className="mt-2 text-gray-600">
          Discover, share, and customize supply chain disruption scenarios from the community
        </p>
      </div>

      {/* Search and View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar onSearch={handleSearch} initialValue={filters.searchQuery} />
        </div>

        <div className="flex gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 border-l border-gray-300 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            scenarios={scenarios}
          />
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredScenarios.length} of {scenarios.length} scenarios
      </div>

      {/* Scenarios Display */}
      {filteredScenarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg">No scenarios found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard key={scenario.scenarioId} scenario={scenario} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScenarios.map((scenario) => (
            <ScenarioListItem key={scenario.scenarioId} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}
