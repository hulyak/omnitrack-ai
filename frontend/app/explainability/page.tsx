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
  const [data, setData] = useState<ExplainabilityData>(sampleExplainabilityData);
  const [disruptionType, setDisruptionType] = useState('Weather Event');
  const [location, setLocation] = useState('Taiwan, Southeast Asia');
  const [severity, setSeverity] = useState('HIGH');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decisionId, setDecisionId] = useState('DEC-2026-0417-001');
  const [decisionIdError, setDecisionIdError] = useState<string | null>(null);

  const handleReanalyze = () => {
    setDecisionIdError(null);
    // Validate decision ID
    const validIds = ['DEC-2026-0417-001', 'DEC-2026-0416-002', 'DEC-2026-0415-003'];
    if (!validIds.includes(decisionId) && !decisionId.startsWith('DEC-')) {
      setDecisionIdError(`Unknown decision identifier: "${decisionId}". Please enter a valid decision ID (e.g., DEC-2026-0417-001).`);
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const severityConfidence = severity === 'HIGH' ? 0.87 : severity === 'MEDIUM' ? 0.72 : 0.58;
      const severityLabel = severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MODERATE' : 'LOW';
      const costMultiplier = severity === 'HIGH' ? 1.0 : severity === 'MEDIUM' ? 0.55 : 0.2;
      const newConfidence = parseFloat((severityConfidence + (Math.random() * 0.08 - 0.04)).toFixed(2));
      setData({
        ...sampleExplainabilityData,
        summary: `The AI analysis indicates a ${severityLabel} risk disruption scenario affecting your ${location} supply chain network. The primary concern is a ${disruptionType.toLowerCase()} disruption with ${severity.toLowerCase()} severity.\n\nOur multi-agent analysis reveals an estimated impact of $${(5.0 * costMultiplier).toFixed(1)}M in total costs. The Strategy Agent recommends a ${severity === 'HIGH' ? 'hybrid approach combining expedited air freight with alternative sourcing' : severity === 'MEDIUM' ? 'proactive monitoring with pre-positioned inventory buffers' : 'standard monitoring with existing contingency plans'}.`,
        overallConfidence: newConfidence,
        uncertaintyRanges: {
          ...sampleExplainabilityData.uncertaintyRanges,
          costImpact: {
            ...sampleExplainabilityData.uncertaintyRanges.costImpact,
            expected: Math.round(5000000 * costMultiplier),
            bestCase: Math.round(3200000 * costMultiplier),
            worstCase: Math.round(7800000 * costMultiplier),
            confidence: newConfidence,
          },
        },
        timestamp: new Date().toISOString(),
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header with Navigation - Matching Dashboard */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Explainability
            </h1>
            <p className="text-sm text-slate-400 font-medium">Transparent AI decision-making insights</p>
          </div>
          {/* Navigation Bar */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a href="/scenarios" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Scenarios
            </a>
            <a href="/explainability" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 text-sm font-medium">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Explainability
            </a>
            <a href="/sustainability" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Sustainability
            </a>
            <a href="/voice" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice
            </a>
            <a href="/ar" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              AR View
            </a>
            <a href="/marketplace" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Marketplace
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-4 border border-purple-500/50">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            Transparency & Trust
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            AI Explainability 
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Demo</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Explore how the AI reached its recommendations for supply chain disruption scenarios
          </p>
        </div>

        {/* Scenario Context - Editable */}
        <div className="mb-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 hover:border-slate-700/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Scenario Context</h2>
            <button
              onClick={handleReanalyze}
              disabled={isAnalyzing}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Re-analyze
                </>
              )}
            </button>
          </div>
          {/* Decision Identifier */}
          <div className="mb-6">
            <label className="text-sm text-slate-400 font-medium mb-2 block">Decision Identifier</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={decisionId}
                onChange={(e) => { setDecisionId(e.target.value); setDecisionIdError(null); }}
                placeholder="Enter decision ID (e.g., DEC-2026-0417-001)"
                className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
            {decisionIdError && (
              <p className="mt-2 text-sm text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg px-3 py-2">{decisionIdError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <label className="text-sm text-slate-400 font-medium mb-2 block">Disruption Type</label>
              <select
                value={disruptionType}
                onChange={(e) => setDisruptionType(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option>Weather Event</option>
                <option>Supplier Failure</option>
                <option>Transportation Delay</option>
                <option>Geopolitical Crisis</option>
                <option>Demand Surge</option>
                <option>Cyber Attack</option>
              </select>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <label className="text-sm text-slate-400 font-medium mb-2 block">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option>Taiwan, Southeast Asia</option>
                <option>Shanghai, China</option>
                <option>Germany, Europe</option>
                <option>California, USA</option>
                <option>Mumbai, India</option>
              </select>
            </div>
            <div className={`p-4 rounded-xl border ${severity === 'HIGH' ? 'bg-red-900/20 border-red-500/50' : severity === 'MEDIUM' ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
              <label className={`text-sm font-medium mb-2 block ${severity === 'HIGH' ? 'text-red-400' : severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}`}>Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* Explainability Panel */}
        <div className="mb-6">
          <ExplainabilityPanel data={data} />
        </div>

        {/* Additional Info */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-2xl backdrop-blur-sm p-6">
          <div className="flex items-start space-x-4">
            <svg
              className="w-8 h-8 text-blue-400 flex-shrink-0"
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
              <h3 className="text-lg font-bold text-white mb-2">About This Demo</h3>
              <p className="text-base text-slate-300 leading-relaxed">
                This page demonstrates the explainability components built for the OmniTrack AI
                platform. In production, this data would be generated by the backend AI agents based
                on real supply chain scenarios. The components provide transparency into AI
                decision-making through natural language summaries, interactive decision trees,
                agent attribution, and uncertainty analysis.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Background decoration - matching dashboard */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
