'use client';

import { useState, useEffect } from 'react';
import { MarketplaceScenario, SearchFilters, ViewMode } from '@/types/marketplace';
import { apiClient } from '@/lib/api/client';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-900/20 border border-red-500/50 rounded-2xl p-8">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-white font-medium text-lg">Failed to load marketplace</p>
          <p className="text-slate-300 mt-2">{error}</p>
          <button
            onClick={loadScenarios}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/50">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🛒</span>
          <h2 className="text-2xl font-bold text-white">Scenario Marketplace</h2>
        </div>
        <p className="text-slate-200 text-base leading-relaxed">
          Discover, share, and customize supply chain disruption scenarios from the community. 
          Browse pre-built scenarios or contribute your own to help others.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search scenarios by title, tags, or industry..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
          />
        </div>
      </div>

      {/* Results Count & View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-slate-300 font-medium">
          Showing <span className="text-purple-400 font-bold">{filteredScenarios.length}</span> of{' '}
          <span className="text-blue-400 font-bold">{scenarios.length}</span> scenarios
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-2">Sort by:</span>
          <select className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
            <option>Most Popular</option>
            <option>Highest Rated</option>
            <option>Most Recent</option>
            <option>Most Downloads</option>
          </select>
        </div>
      </div>

      {/* Scenarios Display */}
      {filteredScenarios.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800/50">
          <div className="text-slate-500 text-6xl mb-4">🔍</div>
          <p className="text-white text-xl font-bold mb-2">No scenarios found</p>
          <p className="text-slate-400 mt-2 text-base">Try adjusting your search query or filters</p>
          <button
            onClick={() => setFilters({})}
            className="mt-6 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-400 rounded-lg font-medium transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.scenarioId}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden flex flex-col"
            >

              <div className="p-6 flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 hover:text-purple-400 transition-colors cursor-pointer">
                  {scenario.marketplaceMetadata.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                  {scenario.marketplaceMetadata.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {scenario.marketplaceMetadata.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-yellow-400 font-medium">
                      ⭐ {scenario.marketplaceMetadata.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-blue-400 font-medium">
                      📥 {scenario.marketplaceMetadata.usageCount}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/50 whitespace-nowrap">
                    {scenario.marketplaceMetadata.industry}
                  </span>
                </div>

                {/* Spacer to push author section to bottom */}
                <div className="flex-1"></div>

                {/* Author */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-shrink">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {scenario.marketplaceMetadata.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-300 font-medium truncate">
                      {scenario.marketplaceMetadata.author}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      // Navigate to scenarios page
                      window.location.href = '/scenarios';
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 hover:scale-105 text-xs font-semibold transition-all shadow-lg hover:shadow-purple-500/50 whitespace-nowrap flex-shrink-0"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
