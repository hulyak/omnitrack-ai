'use client';

import { useState, useEffect } from 'react';
import { SustainabilityDashboard } from '@/components/sustainability';
import type { SustainabilityData } from '@/types/sustainability';

// Mock data for demonstration
const mockSustainabilityData: SustainabilityData = {
  metrics: {
    carbonFootprint: 125000,
    emissionsByRoute: [
      {
        routeId: 'route-1',
        routeName: 'Shanghai to Los Angeles',
        emissions: 45000,
        distance: 11000,
        transportMode: 'SEA',
        percentage: 36,
      },
      {
        routeId: 'route-2',
        routeName: 'Frankfurt to New York',
        emissions: 35000,
        distance: 6200,
        transportMode: 'AIR',
        percentage: 28,
      },
      {
        routeId: 'route-3',
        routeName: 'Mumbai to Dubai',
        emissions: 20000,
        distance: 1900,
        transportMode: 'AIR',
        percentage: 16,
      },
      {
        routeId: 'route-4',
        routeName: 'Berlin to Warsaw',
        emissions: 15000,
        distance: 570,
        transportMode: 'ROAD',
        percentage: 12,
      },
      {
        routeId: 'route-5',
        routeName: 'Tokyo to Seoul',
        emissions: 10000,
        distance: 1160,
        transportMode: 'SEA',
        percentage: 8,
      },
    ],
    sustainabilityScore: 68,
    rating: 'Good',
    totalEmissions: 125000,
    emissionsPerUnit: 2.5,
  },
  trends: Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (89 - i));
    return {
      timestamp: date.toISOString(),
      date: date.toLocaleDateString(),
      carbonFootprint: 120000 + Math.random() * 10000,
      sustainabilityScore: 65 + Math.random() * 10,
      totalEmissions: 120000 + Math.random() * 10000,
    };
  }),
  strategyComparisons: [
    {
      strategyId: 'strategy-1',
      strategyName: 'Optimize Sea Routes',
      environmental: {
        carbonReduction: 15,
        emissionsReduction: 18750,
        sustainabilityScore: 78,
      },
      cost: {
        value: 950000,
        change: -5,
      },
      risk: {
        score: 35,
        level: 'LOW',
      },
    },
    {
      strategyId: 'strategy-2',
      strategyName: 'Switch to Rail Transport',
      environmental: {
        carbonReduction: 25,
        emissionsReduction: 31250,
        sustainabilityScore: 85,
      },
      cost: {
        value: 1050000,
        change: 5,
      },
      risk: {
        score: 45,
        level: 'MEDIUM',
      },
    },
    {
      strategyId: 'strategy-3',
      strategyName: 'Consolidate Shipments',
      environmental: {
        carbonReduction: 12,
        emissionsReduction: 15000,
        sustainabilityScore: 72,
      },
      cost: {
        value: 900000,
        change: -10,
      },
      risk: {
        score: 55,
        level: 'MEDIUM',
      },
    },
  ],
  thresholdAlerts: [
    {
      alertId: 'alert-1',
      metric: 'Carbon Footprint',
      currentValue: 125000,
      thresholdValue: 100000,
      severity: 'HIGH',
      message: 'Carbon footprint has exceeded the monthly threshold by 25%',
      recommendedActions: [
        'Review and optimize high-emission routes',
        'Consider switching to more sustainable transport modes',
        'Implement carbon offset programs',
        'Consolidate shipments to reduce frequency',
      ],
      createdAt: new Date().toISOString(),
    },
    {
      alertId: 'alert-2',
      metric: 'Emissions Per Unit',
      currentValue: 2.5,
      thresholdValue: 2.0,
      severity: 'MEDIUM',
      message: 'Emissions per unit have increased above target efficiency',
      recommendedActions: [
        'Optimize packaging to increase units per shipment',
        'Review supplier locations for proximity',
        'Implement just-in-time delivery strategies',
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  lastUpdated: new Date().toISOString(),
};

export default function SustainabilityPage() {
  const [data, setData] = useState<SustainabilityData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setData(mockSustainabilityData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(undefined);
    
    // Simulate API call
    setTimeout(() => {
      setData(mockSustainabilityData);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header with Navigation - Matching Dashboard */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Sustainability Dashboard
            </h1>
            <p className="text-sm text-slate-400 font-medium">Environmental impact & carbon footprint analysis</p>
          </div>
          {/* Navigation Bar */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
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
            <a href="/sustainability" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 text-sm font-medium">
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
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <SustainabilityDashboard
          data={data}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
        />
      </main>

      {/* Background decoration - matching dashboard */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
