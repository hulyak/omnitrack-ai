'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
          OmniTrack AI
        </h1>
        <p className="text-2xl text-slate-300 mb-4">
          Agentic AI That Saves Supply Chains
        </p>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
          Autonomous risk detection. Multi-agent mitigation. Zero-downtime resilience.
          Powered by AWS Bedrock and specialized AI agents.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-lg shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-purple-500/50 text-purple-300 font-semibold rounded-lg transition-all text-lg"
          >
            Try Demo
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">🤖 AI Agents</h3>
            <p className="text-slate-400">
              Multi-agent system with specialized roles for comprehensive supply chain management
            </p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">⚡ Real-Time</h3>
            <p className="text-slate-400">
              Instant risk detection and automated mitigation strategies powered by AWS
            </p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">🌍 Global Scale</h3>
            <p className="text-slate-400">
              Monitor and optimize supply chains across multiple regions and partners
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
