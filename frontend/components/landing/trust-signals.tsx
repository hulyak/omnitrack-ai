'use client';

/**
 * Trust Signals Component
 * Powered by badges and enterprise logos
 */

export function TrustSignals() {
  const techStack = [
    { name: 'Next.js', icon: '▲' },
    { name: 'AWS Lambda', icon: 'λ' },
    { name: 'React Flow', icon: '⚛' },
    { name: 'Tailwind', icon: '🎨' },
  ];

  return (
    <div className="py-16 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Powered By */}
        <div className="text-center mb-12">
          <div className="text-slate-500 text-sm uppercase tracking-wider mb-4">Powered By</div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-white font-semibold text-lg">AWS Bedrock</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-white font-semibold text-lg">Kiro AI IDE</span>
            </div>
          </div>
        </div>

        {/* Enterprise Logos */}
        <div className="mb-12">
          <div className="text-slate-500 text-sm uppercase tracking-wider text-center mb-6">
            Trusted by Supply Chain Leaders
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50">
            {['DHL', 'MAERSK', 'FEDEX', 'UPS'].map((company, i) => (
              <div
                key={i}
                className="text-slate-400 font-bold text-2xl tracking-wider hover:text-cyan-400 transition-colors duration-300"
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-colors duration-300"
            >
              <span className="text-xl">{tech.icon}</span>
              <span className="text-slate-400 font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
