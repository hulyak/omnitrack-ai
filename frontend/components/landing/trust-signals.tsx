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
    <div className="py-24 bg-gradient-to-b from-gray-900 via-primary-950 to-gray-900 border-t border-primary-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Powered By */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-6">Powered By</div>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="group flex items-center gap-4 hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
              <span className="text-white font-bold text-xl group-hover:text-orange-400 transition-colors duration-200">AWS Bedrock</span>
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
            <div className="group flex items-center gap-4 hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-2xl">K</span>
              </div>
              <span className="text-white font-bold text-xl group-hover:text-primary-400 transition-colors duration-200">Kiro AI IDE</span>
            </div>
          </div>
        </div>

        {/* Enterprise Logos */}
        <div className="mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-gray-400 text-sm uppercase tracking-wider font-semibold text-center mb-8">
            Trusted by Supply Chain Leaders
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center">
            {['DHL', 'MAERSK', 'FEDEX', 'UPS'].map((company, i) => (
              <div
                key={i}
                className="text-gray-500 font-bold text-3xl tracking-wider hover:text-primary-400 transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-primary-500/50 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-glow"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{tech.icon}</span>
              <span className="text-gray-300 font-semibold group-hover:text-white transition-colors duration-200">{tech.name}</span>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-gray-400 text-lg mb-6">Ready to transform your supply chain?</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold rounded-2xl shadow-hard hover:shadow-glow transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Started Now
          </a>
        </div>
      </div>
    </div>
  );
}
