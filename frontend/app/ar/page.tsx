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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading digital twin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <ARVisualization
        digitalTwin={digitalTwin}
        onNodeSelect={handleNodeSelect}
        onError={handleError}
      />
    </div>
  );
}
