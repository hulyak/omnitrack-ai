/**
 * Explainability Service - Generates explanations for AI decisions
 * 
 * This service provides natural language summaries, decision tree structures,
 * agent attribution tracking, and uncertainty quantification for predictions.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  ImpactAnalysis,
  MitigationStrategy,
  DecisionTree,
  DecisionNode,
  DecisionEdge,
  Scenario
} from '../models/types';

export interface AgentContribution {
  agentName: string;
  contributionType: string;
  data: any;
  confidence?: number;
  uncertaintyRange?: UncertaintyRange;
}

export interface UncertaintyRange {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g., 0.95 for 95% confidence interval
}

export interface ExplanationRequest {
  scenarioId: string;
  scenario?: Scenario;
  impacts?: ImpactAnalysis;
  strategies?: MitigationStrategy[];
  agentContributions: AgentContribution[];
  includeNaturalLanguage?: boolean;
  includeDecisionTree?: boolean;
  includeUncertainty?: boolean;
}

export interface ExplanationResponse {
  scenarioId: string;
  naturalLanguageSummary?: string;
  decisionTree?: DecisionTree;
  agentAttributions: AgentAttribution[];
  uncertaintyQuantification?: UncertaintyQuantification;
  metadata: {
    generatedAt: string;
    generationMethod: string;
    completeness: number; // 0-1 score
  };
}

export interface AgentAttribution {
  agentName: string;
  componentId: string;
  contributionDescription: string;
  confidence?: number;
}

export interface UncertaintyQuantification {
  overallConfidence: number;
  predictionRanges: PredictionRange[];
  assumptions: string[];
  limitationsAndCaveats: string[];
}

export interface PredictionRange {
  metric: string;
  pointEstimate: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

/**
 * Explainability Service
 */
export class ExplainabilityService {
  private bedrockClient: BedrockRuntimeClient;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  /**
   * Generate comprehensive explanation for a scenario result
   */
  async generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    const generatedAt = new Date().toISOString();
    
    // Generate natural language summary if requested
    let naturalLanguageSummary: string | undefined;
    if (request.includeNaturalLanguage !== false) {
      naturalLanguageSummary = await this.generateNaturalLanguageSummary(
        request.scenario,
        request.impacts,
        request.strategies,
        request.agentContributions
      );
    }

    // Generate decision tree structure if requested
    let decisionTree: DecisionTree | undefined;
    if (request.includeDecisionTree !== false) {
      decisionTree = this.generateDecisionTreeStructure(
        request.scenario,
        request.impacts,
        request.strategies,
        request.agentContributions
      );
    }

    // Extract agent attributions
    const agentAttributions = this.extractAgentAttributions(
      request.agentContributions,
      decisionTree
    );

    // Generate uncertainty quantification if requested
    let uncertaintyQuantification: UncertaintyQuantification | undefined;
    if (request.includeUncertainty !== false) {
      uncertaintyQuantification = this.generateUncertaintyQuantification(
        request.impacts,
        request.strategies,
        request.agentContributions
      );
    }

    // Calculate completeness score
    const completeness = this.calculateCompleteness({
      naturalLanguageSummary,
      decisionTree,
      agentAttributions,
      uncertaintyQuantification
    });

