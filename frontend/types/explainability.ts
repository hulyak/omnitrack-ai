/**
 * Explainability-specific type definitions
 */

export interface DecisionTreeNode {
  id: string;
  label: string;
  value?: string | number;
  description?: string;
  children?: DecisionTreeNode[];
  confidence?: number;
  agent?: string;
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  role: string;
  confidence: number;
  insights: string[];
  dataSourcesUsed?: string[];
}

export interface UncertaintyRange {
  bestCase: number;
  expected: number;
  worstCase: number;
  confidence: number;
  assumptions?: string;
}

export interface ExplainabilityData {
  summary: string;
  decisionTree: DecisionTreeNode;
  agentContributions: AgentContribution[];
  uncertaintyRanges: Record<string, UncertaintyRange>;
  overallConfidence: number;
  technicalTerms?: Record<string, string>;
  timestamp: string;
}

export interface ExplanationRequest {
  scenarioId: string;
  includeDecisionTree?: boolean;
  includeAgentAttribution?: boolean;
  includeUncertainty?: boolean;
}

export interface ExplanationResponse {
  explanationId: string;
  scenarioId: string;
  data: ExplainabilityData;
  generatedAt: string;
}
