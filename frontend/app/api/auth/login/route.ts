import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // TODO: Replace with actual AWS API Gateway endpoint when deployed
    // For now, return mock response for demo mode
    if (process.env.NODE_ENV === 'development') {
      // Mock authentication for development
      if (email && password) {
        return NextResponse.json({
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 'user-123',
            email: email,
            name: email.split('@')[0],
            role: 'admin',
          },
        });
      }
    }

    // In production, proxy to AWS API Gateway
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || process.env.API_ENDPOINT;
    
    if (apiEndpoint) {
      const response = await fetch(`${apiEndpoint}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || 'Login failed' },
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
