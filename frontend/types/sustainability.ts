/**
 * Sustainability Dashboard type definitions
 */

export interface EnvironmentalMetrics {
  carbonFootprint: number; // kg CO₂
  emissionsByRoute: RouteEmission[];
  sustainabilityScore: number; // 0-100
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  totalEmissions: number;
  emissionsPerUnit: number;
}

export interface RouteEmission {
  routeId: string;
  routeName: string;
  emissions: number; // kg CO₂
  distance: number; // km
  transportMode: 'AIR' | 'SEA' | 'RAIL' | 'ROAD';
  percentage: number; // percentage of total emissions
}

export interface TrendDataPoint {
  timestamp: string;
  date: string;
  carbonFootprint: number;
  sustainabilityScore: number;
  totalEmissions: number;
}

export interface StrategyComparison {
  strategyId: string;
  strategyName: string;
  environmental: {
    carbonReduction: number; // percentage
    emissionsReduction: number; // kg CO₂
    sustainabilityScore: number;
  };
  cost: {
    value: number;
    change: number; // percentage
  };
  risk: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export interface ThresholdAlert {
  alertId: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recommendedActions: string[];
  createdAt: string;
}

export interface SustainabilityData {
  metrics: EnvironmentalMetrics;
  trends: TrendDataPoint[];
  strategyComparisons: StrategyComparison[];
  thresholdAlerts: ThresholdAlert[];
  lastUpdated: string;
}
