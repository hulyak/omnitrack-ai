'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Lightbulb, FlaskConical } from 'lucide-react';
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
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
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
            
            {/* Quick Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/scenarios')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                <FlaskConical className="h-5 w-5" />
                <span className="font-medium">Run Scenarios</span>
              </button>
              
              <button
                onClick={() => router.push('/explainability')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                <Lightbulb className="h-5 w-5" />
                <span className="font-medium">AI Explainability</span>
              </button>
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
