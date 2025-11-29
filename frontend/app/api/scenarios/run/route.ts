import { NextRequest, NextResponse } from 'next/server';

// Demo data for scenario simulation
const generateScenarioResults = (parameters: any) => {
  const { scenarioType, severity, duration, affectedNodes } = parameters;
  
  // Simulate different scenario outcomes based on parameters
  const baseImpact = severity === 'high' ? 0.8 : severity === 'medium' ? 0.5 : 0.2;
  const durationMultiplier = duration > 30 ? 1.5 : duration > 14 ? 1.2 : 1.0;
  
  return {
    scenarioId: `scenario_${Date.now()}`,
    status: 'completed',
    results: {
      overallImpact: Math.min(baseImpact * durationMultiplier, 1.0),
      affectedNodes: affectedNodes || ['shanghai', 'singapore'],
      metrics: {
        revenueImpact: {
          amount: Math.round(baseImpact * durationMultiplier * 2500000),
          currency: 'USD',
          percentage: Math.round(baseImpact * durationMultiplier * 15)
        },
        deliveryDelay: {
          averageDays: Math.round(baseImpact * durationMultiplier * 7),
          maxDays: Math.round(baseImpact * durationMultiplier * 14)
        },
        customerSatisfaction: {
          score: Math.max(85 - (baseImpact * durationMultiplier * 30), 40),
          change: -Math.round(baseImpact * durationMultiplier * 30)
        }
      },
      mitigationStrategies: [
        {
          strategy: 'Alternative Supplier Activation',
          effectiveness: Math.random() * 0.4 + 0.6,
          cost: Math.round(Math.random() * 500000 + 100000),
          timeToImplement: Math.round(Math.random() * 7 + 3)
        },
        {
          strategy: 'Inventory Buffer Increase',
          effectiveness: Math.random() * 0.3 + 0.5,
          cost: Math.round(Math.random() * 300000 + 50000),
          timeToImplement: Math.round(Math.random() * 3 + 1)
        },
        {
          strategy: 'Route Optimization',
          effectiveness: Math.random() * 0.5 + 0.4,
          cost: Math.round(Math.random() * 100000 + 20000),
          timeToImplement: Math.round(Math.random() * 5 + 2)
        }
      ],
      timeline: generateTimeline(scenarioType, duration),
      confidence: Math.random() * 0.2 + 0.8
    },
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
