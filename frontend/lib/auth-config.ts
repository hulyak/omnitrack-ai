import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth temporarily disabled - use Demo Mode instead
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID || '',
    //   clientSecret: process.env.GITHUB_SECRET || '',
    // }),
    CredentialsProvider({
      name: 'Demo Mode',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@omnitrack.ai' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Demo mode - accept valid-looking credentials for hackathon
        if (credentials?.email && credentials?.password) {
          // Reject obviously invalid credentials
          const email = credentials.email.trim();
          const password = credentials.password.trim();
          if (!email.includes('@') || password.length < 3) {
            return null;
          }
          // Reject test-invalid credentials
          if (email.startsWith('invalid') || email.startsWith('wrong') || email.startsWith('bad')) {
            return null;
          }
          return {
            id: 'demo-user',
            email,
            name: email.split('@')[0],
            image: null,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'omnitrack-hackathon-secret-2024',
};
