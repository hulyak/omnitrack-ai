'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface ScenarioType {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface SimpleScenarioFormProps {
  onSubmit: (parameters: any) => void;
  disabled?: boolean;
  scenarioTypes?: ScenarioType[];
}

export function SimpleScenarioForm({ onSubmit, disabled = false, scenarioTypes = [] }: SimpleScenarioFormProps) {
  const [parameters, setParameters] = useState({
    scenarioType: '',
    severity: 'medium',
    duration: 14,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parameters);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const selectedScenarioType = scenarioTypes.find(type => type.id === parameters.scenarioType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="scenarioType" className="text-white font-medium">Scenario Type</Label>
        <Select 
          value={parameters.scenarioType} 
          onValueChange={(value: string) => setParameters(prev => ({ ...prev, scenarioType: value }))}
          disabled={disabled}
        >
          <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white [&>span]:text-white">
            <SelectValue placeholder="Select a scenario type" className="text-white" />
          </SelectTrigger>
          <SelectContent>
            {scenarioTypes.map((type) => (
              <SelectItem key={type.id} value={type.id} className="text-slate-900">
                <div className="flex items-center gap-2">
                  <span>{type.name}</span>
                  <Badge variant="outline" className="text-xs border-slate-400 text-slate-700">
                    {type.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedScenarioType && (
          <p className="text-sm text-slate-300">
            {selectedScenarioType.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="severity" className="text-white font-medium">Severity Level</Label>
        <div className="grid grid-cols-3 gap-2">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setParameters(prev => ({ ...prev, severity: level }))}
              disabled={disabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                parameters.severity === level
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/50 text-slate-200 border border-slate-600 hover:bg-slate-700/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        <Badge className={`${getSeverityColor(parameters.severity)} border`}>
          {parameters.severity.toUpperCase()} SEVERITY
        </Badge>
      </div>

      <div className="space-y-2">
        <Label className="text-white font-medium">Duration: {parameters.duration} days</Label>
        <Slider
          value={[parameters.duration]}
          onValueChange={(value: number[]) => setParameters(prev => ({ ...prev, duration: value[0] }))}
          max={90}
          min={1}
          step={1}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-slate-300 font-medium">
          <span>1 day</span>
          <span>90 days</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white font-medium">Additional Notes</Label>
        <textarea
          id="description"
          placeholder="Describe any specific conditions or assumptions for this scenario..."
          value={parameters.description}
          onChange={(e) => setParameters(prev => ({ ...prev, description: e.target.value }))}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-white placeholder:text-slate-400 disabled:bg-slate-900/50 disabled:cursor-not-allowed"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
        disabled={disabled || !parameters.scenarioType}
      >
        {disabled ? 'Running Simulation...' : 'Run Simulation'}
      </Button>
    </form>
  );
}
