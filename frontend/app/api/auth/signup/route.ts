import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In development, return mock response
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 'user-' + Date.now(),
          email: email,
          name: name,
          role: 'analyst',
        },
      });
    }

    // In production, proxy to AWS API Gateway
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || process.env.API_ENDPOINT;
    
    if (apiEndpoint) {
      const response = await fetch(`${apiEndpoint}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || 'Signup failed' },
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
