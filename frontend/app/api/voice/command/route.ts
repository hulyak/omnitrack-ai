import { NextRequest, NextResponse } from 'next/server';

/**
 * Voice Command API Route
 * 
 * Handles voice commands and returns mock responses for demo purposes.
 * In production, this would integrate with Amazon Lex and backend services.
 */

interface VoiceCommandRequest {
  command: string;
  userId: string;
  timestamp: string;
}

interface VoiceCommandResponse {
  success: boolean;
  intent: {
    name: string;
    confidence: number;
  };
  response: {
    text: string;
    audioUrl?: string;
  };
  data?: any;
  executionTime: number;
}

// Mock responses for different command patterns
const commandPatterns = [
  {
    pattern: /status|overview|dashboard/i,
    intent: 'QueryStatus',
    response: 'Your supply chain is operating normally. There are 3 active shipments and 2 pending alerts.',
    data: {
      activeShipments: 3,
      pendingAlerts: 2,
      overallHealth: 'good',
    },
  },
  {
    pattern: /alert|warning|issue/i,
    intent: 'ViewAlerts',
    response: 'You have 2 active alerts: Port congestion in Los Angeles causing 2-day delays, and inventory shortage for SKU-12345.',
    data: {
      alerts: [
        { id: 1, severity: 'medium', message: 'Port congestion in Los Angeles' },
        { id: 2, severity: 'high', message: 'Inventory shortage for SKU-12345' },
      ],
    },
  },
  {
    pattern: /scenario|simulation|test|what if/i,
    intent: 'RunScenario',
    response: 'I can help you run a scenario simulation. What type of disruption would you like to test? For example, weather delays, supplier issues, or demand surges.',
    data: {
      availableScenarios: ['weather', 'supplier', 'demand', 'transportation'],
    },
  },
  {
    pattern: /metric|performance|kpi/i,
    intent: 'GetMetrics',
    response: 'Current metrics: On-time delivery rate is 94%, average lead time is 12 days, and inventory turnover is 8.5 times per year.',
    data: {
      onTimeDelivery: 94,
      avgLeadTime: 12,
      inventoryTurnover: 8.5,
    },
  },
  {
    pattern: /sustainability|carbon|emission|environmental/i,
    intent: 'ViewSustainability',
    response: 'Your current carbon footprint is 125,000 kg CO2 this month, which is 8% above target. The sustainability score is 68 out of 100.',
    data: {
      carbonFootprint: 125000,
      sustainabilityScore: 68,
      targetExcess: 8,
    },
  },
  {
    pattern: /strategy|recommendation|mitigation/i,
    intent: 'GetStrategies',
    response: 'Based on current conditions, I recommend optimizing sea routes to reduce costs by 5% and switching to rail transport for regional shipments.',
    data: {
      strategies: [
        { name: 'Optimize sea routes', impact: 'Cost reduction 5%' },
        { name: 'Switch to rail', impact: 'Emissions reduction 15%' },
      ],
    },
  },
  {
    pattern: /help|what can you do|commands/i,
    intent: 'Help',
    response: 'I can help you with: checking status, viewing alerts, running scenarios, getting metrics, sustainability data, and strategy recommendations. Just ask me naturally!',
    data: {
      availableCommands: [
        'Show me the status',
        'View alerts',
        'Run a scenario',
        'Show metrics',
        'Sustainability report',
        'Get recommendations',
      ],
    },
  },
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: VoiceCommandRequest = await request.json();
    const { command, userId } = body;

    if (!command || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: command and userId',
        },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find matching pattern
    const matchedPattern = commandPatterns.find((p) => p.pattern.test(command)) || {
      pattern: /.*/,
      intent: 'Unknown',
      response: `I heard "${command}" but I'm not sure how to help with that. Try asking about status, alerts, scenarios, metrics, or sustainability.`,
      data: {
        availableCommands: [
          'Show me the status',
          'View alerts',
          'Run a scenario',
          'Show metrics',
          'Sustainability report',
        ],
      },
    };

    const executionTime = Date.now() - startTime;

    const response: VoiceCommandResponse = {
      success: true,
      intent: {
        name: matchedPattern.intent,
        confidence: matchedPattern.intent === 'Unknown' ? 0.3 : 0.85 + Math.random() * 0.1,
      },
      response: {
        text: matchedPattern.response,
        // In production, this would be a URL to generated audio
        audioUrl: undefined,
      },
      data: matchedPattern.data,
      executionTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice command error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process voice command',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    service: 'Voice Command API',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      POST: '/api/voice/command - Process voice commands',
    },
    exampleCommands: [
      'Show me the status',
      'View alerts',
      'Run a scenario',
      'Show metrics',
      'Sustainability report',
      'Get recommendations',
    ],
  });
}
