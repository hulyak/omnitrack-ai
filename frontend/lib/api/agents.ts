/**
 * Agent API Client
 * Handles communication with AI agents via Next.js API routes
 */

interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

interface AgentActionParams {
  scenario?: string;
  [key: string]: any;
}

/**
 * Call an AI agent with specified action and parameters
 */
export async function callAgent(
  agent: 'info' | 'scenario' | 'strategy' | 'impact',
  action: string,
  params?: AgentActionParams
): Promise<AgentResponse> {
  try {
    const response = await fetch(`/api/agents/${agent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        params: params || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error calling ${agent} agent:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Info Agent: Scan for anomalies
 */
export async function scanForAnomalies(): Promise<AgentResponse> {
  return callAgent('info', 'scan');
}

/**
 * Scenario Agent: Run simulation
 */
export async function runSimulation(scenario: string): Promise<AgentResponse> {
  return callAgent('scenario', 'simulate', { scenario });
}

/**
 * Strategy Agent: Generate mitigation plan
 */
export async function generateMitigationPlan(): Promise<AgentResponse> {
  return callAgent('strategy', 'generate');
}

/**
 * Impact Agent: Calculate ESG impact
 */
export async function calculateESGImpact(): Promise<AgentResponse> {
  return callAgent('impact', 'calculate');
}

/**
 * Demo mode sample data generators
 */
export const demoData = {
  infoAgent: {
    anomalies: [
      {
        id: 'anomaly-1',
        type: 'inventory',
        severity: 'high',
        location: 'Regional Distributor',
        description: 'Inventory levels critically low (19% capacity)',
        recommendation: 'Expedite shipment from Central Warehouse',
      },
      {
        id: 'anomaly-2',
        type: 'supplier',
        severity: 'medium',
        location: 'Component Supplier',
        description: 'Supplier utilization below optimal (45% capacity)',
        recommendation: 'Review supplier contract and demand forecast',
      },
    ],
    timestamp: new Date().toISOString(),
  },
  
  scenarioAgent: {
    'port-closure': {
      scenario: 'Port Closure',
      impact: {
        deliveryDelay: '7-10 days',
        affectedNodes: ['Regional Distributor', 'Retail Outlets'],
        costIncrease: '$125,000',
        revenueRisk: '$450,000',
      },
      recommendations: [
        'Activate alternative shipping routes via air freight',
        'Increase safety stock at regional warehouses',
        'Communicate delays to retail partners',
      ],
    },
    'supplier-disruption': {
      scenario: 'Supplier Disruption',
      impact: {
        deliveryDelay: '14-21 days',
        affectedNodes: ['Component Supplier', 'Assembly Plant'],
        costIncrease: '$280,000',
        revenueRisk: '$850,000',
      },
      recommendations: [
        'Engage backup supplier immediately',
        'Reduce production schedule by 30%',
        'Prioritize high-margin products',
      ],
    },
    'demand-spike': {
      scenario: 'Demand Spike',
      impact: {
        deliveryDelay: '3-5 days',
        affectedNodes: ['Central Warehouse', 'Retail Outlets'],
        costIncrease: '$85,000',
        revenueRisk: '$0 (opportunity)',
      },
      recommendations: [
        'Increase production capacity by 25%',
        'Expedite shipments to high-demand regions',
        'Negotiate overtime with manufacturing partners',
      ],
    },
    'weather-event': {
      scenario: 'Weather Event',
      impact: {
        deliveryDelay: '5-7 days',
        affectedNodes: ['Regional Distributor', 'Retail Outlets'],
        costIncrease: '$95,000',
        revenueRisk: '$320,000',
      },
      recommendations: [
        'Reroute shipments through unaffected regions',
        'Increase inventory buffer at retail locations',
        'Monitor weather patterns for additional disruptions',
      ],
    },
  },
  
  strategyAgent: {
    strategies: [
      {
        id: 'strategy-1',
        name: 'Multi-Sourcing Strategy',
        priority: 'high',
        timeframe: '2-4 weeks',
        cost: '$150,000',
        expectedBenefit: 'Reduce supplier risk by 60%',
        actions: [
          'Identify and qualify 2 additional component suppliers',
          'Negotiate contracts with volume commitments',
          'Implement dual-sourcing for critical components',
        ],
      },
      {
        id: 'strategy-2',
        name: 'Inventory Optimization',
        priority: 'medium',
        timeframe: '1-2 weeks',
        cost: '$75,000',
        expectedBenefit: 'Improve utilization by 25%',
        actions: [
          'Rebalance inventory across distribution network',
          'Implement dynamic safety stock calculations',
          'Increase warehouse capacity at critical nodes',
        ],
      },
      {
        id: 'strategy-3',
        name: 'Transportation Diversification',
        priority: 'medium',
        timeframe: '3-6 weeks',
        cost: '$200,000',
        expectedBenefit: 'Reduce delivery delays by 40%',
        actions: [
          'Establish contracts with multiple carriers',
          'Implement multi-modal transportation options',
          'Create contingency routing plans',
        ],
      },
    ],
  },
  
  impactAgent: {
    esgMetrics: {
      environmental: {
        carbonFootprint: '1,250 tons CO2e',
        carbonReduction: '-15% vs baseline',
        energyEfficiency: '82%',
        wasteReduction: '45%',
      },
      social: {
        laborPractices: 'Compliant',
        supplierDiversity: '35%',
        communityImpact: 'Positive',
        safetyIncidents: '2 (minor)',
      },
      governance: {
        ethicsCompliance: '98%',
        transparencyScore: '4.2/5',
        riskManagement: 'Strong',
        boardDiversity: '40%',
      },
    },
    recommendations: [
      'Increase renewable energy usage to reduce carbon footprint by additional 10%',
      'Expand supplier diversity program to reach 50% target',
      'Implement additional safety training to eliminate incidents',
    ],
  },
};
