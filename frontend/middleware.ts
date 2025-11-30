export { default } from 'next-auth/middleware';

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
