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
        // Demo mode - accept any credentials for hackathon
        if (credentials?.email) {
          return {
            id: 'demo-user',
            email: credentials.email,
            name: credentials.email.split('@')[0],
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
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'omnitrack-hackathon-secret-2024',
};
