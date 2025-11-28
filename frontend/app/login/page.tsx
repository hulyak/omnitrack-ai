'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-800">
        <h1 className="mb-6 text-3xl font-bold text-text-primary dark:text-zinc-50">
          OmniTrack AI
        </h1>
        <p className="mb-6 text-text-secondary dark:text-zinc-400">
          Sign in to access your supply chain dashboard
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-error-light p-3 text-sm text-error dark:bg-error-light/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-text-primary dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-text-primary dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
