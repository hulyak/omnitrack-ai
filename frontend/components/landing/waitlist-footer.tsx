'use client';

/**
 * Waitlist Footer Component
 * Single-field waitlist signup
 */

import { useState } from 'react';

export function WaitlistFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Be First to Deploy
        </h2>
        <p className="text-xl text-slate-400 mb-8">
          Join the waitlist for early access to OmniTrack AI
        </p>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'submitting' || status === 'success'}
              className="flex-1 px-6 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors duration-300"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                status === 'success'
                  ? 'bg-green-500 text-white'
                  : status === 'submitting'
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105'
              }`}
              style={{
                boxShadow: status === 'idle' ? '0 0 30px rgba(6, 182, 212, 0.3)' : 'none',
              }}
            >
              {status === 'submitting' ? (
                <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
              ) : status === 'success' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                'Join'
              )}
            </button>
          </div>
          {status === 'success' && (
            <p className="mt-3 text-green-400 text-sm">Thanks! We'll be in touch soon.</p>
          )}
        </form>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          <a href="/privacy" className="hover:text-cyan-400 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-cyan-400 transition-colors">
            Terms of Service
          </a>
          <a href="/docs" className="hover:text-cyan-400 transition-colors">
            Documentation
          </a>
          <a href="https://github.com" className="hover:text-cyan-400 transition-colors">
            GitHub
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-slate-600 text-sm">
          © 2024 OmniTrack AI. All rights reserved.
        </div>
      </div>
    </div>
  );
}
