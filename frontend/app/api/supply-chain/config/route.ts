import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore, SupplyChainConfig } from '@/lib/demo-data-store';

export async function POST(request: NextRequest) {
  try {
    const config: SupplyChainConfig = await request.json();
    const dataStore = getDemoDataStore();
    
    dataStore.setConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Supply chain configuration updated',
      config: dataStore.getConfig(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const dataStore = getDemoDataStore();
    
    return NextResponse.json({
      success: true,
      config: dataStore.getConfig(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configuration',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
