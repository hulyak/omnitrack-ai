'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-md rounded-xl bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl border border-red-500/20">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-slate-400 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Try Again
            </button>
            <a
              href="/"
              className="block w-full rounded-lg border-2 border-slate-700 bg-slate-800/50 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-700/50 transition-all"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
