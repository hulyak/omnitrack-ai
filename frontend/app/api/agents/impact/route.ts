import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export async function POST(request: NextRequest) {
  try {
    await request.json(); // Parse request body
    const dataStore = getDemoDataStore();
    const nodes = dataStore.getNodes();
    const config = dataStore.getConfig();

    const avgUtilization = nodes.reduce((sum, n) => sum + n.metrics.utilization, 0) / nodes.length;
    const totalShipments = nodes.length * 100; // Simplified calculation

    // Calculate ESG metrics based on configuration and current state
    const carbonFootprint = Math.round(
      totalShipments * 
      (config.shippingMethods.includes('air-freight') ? 1.5 : 1) *
      (config.shippingMethods.includes('sea-freight') ? 0.8 : 1)
    );

    const carbonReduction = config.shippingMethods.includes('rail') ? '-20%' : 
                           config.shippingMethods.includes('sea-freight') ? '-15%' : '-5%';

    const energyEfficiency = Math.round(75 + (avgUtilization / 4));

    const esgMetrics = {
      environmental: {
        carbonFootprint: `${carbonFootprint} tons CO2e`,
        carbonReduction: `${carbonReduction} vs baseline`,
        energyEfficiency: `${energyEfficiency}%`,
        wasteReduction: config.industry === 'electronics' ? '45%' : '35%',
        renewableEnergy: config.shippingMethods.includes('rail') ? '30%' : '15%',
      },
      social: {
        laborPractices: config.riskProfile === 'low' ? 'Fully Compliant' : 'Compliant',
        supplierDiversity: `${Math.round(25 + nodes.length * 2)}%`,
        communityImpact: avgUtilization > 70 ? 'Very Positive' : 'Positive',
        safetyIncidents: config.riskProfile === 'high' ? '4 (minor)' : '2 (minor)',
        employeeWellbeing: avgUtilization < 80 ? 'Good' : 'Moderate',
      },
      governance: {
        ethicsCompliance: config.riskProfile === 'low' ? '99%' : '95%',
        transparencyScore: `${(4.0 + (avgUtilization / 100)).toFixed(1)}/5`,
        riskManagement: config.riskProfile === 'low' ? 'Excellent' : 
                       config.riskProfile === 'medium' ? 'Strong' : 'Adequate',
        boardDiversity: '40%',
        supplierAudits: `${nodes.filter(n => n.type === 'supplier').length * 2}/year`,
      },
    };

    const recommendations = [];

    if (!config.shippingMethods.includes('rail')) {
      recommendations.push('Add rail transport to reduce carbon footprint by additional 10%');
    }

    if (parseInt(esgMetrics.social.supplierDiversity) < 40) {
      recommendations.push(`Expand supplier diversity program to reach 50% target (currently ${esgMetrics.social.supplierDiversity})`);
    }

    if (config.riskProfile === 'high') {
      recommendations.push('Implement additional safety training to eliminate incidents');
      recommendations.push('Strengthen risk management protocols');
    }

    if (avgUtilization > 80) {
      recommendations.push('Monitor employee wellbeing during high-utilization periods');
    }

    return NextResponse.json({
      success: true,
      data: {
        esgMetrics,
        recommendations,
        context: {
          region: config.region,
          industry: config.industry,
          avgUtilization: Math.round(avgUtilization),
          nodeCount: nodes.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Impact agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process impact agent request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
