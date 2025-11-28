'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-800">
            <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mb-4 text-zinc-700 dark:text-zinc-300">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-700">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
