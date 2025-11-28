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
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <SustainabilityDashboard
        data={data}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
