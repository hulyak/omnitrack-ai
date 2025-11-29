import { NextRequest, NextResponse } from 'next/server';

// Demo data for explainability analysis
const generateExplainabilityData = (agentDecision: any) => {
  const { agentType, decision, context } = agentDecision;
  
  // Generate decision tree based on agent type
  const decisionTree = generateDecisionTree(agentType, decision);
  
  // Generate confidence scores
  const confidence = {
    overall: Math.random() * 0.3 + 0.7, // 70-100%
    factors: {
      dataQuality: Math.random() * 0.2 + 0.8,
      modelAccuracy: Math.random() * 0.15 + 0.85,
      contextRelevance: Math.random() * 0.25 + 0.75,
      historicalPerformance: Math.random() * 0.2 + 0.8
    }
  };
  
  // Generate feature importance
  const featureImportance = generateFeatureImportance(agentType);
  
  // Generate natural language explanation
  const explanation = generateNaturalLanguageExplanation(agentType, decision, confidence.overall);
  
  return {
    analysisId: `analysis_${Date.now()}`,
    agentType,
    decision,
    confidence,
    decisionTree,
    featureImportance,
    explanation,
    alternatives: generateAlternatives(agentType, decision),
    riskFactors: generateRiskFactors(agentType),
    createdAt: new Date().toISOString()
  };
};

const generateDecisionTree = (agentType: string, decision: any) => {
  const baseNodes = {
    info: [
      {
        id: 'root',
        type: 'condition',
        label: 'Anomaly Detected?',
        condition: 'temperature > threshold',
        children: ['high_temp', 'normal_temp']
      },
      {
        id: 'high_temp',
        type: 'condition',
        label: 'Severity Level?',
        condition: 'deviation > 2σ',
        children: ['critical', 'warning']
      },
      {
        id: 'critical',
        type: 'action',
        label: 'Alert: Critical Temperature',
        action: 'immediate_action_required',
        confidence: 0.95
      },
      {
        id: 'warning',
        type: 'action',
        label: 'Alert: Temperature Warning',
        action: 'monitor_closely',
        confidence: 0.87
      },
      {
        id: 'normal_temp',
        type: 'action',
        label: 'Status: Normal',
        action: 'continue_monitoring',
        confidence: 0.92
      }
    ],
    scenario: [
      {
        id: 'root',
        type: 'condition',
        label: 'Disruption Type?',
        condition: 'scenario_category',
        children: ['supply_risk', 'demand_risk', 'logistics_risk']
      },
      {
        id: 'supply_risk',
        type: 'condition',
        label: 'Supplier Criticality?',
        condition: 'supplier_importance > 0.7',
        children: ['critical_supplier', 'standard_supplier']
      },
      {
        id: 'critical_supplier',
        type: 'action',
        label: 'High Impact Scenario',
        action: 'activate_contingency_plan',
        confidence: 0.89
      }
    ],
    strategy: [
      {
        id: 'root',
        type: 'condition',
        label: 'Risk Level?',
        condition: 'overall_risk_score',
        children: ['high_risk', 'medium_risk', 'low_risk']
      },
      {
        id: 'high_risk',
        type: 'condition',
        label: 'Available Resources?',
        condition: 'budget_available && time_available',
        children: ['full_mitigation', 'partial_mitigation']
      },
      {
        id: 'full_mitigation',
        type: 'action',
        label: 'Comprehensive Strategy',
        action: 'implement_all_strategies',
        confidence: 0.93
      }
    ],
    impact: [
      {
        id: 'root',
        type: 'condition',
        label: 'Business Impact?',
        condition: 'revenue_impact + operational_impact',
        children: ['severe_impact', 'moderate_impact', 'minor_impact']
      },
      {
        id: 'severe_impact',
        type: 'action',
        label: 'Critical Business Impact',
        action: 'executive_escalation',
        confidence: 0.91
      }
    ]
  };
  
  return baseNodes[agentType as keyof typeof baseNodes] || baseNodes.info;
};

