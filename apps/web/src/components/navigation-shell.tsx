'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';

interface WalletSummary {
  available_balance?: number;
  availableBalance?: number;
  escrowed_balance?: number;
  escrowedBalance?: number;
}

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary>({ available_balance: 1.0, escrowed_balance: 0.0 });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/onboarding' || pathname === '/login' || pathname === '/register';
  const isLandingPage = pathname === '/';

  useEffect(() => {
    if (user) {
      fetchWalletAndNotifications();
    }
  }, [user]);

  const fetchWalletAndNotifications = async () => {
    try {
      const res = await apiClient<WalletSummary>('/wallet/balance');
      if (res.success && res.data) {
        setWallet(res.data);
      }
    } catch (err) {
      // Fallback
    }
  };

  const navItems = [
    { label: 'Discover', href: '/discover' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Bookings', href: '/bookings' },
    { label: 'Messages', href: '/messages' },
    { label: 'Wallet', href: '/wallet' },
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  const currentAvailableBalance = Number(
    wallet?.available_balance ?? wallet?.availableBalance ?? 1.0
  );
  const displayBalance = isNaN(currentAvailableBalance) ? 1.0 : currentAvailableBalance;

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e2e8f7]/60 shadow-sm transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#0b6057] text-white flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:bg-[#00473f] transition">
                ⚡
              </div>
              <span className="text-xl font-extrabold text-[#00473f] tracking-tight group-hover:text-[#0b6057] transition">
                TimeSwap
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-semibold transition py-5 border-b-2 ${
                      active
                        ? 'border-[#0b6057] text-[#0b6057]'
                        : 'border-transparent text-[#3f4947] hover:text-[#0b6057]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions / Right Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet Balance Capsule */}
                <Link
                  href="/wallet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffdcc3]/50 text-[#663500] border border-[#ffb77d] text-xs font-bold transition hover:bg-[#ffdcc3]"
                >
                  <span className="material-symbols-outlined text-xs text-[#904d00]">schedule</span>
                  <span>{Math.round(displayBalance)} CR</span>
                </Link>

                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-full text-[#3f4947] hover:text-[#0b6057] hover:bg-[#f2f4f2] transition"
                  title="Notifications"
                >
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
                  )}
                </Link>

                {/* Create Listing Primary CTA */}
                <Link
                  href="/marketplace/publish"
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-[#0b6057] hover:bg-[#00473f] text-white font-semibold text-xs transition shadow-sm"
                >
                  + Create Listing
                </Link>

                {/* Profile Pill & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-[#e0e3e1]">
                  <Link
                    href="/users/me/profile"
                    className="w-8 h-8 rounded-full bg-[#0b6057] text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition shadow-sm"
                    title={user.profile?.display_name || user.email}
                  >
                    {user.profile?.display_name?.[0] || user.email[0].toUpperCase()}
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-slate-400 hover:text-slate-700 transition px-1 font-medium"
                    title="Log out"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#3f4947] hover:text-[#0b6057] px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-lg bg-[#0b6057] hover:bg-[#00473f] text-white text-xs sm:text-sm font-semibold transition shadow-sm"
                >
                  Join TimeSwap
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-8">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2e8f7] px-4 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                active ? 'text-[#0b6057]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {isLandingPage && (
        <footer className="w-full py-12 mt-20 bg-[#e0e3e1]/30 border-t border-[#e2e8f7] transition-opacity duration-200">
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-[#515f5d]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#00473f]">TimeSwap</span>
              </div>
              <p className="text-xs text-[#515f5d]">
                Exchange skills, learn together, and grow without spending money.
              </p>
              <p className="text-[11px] text-slate-400 pt-2">
                © 2026 TimeSwap. All rights reserved.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-[#191c1b] mb-1">Platform</h4>
              <Link href="/discover" className="hover:text-[#0b6057] transition">Discover Skills</Link>
              <Link href="/marketplace" className="hover:text-[#0b6057] transition">Marketplace</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-[#191c1b] mb-1">Support</h4>
              <a href="#" className="hover:text-[#0b6057] transition">How it Works</a>
              <a href="#" className="hover:text-[#0b6057] transition">Community Rules</a>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-[#191c1b] mb-1">Legal</h4>
              <a href="#" className="hover:text-[#0b6057] transition">Terms of Service</a>
              <a href="#" className="hover:text-[#0b6057] transition">Privacy Policy</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
