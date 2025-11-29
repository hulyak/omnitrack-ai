'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, LayoutDashboard, FlaskConical, Lightbulb, Leaf, Mic, Box, BarChart3 } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  category: 'core' | 'analysis' | 'advanced';
}

const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: <Home className="h-4 w-4" />,
    description: 'Landing page',
    category: 'core',
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Main control center',
    category: 'core',
  },
  {
    name: 'Scenarios',
    href: '/scenarios',
    icon: <FlaskConical className="h-4 w-4" />,
    description: 'Run simulations',
    category: 'analysis',
  },
  {
    name: 'AI Explainability',
    href: '/explainability',
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Understand AI decisions',
    category: 'analysis',
  },
  {
    name: 'Sustainability',
    href: '/sustainability',
    icon: <Leaf className="h-4 w-4" />,
    description: 'Carbon footprint tracking',
    category: 'analysis',
  },
  {
    name: 'Voice Assistant',
    href: '/voice',
    icon: <Mic className="h-4 w-4" />,
    description: 'Voice commands',
    category: 'advanced',
  },
  {
    name: 'AR Visualization',
    href: '/ar',
    icon: <Box className="h-4 w-4" />,
    description: 'Immersive 3D view',
    category: 'advanced',
  },
];

export function AppNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const corePages = navigation.filter(item => item.category === 'core');
  const analysisPages = navigation.filter(item => item.category === 'analysis');
  const advancedPages = navigation.filter(item => item.category === 'advanced');

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-2">
        {navigation.slice(0, 5).map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              pathname === item.href
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border-transparent hover:border-slate-700'
            }`}
            title={item.description}
          >
            {item.icon}
            <span>{item.name}</span>
          </a>
        ))}
        
        {/* More Menu */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all duration-200">
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Advanced Features
              </h3>
              <div className="space-y-1">
                {advancedPages.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      pathname === item.href
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-slate-700 transition-all duration-200"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span>Menu</span>
        </button>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800/50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Navigation
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Core Pages */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Core
                  </h3>
                  <div className="space-y-1">
                    {corePages.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                            : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="mt-0.5">{item.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.description}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Analysis Pages */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Analysis & Insights
                  </h3>
                  <div className="space-y-1">
                    {analysisPages.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                            : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="mt-0.5">{item.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.description}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Advanced Pages */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Advanced Features
                  </h3>
                  <div className="space-y-1">
                    {advancedPages.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                            : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="mt-0.5">{item.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.description}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Feature Explanation */}
                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">Why These Pages?</h4>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li><strong>Dashboard:</strong> Real-time supply chain monitoring</li>
                    <li><strong>Scenarios:</strong> Test "what-if" disruption scenarios</li>
                    <li><strong>AI Explainability:</strong> Understand how AI makes decisions</li>
                    <li><strong>Sustainability:</strong> Track environmental impact</li>
                    <li><strong>Voice:</strong> Hands-free interaction</li>
                    <li><strong>AR:</strong> Immersive 3D supply chain visualization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
