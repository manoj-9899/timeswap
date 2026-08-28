'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.profile?.is_completed === false) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6057]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] font-sans flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 bg-[#f7faf8] border-b border-[#e2e8f7]">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffdcc3]/50 border border-[#ffb77d] shadow-sm">
            <span className="material-symbols-outlined text-[#904d00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-[#904d00] font-semibold text-xs sm:text-sm">Join a community where knowledge is the only currency.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#191c1b] max-w-4xl mx-auto tracking-tight leading-[1.15]">
            Exchange Your Time &amp; Skills.<br />
            <span className="text-[#0b6057]">Learn Anything Without Money.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#3f4947] max-w-2xl mx-auto leading-relaxed">
            1 Hour of Help = 1 Time Credit. Stop paying for expensive courses and start trading your expertise for the skills you've always wanted to learn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#0b6057] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#00473f] hover:shadow-md transition-all flex items-center justify-center gap-2 text-base shadow-sm"
            >
              <span>Join Community</span>
              <span className="opacity-80 text-xs font-normal">(1 Free Credit)</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
            <Link
              href="/discover"
              className="w-full sm:w-auto bg-white border-2 border-[#0b6057] text-[#0b6057] font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50/50 transition-all text-base text-center shadow-sm"
            >
              Browse Marketplace
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-[#e2e8f7] flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 text-xs sm:text-sm font-semibold text-[#3f4947]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#0b6057]">school</span>
              <span>10k+ Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#0b6057]">groups</span>
              <span>50k+ Members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#0b6057]">schedule</span>
              <span>1M+ Hours Swapped</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Exchange Loop (3-Step Diagram) */}
      <section className="py-20 bg-white border-b border-[#e2e8f7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-[#191c1b] tracking-tight">How TimeSwap Works</h2>
            <p className="text-base text-[#3f4947] max-w-2xl mx-auto">A simple, fair exchange system built on mutual growth and trust.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center group bg-[#fcfdfd] border border-[#e2e8f7] p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-20 h-20 rounded-2xl bg-[#eceeec] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-4xl text-[#0b6057]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0b6057] text-white font-bold text-sm mb-4">1</div>
              <h3 className="text-xl font-bold text-[#191c1b] mb-2">Share a Skill</h3>
              <p className="text-sm text-[#3f4947] leading-relaxed">Offer an hour of your time teaching or helping someone with a skill you already have.</p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center group bg-[#fcfdfd] border border-[#e2e8f7] p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-20 h-20 rounded-2xl bg-[#eceeec] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-4xl text-[#fe932c]" style={{ fontVariationSettings: "'FILL' 1" }}>generating_tokens</span>
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fe932c] text-white font-bold text-sm mb-4">2</div>
              <h3 className="text-xl font-bold text-[#191c1b] mb-2">Earn Credits</h3>
              <p className="text-sm text-[#3f4947] leading-relaxed">Receive exactly 1 Time Credit for every hour you spend helping another community member.</p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center group bg-[#fcfdfd] border border-[#e2e8f7] p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-20 h-20 rounded-2xl bg-[#eceeec] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-4xl text-[#0b6057]" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0b6057] text-white font-bold text-sm mb-4">3</div>
              <h3 className="text-xl font-bold text-[#191c1b] mb-2">Learn New Skills</h3>
              <p className="text-sm text-[#3f4947] leading-relaxed">Spend your earned credits to get 1-on-1 help in coding, languages, music, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skill Exchange Callout Section */}
      <section className="py-20 bg-[#f7faf8]">
        <div className="max-w-[1200px] mx-auto px-6 text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-[#191c1b] tracking-tight">Ready to Start Swapping?</h2>
            <p className="text-base text-[#3f4947]">
              Join thousands of community members exchanging knowledge, growing skills, and building human connection every day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-[#0b6057] hover:bg-[#00473f] text-white font-bold text-sm shadow-sm transition"
            >
              Get Started Now — Claim 1 Credit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
