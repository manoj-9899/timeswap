'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmittedMessage(
        res.data?.message || 'If an account with that email exists, a password reset link has been sent.',
      );
    } else {
      setError(res.error?.message || 'Failed to send password reset request.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h1>
      <p className="text-xs sm:text-sm text-slate-600 mb-6">Enter your email to receive a password reset link</p>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2"
        >
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      {submittedMessage ? (
        <div>
          <div
            role="status"
            className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0b6057] text-xs"
          >
            {submittedMessage}
          </div>
          <Link
            href="/auth/login"
            className="inline-block w-full py-3 px-4 text-center rounded-xl font-semibold text-white bg-[#0b6057] hover:bg-[#084c45] transition shadow-sm"
          >
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0b6057] focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#0b6057] hover:bg-[#084c45] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isSubmitting ? 'Sending Request...' : 'Send Password Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs sm:text-sm text-slate-600">
        Remembered your password?{' '}
        <Link href="/auth/login" className="font-semibold text-[#0b6057] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
