'use client';

/**
 * Interactive Demo Component
 * Embedded agent workflow animation showing 4 agents collaborating
 */

import { useState, useEffect } from 'react';

interface AgentStep {
  agent: string;
  action: string;
  status: 'pending' | 'active' | 'complete';
  color: string;
}

export function InteractiveDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [steps, setSteps] = useState<AgentStep[]>([
    { agent: 'Info Agent', action: 'Detecting port delay anomaly...', status: 'pending', color: 'cyan' },
    { agent: 'Scenario Agent', action: 'Running 1000 impact simulations...', status: 'pending', color: 'purple' },
    { agent: 'Strategy Agent', action: 'Generating mitigation strategies...', status: 'pending', color: 'orange' },
    { agent: 'Impact Agent', action: 'Calculating cost & carbon impact...', status: 'pending', color: 'green' },
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= steps.length) {
      // Reset after completion
      setTimeout(() => {
        setCurrentStep(0);
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })));
        setIsPlaying(false);
      }, 2000);
      return;
    }

    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step, i) => {
          if (i < currentStep) return { ...step, status: 'complete' };
          if (i === currentStep) return { ...step, status: 'active' };
          return step;
        })
      );
      setCurrentStep((prev) => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })));
  };

  const getColorClasses = (color: string, status: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
      cyan: {
        bg: status === 'active' ? 'bg-cyan-500/20' : 'bg-slate-800/50',
        border: status === 'active' ? 'border-cyan-500' : status === 'complete' ? 'border-cyan-500/50' : 'border-slate-700',
        text: 'text-cyan-400',
        glow: 'rgba(6, 182, 212, 0.3)',
      },
      purple: {
        bg: status === 'active' ? 'bg-purple-500/20' : 'bg-slate-800/50',
        border: status === 'active' ? 'border-purple-500' : status === 'complete' ? 'border-purple-500/50' : 'border-slate-700',
        text: 'text-purple-400',
        glow: 'rgba(168, 85, 247, 0.3)',
      },
      orange: {
        bg: status === 'active' ? 'bg-orange-500/20' : 'bg-slate-800/50',
        border: status === 'active' ? 'border-orange-500' : status === 'complete' ? 'border-orange-500/50' : 'border-slate-700',
        text: 'text-orange-400',
        glow: 'rgba(249, 115, 22, 0.3)',
      },
      green: {
        bg: status === 'active' ? 'bg-green-500/20' : 'bg-slate-800/50',
        border: status === 'active' ? 'border-green-500' : status === 'complete' ? 'border-green-500/50' : 'border-slate-700',
        text: 'text-green-400',
        glow: 'rgba(34, 197, 94, 0.3)',
      },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="py-20 bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Watch Agents Collaborate
          </h2>
          <p className="text-xl text-slate-400">
            See how our multi-agent system resolves a supply chain disruption in real-time
          </p>
        </div>

        {/* Demo Container */}
        <div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 shadow-2xl">
          {/* Workflow Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, i) => {
              const colors = getColorClasses(step.color, step.status);
              return (
                <div key={i} className="relative">
                  {/* Connection Line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute left-6 top-16 w-0.5 h-8 ${
                        step.status === 'complete' ? 'bg-cyan-500' : 'bg-slate-700'
                      } transition-colors duration-500`}
                    />
                  )}

                  {/* Step Card */}
                  <div
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 ${colors.bg} ${colors.border} transition-all duration-500`}
                    style={{
                      boxShadow: step.status === 'active' ? `0 0 30px ${colors.glow}` : 'none',
                    }}
                  >
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {step.status === 'complete' ? (
                        <div className={`w-12 h-12 rounded-full ${colors.text} bg-current/20 flex items-center justify-center`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : step.status === 'active' ? (
                        <div className={`w-12 h-12 rounded-full ${colors.text} bg-current/20 flex items-center justify-center`}>
                          <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className={`font-bold text-lg ${step.status === 'pending' ? 'text-slate-500' : colors.text}`}>
                        {step.agent}
                      </div>
                      <div className={`text-sm ${step.status === 'pending' ? 'text-slate-600' : 'text-slate-300'}`}>
                        {step.action}
                      </div>
                    </div>

                    {/* Pulse Animation for Active */}
                    {step.status === 'active' && (
                      <div className="absolute inset-0 rounded-xl border-2 border-current animate-ping opacity-20" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Control Button */}
          <div className="text-center">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isPlaying
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105 shadow-lg hover:shadow-cyan-500/50'
              }`}
              style={{
                boxShadow: !isPlaying ? '0 0 30px rgba(6, 182, 212, 0.3)' : 'none',
              }}
            >
              {isPlaying ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                  Running Demo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Control Live Demo
                </span>
              )}
            </button>
          </div>

          {/* Result Summary */}
          {currentStep >= steps.length && (
            <div className="mt-8 p-6 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400 font-bold text-lg">Resolution Complete</span>
              </div>
              <p className="text-slate-300">
                Optimal strategy identified: <span className="text-white font-semibold">Reroute via Singapore</span> • 
                Cost impact: <span className="text-orange-400">+8%</span> • 
                Risk reduction: <span className="text-green-400">-72%</span> • 
                Carbon: <span className="text-cyan-400">+3%</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
