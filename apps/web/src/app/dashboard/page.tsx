'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';

interface Offer {
  id: string;
  title: string;
  description: string;
  delivery_format: string;
  supported_durations: number[];
  city: string;
  general_district: string;
  provider?: { display_name: string; handle: string };
  skill?: { name: string };
}

interface HelpRequest {
  id: string;
  title: string;
  description: string;
  delivery_format: string;
  target_duration_minutes: number;
  urgency_tag?: string;
  requester?: { display_name: string; handle: string };
  skill?: { name: string };
}

interface Booking {
  id: string;
  status: string;
  scheduled_start_time: string;
  duration_minutes: number;
  credit_amount: number;
  provider?: { display_name: string; handle: string };
  requester?: { display_name: string; handle: string };
  offer?: { title: string };
  request?: { title: string };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [offersRes, requestsRes, bookingsRes] = await Promise.all([
          apiClient<Offer[]>('/discovery/offers?limit=4'),
          apiClient<HelpRequest[]>('/discovery/requests?limit=4'),
          apiClient<Booking[]>('/bookings?limit=3'),
        ]);

        if (offersRes.success && offersRes.data) setOffers(offersRes.data);
        if (requestsRes.success && requestsRes.data) setRequests(requestsRes.data);
        if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
      } catch (err) {
        // Handle error gracefully
      }
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'Community Member';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-[#fcfdfd] min-h-screen text-[#191c1b]">
      {/* Welcome & Wallet Banner */}
      <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <span className="text-[#0b6057] text-xs font-extrabold uppercase tracking-wider bg-[#9cf2e8]/40 border border-[#80d5cb] px-3 py-1 rounded-full inline-block">
            Community Exchange Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1b]">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-[#3f4947] text-xs sm:text-sm">
            Ready to share your skills or receive community help today?
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#f2f4f2] p-4 rounded-2xl border border-[#e2e8f7]">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#515f5d] font-bold uppercase tracking-wider block">Available Balance</span>
            <span className="text-2xl font-extrabold text-[#0b6057]">1.00 CR</span>
          </div>
          <Link
            href="/wallet"
            className="px-3.5 py-2 rounded-xl bg-[#ffdcc3] text-[#663500] hover:bg-[#ffb77d] text-xs font-bold transition flex items-center gap-1"
          >
            <span>Wallet</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/marketplace/publish?type=offer"
          className="p-6 rounded-3xl bg-white border border-[#e2e8f7] hover:border-[#0b6057] hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#9cf2e8]/40 text-[#00504a] flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
            <span className="material-symbols-outlined">lightbulb</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#191c1b] group-hover:text-[#0b6057] transition">Offer a Skill</h3>
            <p className="text-xs text-[#3f4947] mt-1">Publish what you can teach and earn credits when helping others.</p>
          </div>
        </Link>

        <Link
          href="/marketplace/publish?type=request"
          className="p-6 rounded-3xl bg-white border border-[#e2e8f7] hover:border-[#0b6057] hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
            <span className="material-symbols-outlined">front_hand</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#191c1b] group-hover:text-[#0b6057] transition">Request Help</h3>
            <p className="text-xs text-[#3f4947] mt-1">Ask the community for assistance or mentorship with a specific task.</p>
          </div>
        </Link>

        <Link
          href="/marketplace"
          className="p-6 rounded-3xl bg-white border border-[#e2e8f7] hover:border-[#0b6057] hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#f2f4f2] text-[#191c1b] flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#191c1b] group-hover:text-[#0b6057] transition">Browse Marketplace</h3>
            <p className="text-xs text-[#3f4947] mt-1">Filter active listings by skill category, format, or city location.</p>
          </div>
        </Link>
      </div>

      {/* Active Bookings / Next Session Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#191c1b]">Upcoming & Active Sessions</h2>
          <Link href="/bookings" className="text-xs font-bold text-[#0b6057] hover:underline flex items-center gap-1">
            <span>View All Bookings</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 rounded-3xl bg-white border border-[#e2e8f7] flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00504a] bg-[#9cf2e8]/40 px-3 py-1 rounded-full border border-[#80d5cb]">
                    {booking.status}
                  </span>
                  <span className="text-xs text-[#904d00] font-extrabold">
                    {booking.credit_amount.toFixed(2)} CR ({booking.duration_minutes}m)
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#191c1b]">
                  {booking.offer?.title || booking.request?.title || 'Skill Exchange Session'}
                </h3>
                <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f7] text-xs text-[#3f4947]">
                  <span>📅 {new Date(booking.scheduled_start_time).toLocaleString()}</span>
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-[#0b6057] font-bold hover:underline"
                  >
                    Manage Container →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white border border-[#e2e8f7] rounded-3xl text-center space-y-3 shadow-sm">
            <p className="text-xs text-[#515f5d]">You have no upcoming exchange sessions scheduled.</p>
            <Link
              href="/marketplace"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#0b6057] hover:bg-[#00473f] text-white text-xs font-bold shadow-sm transition"
            >
              Find a Session to Book
            </Link>
          </div>
        )}
      </div>

      {/* Discovery Recommendations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#191c1b]">Recommended Service Offers</h2>
          <Link href="/marketplace" className="text-xs font-bold text-[#0b6057] hover:underline flex items-center gap-1">
            <span>Explore All</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-[#e2e8f7] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.map((offer) => (
              <Link
                key={offer.id}
                href={`/marketplace/offers/${offer.id}`}
                className="p-5 rounded-3xl bg-white border border-[#e2e8f7] hover:border-[#0b6057] hover:shadow-md transition flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#00504a] bg-[#9cf2e8]/40 px-2.5 py-0.5 rounded-full border border-[#80d5cb]">
                      {offer.delivery_format}
                    </span>
                    <span className="text-[10px] text-[#515f5d] font-mono">
                      {offer.supported_durations.join(' / ')} min
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-[#191c1b] line-clamp-2 group-hover:text-[#0b6057] transition">
                    {offer.title}
                  </h3>
                </div>
                <div className="pt-2 border-t border-[#e2e8f7] flex items-center justify-between text-[11px] text-[#3f4947]">
                  <span>@{offer.provider?.handle || 'provider'}</span>
                  <span className="text-[#0b6057] font-bold">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
