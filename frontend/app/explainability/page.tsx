'use client';

import { useState } from 'react';
import { ExplainabilityPanel } from '@/components/explainability';
import type { ExplainabilityData } from '@/types/explainability';

// Sample data for demonstration
const sampleExplainabilityData: ExplainabilityData = {
  summary: `The AI analysis indicates a HIGH risk disruption scenario affecting your Southeast Asia supply chain network. The primary concern is a potential 14-day delay in semiconductor shipments from Taiwan due to typhoon season weather patterns.

Our multi-agent analysis reveals that this disruption would cascade through your manufacturing operations, affecting approximately 2,400 customer orders with a total estimated impact of $3.2M in direct costs and $1.8M in opportunity costs.

The Strategy Agent has identified three viable mitigation approaches, with the recommended strategy being a hybrid approach combining expedited air freight for critical components with temporary sourcing from alternative suppliers in South Korea. This strategy balances cost efficiency (reducing impact by 65%) with timeline recovery (reducing delays to 4 days average).`,

  decisionTree: {
    id: 'root',
    label: 'Supply Chain Risk Assessment',
    confidence: 0.87,
    agent: 'Info Agent',
    children: [
      {
        id: 'weather',
        label: 'Weather Pattern Analysis',
        value: 'Typhoon Risk: High',
        confidence: 0.92,
        agent: 'Info Agent',
        description: 'Historical weather data indicates 78% probability of severe weather',
        children: [
          {
            id: 'impact-timeline',
            label: 'Timeline Impact',
            value: '14 days delay',
            confidence: 0.85,
            agent: 'Impact Agent',
            description: 'Based on historical disruption patterns',
          },
          {
            id: 'impact-cost',
            label: 'Cost Impact',
            value: '$5.0M total',
            confidence: 0.81,
            agent: 'Impact Agent',
            description: 'Direct + indirect + opportunity costs',
          },
        ],
      },
      {
        id: 'alternatives',
        label: 'Alternative Sourcing',
        confidence: 0.79,
        agent: 'Scenario Agent',
        children: [
          {
            id: 'strategy-hybrid',
            label: 'Hybrid Strategy',
            value: 'Recommended',
            confidence: 0.88,
            agent: 'Strategy Agent',
            description: 'Air freight + alternative suppliers',
          },
          {
            id: 'strategy-air',
            label: 'Full Air Freight',
            value: 'High Cost',
            confidence: 0.76,
            agent: 'Strategy Agent',
            description: 'Fastest but most expensive option',
          },
          {
            id: 'strategy-wait',
            label: 'Wait & Monitor',
            value: 'High Risk',
            confidence: 0.65,
            agent: 'Strategy Agent',
            description: 'Lowest cost but highest risk',
          },
        ],
      },
    ],
  },

  agentContributions: [
    {
      agentId: 'info-001',
      agentName: 'Info Agent',
      role: 'Data Aggregation & Analysis',
      confidence: 0.92,
      insights: [
        'Identified weather pattern anomalies in Taiwan region',
        'Correlated historical typhoon data with supply chain disruptions',
        'Aggregated real-time IoT sensor data from shipping routes',
        'Synthesized ERP inventory levels across all warehouses',
      ],
      dataSourcesUsed: ['IoT Sensors', 'Weather APIs', 'ERP System', 'Historical Data'],
    },
    {
      agentId: 'scenario-001',
      agentName: 'Scenario Agent',
      role: 'Disruption Scenario Generation',
      confidence: 0.85,
      insights: [
        'Generated 12 alternative scenario variations',
        'Identified critical path dependencies in supply network',
        'Modeled cascading effects across manufacturing operations',
      ],
      dataSourcesUsed: ['ML Models', 'Historical Patterns', 'Network Topology'],
    },
    {
      agentId: 'impact-001',
      agentName: 'Impact Agent',
      role: 'Impact Prediction & Analysis',
      confidence: 0.83,
      insights: [
        'Calculated financial impact using Monte Carlo simulation',
        'Predicted delivery delays for 2,400 affected orders',
        'Assessed inventory shortfall across 47 SKUs',
        'Quantified opportunity cost from lost sales',
      ],
      dataSourcesUsed: ['Financial Models', 'Order Database', 'Inventory System'],
    },
    {
      agentId: 'strategy-001',
      agentName: 'Strategy Agent',
      role: 'Mitigation Strategy Optimization',
      confidence: 0.88,
      insights: [
        'Evaluated 8 potential mitigation strategies',
        'Optimized for cost, time, and risk reduction',
        'Identified alternative suppliers with capacity',
        'Calculated ROI for each strategy option',
      ],
      dataSourcesUsed: ['Supplier Database', 'Logistics APIs', 'Cost Models'],
    },
    {
      agentId: 'sustainability-001',
      agentName: 'Sustainability Service',
      role: 'Environmental Impact Assessment',
      confidence: 0.79,
      insights: [
        'Calculated carbon footprint increase from air freight',
        'Identified lower-emission alternative routes',
        'Assessed sustainability trade-offs for each strategy',
      ],
      dataSourcesUsed: ['Emission Factors', 'Route Data', 'Transportation Modes'],
    },
  ],

  uncertaintyRanges: {
    costImpact: {
      bestCase: 3200000,
      expected: 5000000,
      worstCase: 7800000,
      confidence: 0.81,
      assumptions: 'Based on historical disruption costs and current market conditions',
    },
    deliveryDelay: {
      bestCase: 7,
      expected: 14,
      worstCase: 21,
      confidence: 0.85,
      assumptions: 'Assumes normal recovery patterns and no secondary disruptions',
    },
    affectedOrders: {
      bestCase: 1800,
      expected: 2400,
      worstCase: 3200,
      confidence: 0.88,
      assumptions: 'Based on current order pipeline and dependency analysis',
    },
    mitigationEffectiveness: {
      bestCase: 0.75,
      expected: 0.65,
      worstCase: 0.45,
      confidence: 0.76,
      assumptions: 'Depends on supplier availability and logistics execution',
    },
  },

  overallConfidence: 0.87,

  technicalTerms: {
    'Monte Carlo simulation':
      'A computational technique that uses repeated random sampling to obtain numerical results, used here to model the range of possible outcomes.',
    'cascading effects':
      'Secondary impacts that occur when a disruption in one part of the supply chain triggers problems in connected parts.',
    'opportunity cost':
      'The potential revenue lost from being unable to fulfill customer orders due to supply chain disruptions.',
    'critical path':
      'The sequence of dependent activities that determines the minimum time needed to complete a project or process.',
  },

  timestamp: new Date().toISOString(),
};

export default function ExplainabilityPage() {
  const [data] = useState<ExplainabilityData>(sampleExplainabilityData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AI Explainability Demo</h1>
          <p className="mt-2 text-lg text-slate-600">
            Explore how the AI reached its recommendations for supply chain disruption scenarios
          </p>
        </div>

        {/* Scenario Context */}
        <div className="mb-6 bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Scenario Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Disruption Type</p>
              <p className="text-lg font-semibold text-slate-900">Weather Event</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Location</p>
              <p className="text-lg font-semibold text-slate-900">Taiwan, Southeast Asia</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Severity</p>
              <p className="text-lg font-semibold text-red-600">HIGH</p>
            </div>
          </div>
        </div>

        {/* Explainability Panel */}
        <ExplainabilityPanel data={data} />

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg shadow-md p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">About This Demo</h3>
              <p className="text-sm text-slate-700">
                This page demonstrates the explainability components built for the OmniTrack AI
                platform. In production, this data would be generated by the backend AI agents based
                on real supply chain scenarios. The components provide transparency into AI
                decision-making through natural language summaries, interactive decision trees,
                agent attribution, and uncertainty analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
