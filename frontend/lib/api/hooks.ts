/**
 * SWR hooks for data fetching
 * Provides React hooks for API data fetching with caching and revalidation
 */

import useSWR, { SWRConfiguration } from 'swr';
import { apiClient, APIError } from './client';

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

/**
 * Generic fetcher function for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
  return apiClient.get<T>(url);
}

/**
 * Hook for fetching digital twin state
 */
export function useDigitalTwin(config?: SWRConfiguration) {
  return useSWR<any, APIError>('/digital-twin/state', fetcher, {
    ...defaultConfig,
    ...config,
    refreshInterval: 5000, // Refresh every 5 seconds
  });
}

/**
 * Hook for fetching alerts
 */
export function useAlerts(config?: SWRConfiguration) {
  return useSWR<any, APIError>('/alerts', fetcher, {
    ...defaultConfig,
    ...config,
    refreshInterval: 10000, // Refresh every 10 seconds
  });
}

/**
 * Hook for fetching scenario details
 */
export function useScenario(scenarioId: string | null, config?: SWRConfiguration) {
  return useSWR(scenarioId ? `/scenarios/${scenarioId}` : null, fetcher, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Hook for fetching scenario results
 */
export function useScenarioResults(scenarioId: string | null, config?: SWRConfiguration) {
  return useSWR(scenarioId ? `/scenarios/${scenarioId}/results` : null, fetcher, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Hook for fetching marketplace scenarios
 */
export function useMarketplaceScenarios(
  filters?: Record<string, string>,
  config?: SWRConfiguration
) {
  const queryString = filters ? '?' + new URLSearchParams(filters).toString() : '';

  return useSWR(`/marketplace/scenarios${queryString}`, fetcher, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Hook for fetching sustainability metrics
 */
export function useSustainabilityMetrics(config?: SWRConfiguration) {
  return useSWR('/sustainability/metrics', fetcher, {
    ...defaultConfig,
    ...config,
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for fetching user profile
 */
export function useUserProfile(config?: SWRConfiguration) {
  return useSWR('/users/profile', fetcher, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Generic hook for any endpoint
 */
export function useAPI<T>(endpoint: string | null, config?: SWRConfiguration) {
  return useSWR<T, APIError>(endpoint, fetcher, {
    ...defaultConfig,
    ...config,
  });
}
