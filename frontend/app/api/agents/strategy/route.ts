import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export async function POST(request: NextRequest) {
  try {
    await request.json(); // Parse request body
    const dataStore = getDemoDataStore();
    const nodes = dataStore.getNodes();
    const config = dataStore.getConfig();

    const criticalNodes = nodes.filter(n => n.status === 'critical');
    const warningNodes = nodes.filter(n => n.status === 'warning');
    const avgUtilization = nodes.reduce((sum, n) => sum + n.metrics.utilization, 0) / nodes.length;

    const strategies = [];

    // Strategy 1: Multi-Sourcing (if suppliers are at risk)
    if (nodes.some(n => n.type === 'supplier' && n.status !== 'healthy')) {
      strategies.push({
        id: 'strategy-1',
        name: 'Multi-Sourcing Strategy',
        priority: 'high',
        timeframe: '2-4 weeks',
        cost: `${config.currency} ${(150000).toLocaleString()}`,
        expectedBenefit: 'Reduce supplier risk by 60%',
        actions: [
          `Identify and qualify 2 additional ${config.industry} suppliers`,
          'Negotiate contracts with volume commitments',
          'Implement dual-sourcing for critical components',
        ],
      });
    }

    // Strategy 2: Inventory Optimization (if utilization is low)
    if (avgUtilization < 60 || criticalNodes.length > 0) {
      strategies.push({
        id: 'strategy-2',
        name: 'Inventory Optimization',
        priority: criticalNodes.length > 0 ? 'high' : 'medium',
        timeframe: '1-2 weeks',
        cost: `${config.currency} ${(75000).toLocaleString()}`,
        expectedBenefit: `Improve utilization by ${100 - Math.round(avgUtilization)}%`,
        actions: [
          'Rebalance inventory across distribution network',
          'Implement dynamic safety stock calculations',
          `Increase capacity at ${criticalNodes.length > 0 ? criticalNodes[0].name : 'critical nodes'}`,
        ],
      });
    }

    // Strategy 3: Transportation Diversification
    if (config.shippingMethods.length < 3) {
      strategies.push({
        id: 'strategy-3',
        name: 'Transportation Diversification',
        priority: 'medium',
        timeframe: '3-6 weeks',
        cost: `${config.currency} ${(200000).toLocaleString()}`,
        expectedBenefit: 'Reduce delivery delays by 40%',
        actions: [
          'Establish contracts with multiple carriers',
          'Implement multi-modal transportation options',
          'Create contingency routing plans',
        ],
      });
    }

    // Strategy 4: Regional Expansion (if high risk profile)
    if (config.riskProfile === 'high') {
      strategies.push({
        id: 'strategy-4',
        name: 'Regional Risk Mitigation',
        priority: 'high',
        timeframe: '4-8 weeks',
        cost: `${config.currency} ${(350000).toLocaleString()}`,
        expectedBenefit: 'Reduce regional concentration risk by 50%',
        actions: [
          `Establish backup facilities outside ${config.region}`,
          'Diversify supplier base across multiple regions',
          'Implement regional inventory buffers',
        ],
      });
    }

    // If everything is healthy, provide optimization strategies
    if (strategies.length === 0) {
      strategies.push({
        id: 'strategy-opt',
        name: 'Continuous Optimization',
        priority: 'low',
        timeframe: 'Ongoing',
        cost: `${config.currency} ${(50000).toLocaleString()}`,
        expectedBenefit: 'Maintain operational excellence',
        actions: [
          'Monitor KPIs and adjust thresholds',
          'Conduct quarterly supplier reviews',
          'Optimize inventory turnover rates',
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        strategies,
        context: {
          avgUtilization: Math.round(avgUtilization),
          criticalNodes: criticalNodes.length,
          warningNodes: warningNodes.length,
          region: config.region,
          industry: config.industry,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Strategy agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process strategy agent request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
