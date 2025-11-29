import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In development, return new mock token
    if (process.env.NODE_ENV === 'development') {
      const token = authHeader.replace('Bearer ', '');
      
      if (token.startsWith('mock-jwt-token')) {
        return NextResponse.json({
          token: 'mock-jwt-token-' + Date.now(),
        });
      }
    }

    // In production, proxy to AWS API Gateway
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || process.env.API_ENDPOINT;
    
    if (apiEndpoint) {
      const response = await fetch(`${apiEndpoint}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || 'Token refresh failed' },
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
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