const generateFeatureImportance = (agentType: string) => {
  const features = {
    info: [
      { name: 'Temperature Deviation', importance: 0.35, value: '2.3σ above normal' },
      { name: 'Historical Patterns', importance: 0.28, value: 'Similar events in past 6 months' },
      { name: 'Sensor Reliability', importance: 0.22, value: '98.5% accuracy rating' },
      { name: 'Time of Day', importance: 0.15, value: 'Peak operational hours' }
    ],
    scenario: [
      { name: 'Supplier Dependency', importance: 0.42, value: '73% of supply from single source' },
      { name: 'Geographic Risk', importance: 0.31, value: 'High seismic activity region' },
      { name: 'Inventory Levels', importance: 0.18, value: '12 days safety stock' },
      { name: 'Alternative Sources', importance: 0.09, value: '2 qualified alternatives' }
    ],
    strategy: [
      { name: 'Cost-Benefit Ratio', importance: 0.38, value: '3.2:1 expected return' },
      { name: 'Implementation Speed', importance: 0.29, value: '14 days to full deployment' },
      { name: 'Risk Reduction', importance: 0.21, value: '67% risk mitigation' },
      { name: 'Resource Availability', importance: 0.12, value: '85% team capacity available' }
    ],
    impact: [
      { name: 'Revenue at Risk', importance: 0.45, value: '$2.3M potential loss' },
      { name: 'Customer Impact', importance: 0.32, value: '15,000 affected customers' },
      { name: 'Operational Disruption', importance: 0.15, value: '3 facilities affected' },
      { name: 'Reputation Risk', importance: 0.08, value: 'Medium brand impact' }
    ]
  };
  
  return features[agentType as keyof typeof features] || features.info;
};

const generateNaturalLanguageExplanation = (agentType: string, decision: any, confidence: number) => {
  const explanations = {
    info: `Based on the analysis of sensor data and historical patterns, I detected a significant temperature anomaly in the Shanghai facility. The temperature reading of 28.5°C exceeds the normal operating range by 2.3 standard deviations. Given the sensor's 98.5% reliability rating and similar incidents in the past 6 months, I'm ${Math.round(confidence * 100)}% confident this requires immediate attention.`,
    
    scenario: `The scenario analysis indicates a high-impact disruption event with ${Math.round(confidence * 100)}% confidence. The primary risk factor is our 73% dependency on a single supplier located in a seismically active region. With only 12 days of safety stock and limited alternative sources, this scenario could significantly impact our supply chain operations.`,
    
    strategy: `I recommend implementing a comprehensive mitigation strategy with ${Math.round(confidence * 100)}% confidence. The cost-benefit analysis shows a 3.2:1 expected return, and we can achieve 67% risk reduction within 14 days. Our team has 85% capacity available, making this strategy both feasible and effective.`,
    
    impact: `The business impact assessment reveals a critical situation with ${Math.round(confidence * 100)}% confidence. We're facing $2.3M in potential revenue loss affecting 15,000 customers across 3 facilities. While operational disruption is significant, the reputation risk remains manageable with proper communication strategies.`
  };
  
  return explanations[agentType as keyof typeof explanations] || explanations.info;
};

const generateAlternatives = (agentType: string, decision: any) => {
  return [
    {
      option: 'Conservative Approach',
      confidence: Math.random() * 0.2 + 0.6,
      pros: ['Lower risk', 'Proven method', 'Less resource intensive'],
      cons: ['Slower response', 'May miss opportunities', 'Limited impact']
    },
    {
      option: 'Aggressive Approach',
      confidence: Math.random() * 0.3 + 0.5,
      pros: ['Faster results', 'Maximum impact', 'Competitive advantage'],
      cons: ['Higher risk', 'Resource intensive', 'Potential overreaction']
    },
    {
      option: 'Hybrid Approach',
      confidence: Math.random() * 0.25 + 0.65,
      pros: ['Balanced risk', 'Flexible implementation', 'Scalable solution'],
      cons: ['Complex coordination', 'Moderate speed', 'Requires more planning']
    }
  ];
};

const generateRiskFactors = (agentType: string) => {
  return [
    {
      factor: 'Data Quality',
      level: 'low',
      description: 'High-quality data from reliable sources',
      mitigation: 'Continuous monitoring and validation'
    },
    {
      factor: 'Model Uncertainty',
      level: 'medium',
      description: 'Some variability in predictions',
      mitigation: 'Regular model retraining and validation'
    },
    {
      factor: 'External Factors',
      level: 'medium',
      description: 'Market conditions may change',
      mitigation: 'Scenario planning and contingencies'
    }
  ];
};

export async function POST(request: NextRequest) {
  try {
    const agentDecision = await request.json();
    
    // Validate required parameters
    if (!agentDecision.agentType) {
      return NextResponse.json(
        { error: 'Agent type is required' },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results = generateExplainabilityData(agentDecision);
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Explainability analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze decision' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available agent types for analysis
  return NextResponse.json({
    agentTypes: [
      { id: 'info', name: 'Info Agent', description: 'Data aggregation and anomaly detection' },
      { id: 'scenario', name: 'Scenario Agent', description: 'Disruption scenario generation' },
      { id: 'strategy', name: 'Strategy Agent', description: 'Mitigation strategy optimization' },
      { id: 'impact', name: 'Impact Agent', description: 'Business impact prediction' }
    ]
  });
}
