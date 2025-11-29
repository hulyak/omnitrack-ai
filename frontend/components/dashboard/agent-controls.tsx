'use client';

import { useState } from 'react';

interface AgentControlsProps {
  onAgentAction: (agent: string, action: string, params?: any) => Promise<void>;
}

export function AgentControls({ onAgentAction }: AgentControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState('port-closure');

  const scenarios = [
    { value: 'port-closure', label: 'Port Closure' },
    { value: 'supplier-disruption', label: 'Supplier Disruption' },
    { value: 'demand-spike', label: 'Demand Spike' },
    { value: 'weather-event', label: 'Weather Event' },
  ];

  const handleAgentAction = async (agent: string, action: string, params?: any) => {
    setLoading(agent);
    try {
      await onAgentAction(agent, action, params);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        AI Agent Controls
      </h2>
      
      <div className="space-y-3">
        {/* Info Agent */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium text-text-primary dark:text-zinc-200">Info Agent</h3>
              <p className="text-xs text-text-tertiary dark:text-zinc-500">Scan supply chain for anomalies</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <button
            onClick={() => handleAgentAction('info', 'scan')}
            disabled={loading === 'info'}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'info' ? 'Scanning...' : '🔍 Scan for Anomalies'}
          </button>
        </div>

        {/* Scenario Agent */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium text-text-primary dark:text-zinc-200">Scenario Agent</h3>
              <p className="text-xs text-text-tertiary dark:text-zinc-500">Simulate disruption scenarios</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full mt-2 bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-text-primary dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {scenario.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAgentAction('scenario', 'simulate', { scenario: selectedScenario })}
            disabled={loading === 'scenario'}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'scenario' ? 'Simulating...' : '🎯 Run Simulation'}
          </button>
        </div>

        {/* Strategy Agent */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium text-text-primary dark:text-zinc-200">Strategy Agent</h3>
              <p className="text-xs text-text-tertiary dark:text-zinc-500">Generate mitigation strategies</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <button
            onClick={() => handleAgentAction('strategy', 'generate')}
            disabled={loading === 'strategy'}
            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'strategy' ? 'Generating...' : '🛡️ Generate Mitigation Plan'}
          </button>
        </div>

        {/* Impact Agent */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium text-text-primary dark:text-zinc-200">Impact Agent</h3>
              <p className="text-xs text-text-tertiary dark:text-zinc-500">Calculate ESG impact</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <button
            onClick={() => handleAgentAction('impact', 'calculate')}
            disabled={loading === 'impact'}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'impact' ? 'Calculating...' : '🌱 Calculate ESG Impact'}
          </button>
        </div>
      </div>
    </div>
  );
}
