import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export async function POST(request: NextRequest) {
  try {
    await request.json(); // Parse request body
    const dataStore = getDemoDataStore();
    const nodes = dataStore.getNodes();
    const config = dataStore.getConfig();

    // Analyze nodes for anomalies based on current data
    const anomalies = nodes
      .filter(node => node.status === 'warning' || node.status === 'critical')
      .map(node => ({
        id: `anomaly-${node.id}`,
        type: node.type,
        severity: node.status === 'critical' ? 'high' : 'medium',
        location: node.name,
        description: `${node.name} - ${
          node.metrics.utilization < 30
            ? `Critically low inventory (${node.metrics.utilization}% capacity)`
            : node.metrics.utilization < 50
            ? `Below optimal inventory (${node.metrics.utilization}% capacity)`
            : `Status: ${node.status}`
        }`,
        recommendation: node.metrics.utilization < 30
          ? `Expedite shipment to ${node.name} immediately`
          : `Review inventory levels and demand forecast for ${node.name}`,
        metrics: node.metrics,
        region: node.location?.region || config.region,
      }));

    // If no anomalies, provide positive feedback
    if (anomalies.length === 0) {
      anomalies.push({
        id: 'status-ok',
        type: 'supplier', // Use a valid node type
        severity: 'low',
        location: 'All Nodes',
        description: 'All supply chain nodes operating within normal parameters',
        recommendation: 'Continue monitoring for changes',
        metrics: { inventory: 0, capacity: 0, utilization: 0 },
        region: config.region,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        anomalies,
        summary: {
          totalNodes: nodes.length,
          healthyNodes: nodes.filter(n => n.status === 'healthy').length,
          warningNodes: nodes.filter(n => n.status === 'warning').length,
          criticalNodes: nodes.filter(n => n.status === 'critical').length,
          region: config.region,
          industry: config.industry,
        },
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Info agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process info agent request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
