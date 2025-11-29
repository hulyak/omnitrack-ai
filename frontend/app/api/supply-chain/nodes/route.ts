import { NextRequest, NextResponse } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export async function GET(request: NextRequest) {
  try {
    const dataStore = getDemoDataStore();
    const nodes = dataStore.getNodes();

    return NextResponse.json({
      nodes,
      timestamp: new Date().toISOString(),
      count: nodes.length,
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply chain nodes' },
      { status: 500 }
    );
  }
}
