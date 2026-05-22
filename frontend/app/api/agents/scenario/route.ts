import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export async function POST(request: NextRequest) {
  try {
    const { params } = await request.json();
    const scenario = params?.scenario || 'port-closure';
    const dataStore = getDemoDataStore();
    const nodes = dataStore.getNodes();
    const config = dataStore.getConfig();

    // Calculate impact based on current supply chain state
    const criticalNodes = nodes.filter(n => n.status === 'critical');
    const warningNodes = nodes.filter(n => n.status === 'warning');
    const avgUtilization = nodes.reduce((sum, n) => sum + n.metrics.utilization, 0) / nodes.length;

    // Scenario-specific impacts
    const scenarioImpacts: Record<string, any> = {
      'port-closure': {
        scenario: 'Port Closure',
        impact: {
          deliveryDelay: config.shippingMethods.includes('air-freight') ? '3-5 days' : '7-10 days',
          affectedNodes: nodes.filter(n => n.type === 'warehouse' || n.type === 'distributor').map(n => n.name),
          costIncrease: `${config.currency} ${(125000 * (config.riskProfile === 'high' ? 1.5 : 1)).toLocaleString()}`,
          revenueRisk: `${config.currency} ${(450000 * (config.riskProfile === 'high' ? 1.5 : 1)).toLocaleString()}`,
        },
        recommendations: [
          config.shippingMethods.includes('air-freight') 
            ? 'Activate air freight routes to minimize delays'
            : 'Consider emergency air freight for critical shipments',
          'Increase safety stock at regional warehouses by 30%',
          'Communicate delays to downstream partners',
        ],
      },
      'supplier-disruption': {
        scenario: 'Supplier Disruption',
        impact: {
          deliveryDelay: '14-21 days',
          affectedNodes: nodes.filter(n => n.type === 'supplier' || n.type === 'manufacturer').map(n => n.name),
          costIncrease: `${config.currency} ${(280000 * (config.riskProfile === 'high' ? 1.8 : 1)).toLocaleString()}`,
          revenueRisk: `${config.currency} ${(850000 * (config.riskProfile === 'high' ? 1.8 : 1)).toLocaleString()}`,
        },
        recommendations: [
          'Engage backup suppliers immediately',
          `Reduce production schedule by ${config.riskProfile === 'high' ? '40%' : '30%'}`,
          'Prioritize high-margin products',
        ],
      },
      'demand-spike': {
        scenario: 'Demand Spike',
        impact: {
          deliveryDelay: avgUtilization > 70 ? '5-7 days' : '3-5 days',
          affectedNodes: nodes.filter(n => n.type === 'warehouse' || n.type === 'retailer').map(n => n.name),
          costIncrease: `${config.currency} ${(85000).toLocaleString()}`,
          revenueRisk: `${config.currency} 0 (opportunity)`,
        },
        recommendations: [
          `Increase production capacity by ${avgUtilization > 70 ? '35%' : '25%'}`,
          'Expedite shipments to high-demand regions',
          'Negotiate overtime with manufacturing partners',
        ],
      },
      'weather-event': {
        scenario: 'Weather Event',
        impact: {
          deliveryDelay: '5-7 days',
          affectedNodes: nodes.filter(n => n.location?.region === config.region).map(n => n.name),
          costIncrease: `${config.currency} ${(95000 * (config.riskProfile === 'high' ? 1.3 : 1)).toLocaleString()}`,
          revenueRisk: `${config.currency} ${(320000 * (config.riskProfile === 'high' ? 1.3 : 1)).toLocaleString()}`,
        },
        recommendations: [
          'Reroute shipments through unaffected regions',
          'Increase inventory buffer at retail locations by 25%',
          'Monitor weather patterns for additional disruptions',
        ],
      },
    };

    const scenarioData = scenarioImpacts[scenario] || scenarioImpacts['port-closure'];
    
    return NextResponse.json({
      success: true,
      data: {
        ...scenarioData,
        context: {
          currentUtilization: Math.round(avgUtilization),
          criticalNodes: criticalNodes.length,
          warningNodes: warningNodes.length,
          region: config.region,
          industry: config.industry,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scenario agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scenario agent request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
