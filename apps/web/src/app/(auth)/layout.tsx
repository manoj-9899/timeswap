import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-[#0b6057]">
              TimeSwap
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Non-monetary peer skill exchange</p>
        </div>
        {children}
      </div>
    </div>
  );
}
