import { NextResponse } from 'next/server';

/**
 * Marketplace Scenarios API
 * 
 * Returns mock scenario data for the marketplace demo.
 * In production, this would fetch from DynamoDB.
 */

const mockScenarios = [
  {
    id: 'scenario-1',
    type: 'weather',
    marketplaceMetadata: {
      title: 'Typhoon Season Disruption - Taiwan Semiconductor Supply',
      description: 'Simulate the impact of severe weather disrupting semiconductor shipments from Taiwan during typhoon season. Includes cascading effects on manufacturing and customer orders.',
      author: 'Supply Chain Expert',
      authorId: 'user-001',
      publishedAt: new Date('2024-11-15').toISOString(),
      downloads: 1247,
      rating: 4.8,
      reviewCount: 89,
      tags: ['weather', 'semiconductors', 'asia-pacific', 'high-risk'],
      industry: 'electronics',
      geography: 'asia-pacific',
      featured: true,
    },
    parameters: {
      severity: 'high',
      duration: 14,
      affectedRegion: 'Taiwan',
      impactType: 'transportation',
    },
  },
  {
    id: 'scenario-2',
    type: 'supplier',
    marketplaceMetadata: {
      title: 'Critical Supplier Bankruptcy - Automotive Parts',
      description: 'Test your supply chain resilience when a tier-1 automotive parts supplier suddenly declares bankruptcy. Evaluate alternative sourcing strategies and timeline impacts.',
      author: 'Automotive Analyst',
      authorId: 'user-002',
      publishedAt: new Date('2024-11-10').toISOString(),
      downloads: 892,
      rating: 4.6,
      reviewCount: 67,
      tags: ['supplier-risk', 'automotive', 'sourcing', 'medium-risk'],
      industry: 'automotive',
      geography: 'north-america',
      featured: true,
    },
    parameters: {
      severity: 'high',
      duration: 30,
      affectedRegion: 'North America',
      impactType: 'supplier',
    },
  },
  {
    id: 'scenario-3',
    type: 'demand',
    marketplaceMetadata: {
      title: 'Sudden Demand Surge - Holiday Season Rush',
      description: 'Prepare for unexpected demand spikes during peak holiday season. Analyze inventory positioning, fulfillment capacity, and customer satisfaction impacts.',
      author: 'Retail Operations',
      authorId: 'user-003',
      publishedAt: new Date('2024-11-20').toISOString(),
      downloads: 1534,
      rating: 4.9,
      reviewCount: 112,
      tags: ['demand-planning', 'retail', 'seasonal', 'medium-risk'],
      industry: 'retail',
      geography: 'global',
      featured: true,
    },
    parameters: {
      severity: 'medium',
      duration: 21,
      affectedRegion: 'Global',
      impactType: 'demand',
    },
  },
  {
    id: 'scenario-4',
    type: 'transportation',
    marketplaceMetadata: {
      title: 'Port Strike - West Coast Logistics Shutdown',
      description: 'Simulate a major port strike affecting Los Angeles and Long Beach ports. Evaluate rerouting options, air freight costs, and delivery timeline impacts.',
      author: 'Logistics Manager',
      authorId: 'user-004',
      publishedAt: new Date('2024-11-18').toISOString(),
      downloads: 743,
      rating: 4.5,
      reviewCount: 54,
      tags: ['transportation', 'ports', 'labor-dispute', 'high-risk'],
      industry: 'logistics',
      geography: 'north-america',
      featured: false,
    },
    parameters: {
      severity: 'high',
      duration: 10,
      affectedRegion: 'West Coast USA',
      impactType: 'transportation',
    },
  },
  {
    id: 'scenario-5',
    type: 'geopolitical',
    marketplaceMetadata: {
      title: 'Trade Tariff Implementation - US-China Relations',
      description: 'Analyze the impact of new trade tariffs on cross-border supply chains. Includes cost modeling, alternative sourcing, and compliance considerations.',
      author: 'Trade Compliance',
      authorId: 'user-005',
      publishedAt: new Date('2024-11-12').toISOString(),
      downloads: 621,
      rating: 4.7,
      reviewCount: 43,
      tags: ['geopolitical', 'tariffs', 'compliance', 'medium-risk'],
      industry: 'manufacturing',
      geography: 'global',
      featured: false,
    },
    parameters: {
      severity: 'medium',
      duration: 90,
      affectedRegion: 'US-China',
      impactType: 'regulatory',
    },
  },
  {
    id: 'scenario-6',
    type: 'cyber',
    marketplaceMetadata: {
      title: 'Ransomware Attack - ERP System Outage',
      description: 'Test business continuity when a ransomware attack takes down your ERP system. Evaluate manual processes, data recovery, and operational workarounds.',
      author: 'Cybersecurity Team',
      authorId: 'user-006',
      publishedAt: new Date('2024-11-22').toISOString(),
      downloads: 456,
      rating: 4.4,
      reviewCount: 31,
      tags: ['cybersecurity', 'it-systems', 'business-continuity', 'high-risk'],
      industry: 'technology',
      geography: 'global',
      featured: false,
    },
    parameters: {
      severity: 'high',
      duration: 7,
      affectedRegion: 'Global',
      impactType: 'systems',
    },
  },
  {
    id: 'scenario-7',
    type: 'quality',
    marketplaceMetadata: {
      title: 'Product Recall - Quality Defect Discovery',
      description: 'Manage a large-scale product recall due to quality defects. Includes reverse logistics, customer communication, and brand reputation management.',
      author: 'Quality Assurance',
      authorId: 'user-007',
      publishedAt: new Date('2024-11-08').toISOString(),
      downloads: 389,
      rating: 4.3,
      reviewCount: 28,
      tags: ['quality', 'recall', 'reverse-logistics', 'high-risk'],
      industry: 'consumer-goods',
      geography: 'north-america',
      featured: false,
    },
    parameters: {
      severity: 'high',
      duration: 45,
      affectedRegion: 'North America',
      impactType: 'quality',
    },
  },
  {
    id: 'scenario-8',
    type: 'environmental',
    marketplaceMetadata: {
      title: 'Carbon Tax Implementation - EU Sustainability Regulations',
      description: 'Prepare for new EU carbon border adjustment mechanism. Analyze emissions impact, cost implications, and sustainable sourcing alternatives.',
      author: 'Sustainability Lead',
      authorId: 'user-008',
      publishedAt: new Date('2024-11-25').toISOString(),
      downloads: 512,
      rating: 4.6,
      reviewCount: 37,
      tags: ['sustainability', 'regulations', 'carbon', 'medium-risk'],
      industry: 'manufacturing',
      geography: 'europe',
      featured: true,
    },
    parameters: {
      severity: 'medium',
      duration: 180,
      affectedRegion: 'European Union',
      impactType: 'regulatory',
    },
  },
];

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(mockScenarios);
}
