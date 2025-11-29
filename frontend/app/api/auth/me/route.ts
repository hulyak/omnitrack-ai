import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In development, return mock user data
    if (process.env.NODE_ENV === 'development') {
      const token = authHeader.replace('Bearer ', '');
      
      if (token.startsWith('mock-jwt-token')) {
        return NextResponse.json({
          id: 'user-123',
          email: 'demo@omnitrack.ai',
          name: 'Demo User',
          role: 'admin',
        });
      }
    }

    // In production, proxy to AWS API Gateway
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || process.env.API_ENDPOINT;
    
    if (apiEndpoint) {
      const response = await fetch(`${apiEndpoint}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || 'Authentication failed' },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'API endpoint not configured' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
