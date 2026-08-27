'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const res = await register(email, password, displayName);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(
        res.message || 'Registration successful! Please check your email to verify your account.',
      );
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-[10px] text-[#904d00] uppercase font-bold tracking-wider bg-[#ffdcc3]/50 border border-[#ffb77d] px-2.5 py-1 rounded-full inline-block">
          Starter Grant +1.00 CR
        </span>
        <h1 className="text-2xl font-extrabold text-[#191c1b] tracking-tight">Create an Account</h1>
        <p className="text-xs text-[#515f5d]">Join TimeSwap to exchange skills with your local & global community.</p>
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

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#9cf2e8]/30 border border-[#80d5cb] text-[#00504a] text-xs font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">mark_email_read</span>
          <span>{successMsg}</span>
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-xs font-bold text-[#191c1b] mb-1.5">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#e2e8f7] text-[#191c1b] text-xs placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
            />
          </div>

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
            <label htmlFor="password" className="block text-xs font-bold text-[#191c1b] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 number, 1 special symbol"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#e2e8f7] text-[#191c1b] text-xs placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
            />
            <p className="text-[11px] text-[#515f5d] mt-1">Must contain at least 8 characters, a number, and a symbol.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-[#0b6057] hover:bg-[#00473f] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      )}

      <div className="pt-2 text-center text-xs text-[#515f5d] border-t border-[#e2e8f7]">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#0b6057] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
