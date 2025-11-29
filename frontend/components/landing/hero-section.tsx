'use client';

/**
 * Hero Section Component
 * Full-screen hero with animated neural network and neon effects
 */

import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  onShowAgents: () => void;
}

interface AgentNode {
  id: number;
  x: number;
  y: number;
  type: 'info' | 'scenario' | 'strategy' | 'impact';
  active: boolean;
}

export function HeroSection({ onGetStarted, onTryDemo, onShowAgents }: HeroSectionProps) {
  const [nodes, setNodes] = useState<AgentNode[]>([
    { id: 1, x: 20, y: 30, type: 'info', active: false },
    { id: 2, x: 40, y: 60, type: 'scenario', active: false },
    { id: 3, x: 60, y: 40, type: 'strategy', active: false },
    { id: 4, x: 80, y: 70, type: 'impact', active: false },
  ]);

  // Animate agent connections pulsing
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          active: Math.random() > 0.5,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Animated Neural Network Background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Agent Connection Lines */}
          {nodes.map((node, i) => {
            const nextNode = nodes[(i + 1) % nodes.length];
            return (
              <line
                key={`line-${i}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${nextNode.x}%`}
                y2={`${nextNode.y}%`}
                stroke={node.active ? '#06b6d4' : '#334155'}
                strokeWidth="2"
                className="transition-all duration-1000"
                style={{
                  filter: node.active ? 'drop-shadow(0 0 8px #06b6d4)' : 'none',
                }}
              />
            );
          })}
          {/* Agent Nodes */}
          {nodes.map((node) => (
            <circle
              key={`node-${node.id}`}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="8"
              fill={node.active ? '#06b6d4' : '#475569'}
              className="transition-all duration-1000"
              style={{
                filter: node.active ? 'drop-shadow(0 0 12px #06b6d4)' : 'none',
              }}
            />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <img 
            src="/omnitrack-logo-horizontal.svg" 
            alt="OmniTrack AI" 
            className="h-20 sm:h-24 lg:h-28 w-auto"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
            }}
          />
        </div>

        {/* Main Heading with Neon Glow */}
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          <span
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            style={{
              textShadow: '0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.3)',
            }}
          >
            Agentic AI That
          </span>
          <br />
          <span
            className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent"
            style={{
              textShadow: '0 0 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.3)',
            }}
          >
            Saves Supply Chains
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-cyan-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
          Autonomous risk detection. Multi-agent mitigation. Zero-downtime resilience.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <button
            onClick={onGetStarted}
            className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white text-xl font-bold rounded-xl shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            style={{
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)',
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              GET STARTED
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={onTryDemo}
            className="px-10 py-5 bg-transparent text-cyan-300 text-lg font-bold rounded-xl border-2 border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
            style={{
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)',
            }}
          >
            Watch Demo
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="animate-bounce mt-12">
          <svg className="w-6 h-6 mx-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
