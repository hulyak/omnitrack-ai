'use client';

/**
 * Demo Section Component
 * Interactive demo showcase with live examples
 */

import { useState } from 'react';

interface AlertData {
  severity: string;
  location: string;
  issue: string;
  impact: string;
  recommendation: string;
}

interface SimulationData {
  scenario: string;
  probability: number;
  impact: string;
  timeToResolve: string;
  alternatives: number;
}

interface StrategyData {
  agents: string[];
  strategies: number;
  recommended: string;
  costImpact: string;
  riskReduction: string;
  sustainability: string;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  demo: {
    type: 'alert' | 'simulation' | 'strategy';
    data: AlertData | SimulationData | StrategyData;
  };
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'disruption',
    title: 'Disruption Detection',
    description: 'Real-time anomaly detection across your supply chain',
    demo: {
      type: 'alert',
      data: {
        severity: 'high',
        location: 'Shanghai Port',
        issue: 'Typhoon approaching - 72hr delay expected',
        impact: '15 shipments affected',
        recommendation: 'Reroute via Singapore',
      } as AlertData,
    },
  },
  {
    id: 'simulation',
    title: 'Scenario Simulation',
    description: 'Test "what-if" scenarios in seconds',
    demo: {
      type: 'simulation',
      data: {
        scenario: 'Supplier Bankruptcy',
        probability: 0.23,
        impact: '$2.4M revenue at risk',
        timeToResolve: '45 days',
        alternatives: 3,
      } as SimulationData,
    },
  },
  {
    id: 'strategy',
    title: 'AI Strategy Generation',
    description: 'Multi-agent negotiation for optimal solutions',
    demo: {
      type: 'strategy',
      data: {
        agents: ['Info Agent', 'Impact Agent', 'Strategy Agent'],
        strategies: 5,
        recommended: 'Dual-source with safety stock',
        costImpact: '+12%',
        riskReduction: '-67%',
        sustainability: '+5% carbon',
      } as StrategyData,
    },
  },
];

export function DemoSection() {
  const [activeDemo, setActiveDemo] = useState(demoScenarios[0]);

  return (
    <div className="py-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Experience how OmniTrack AI transforms supply chain management
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo Selector */}
          <div className="space-y-4">
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveDemo(scenario)}
                className={`w-full text-left p-6 rounded-xl transition-all duration-300 ${
                  activeDemo.id === scenario.id
                    ? 'bg-blue-600 shadow-xl scale-105'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  {scenario.title}
                </h3>
                <p className="text-slate-300">
                  {scenario.description}
                </p>
              </button>
            ))}
          </div>

          {/* Demo Display */}
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
            {activeDemo.demo.type === 'alert' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-semibold uppercase text-sm">
                    {(activeDemo.demo.data as AlertData).severity} Priority Alert
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Location</div>
                    <div className="text-white font-semibold">{(activeDemo.demo.data as AlertData).location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Issue</div>
                    <div className="text-white">{(activeDemo.demo.data as AlertData).issue}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Impact</div>
                    <div className="text-orange-400 font-semibold">{(activeDemo.demo.data as AlertData).impact}</div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-2">AI Recommendation</div>
                    <div className="flex items-center gap-2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(activeDemo.demo.data as AlertData).recommendation}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo.demo.type === 'simulation' && (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-white mb-6">
                  {(activeDemo.demo.data as SimulationData).scenario}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Probability</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {((activeDemo.demo.data as SimulationData).probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Impact</div>
                    <div className="text-2xl font-bold text-red-400">
                      {(activeDemo.demo.data as SimulationData).impact}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Time to Resolve</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(activeDemo.demo.data as SimulationData).timeToResolve}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Alternatives</div>
                    <div className="text-2xl font-bold text-green-400">
                      {(activeDemo.demo.data as SimulationData).alternatives}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo.demo.type === 'strategy' && (
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-slate-400 mb-3">Active Agents</div>
                  <div className="flex gap-2">
                    {(activeDemo.demo.data as StrategyData).agents.map((agent, i) => (
                      <div key={i} className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                        {agent}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-2">Recommended Strategy</div>
                  <div className="text-xl font-bold text-white mb-4">
                    {(activeDemo.demo.data as StrategyData).recommended}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Cost</div>
                    <div className="text-lg font-bold text-orange-400">
                      {(activeDemo.demo.data as StrategyData).costImpact}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Risk</div>
                    <div className="text-lg font-bold text-green-400">
                      {(activeDemo.demo.data as StrategyData).riskReduction}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Carbon</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {(activeDemo.demo.data as StrategyData).sustainability}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
