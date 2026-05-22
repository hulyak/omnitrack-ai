import { NextRequest, NextResponse } from 'next/server';

// Demo data for scenario simulation
const generateScenarioResults = (parameters: any) => {
  const { scenarioType, severity, duration } = parameters;
  
  // Simulate different scenario outcomes based on parameters
  const baseImpact = severity === 'high' ? 0.8 : severity === 'medium' ? 0.5 : 0.2;
  const durationMultiplier = duration > 30 ? 1.5 : duration > 14 ? 1.2 : 1.0;
  
  const costImpact = Math.round(baseImpact * durationMultiplier * 2500000);
  const delayDays = Math.round(baseImpact * durationMultiplier * 7);
  const affectedOrders = Math.round(baseImpact * durationMultiplier * 1500);
  
  return {
    scenarioId: `scenario_${Date.now()}`,
    status: 'COMPLETED',
    progress: 100,
    summary: `The ${scenarioType.replace(/_/g, ' ')} scenario with ${severity} severity over ${duration} days would result in an estimated cost impact of $${costImpact.toLocaleString()}, affecting approximately ${affectedOrders.toLocaleString()} orders with an average delivery delay of ${delayDays} days. Our AI agents have analyzed multiple mitigation strategies to minimize the impact.`,
    impacts: {
      cost: {
        value: costImpact,
        currency: 'USD',
        breakdown: {
          direct: Math.round(costImpact * 0.4),
          indirect: Math.round(costImpact * 0.35),
          opportunity: Math.round(costImpact * 0.25)
        }
      },
      deliveryTime: {
        delayDays: delayDays,
        affectedOrders: affectedOrders,
        criticalOrders: Math.round(affectedOrders * 0.3)
      },
      inventory: {
        shortfall: Math.round(baseImpact * durationMultiplier * 5000),
        excessStock: Math.round(baseImpact * durationMultiplier * 2000),
        affectedSKUs: Math.round(baseImpact * durationMultiplier * 45)
      },
      sustainability: {
        carbonFootprint: Math.round(baseImpact * durationMultiplier * 15000),
        emissionsIncrease: baseImpact * durationMultiplier * 12
      }
    },
    strategies: [
      {
        id: 'strategy-1',
        title: 'Alternative Supplier Activation',
        description: 'Activate pre-qualified backup suppliers to maintain supply continuity',
        confidence: 0.85,
        impact: {
          costReduction: Math.round(costImpact * 0.45),
          timeReduction: Math.round(delayDays * 0.6),
          riskReduction: 0.7
        }
      },
      {
        id: 'strategy-2',
        title: 'Expedited Shipping Routes',
        description: 'Use air freight and express shipping to reduce delivery delays',
        confidence: 0.78,
        impact: {
          costReduction: Math.round(costImpact * 0.3),
          timeReduction: Math.round(delayDays * 0.8),
          riskReduction: 0.5
        }
      },
      {
        id: 'strategy-3',
        title: 'Inventory Buffer Increase',
        description: 'Temporarily increase safety stock levels for critical SKUs',
        confidence: 0.72,
        impact: {
          costReduction: Math.round(costImpact * 0.25),
          timeReduction: Math.round(delayDays * 0.4),
          riskReduction: 0.6
        }
      }
    ],
    decisionTree: {
      id: 'root',
      label: 'Scenario Analysis',
      value: scenarioType.replace(/_/g, ' '),
      confidence: 0.87,
      children: [
        {
          id: 'impact',
          label: 'Impact Assessment',
          value: `${severity} severity`,
          confidence: 0.92,
          children: [
            {
              id: 'cost',
              label: 'Cost Impact',
              value: `$${costImpact.toLocaleString()}`,
              confidence: 0.85
            },
            {
              id: 'time',
              label: 'Time Impact',
              value: `${delayDays} days delay`,
              confidence: 0.88
            }
          ]
        },
        {
          id: 'mitigation',
          label: 'Mitigation Options',
          confidence: 0.83,
          children: [
            {
              id: 'supplier',
              label: 'Alternative Suppliers',
              value: 'Recommended',
              confidence: 0.85
            },
            {
              id: 'shipping',
              label: 'Expedited Shipping',
              value: 'High Cost',
              confidence: 0.78
            }
          ]
        }
      ]
    },
    executionTime: 1500 + Math.random() * 1000,
    createdAt: new Date().toISOString(),
    parameters
  };
};

const generateTimeline = (scenarioType: string, duration: number) => {
  const events = [];
  
  // Initial impact
  events.push({
    day: 0,
    event: `${scenarioType} disruption begins`,
    impact: 'high',
    description: 'Initial disruption detected in supply chain'
  });
  
  // Escalation phase
  if (duration > 7) {
    events.push({
      day: Math.round(duration * 0.2),
      event: 'Impact escalation',
      impact: 'critical',
      description: 'Disruption spreads to downstream suppliers'
    });
  }
  
  // Mitigation phase
  events.push({
    day: Math.round(duration * 0.4),
    event: 'Mitigation strategies activated',
    impact: 'medium',
    description: 'Alternative suppliers and routes activated'
  });
  
  // Recovery phase
  events.push({
    day: Math.round(duration * 0.7),
    event: 'Recovery begins',
    impact: 'low',
    description: 'Supply chain stability improving'
  });
  
  // Resolution
  events.push({
    day: duration,
    event: 'Full recovery',
    impact: 'none',
    description: 'Supply chain operations normalized'
  });
  
  return events;
};

export async function POST(request: NextRequest) {
  try {
    const parameters = await request.json();
    
    // Validate required parameters
    if (!parameters.scenarioType) {
      return NextResponse.json(
        { error: 'Scenario type is required' },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const results = generateScenarioResults(parameters);
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Scenario simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to run scenario simulation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available scenario types
  return NextResponse.json({
    scenarioTypes: [
      {
        id: 'supplier_disruption',
        name: 'Supplier Disruption',
        description: 'Major supplier becomes unavailable',
        category: 'supply'
      },
      {
        id: 'transportation_delay',
        name: 'Transportation Delay',
        description: 'Shipping routes experience significant delays',
        category: 'logistics'
      },
      {
        id: 'demand_surge',
        name: 'Demand Surge',
        description: 'Unexpected increase in product demand',
        category: 'demand'
      },
      {
        id: 'natural_disaster',
        name: 'Natural Disaster',
        description: 'Weather or geological event impacts operations',
        category: 'external'
      },
      {
        id: 'cyber_attack',
        name: 'Cyber Attack',
        description: 'IT systems compromised affecting operations',
        category: 'security'
      },
      {
        id: 'quality_issue',
        name: 'Quality Issue',
        description: 'Product quality problems require recalls',
        category: 'quality'
      }
    ]
  });
}
