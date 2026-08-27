'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  target_duration: number;
  preferred_format: string;
  urgency: string;
  city: string;
  general_district: string;
  status: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  requester: {
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

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params?.id as string;

  const [requestData, setRequestData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal Form State
  const [proposalMsg, setProposalMsg] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposalError, setProposalError] = useState('');

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<RequestDetail>(`/requests/${requestId}`);
      if (res.success && res.data) {
        setRequestData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProposalError('');
    setProposalSuccess(false);

    if (proposalMsg.trim().length < 10) {
      setProposalError('Proposal message must be at least 10 characters.');
      return;
    }
    if (!proposedTime) {
      setProposalError('Please select a proposed start date and time.');
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const res = await apiClient.post(`/requests/${requestId}/proposals`, {
        proposed_start_time: new Date(proposedTime).toISOString(),
        duration_minutes: requestData?.target_duration || 60,
        message: proposalMsg.trim(),
      });

      if (res.success) {
        setProposalSuccess(true);
        setProposalMsg('');
      } else {
        setProposalError(res.error?.message || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      setProposalError(err.message || 'An error occurred while submitting proposal.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 mx-auto flex items-center justify-center font-bold text-[#0b6057]">
            ★
          </div>
          <p className="text-slate-600 text-sm font-medium">Loading Help Request details...</p>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Help Request Not Found</h1>
        <Link href="/marketplace" className="text-[#0b6057] hover:underline text-sm font-semibold">
          &larr; Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <Link
            href="/marketplace"
            className="text-xs text-slate-500 hover:text-slate-900 transition mb-3 inline-block font-semibold"
          >
            &larr; Back to Marketplace
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0b6057] border border-teal-200">
              {requestData.category.name}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {requestData.preferred_format === 'ONLINE' ? 'Online' : requestData.preferred_format === 'IN_PERSON' ? 'In-Person' : 'Hybrid / Both'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#b2f5ea]/60 text-[#0b6057] border border-teal-200">
              1.0 Credit Reward (1 Hour)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl leading-tight tracking-tight">
            {requestData.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Request Description & Proposal Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Request Details
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {requestData.description}
              </p>
            </div>

            {/* Submit Proposal Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Submit Proposal to Help
              </h2>

              {proposalSuccess ? (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0b6057] text-sm font-medium space-y-2">
                  <p className="font-bold">Proposal Submitted Successfully!</p>
                  <p className="text-xs">
                    Your message and proposed session start time have been sent directly to the requester.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  {proposalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {proposalError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Proposed Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={proposedTime}
                      onChange={(e) => setProposedTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0b6057]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Proposal Message / How you can help
                    </label>
                    <textarea
                      required
                      minLength={10}
                      rows={4}
                      placeholder="Introduce yourself and explain your expertise to help resolve this request..."
                      value={proposalMsg}
                      onChange={(e) => setProposalMsg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0b6057]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingProposal}
                    className="w-full py-3 rounded-xl bg-[#0b6057] hover:bg-[#084c45] font-semibold text-white text-sm shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmittingProposal ? 'Sending Proposal...' : 'Send Proposal to Requester'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Requester Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-center">
              <div className="space-y-3 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#0b6057] flex items-center justify-center font-bold text-2xl text-white shadow-sm">
                  {requestData.requester?.display_name?.[0] || 'R'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {requestData.requester?.display_name || 'Requester'}
                  </h3>
                  {requestData.requester?.handle && (
                    <Link
                      href={`/profiles/${requestData.requester.handle}`}
                      className="text-xs text-[#0b6057] hover:underline font-semibold"
                    >
                      @{requestData.requester.handle}
                    </Link>
                  )}
                </div>
              </div>

              {/* Requester Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-left">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Rating</p>
                  <p className="text-sm font-bold text-amber-600">
                    {requestData.requester?.rating_average ? `${requestData.requester.rating_average} / 5.0` : 'New'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Exchanges</p>
                  <p className="text-sm font-bold text-[#0b6057]">
                    {requestData.requester?.completed_exchanges_count || 0} completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
