'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { AgentControls } from '@/components/dashboard/agent-controls';
import { SupplyChainNetwork } from '@/components/dashboard/supply-chain-network';
import { AgentResults } from '@/components/dashboard/agent-results';
import { SupplyChainConfigForm, SupplyChainConfig } from '@/components/dashboard/supply-chain-config-form';
import { CopilotChat } from '@/components/copilot/copilot-chat';
import { callAgent } from '@/lib/api/agents';

function DashboardContent() {
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(false);
  const [agentResults, setAgentResults] = useState<any>(null);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [supplyChainConfig, setSupplyChainConfig] = useState<SupplyChainConfig | undefined>();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  useEffect(() => {
    // Check if in demo mode
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    setDemoMode(isDemoMode);

    // Load current configuration
    fetch('/api/supply-chain/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSupplyChainConfig(data.config);
        }
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('demoMode');
    router.push('/');
  };

  const handleConfigSubmit = async (config: SupplyChainConfig) => {
    try {
      const response = await fetch('/api/supply-chain/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const data = await response.json();
      if (data.success) {
        setSupplyChainConfig(config);
        // Clear agent results to force re-run with new config
        setAgentResults(null);
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleAgentAction = async (agent: string, action: string, params?: any) => {
    setCurrentAgent(agent);
    const response = await callAgent(
      agent as 'info' | 'scenario' | 'strategy' | 'impact',
      action,
      params
    );
    setAgentResults(response);
    // Don't auto-scroll - let user see results naturally
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              OmniTrack AI
            </h1>
            <div className="flex items-center gap-4">
              {demoMode && (
                <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50">
                  Demo Mode
                </span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors border border-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Navigation Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 text-sm font-medium">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </a>
              <a href="/scenarios" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Welcome Message & Quick Actions */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome to Your Dashboard
              </h2>
              <p className="text-slate-400">
                Monitor your supply chain and interact with AI agents in real-time
              </p>
            </div>
            

          </div>
        </div>

        {/* Top Section - Controls */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <SupplyChainConfigForm 
            onConfigSubmit={handleConfigSubmit}
            currentConfig={supplyChainConfig}
          />
          <AgentControls onAgentAction={handleAgentAction} />
        </div>

        {/* Agent Results - Show above network if present */}
        {agentResults && (
          <div id="agent-results" className="mb-6">
            <AgentResults results={agentResults} agent={currentAgent} />
          </div>
        )}

        {/* Supply Chain Network - Full Width */}
        <div className="w-full">
          <SupplyChainNetwork demoMode={demoMode} />
        </div>
      </main>

      {/* AI Copilot Floating Button with Label */}
      {!isCopilotOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Tooltip/Label */}
          <div className="bg-slate-900/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/50 shadow-lg animate-bounce">
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Ask AI Copilot
            </p>
          </div>
          
          {/* Button */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 animate-pulse"
            aria-label="Open AI Copilot"
          >
            {/* Animated ring */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping"></span>
            
            {/* Icon */}
            <MessageSquare className="h-7 w-7 relative z-10 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* AI Copilot Chat */}
      <CopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        supplyChainContext={{
          nodes: [],
          edges: [],
          configuration: supplyChainConfig || {
            region: 'asia-pacific',
            industry: 'electronics',
            currency: 'USD',
            shippingMethods: ['sea-freight'],
            nodeCount: 6,
            riskProfile: 'medium',
          },
          recentActions: [],
          activeSimulations: [],
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
