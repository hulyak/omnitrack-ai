'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleScenarioForm } from '@/components/scenarios/simple-scenario-form';
import { SimulationProgress } from '@/components/scenarios/simulation-progress';
import { SimulationResults } from '@/components/scenarios/simulation-results';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

type SimulationState = 'idle' | 'running' | 'completed' | 'error';

interface ScenarioType {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function ScenariosPage() {
  const [simulationState, setSimulationState] = useState<SimulationState>('idle');
  const [results, setResults] = useState(null);
  const [scenarioTypes, setScenarioTypes] = useState<ScenarioType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load available scenario types
  useEffect(() => {
    const loadScenarioTypes = async () => {
      try {
        const response = await fetch('/api/scenarios/run');
        const data = await response.json();
        setScenarioTypes(data.scenarioTypes || []);
      } catch (error) {
        console.error('Failed to load scenario types:', error);
      }
    };
    
    loadScenarioTypes();
  }, []);

  const handleRunSimulation = async (parameters: any) => {
    setSimulationState('running');
    setResults(null);
    setError(null);

    try {
      const response = await fetch('/api/scenarios/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        throw new Error('Failed to run simulation');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setSimulationState('completed');
      } else {
        throw new Error(data.error || 'Simulation failed');
      }
    } catch (error) {
      console.error('Simulation failed:', error);
      setError(error instanceof Error ? error.message : 'Simulation failed');
      setSimulationState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Scenario Simulation</h1>
            <p className="text-slate-600 mt-1">
              Model supply chain disruptions and test mitigation strategies
            </p>
          </div>
          {simulationState === 'completed' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Simulation Complete</span>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <CardTitle className="text-slate-900">Simulation Parameters</CardTitle>
              <CardDescription className="text-slate-600">
                Configure the scenario parameters to simulate different disruption events
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <SimpleScenarioForm 
                onSubmit={handleRunSimulation}
                disabled={simulationState === 'running'}
                scenarioTypes={scenarioTypes}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <CardTitle className="text-slate-900">Simulation Status</CardTitle>
              <CardDescription className="text-slate-600">
                Monitor the progress of your scenario simulation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {simulationState === 'running' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-700 font-medium">Running Simulation...</p>
                  <p className="text-sm text-slate-500 mt-2">Analyzing scenario parameters</p>
                </div>
              )}
              {simulationState === 'completed' && results && (
                <SimulationResults result={results as any} onReset={() => setSimulationState('idle')} />
              )}
              {simulationState === 'error' && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Simulation Failed</p>
                  <p className="text-sm text-slate-600 mt-2">
                    {error || 'Please check your parameters and try again'}
                  </p>
                </div>
              )}
              {simulationState === 'idle' && (
                <div className="text-center py-8 text-slate-500">
                  <svg
                    className="mx-auto h-16 w-16 mb-4 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="font-medium text-slate-700">Configure parameters and run simulation to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {simulationState === 'completed' && results && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <CardTitle className="text-slate-900">Detailed Results</CardTitle>
              <CardDescription className="text-slate-600">
                Comprehensive analysis of the scenario impact and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <SimulationResults result={results as any} onReset={() => setSimulationState('idle')} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
