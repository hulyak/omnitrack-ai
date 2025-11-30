# NextAuth.js Integration - Zero-Cost Authentication

## Overview

NextAuth.js has been integrated into OmniTrack AI to provide **free, production-ready authentication** that works on Vercel's free tier.

## What Changed

### ✅ Added
- **NextAuth.js v4.24** - Industry-standard authentication
- **GitHub OAuth** - Sign in with GitHub (optional)
- **Demo Mode** - Credentials provider for hackathon
- **JWT Sessions** - No database required
- **Protected Routes** - Automatic middleware
- **Session Provider** - React context for auth state

### 🔄 Updated
- Login page (`/login`) - Now uses NextAuth
- Signup page (`/signup`) - Now uses NextAuth
- Root layout - Added SessionProvider
- Package.json - Added next-auth dependency

### 📁 New Files
```
frontend/
├── app/api/auth/[...nextauth]/route.ts  # NextAuth API route
├── lib/auth.ts                           # Auth utilities
├── middleware.ts                         # Route protection
├── components/providers/
│   └── session-provider.tsx             # Session context
├── types/next-auth.d.ts                 # TypeScript types
├── .env.local.example                   # Environment template
├── install-nextauth.sh                  # Installation script
├── NEXTAUTH_SETUP.md                    # Full setup guide
└── package.json                         # Updated with next-auth
```

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
./install-nextauth.sh
```

Or manually:
```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Generate secret:
```bash
openssl rand -base64 32
```

Add to `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
```

### 3. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000/login

## Authentication Methods

### 1. Demo Mode (Default)
- Click "Try Demo Mode" button
- No configuration needed
- Perfect for hackathon demos
- Works immediately

### 2. Email/Password
- Enter any email/password
- Demo credentials provider
- Auto-creates session
- No backend required

### 3. GitHub OAuth (Optional)
- Sign in with GitHub account
- Requires OAuth app setup
- Free for unlimited users
- Production-ready

## Vercel Deployment

### Environment Variables

Set in Vercel dashboard:

```bash
NEXTAUTH_SECRET=your-secret-here
```

Optional (for GitHub OAuth):
```bash
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

**Note**: `NEXTAUTH_URL` is auto-detected on Vercel!

### Deploy

```bash
vercel --prod
```

## Protected Routes

These routes now require authentication:

- `/dashboard/*` - Main dashboard
- `/scenarios/*` - Scenario management
- `/marketplace/*` - Marketplace browser
- `/voice/*` - Voice interface
- `/ar/*` - AR visualization
- `/sustainability/*` - Sustainability dashboard
- `/explainability/*` - Explainability panel
- `/copilot-analytics/*` - Analytics dashboard

Unauthenticated users are redirected to `/login`.

## Usage Examples

### Client Component

```tsx
'use client';

import { useSession, signOut } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <p>Welcome {session?.user?.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server Component

```tsx
import { getSession } from '@/lib/auth';

export default async function Page() {
  const session = await getSession();
  
  return <div>Hello {session?.user?.email}</div>;
}
```

### API Route

```tsx
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return Response.json({ user: session.user });
}
```

## GitHub OAuth Setup (Optional)

### 1. Create OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Configure:
   - **Name**: OmniTrack AI
   - **Homepage**: https://your-domain.vercel.app
   - **Callback**: https://your-domain.vercel.app/api/auth/callback/github
4. Save Client ID and Secret

### 2. Add to Environment

```env
GITHUB_ID=your-client-id
GITHUB_SECRET=your-client-secret
```

### 3. Test

Click "Sign in with GitHub" on login page.

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| NextAuth.js | **$0** | Open source |
| JWT Sessions | **$0** | No database |
| GitHub OAuth | **$0** | Unlimited users |
| Vercel Hosting | **$0** | Hobby tier |
| **Total** | **$0/month** | ✅ Zero cost |

## Security Features

✅ **JWT Tokens** - Signed with secret key
✅ **CSRF Protection** - Built-in
✅ **Secure Cookies** - httpOnly, secure flags
✅ **Session Rotation** - On sign in
✅ **XSS Protection** - Cookie-based sessions
✅ **HTTPS Only** - In production

## Migration Notes

### Old Auth System
```tsx
// ❌ Old way (removed)
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
localStorage.setItem('token', data.token);
```

### New Auth System
```tsx
// ✅ New way (NextAuth)
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email,
  password,
  redirect: false,
});
```

## Troubleshooting

### Module not found error
```bash
cd frontend
npm install
```

### Session not persisting
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies
- Restart dev server

### GitHub OAuth fails
- Verify callback URL matches exactly
- Check client ID and secret
- Ensure OAuth app is active

### Redirect loop
- Check `NEXTAUTH_URL` matches domain
- Verify middleware.ts location
- Clear browser cache

## Testing

### Demo Mode
1. Visit `/login`
2. Click "Try Demo Mode"
3. Should redirect to `/dashboard`
4. Session should persist

### Email/Password
1. Visit `/login`
2. Enter any email/password
3. Click "Sign In"
4. Should redirect to `/dashboard`

### GitHub OAuth
1. Visit `/login`
2. Click "Sign in with GitHub"
3. Authorize app
4. Should redirect to `/dashboard`

## Documentation

- **Setup Guide**: `frontend/NEXTAUTH_SETUP.md`
- **NextAuth Docs**: https://next-auth.js.org/
- **GitHub OAuth**: https://docs.github.com/en/developers/apps

## Benefits

✅ **Zero Cost** - No monthly fees
✅ **Production Ready** - Battle-tested library
✅ **Easy Setup** - 5 minutes to configure
✅ **Flexible** - Multiple auth providers
✅ **Secure** - Industry best practices
✅ **Scalable** - Handles unlimited users
✅ **No Database** - JWT-based sessions
✅ **Vercel Optimized** - Works on free tier

## Next Steps

1. **Install**: Run `./install-nextauth.sh`
2. **Configure**: Set `NEXTAUTH_SECRET`
3. **Test**: Try demo mode locally
4. **Deploy**: Push to Vercel
5. **Optional**: Add GitHub OAuth

## Support

- 📖 Full guide: `frontend/NEXTAUTH_SETUP.md`
- 🐛 Issues: Check NextAuth.js docs
- 💬 Questions: Review setup guide

---

**Status**: ✅ Ready to use
**Cost**: $0/month
**Setup Time**: 5 minutes
**Last Updated**: November 30, 2024
