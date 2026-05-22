'use client';

/**
 * Agentic AI Capabilities Component
 * 4 specialized agents with neon supply chain aesthetic
 */

const agents = [
  {
    name: 'Info Agent',
    role: 'Real-time Monitoring',
    description: 'Continuously monitors supply chain sensors, IoT devices, and external data sources for anomalies and disruptions.',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    capabilities: ['IoT Integration', 'Anomaly Detection', 'Real-time Alerts'],
  },
  {
    name: 'Scenario Agent',
    role: 'What-If Simulations',
    description: 'Generates and runs Monte Carlo simulations to predict disruption impacts across thousands of scenarios in seconds.',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    capabilities: ['Monte Carlo Sims', 'Risk Forecasting', 'Impact Analysis'],
  },
  {
    name: 'Strategy Agent',
    role: 'Autonomous Planning',
    description: 'Negotiates with other agents to generate optimal mitigation strategies balancing cost, risk, and sustainability.',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    capabilities: ['Multi-Agent Negotiation', 'Strategy Optimization', 'Decision Trees'],
  },
  {
    name: 'Impact Agent',
    role: 'Sustainability & Cost',
    description: 'Calculates carbon footprint, environmental impact, and financial implications for every supply chain decision.',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    capabilities: ['Carbon Tracking', 'Cost Analysis', 'ESG Compliance'],
  },
];

export function AgentCapabilities() {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; glow: string; text: string }> = {
      cyan: { border: 'border-cyan-500/30', glow: 'rgba(6, 182, 212, 0.2)', text: 'text-cyan-400' },
      purple: { border: 'border-purple-500/30', glow: 'rgba(168, 85, 247, 0.2)', text: 'text-purple-400' },
      orange: { border: 'border-orange-500/30', glow: 'rgba(249, 115, 22, 0.2)', text: 'text-orange-400' },
      green: { border: 'border-green-500/30', glow: 'rgba(34, 197, 94, 0.2)', text: 'text-green-400' },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Agentic AI Capabilities
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Four specialized agents collaborate autonomously to protect your supply chain
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, i) => {
            const colors = getColorClasses(agent.color);
            return (
              <div
                key={i}
                className={`group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border-2 ${colors.border} hover:scale-105 transition-all duration-300`}
                style={{
                  boxShadow: `0 0 30px ${colors.glow}`,
                }}
              >
                {/* Gradient Glow on Hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                />

                {/* Icon */}
                <div
                  className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${agent.gradient} text-white mb-6 shadow-lg`}
                  style={{
                    boxShadow: `0 0 20px ${colors.glow}`,
                  }}
                >
                  {agent.icon}
                </div>

                {/* Agent Name */}
                <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>
                  {agent.name}
                </h3>

                {/* Role */}
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-4">
                  {agent.role}
                </div>

                {/* Description */}
                <p className="text-slate-300 leading-relaxed mb-6">
                  {agent.description}
                </p>

                {/* Capabilities */}
                <div className="space-y-2">
                  {agent.capabilities.map((capability, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className={`w-4 h-4 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {capability}
                    </div>
                  ))}
                </div>

                {/* Connection Indicator */}
                <div className="absolute top-4 right-4">
                  <div className={`w-3 h-3 ${colors.text} rounded-full animate-pulse`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent Collaboration Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 backdrop-blur-sm rounded-full border border-cyan-500/30">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-white font-semibold">
              Agents collaborate in <span className="text-cyan-400">&lt;60 seconds</span> to resolve disruptions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
