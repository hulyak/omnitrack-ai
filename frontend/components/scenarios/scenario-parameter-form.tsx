'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type {
  ScenarioParameters,
  ScenarioResult,
  DisruptionType,
  SeverityLevel,
} from '@/types/dashboard';

interface ScenarioParameterFormProps {
  onSimulationStart: (result: ScenarioResult) => void;
  disabled?: boolean;
}

const DISRUPTION_TYPES: { value: DisruptionType; label: string }[] = [
  { value: 'SUPPLIER_FAILURE', label: 'Supplier Failure' },
  { value: 'TRANSPORTATION_DELAY', label: 'Transportation Delay' },
  { value: 'NATURAL_DISASTER', label: 'Natural Disaster' },
  { value: 'DEMAND_SPIKE', label: 'Demand Spike' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'GEOPOLITICAL_EVENT', label: 'Geopolitical Event' },
  { value: 'CYBER_ATTACK', label: 'Cyber Attack' },
  { value: 'LABOR_SHORTAGE', label: 'Labor Shortage' },
];

const SEVERITY_LEVELS: { value: SeverityLevel; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
];

export function ScenarioParameterForm({ onSimulationStart, disabled }: ScenarioParameterFormProps) {
  const [parameters, setParameters] = useState<ScenarioParameters>({
    disruptionType: 'SUPPLIER_FAILURE',
    location: '',
    severity: 'MEDIUM',
    duration: 7,
    includeSustainability: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!parameters.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (parameters.duration !== undefined) {
      if (parameters.duration < 1) {
        newErrors.duration = 'Duration must be at least 1 day';
      } else if (parameters.duration > 365) {
        newErrors.duration = 'Duration cannot exceed 365 days';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient.post<ScenarioResult>('/scenarios/simulate', parameters);
      onSimulationStart(result);
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setErrors({ submit: 'Failed to start simulation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestVariation = async () => {
    // Request scenario variations based on current parameters
    setIsSubmitting(true);
    try {
      const variationParams = {
        ...parameters,
        requestVariations: true,
      };
      const result = await apiClient.post<ScenarioResult>('/scenarios/simulate', variationParams);
      onSimulationStart(result);
    } catch (error) {
      console.error('Failed to request variations:', error);
      setErrors({ submit: 'Failed to request variations. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Scenario Parameters</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Disruption Type */}
        <div>
          <label htmlFor="disruptionType" className="block text-sm font-medium text-gray-700 mb-2">
            Disruption Type
          </label>
          <select
            id="disruptionType"
            value={parameters.disruptionType}
            onChange={(e) =>
              setParameters({ ...parameters, disruptionType: e.target.value as DisruptionType })
            }
            disabled={disabled || isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {DISRUPTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            value={parameters.location}
            onChange={(e) => setParameters({ ...parameters, location: e.target.value })}
            disabled={disabled || isSubmitting}
            placeholder="e.g., Shanghai, China"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setParameters({ ...parameters, severity: level.value })}
                disabled={disabled || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  parameters.severity === level.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (days)
          </label>
          <input
            type="number"
            id="duration"
            value={parameters.duration ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setParameters({
                ...parameters,
                duration: value === '' ? undefined : parseInt(value, 10),
              });
            }}
            disabled={disabled || isSubmitting}
            min="1"
            max="365"
            placeholder="Optional"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.duration ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
        </div>

        {/* Include Sustainability */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeSustainability"
            checked={parameters.includeSustainability}
            onChange={(e) =>
              setParameters({ ...parameters, includeSustainability: e.target.checked })
            }
            disabled={disabled || isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
          />
          <label htmlFor="includeSustainability" className="ml-2 block text-sm text-gray-700">
            Include sustainability impact analysis
          </label>
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Starting Simulation...' : 'Run Simulation'}
          </button>

          <button
            type="button"
            onClick={handleRequestVariation}
            disabled={disabled || isSubmitting || !parameters.location.trim()}
            className="w-full px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Request Variations
          </button>
        </div>
      </form>
    </div>
  );
}
