'use client';

import React, { useState, useEffect } from 'react';
import { ARVisualization } from '@/components/ar';
import { DigitalTwinState, SupplyChainNode } from '@/types/ar';

/**
 * AR Visualization Page
 * 
 * Provides an immersive AR view of the supply chain digital twin.
 */
export default function ARPage() {
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinState>({
    nodes: [],
    routes: [],
    disruptions: [],
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch digital twin data
  useEffect(() => {
    fetchDigitalTwin();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchDigitalTwin, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDigitalTwin = async () => {
    try {
      // In production, this would fetch from the API
      // For now, using mock data
      const mockData: DigitalTwinState = {
        nodes: [
          {
            nodeId: 'node-1',
            type: 'SUPPLIER',
            name: 'Shanghai Supplier',
            location: { latitude: 31.2304, longitude: 121.4737 },
            status: 'HEALTHY',
            metrics: {
              capacity: 10000,
              utilization: 75,
              inventory: 7500,
              leadTime: 14,
            },
            connections: ['node-2', 'node-3'],
          },
          {
            nodeId: 'node-2',
            type: 'MANUFACTURER',
            name: 'Tokyo Manufacturing',
            location: { latitude: 35.6762, longitude: 139.6503 },
            status: 'HEALTHY',
            metrics: {
              capacity: 5000,
              utilization: 82,
              inventory: 4100,
              leadTime: 7,
            },
            connections: ['node-4'],
          },
          {
            nodeId: 'node-3',
            type: 'WAREHOUSE',
            name: 'Singapore Warehouse',
            location: { latitude: 1.3521, longitude: 103.8198 },
            status: 'DEGRADED',
            metrics: {
              capacity: 15000,
              utilization: 92,
              inventory: 13800,
              leadTime: 3,
            },
            connections: ['node-4', 'node-5'],
          },
          {
            nodeId: 'node-4',
            type: 'DISTRIBUTOR',
            name: 'Los Angeles Distribution',
            location: { latitude: 34.0522, longitude: -118.2437 },
            status: 'DISRUPTED',
            metrics: {
              capacity: 8000,
              utilization: 45,
              inventory: 3600,
              leadTime: 21,
            },
            connections: ['node-6'],
          },
          {
            nodeId: 'node-5',
            type: 'DISTRIBUTOR',
            name: 'New York Distribution',
            location: { latitude: 40.7128, longitude: -74.0060 },
            status: 'HEALTHY',
            metrics: {
              capacity: 7000,
              utilization: 68,
              inventory: 4760,
              leadTime: 5,
            },
            connections: ['node-6'],
          },
          {
            nodeId: 'node-6',
            type: 'RETAILER',
            name: 'Retail Network',
            location: { latitude: 41.8781, longitude: -87.6298 },
            status: 'HEALTHY',
            metrics: {
              capacity: 20000,
              utilization: 55,
              inventory: 11000,
              leadTime: 2,
            },
            connections: [],
          },
        ],
        routes: [
          {
            routeId: 'route-1',
            fromNodeId: 'node-1',
            toNodeId: 'node-2',
            status: 'ACTIVE',
            metrics: {
              distance: 1800,
              transitTime: 3,
              cost: 5000,
              carbonFootprint: 250,
            },
          },
          {
            routeId: 'route-2',
            fromNodeId: 'node-1',
            toNodeId: 'node-3',
            status: 'ACTIVE',
            metrics: {
              distance: 4300,
              transitTime: 7,
              cost: 8500,
              carbonFootprint: 420,
            },
          },
          {
            routeId: 'route-3',
            fromNodeId: 'node-2',
            toNodeId: 'node-4',
            status: 'DELAYED',
            metrics: {
              distance: 8800,
              transitTime: 14,
              cost: 15000,
              carbonFootprint: 850,
            },
          },
          {
            routeId: 'route-4',
            fromNodeId: 'node-3',
            toNodeId: 'node-4',
            status: 'DISRUPTED',
            metrics: {
              distance: 14000,
              transitTime: 21,
              cost: 22000,
              carbonFootprint: 1200,
            },
          },
          {
            routeId: 'route-5',
            fromNodeId: 'node-3',
            toNodeId: 'node-5',
            status: 'ACTIVE',
            metrics: {
              distance: 15000,
              transitTime: 18,
              cost: 24000,
              carbonFootprint: 1300,
            },
          },
          {
            routeId: 'route-6',
            fromNodeId: 'node-4',
            toNodeId: 'node-6',
            status: 'ACTIVE',
            metrics: {
              distance: 2800,
              transitTime: 4,
              cost: 6000,
              carbonFootprint: 320,
            },
          },
          {
            routeId: 'route-7',
            fromNodeId: 'node-5',
            toNodeId: 'node-6',
            status: 'ACTIVE',
            metrics: {
              distance: 1200,
              transitTime: 2,
              cost: 3500,
              carbonFootprint: 180,
            },
          },
        ],
        disruptions: [
          {
            disruptionId: 'disruption-1',
            type: 'TRANSPORTATION_DELAY',
            severity: 'HIGH',
            affectedNodeIds: ['node-4'],
            affectedRouteIds: ['route-3', 'route-4'],
            startTime: new Date(Date.now() - 86400000).toISOString(),
            estimatedEndTime: new Date(Date.now() + 172800000).toISOString(),
            description: 'Port congestion causing significant delays',
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      setDigitalTwin(mockData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching digital twin:', err);
      setError('Failed to load digital twin data');
      setIsLoading(false);
    }
  };

  const handleNodeSelect = (node: SupplyChainNode) => {
    console.log('Selected node:', node);
  };

  const handleError = (err: Error) => {
    console.error('AR Visualization error:', err);
    setError(err.message);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading digital twin...</div>
          <p className="text-gray-400 mt-2">Initializing AR visualization</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-800">
        <div className="text-center bg-red-500/10 backdrop-blur-md border border-red-500/50 rounded-3xl p-12 max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-red-400 text-xl font-semibold mb-2">Error Loading AR</div>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* AR Header - Matching Dashboard Style */}
      <div className="border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AR Supply Chain Visualization
              </h1>
              <p className="text-slate-400 text-sm mt-1">Immersive digital twin experience</p>
            </div>
            <a 
              href="/dashboard" 
              className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-400 rounded-lg font-medium transition-all duration-200"
            >
              Exit AR
            </a>
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
            <a href="/sustainability" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Sustainability
            </a>
            <a href="/ar" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 text-sm font-medium">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              AR View
            </a>
            <a href="/voice" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 text-sm font-medium transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ARVisualization
          digitalTwin={digitalTwin}
          onNodeSelect={handleNodeSelect}
          onError={handleError}
        />
      </main>
    </div>
  );
}
