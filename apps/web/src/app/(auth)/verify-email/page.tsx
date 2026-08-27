'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token missing in link.');
      return;
    }

    async function verify() {
      const res = await apiClient('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (res.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(res.error?.message || 'Email verification failed or link expired.');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md text-center">
      {status === 'verifying' && (
        <div>
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Verifying your email...</h1>
          <p className="text-sm text-slate-400">Please wait while we activate your account.</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="w-12 h-12 bg-teal-950 border border-teal-500 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ✓
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-sm text-slate-400 mb-6">
            Your TimeSwap account is now active. You can now log in and start exchanging skills.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Continue to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="w-12 h-12 bg-red-950 border border-red-500 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-sm text-slate-400 mb-6">{errorMessage}</p>
          <Link
            href="/register"
            className="inline-block w-full py-3 px-4 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Return to Registration
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Loading verification state...
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
