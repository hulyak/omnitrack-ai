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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header with Navigation - Matching Dashboard */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Scenario Simulation
              </h1>
              <p className="text-sm text-slate-400 font-medium">AI-powered predictive modeling</p>
            </div>
            {simulationState === 'completed' && (
              <div className="flex items-center gap-2 text-green-400 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            )}
          </div>
          {/* Navigation Bar */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a href="/scenarios" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 text-sm font-medium">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Scenarios
            </a>
            <a href="/explainability" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
            <div className="p-6 border-b border-slate-800/50">
              <h2 className="text-xl font-bold text-white mb-2">Simulation Parameters</h2>
              <p className="text-slate-400 text-sm">
                Configure the scenario parameters to simulate different disruption events
              </p>
            </div>
            <div className="p-6">
              <SimpleScenarioForm 
                onSubmit={handleRunSimulation}
                disabled={simulationState === 'running'}
                scenarioTypes={scenarioTypes}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
            <div className="p-6 border-b border-slate-800/50">
              <h2 className="text-xl font-bold text-white mb-2">Simulation Status</h2>
              <p className="text-slate-400 text-sm">
                Monitor the progress of your scenario simulation
              </p>
            </div>
            <div className="p-6">
              {simulationState === 'running' && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
                  <p className="text-white font-bold text-lg">Running Simulation...</p>
                  <p className="text-slate-400 mt-2">Analyzing scenario parameters with AI agents</p>
                </div>
              )}
              {simulationState === 'completed' && results && (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <p className="text-white font-bold text-lg">Simulation Complete!</p>
                  <p className="text-slate-400 mt-2">View detailed results below</p>
                </div>
              )}
              {simulationState === 'error' && (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 font-bold text-lg">Simulation Failed</p>
                  <p className="text-slate-400 mt-2">
                    {error || 'Please check your parameters and try again'}
                  </p>
                </div>
              )}
              {simulationState === 'idle' && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-20 w-20 mb-6 text-slate-600"
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
                  <p className="font-bold text-white text-lg">Ready to Simulate</p>
                  <p className="text-slate-400 mt-2">Configure parameters and run simulation to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {simulationState === 'completed' && results && (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
            <div className="p-6 border-b border-slate-800/50">
              <h2 className="text-xl font-bold text-white mb-2">Detailed Results</h2>
              <p className="text-slate-400 text-sm">
                Comprehensive analysis of the scenario impact and recommendations
              </p>
            </div>
            <div className="p-6">
              <SimulationResults result={results as any} onReset={() => setSimulationState('idle')} />
            </div>
          </div>
        )}
      </main>

      {/* Background decoration - matching dashboard */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
