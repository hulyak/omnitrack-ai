'use client';

import { useEffect, useState } from 'react';
import { useScenarioResults } from '@/lib/api/hooks';
import type { ScenarioResult } from '@/types/dashboard';

interface SimulationProgressProps {
  scenarioId: string;
  onComplete: (result: ScenarioResult) => void;
}

export function SimulationProgress({ scenarioId, onComplete }: SimulationProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: result, error } = useScenarioResults(scenarioId, {
    refreshInterval: 1000, // Poll every second
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const scenarioResult = result as ScenarioResult | undefined;
    if (
      scenarioResult &&
      (scenarioResult.status === 'COMPLETED' || scenarioResult.status === 'FAILED')
    ) {
      onComplete(scenarioResult);
    }
  }, [result, onComplete]);

  const progress = (result as ScenarioResult | undefined)?.progress || 0;
  const status = (result as ScenarioResult | undefined)?.status || 'PENDING';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Simulation in Progress</h2>
        <p className="text-sm text-gray-600">Analyzing scenario and generating predictions...</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status === 'RUNNING' ? 'Running' : 'Initializing'}
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="space-y-3 mb-6">
        <StatusItem
          label="Info Agent"
          status={progress > 10 ? 'complete' : progress > 0 ? 'active' : 'pending'}
        />
        <StatusItem
          label="Scenario Agent"
          status={progress > 30 ? 'complete' : progress > 10 ? 'active' : 'pending'}
        />
        <StatusItem
          label="Impact Agent"
          status={progress > 60 ? 'complete' : progress > 30 ? 'active' : 'pending'}
        />
        <StatusItem
          label="Strategy Agent"
          status={progress > 90 ? 'complete' : progress > 60 ? 'active' : 'pending'}
        />
      </div>

      {/* Elapsed time */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
        <span>Elapsed time:</span>
        <span className="font-mono">{formatTime(elapsedTime)}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Failed to fetch simulation status. Retrying...</p>
        </div>
      )}

      {/* Animated spinner */}
      <div className="mt-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

interface StatusItemProps {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

function StatusItem({ label, status }: StatusItemProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        {status === 'complete' && (
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        {status === 'active' && (
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
          </div>
        )}
        {status === 'pending' && (
          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
          </div>
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          status === 'complete'
            ? 'text-green-700'
            : status === 'active'
              ? 'text-blue-700'
              : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
