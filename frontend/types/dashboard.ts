/**
 * Dashboard-specific type definitions
 */

export interface DigitalTwinData {
  status: 'active' | 'syncing' | 'error';
  lastSync: string;
  nodeCount: number;
  healthyNodes: number;
  degradedNodes: number;
  disruptedNodes: number;
}

export interface Alert {
  alertId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  metadata: {
    priority: number;
    affectedNodes: string[];
    estimatedImpact: string;
    recommendedActions: string[];
  };
}

export interface MetricsData {
  cost: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  risk: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    change: number;
  };
  sustainability: {
    score: number;
    rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    carbonFootprint: number;
  };
}

/**
 * Scenario Simulator types
 */

export type DisruptionType =
  | 'SUPPLIER_FAILURE'
  | 'TRANSPORTATION_DELAY'
  | 'NATURAL_DISASTER'
  | 'DEMAND_SPIKE'
  | 'QUALITY_ISSUE'
  | 'GEOPOLITICAL_EVENT'
  | 'CYBER_ATTACK'
  | 'LABOR_SHORTAGE';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScenarioParameters {
  disruptionType: DisruptionType;
  location: string;
  severity: SeverityLevel;
  duration?: number; // in days
  affectedNodes?: string[];
  includeSustainability?: boolean;
}

export interface ImpactPrediction {
  cost: {
    value: number;
    currency: string;
    breakdown: {
      direct: number;
      indirect: number;
      opportunity: number;
    };
  };
  deliveryTime: {
    delayDays: number;
    affectedOrders: number;
    criticalOrders: number;
  };
  inventory: {
    shortfall: number;
    excessStock: number;
    affectedSKUs: number;
  };
  sustainability?: {
    carbonFootprint: number;
    emissionsIncrease: number;
  };
}

export interface DecisionTreeNode {
  id: string;
  label: string;
  value?: string | number;
  children?: DecisionTreeNode[];
  confidence?: number;
  agent?: string;
}

export interface MitigationStrategy {
  id: string;
  title: string;
  description: string;
  impact: {
    costReduction: number;
    timeReduction: number;
    riskReduction: number;
  };
  tradeoffs: {
    cost: number;
    time: number;
    sustainability: number;
  };
  confidence: number;
}

export interface ScenarioResult {
  scenarioId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  impacts?: ImpactPrediction;
  decisionTree?: DecisionTreeNode;
  strategies?: MitigationStrategy[];
  summary?: string;
  executionTime?: number;
  createdAt: string;
  completedAt?: string;
}
