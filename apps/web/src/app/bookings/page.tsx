'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Booking {
  id: string;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  credit_amount: number;
  listing_title?: string;
  cancellation_reason?: string;
  cancellation_type?: string;
  provider?: { id: string; display_name: string; handle: string; avatar_url: string | null };
  requester?: { id: string; display_name: string; handle: string; avatar_url: string | null };
  session?: {
    id: string;
    delivery_format: string;
    meeting_link: string | null;
    requester_attested_at: string | null;
    provider_attested_at: string | null;
  } | null;
}

export default function BookingsListPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'needs_attestation' | 'past'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === 'all' ? '' : activeTab;
      const res = await apiClient.get<Booking[]>(`/bookings${statusParam ? `?status=${statusParam}` : ''}`);
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiClient.post<Booking>(`/bookings/${id}/accept`, {});
      if (res.success) {
        await fetchBookings();
      }
    } catch (err) {
      console.error('Accept booking error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiClient.post<Booking>(`/bookings/${id}/decline`, {});
      if (res.success) {
        await fetchBookings();
      }
    } catch (err) {
      console.error('Decline booking error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttest = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiClient.post<Booking>(`/bookings/${id}/attest-completion`, {});
      if (res.success) {
        await fetchBookings();
      }
    } catch (err) {
      console.error('Attest completion error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Pending Acceptance</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0b6057] border border-teal-200">Confirmed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0b6057] border border-teal-200 uppercase tracking-wider">
              Exchange Sessions
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">My Exchange Bookings</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Manage non-monetary skill exchange bookings, accept proposals, and attest completion.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap space-x-1 sm:space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'all'
                  ? 'bg-[#0b6057] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'upcoming'
                  ? 'bg-[#0b6057] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('needs_attestation')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'needs_attestation'
                  ? 'bg-[#0b6057] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Attestation
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'past'
                  ? 'bg-[#0b6057] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past History
            </button>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 shadow-sm" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-5 transition shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(b.status)}
                    <span className="text-xs font-bold text-[#0b6057] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      ⚡ {Math.round(b.credit_amount)} {Math.round(b.credit_amount) === 1 ? 'Credit' : 'Credits'} ({b.duration_minutes} min)
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {b.listing_title || 'TimeSwap Skill Exchange Session'}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>📅 Scheduled: {new Date(b.scheduled_start_time).toLocaleString()}</span>
                    <span>Provider: @{b.provider?.handle || 'provider'}</span>
                    <span>Requester: @{b.requester?.handle || 'requester'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {b.status === 'PENDING_ACCEPTANCE' && (
                    <>
                      <button
                        onClick={() => handleAccept(b.id)}
                        disabled={actionLoading === b.id}
                        className="px-3.5 py-2 rounded-xl bg-[#0b6057] hover:bg-[#084c45] text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
                      >
                        Accept Booking
                      </button>
                      <button
                        onClick={() => handleDecline(b.id)}
                        disabled={actionLoading === b.id}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleAttest(b.id)}
                      disabled={actionLoading === b.id}
                      className="px-3.5 py-2 rounded-xl bg-[#0b6057] hover:bg-[#084c45] text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
                    >
                      Attest Completion
                    </button>
                  )}

                  <Link
                    href={`/bookings/${b.id}`}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-200 text-center shadow-sm"
                  >
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-[#0b6057] flex items-center justify-center mx-auto text-2xl font-bold">
              📅
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Exchange Sessions Found</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have no active or historical exchange sessions in this view. Discover skill offers to book or publish a request for help in the marketplace.
            </p>
            <div className="pt-2">
              <Link
                href="/marketplace"
                className="px-5 py-2.5 rounded-xl bg-[#0b6057] hover:bg-[#084c45] text-white font-semibold text-xs shadow-sm transition inline-block"
              >
                Explore Marketplace &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
