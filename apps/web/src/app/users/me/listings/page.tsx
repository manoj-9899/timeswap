'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Offer {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  category: {
    name: string;
  };
}

interface HelpRequest {
  id: string;
  title: string;
  description: string;
  target_duration: number;
  status: string;
  created_at: string;
  category: {
    name: string;
  };
}

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>('offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const offersRes = await apiClient.get<Offer[]>('/users/me/offers');
      if (offersRes.success && offersRes.data) {
        setOffers(offersRes.data);
      }

      const reqRes = await apiClient.get<HelpRequest[]>('/users/me/requests');
      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data);
      }
    } catch (err) {
      console.error('Failed to load user listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferStatus = async (id: string, currentStatus: string) => {
    setActionMessage('');
    const targetEndpoint = currentStatus === 'PUBLISHED' ? `/offers/${id}/pause` : `/offers/${id}/publish`;
    try {
      const res = await apiClient.post<Offer>(targetEndpoint, {});
      if (res.success && res.data) {
        const updated = res.data;
        setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
        setActionMessage(`Offer status updated to ${updated.status}`);
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update offer status.');
    }
  };

  const archiveOffer = async (id: string) => {
    if (!confirm('Are you sure you want to archive this service offer?')) return;
    setActionMessage('');
    try {
      const res = await apiClient.post<Offer>(`/offers/${id}/archive`, {});
      if (res.success && res.data) {
        const updated = res.data;
        setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
        setActionMessage('Service offer archived.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to archive offer.');
    }
  };

  const closeRequest = async (id: string) => {
    if (!confirm('Are you sure you want to close this help request?')) return;
    setActionMessage('');
    try {
      const res = await apiClient.post<HelpRequest>(`/requests/${id}/close`, {});
      if (res.success && res.data) {
        const updated = res.data;
        setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
        setActionMessage('Help request closed.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to close request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <Link href="/marketplace" className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition mb-2 inline-block">
              &larr; Back to Marketplace
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Manage My Listings
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Control availability, pause active offers, and manage completed help requests.
            </p>
          </div>
          <Link
            href="/marketplace/publish"
            className="px-5 py-2.5 rounded-xl bg-[#0b6057] hover:bg-[#084c45] font-semibold text-white text-sm shadow-sm transition text-center"
          >
            + Create New Listing
          </Link>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0b6057] text-sm font-semibold">
            {actionMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('offers')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
              activeTab === 'offers'
                ? 'border-[#0b6057] text-[#0b6057]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Service Offers ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
              activeTab === 'requests'
                ? 'border-[#0b6057] text-[#0b6057]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Help Requests ({requests.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 shadow-sm" />
            ))}
          </div>
        ) : activeTab === 'offers' ? (
          offers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <p className="text-slate-600 font-medium">You haven't created any service offers yet.</p>
              <Link href="/marketplace/publish" className="text-sm text-[#0b6057] font-semibold hover:underline">
                Create a Service Offer &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0b6057] border border-teal-200">
                        {offer.category.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          offer.status === 'PUBLISHED'
                            ? 'bg-teal-50 text-[#0b6057]'
                            : offer.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{offer.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{offer.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <Link
                      href={`/marketplace/offers/${offer.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
                    >
                      View
                    </Link>
                    {offer.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => toggleOfferStatus(offer.id, offer.status)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition border border-amber-200"
                      >
                        {offer.status === 'PUBLISHED' ? 'Pause' : 'Publish'}
                      </button>
                    )}
                    {offer.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => archiveOffer(offer.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition border border-rose-200"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <p className="text-slate-600 font-medium">You haven't created any help requests yet.</p>
              <Link href="/marketplace/publish" className="text-sm text-[#0b6057] font-semibold hover:underline">
                Create a Help Request &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0b6057] border border-teal-200">
                        {req.category.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          req.status === 'OPEN'
                            ? 'bg-teal-50 text-[#0b6057]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{req.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <Link
                      href={`/marketplace/requests/${req.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
                    >
                      View
                    </Link>
                    {req.status === 'OPEN' && (
                      <button
                        onClick={() => closeRequest(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition border border-rose-200"
                      >
                        Close Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
