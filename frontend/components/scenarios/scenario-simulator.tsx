'use client';

import { useState } from 'react';
import { ScenarioParameterForm } from './scenario-parameter-form';
import { SimulationProgress } from './simulation-progress';
import { SimulationResults } from './simulation-results';
import type { ScenarioParameters, ScenarioResult } from '@/types/dashboard';

export function ScenarioSimulator() {
  const [activeScenario, setActiveScenario] = useState<ScenarioResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulationStart = (scenarioResult: ScenarioResult) => {
    setActiveScenario(scenarioResult);
    setIsSimulating(true);
  };

  const handleSimulationComplete = (result: ScenarioResult) => {
    setActiveScenario(result);
    setIsSimulating(false);
  };

  const handleReset = () => {
    setActiveScenario(null);
    setIsSimulating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scenario Simulator</h1>
        <p className="mt-2 text-gray-600">
          Simulate supply chain disruptions and analyze potential impacts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Parameter form */}
        <div className="lg:col-span-1">
          <ScenarioParameterForm
            onSimulationStart={handleSimulationStart}
            disabled={isSimulating}
          />
        </div>

        {/* Right column: Progress and results */}
        <div className="lg:col-span-2">
          {isSimulating && activeScenario && (
            <SimulationProgress
              scenarioId={activeScenario.scenarioId}
              onComplete={handleSimulationComplete}
            />
          )}

          {!isSimulating && activeScenario?.status === 'COMPLETED' && (
            <SimulationResults result={activeScenario} onReset={handleReset} />
          )}

          {!isSimulating && !activeScenario && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-24 w-24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Simulation Running</h3>
              <p className="text-gray-600">
                Configure parameters and start a simulation to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