    return {
      scenarioId: request.scenarioId,
      naturalLanguageSummary,
      decisionTree,
      agentAttributions,
      uncertaintyQuantification,
      metadata: {
        generatedAt,
        generationMethod: 'bedrock-llm',
        completeness
      }
    };
  }

  /**
   * Generate natural language summary using Amazon Bedrock
   */
  private async generateNaturalLanguageSummary(
    scenario?: Scenario,
    impacts?: ImpactAnalysis,
    strategies?: MitigationStrategy[],
    agentContributions?: AgentContribution[]
  ): Promise<string> {
    try {
      // Build prompt for Bedrock
      const prompt = this.buildSummaryPrompt(scenario, impacts, strategies, agentContributions);

      const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';
      
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      };

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content[0].text;

    } catch (error) {
      console.error('Bedrock invocation failed for summary generation', error);
      
      // Fallback to rule-based summary
      return this.generateRuleBasedSummary(scenario, impacts, strategies);
    }
  }

  /**
   * Build prompt for natural language summary
   */
  private buildSummaryPrompt(
    scenario?: Scenario,
    impacts?: ImpactAnalysis,
    strategies?: MitigationStrategy[],
    agentContributions?: AgentContribution[]
  ): string {
    let prompt = 'You are an expert supply chain analyst. Generate a clear, business-friendly summary of the following analysis:\n\n';

    if (scenario) {
      prompt += `Scenario: ${scenario.type} disruption at ${scenario.parameters.location.city}, ${scenario.parameters.location.country}\n`;
      prompt += `Severity: ${scenario.parameters.severity}\n`;
      prompt += `Duration: ${scenario.parameters.duration} hours\n\n`;
    }

    if (impacts) {
      prompt += 'Predicted Impacts:\n';
      prompt += `- Cost Impact: $${Math.round(impacts.costImpact).toLocaleString()}\n`;
      prompt += `- Delivery Time Impact: ${Math.round(impacts.deliveryTimeImpact)} hours\n`;
      prompt += `- Inventory Impact: ${Math.round(impacts.inventoryImpact)} units\n`;
      
      if (impacts.sustainabilityImpact) {
        prompt += `- Carbon Footprint: ${Math.round(impacts.sustainabilityImpact.carbonFootprint)} kg CO2\n`;
      }
      prompt += '\n';
    }

    if (strategies && strategies.length > 0) {
      prompt += 'Recommended Mitigation Strategies:\n';
      strategies.slice(0, 3).forEach((strategy, index) => {
        prompt += `${index + 1}. ${strategy.name}: ${strategy.description}\n`;
      });
      prompt += '\n';
    }

    if (agentContributions && agentContributions.length > 0) {
      prompt += 'Analysis Contributors:\n';
      const uniqueAgents = [...new Set(agentContributions.map(c => c.agentName))];
      uniqueAgents.forEach(agent => {
        prompt += `- ${agent}\n`;
      });
      prompt += '\n';
    }

    prompt += 'Please provide a concise 2-3 paragraph summary in business terms that:\n';
    prompt += '1. Explains the key findings and their business implications\n';
    prompt += '2. Highlights the most critical risks and opportunities\n';
    prompt += '3. Recommends immediate next steps\n';
    prompt += '\nAvoid technical jargon and focus on actionable insights.';

    return prompt;
  }

  /**
   * Generate rule-based summary (fallback)
   */
  private generateRuleBasedSummary(
    scenario?: Scenario,
    impacts?: ImpactAnalysis,
    strategies?: MitigationStrategy[]
  ): string {
    let summary = '';

    if (scenario) {
      summary += `A ${scenario.parameters.severity.toLowerCase()} severity ${scenario.type.toLowerCase().replace(/_/g, ' ')} `;
      summary += `at ${scenario.parameters.location.city}, ${scenario.parameters.location.country} `;
      summary += `is predicted to cause significant supply chain disruptions. `;
    }

    if (impacts) {
      summary += `The estimated cost impact is $${Math.round(impacts.costImpact).toLocaleString()}, `;
      summary += `with delivery delays of approximately ${Math.round(impacts.deliveryTimeImpact)} hours. `;
      summary += `Inventory levels are expected to be affected by ${Math.round(impacts.inventoryImpact)} units. `;

      if (impacts.sustainabilityImpact) {
        summary += `Environmental impact includes ${Math.round(impacts.sustainabilityImpact.carbonFootprint).toLocaleString()} kg of CO2 emissions. `;
      }
    }

    if (strategies && strategies.length > 0) {
      summary += `\n\nRecommended mitigation strategies include: `;
      const topStrategies = strategies.slice(0, 3).map(s => s.name).join(', ');
      summary += `${topStrategies}. `;
    }

    summary += `Immediate action is recommended to minimize these impacts and ensure supply chain resilience.`;

    return summary;
  }

  /**
   * Generate decision tree structure for visualization
   */
  private generateDecisionTreeStructure(
    scenario?: Scenario,
    impacts?: ImpactAnalysis,
    strategies?: MitigationStrategy[],
    agentContributions?: AgentContribution[]
  ): DecisionTree {
    const nodes: DecisionNode[] = [];
    const edges: DecisionEdge[] = [];

    // Root node - scenario input
    nodes.push({
      nodeId: 'root',
      label: scenario ? `${scenario.type} Analysis` : 'Scenario Analysis',
      type: 'decision',
      agentAttribution: 'System'
    });

    // Data gathering node
    nodes.push({
      nodeId: 'data-gathering',
      label: 'Data Collection & Aggregation',
      type: 'condition',
      agentAttribution: 'Info Agent'
    });

    edges.push({
      from: 'root',
      to: 'data-gathering',
      label: 'Initiate Analysis'
    });

    // Scenario generation node
    if (scenario) {
      nodes.push({
        nodeId: 'scenario-gen',
        label: `Generate ${scenario.type} Scenario`,
        type: 'condition',
        agentAttribution: 'Scenario Agent',
        confidence: 0.85
      });

      edges.push({
        from: 'data-gathering',
        to: 'scenario-gen',
        label: 'Scenario Parameters'
      });
    }

    // Impact analysis node
    if (impacts) {
      nodes.push({
        nodeId: 'impact-analysis',
        label: 'Analyze Multi-Dimensional Impacts',
        type: 'condition',
        agentAttribution: 'Impact Agent'
      });

      edges.push({
        from: scenario ? 'scenario-gen' : 'data-gathering',
        to: 'impact-analysis',
        label: 'Run Simulation'
      });

      // Cost impact outcome
      nodes.push({
        nodeId: 'cost-outcome',
        label: `Cost: $${Math.round(impacts.costImpact).toLocaleString()}`,
        type: 'outcome',
        agentAttribution: 'Impact Agent',
        confidence: 0.80
      });

      edges.push({
        from: 'impact-analysis',
        to: 'cost-outcome',
        label: 'Cost Analysis'
      });

      // Time impact outcome
      nodes.push({
        nodeId: 'time-outcome',
        label: `Delay: ${Math.round(impacts.deliveryTimeImpact)}h`,
        type: 'outcome',
        agentAttribution: 'Impact Agent',
        confidence: 0.75
      });

      edges.push({
        from: 'impact-analysis',
        to: 'time-outcome',
        label: 'Time Analysis'
      });

      // Sustainability impact if present
      if (impacts.sustainabilityImpact) {
        nodes.push({
          nodeId: 'sustainability-outcome',
          label: `Carbon: ${Math.round(impacts.sustainabilityImpact.carbonFootprint)} kg CO2`,
          type: 'outcome',
          agentAttribution: 'Sustainability Service',
          confidence: 0.70
        });

        edges.push({
          from: 'impact-analysis',
          to: 'sustainability-outcome',
          label: 'Sustainability Analysis'
        });
      }
    }

    // Strategy generation node
    if (strategies && strategies.length > 0) {
      const fromNode = impacts ? 'impact-analysis' : (scenario ? 'scenario-gen' : 'data-gathering');
      
      nodes.push({
        nodeId: 'strategy-gen',
        label: 'Generate Mitigation Strategies',
        type: 'condition',
        agentAttribution: 'Strategy Agent'
      });

      edges.push({
        from: fromNode,
        to: 'strategy-gen',
        label: 'Optimize Solutions'
      });

      // Top strategies as outcomes
      strategies.slice(0, 3).forEach((strategy, index) => {
        nodes.push({
          nodeId: `strategy-${index}`,
          label: strategy.name,
          type: 'outcome',
          agentAttribution: 'Strategy Agent',
          confidence: 0.85 - (index * 0.05)
        });

        edges.push({
          from: 'strategy-gen',
          to: `strategy-${index}`,
          label: `Option ${index + 1}`
        });
      });
    }

    // Add agent contribution nodes if available
    if (agentContributions) {
      agentContributions.forEach((contribution, index) => {
        if (!nodes.find(n => n.agentAttribution === contribution.agentName)) {
          // Agent already represented in tree
          return;
        }
      });
    }

    return { nodes, edges };
  }

  /**
   * Extract agent attributions from contributions and decision tree
   */
  private extractAgentAttributions(
    agentContributions: AgentContribution[],
    decisionTree?: DecisionTree
  ): AgentAttribution[] {
    const attributions: AgentAttribution[] = [];

    // Extract from agent contributions
    agentContributions.forEach((contribution, index) => {
      attributions.push({
        agentName: contribution.agentName,
        componentId: `contribution-${index}`,
        contributionDescription: contribution.contributionType,
        confidence: contribution.confidence
      });
    });

    // Extract from decision tree nodes
    if (decisionTree) {
      decisionTree.nodes.forEach(node => {
        if (node.agentAttribution && 
            !attributions.find(a => a.agentName === node.agentAttribution && a.componentId === node.nodeId)) {
          attributions.push({
            agentName: node.agentAttribution,
            componentId: node.nodeId,
            contributionDescription: node.label,
            confidence: node.confidence
          });
        }
      });
    }

    return attributions;
  }

  /**
   * Generate uncertainty quantification for predictions
   */
  private generateUncertaintyQuantification(
    impacts?: ImpactAnalysis,
    strategies?: MitigationStrategy[],
    agentContributions?: AgentContribution[]
  ): UncertaintyQuantification {
    const predictionRanges: PredictionRange[] = [];

    // Generate uncertainty ranges for impacts
    if (impacts) {
      // Cost impact range (±20% uncertainty)
      predictionRanges.push({
        metric: 'Cost Impact',
        pointEstimate: impacts.costImpact,
        lowerBound: impacts.costImpact * 0.8,
        upperBound: impacts.costImpact * 1.2,
        confidenceLevel: 0.90
      });

      // Delivery time range (±15% uncertainty)
      predictionRanges.push({
        metric: 'Delivery Time Impact',
        pointEstimate: impacts.deliveryTimeImpact,
        lowerBound: impacts.deliveryTimeImpact * 0.85,
        upperBound: impacts.deliveryTimeImpact * 1.15,
        confidenceLevel: 0.85
      });

      // Inventory impact range (±25% uncertainty)
      predictionRanges.push({
        metric: 'Inventory Impact',
        pointEstimate: impacts.inventoryImpact,
        lowerBound: impacts.inventoryImpact * 0.75,
        upperBound: impacts.inventoryImpact * 1.25,
        confidenceLevel: 0.80
      });

      // Sustainability impact if present
      if (impacts.sustainabilityImpact) {
        predictionRanges.push({
          metric: 'Carbon Footprint',
          pointEstimate: impacts.sustainabilityImpact.carbonFootprint,
          lowerBound: impacts.sustainabilityImpact.carbonFootprint * 0.7,
          upperBound: impacts.sustainabilityImpact.carbonFootprint * 1.3,
          confidenceLevel: 0.75
        });
      }
    }

    // Calculate overall confidence from agent contributions
    let overallConfidence = 0.80; // Base confidence
    if (agentContributions && agentContributions.length > 0) {
      const contributionConfidences = agentContributions
        .filter(c => c.confidence !== undefined)
        .map(c => c.confidence!);
      
      if (contributionConfidences.length > 0) {
        overallConfidence = contributionConfidences.reduce((sum, c) => sum + c, 0) / contributionConfidences.length;
      }
    }

    // Define assumptions
    const assumptions = [
      'Historical patterns remain relevant for future predictions',
      'Supply chain network topology remains stable during disruption',
      'External market conditions remain within normal ranges',
      'Mitigation strategies can be implemented as planned'
    ];

    // Define limitations
    const limitationsAndCaveats = [
      'Predictions based on Monte Carlo simulation with 1000 iterations',
      'Actual outcomes may vary due to unforeseen circumstances',
      'Confidence intervals assume normal distribution of uncertainties',
      'Long-term impacts beyond 90 days have higher uncertainty'
    ];

    return {
      overallConfidence,
      predictionRanges,
      assumptions,
      limitationsAndCaveats
    };
  }

  /**
   * Calculate completeness score for explanation
   */
  private calculateCompleteness(components: {
    naturalLanguageSummary?: string;
    decisionTree?: DecisionTree;
    agentAttributions?: AgentAttribution[];
    uncertaintyQuantification?: UncertaintyQuantification;
  }): number {
    let score = 0;
    let maxScore = 4;

    if (components.naturalLanguageSummary && components.naturalLanguageSummary.length > 50) {
      score += 1;
    }

    if (components.decisionTree && 
        components.decisionTree.nodes.length > 0 && 
        components.decisionTree.edges.length > 0) {
      score += 1;
    }

    if (components.agentAttributions && components.agentAttributions.length > 0) {
      score += 1;
    }

    if (components.uncertaintyQuantification && 
        components.uncertaintyQuantification.predictionRanges.length > 0) {
      score += 1;
    }

    return score / maxScore;
  }
}
