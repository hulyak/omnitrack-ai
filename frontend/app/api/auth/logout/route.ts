import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // In development, just return success
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true });
    }

    // In production, proxy to AWS API Gateway
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || process.env.API_ENDPOINT;
    
    if (apiEndpoint) {
      const response = await fetch(`${apiEndpoint}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || 'Logout failed' },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
