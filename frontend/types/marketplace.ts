/**
 * Marketplace-specific type definitions
 */

export type DisruptionType =
  | 'NATURAL_DISASTER'
  | 'SUPPLIER_FAILURE'
  | 'TRANSPORTATION_DELAY'
  | 'DEMAND_SPIKE'
  | 'QUALITY_ISSUE'
  | 'GEOPOLITICAL'
  | 'CYBER_ATTACK'
  | 'LABOR_SHORTAGE';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export interface ScenarioParameters {
  location: Location;
  severity: SeverityLevel;
  duration: number; // in hours
  affectedNodes: string[];
  customParameters?: Record<string, any>;
}

export interface MarketplaceMetadata {
  title: string;
  description: string;
  author: string;
  rating: number;
  usageCount: number;
  tags: string[];
  industry: string;
  geography: string;
  originalAuthor?: string; // For forked scenarios
}

export interface MarketplaceScenario {
  scenarioId: string;
  type: DisruptionType;
  parameters: ScenarioParameters;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  marketplaceMetadata: MarketplaceMetadata;
  version: number;
}

export interface ScenarioRating {
  scenarioId: string;
  userId: string;
  rating: number;
  review?: string;
  timestamp: string;
}

export interface SearchFilters {
  industry?: string;
  disruptionType?: DisruptionType;
  geography?: string;
  minRating?: number;
  tags?: string[];
  searchQuery?: string;
}

export type ViewMode = 'grid' | 'list';

export interface PublishScenarioRequest {
  scenarioId: string;
  title: string;
  description: string;
  tags: string[];
  industry: string;
  geography: string;
}

export interface RateScenarioRequest {
  scenarioId: string;
  rating: number;
  review?: string;
}

export interface ForkScenarioRequest {
  scenarioId: string;
  modifications?: Partial<MarketplaceScenario>;
}
