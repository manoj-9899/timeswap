'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Dispute {
  id: string;
  session_id: string;
  initiator_user_id: string;
  respondent_user_id: string;
  dispute_reason: string;
  evidence_text?: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_outcome?: string;
  resolution_notes?: string;
  created_at: string;
  booking?: {
    id: string;
    credit_amount: number;
    requester_name: string;
    provider_name: string;
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [outcome, setOutcome] = useState<'FULL_REFUND_REQUESTER' | 'FULL_RELEASE_PROVIDER' | 'SPLIT_50_50'>(
    'FULL_REFUND_REQUESTER',
  );
  const [notes, setNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    setLoading(true);
    try {
      const res = await apiClient<Dispute[]>('/disputes/admin/all');
      if (res.success && res.data) {
        setDisputes(res.data);
      }
    } catch (err) {
      // Demo fallback
    }
    setLoading(false);
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    setMessage(null);

    try {
      const res = await apiClient(`/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolution_outcome: outcome,
          resolution_notes: notes,
        }),
      });

      if (res.success) {
        setMessage('Dispute successfully arbitrated! Escrow settled and ledger updated.');
        setSelectedDispute(null);
        setNotes('');
        fetchDisputes();
      } else {
        setMessage(res.error?.message || 'Failed to resolve dispute.');
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred during dispute resolution.');
    }
    setResolving(false);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[#0b6057] text-xs font-bold uppercase tracking-wider">Moderation & Arbitration</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">Dispute Resolution Console</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Arbitrate member disputes, review evidence, and execute balanced double-entry escrow settlements.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0b6057] text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Disputes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Active Dispute Cases</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-200 shadow-sm" />
            ))}
          </div>
        ) : disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        dispute.status === 'OPEN'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-teal-50 text-[#0b6057] border border-teal-200'
                      }`}
                    >
                      {dispute.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Case ID: {dispute.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Reason: {dispute.dispute_reason}</h3>
                  {dispute.evidence_text && (
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                      "{dispute.evidence_text}"
                    </p>
                  )}
                  {dispute.booking && (
                    <div className="text-xs text-slate-600 flex gap-4">
                      <span>Requester: <strong className="text-slate-900">{dispute.booking.requester_name}</strong></span>
                      <span>Provider: <strong className="text-slate-900">{dispute.booking.provider_name}</strong></span>
                      <span>Escrow: <strong className="text-[#0b6057]">{dispute.booking.credit_amount} cr</strong></span>
                    </div>
                  )}
                </div>

                {dispute.status === 'OPEN' ? (
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="px-4 py-2 bg-[#0b6057] hover:bg-[#084c45] text-white font-semibold text-xs rounded-xl shadow-sm transition"
                  >
                    Arbitrate Case
                  </button>
                ) : (
                  <div className="text-right text-xs">
                    <span className="text-[#0b6057] font-bold block">{dispute.resolution_outcome}</span>
                    <span className="text-slate-500 text-[11px]">{dispute.resolution_notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-sm">
            No open dispute cases requiring moderation. All session exchanges are running smoothly!
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-xl text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Arbitrate Dispute #{selectedDispute.id.slice(0, 8)}</h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Resolution Outcome</label>
                <select
                  value={outcome}
                  onChange={(e: any) => setOutcome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0b6057]"
                >
                  <option value="FULL_REFUND_REQUESTER">FULL_REFUND_REQUESTER (100% Escrow to Requester)</option>
                  <option value="FULL_RELEASE_PROVIDER">FULL_RELEASE_PROVIDER (100% Escrow to Provider)</option>
                  <option value="SPLIT_50_50">SPLIT_50_50 (50% to Requester, 50% to Provider)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Moderator Resolution Notes</label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain the findings and rationale for this arbitration ruling..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0b6057]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-[#0b6057] hover:bg-[#084c45] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {resolving ? 'Executing Settlement...' : 'Confirm Arbitration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
