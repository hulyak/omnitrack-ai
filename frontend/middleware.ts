import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'omnitrack-hackathon-secret-2024' });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/scenarios/:path*',
    '/marketplace/:path*',
    '/voice/:path*',
    '/ar/:path*',
    '/sustainability/:path*',
    '/explainability/:path*',
    '/copilot-analytics/:path*',
  ],
};
