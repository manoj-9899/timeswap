'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BookingModal } from '@/components/bookings/BookingModal';

interface OfferDetail {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  supported_durations: number[];
  delivery_format: string;
  city: string;
  general_district: string;
  status: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  provider: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    city: string;
    general_district: string;
    rating_average: number;
    completed_exchanges_count: number;
    reliability_score: number;
  } | null;
}

export default function OfferDetailPage() {
  const params = useParams();
  const offerId = params?.id as string;

  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOffer() {
      if (!offerId) return;
      setLoading(true);
      try {
        const res = await apiClient.get<OfferDetail>(`/offers/${offerId}`);
        if (res.success && res.data) {
          setOffer(res.data);
        }
      } catch (err) {
        console.error('Failed to load offer:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOffer();
  }, [offerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 mx-auto flex items-center justify-center font-bold text-[#0b6057]">
            ★
          </div>
          <p className="text-slate-600 text-sm font-medium">Loading Service Offer details...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Service Offer Not Found</h1>
        <Link href="/marketplace" className="text-[#0b6057] hover:underline text-sm font-semibold">
          &larr; Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <Link
            href="/marketplace"
            className="text-xs text-slate-500 hover:text-slate-900 transition mb-3 inline-block font-semibold"
          >
            &larr; Back to Marketplace
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0b6057] border border-teal-200">
              {offer.category?.name || 'Skill Category'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {offer.delivery_format === 'ONLINE' ? 'Online' : offer.delivery_format === 'IN_PERSON' ? 'In-Person' : 'Hybrid / Both'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#b2f5ea]/60 text-[#0b6057] border border-teal-200">
              {offer.duration_minutes === 60 ? '1.0 Credit • 60 Min Session' : '0.5 Credit • 30 Min Session'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl leading-tight tracking-tight">
            {offer.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                About this Service Offer
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {offer.description}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Non-Monetary Credit System
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All exchanges on TimeSwap use equal human time credits. This 1-on-1 session costs{' '}
                <strong className="text-[#0b6057]">{offer.duration_minutes === 60 ? '1.0 Credit' : '0.5 Credit'}</strong> from your wallet upon booking completion. Credits cannot be bought or sold.
              </p>
            </div>
          </div>

          {/* Provider Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-center">
              <div className="space-y-3 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#0b6057] flex items-center justify-center font-bold text-2xl text-white shadow-sm">
                  {offer.provider?.display_name?.[0] || 'P'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {offer.provider?.display_name || 'Provider'}
                  </h3>
                  {offer.provider?.handle && (
                    <Link
                      href={`/profiles/${offer.provider.handle}`}
                      className="text-xs text-[#0b6057] hover:underline font-semibold"
                    >
                      @{offer.provider.handle}
                    </Link>
                  )}
                </div>
              </div>

              {/* Provider Trust Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-left">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Rating</p>
                  <p className="text-sm font-bold text-amber-600">
                    {offer.provider?.rating_average ? `${offer.provider.rating_average} / 5.0` : 'New'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Exchanges</p>
                  <p className="text-sm font-bold text-[#0b6057]">
                    {offer.provider?.completed_exchanges_count || 0} completed
                  </p>
                </div>
              </div>

              {/* Booking CTA Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-[#0b6057] hover:bg-[#084c45] font-semibold text-white text-sm shadow-sm transition"
                >
                  Request Exchange Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {offer.provider && (
        <BookingModal
          offerId={offer.id}
          providerId={offer.provider.id}
          providerName={offer.provider.display_name}
          offerTitle={offer.title}
          durationMinutes={offer.duration_minutes}
          deliveryFormat={offer.delivery_format}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );
}
