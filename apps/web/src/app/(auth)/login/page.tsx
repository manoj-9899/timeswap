'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-[10px] text-[#0b6057] uppercase font-bold tracking-wider bg-[#9cf2e8]/40 border border-[#80d5cb] px-2.5 py-1 rounded-full inline-block">
          Community Access
        </span>
        <h1 className="text-2xl font-extrabold text-[#191c1b] tracking-tight">Welcome Back</h1>
        <p className="text-xs text-[#515f5d]">Sign in to your TimeSwap account to continue exchanging skills.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[#191c1b] mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#e2e8f7] text-[#191c1b] text-xs placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-[#191c1b]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#0b6057] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#e2e8f7] text-[#191c1b] text-xs placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-[#0b6057] hover:bg-[#00473f] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-[#515f5d] border-t border-[#e2e8f7]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-[#0b6057] hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
