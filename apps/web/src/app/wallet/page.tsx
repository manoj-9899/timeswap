'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface LedgerRecord {
  id: string;
  transaction_id: string;
  transaction_type: string;
  booking_id?: string;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  created_at: string;
}

interface WalletSummary {
  available_balance: number;
  escrowed_balance: number;
  total_balance: number;
  ledger_account_id: string;
  history: LedgerRecord[];
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletSummary>({
    available_balance: 1.0,
    escrowed_balance: 0.0,
    total_balance: 1.0,
    ledger_account_id: '',
    history: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadWalletData() {
      setLoading(true);
      try {
        const res = await apiClient<WalletSummary>('/wallet');
        if (res.success && res.data) {
          setWallet(res.data);
        }
      } catch (err) {
        // Fallback
      }
      setLoading(false);
    }
    loadWalletData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 bg-[#fcfdfd] min-h-screen text-[#191c1b]">
      {/* Header Banner */}
      <div className="border-b border-[#e2e8f7] pb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="text-[#663500] text-xs font-extrabold uppercase tracking-wider bg-[#ffdcc3]/50 border border-[#ffb77d] px-3 py-1 rounded-full">
            Double-Entry Ledger
          </span>
          <h1 className="text-3xl font-extrabold text-[#191c1b] tracking-tight mt-2">Time Credit Wallet</h1>
          <p className="text-xs sm:text-sm text-[#3f4947] mt-1">
            Non-monetary credit balance (60 min = 1.0 credit). Guaranteed by strict double-entry ledger rules.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0b6057] hover:bg-[#00473f] text-white transition shadow-sm"
        >
          Exchange Time Now
        </Link>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#515f5d] text-xs font-bold uppercase tracking-wider block">Available Balance</span>
              <span className="text-4xl font-extrabold text-[#0b6057] block mt-1">{wallet.available_balance.toFixed(2)} CR</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#f2f4f2] text-[#0b6057] flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
          <span className="text-xs text-[#3f4947] block pt-2">Spendable liquidity for booking sessions</span>
        </div>

        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#515f5d] text-xs font-bold uppercase tracking-wider block">Locked Escrow</span>
              <span className="text-3xl font-extrabold text-[#904d00] block mt-1">{wallet.escrowed_balance.toFixed(2)} CR</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ffdcc3] text-[#904d00] flex items-center justify-center">
              <span className="material-symbols-outlined">lock</span>
            </div>
          </div>
          <span className="text-xs text-[#3f4947] block pt-2">Locked in active bookings</span>
        </div>

        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#515f5d] text-xs font-bold uppercase tracking-wider block">Total Net Worth</span>
              <span className="text-3xl font-extrabold text-[#191c1b] block mt-1">{wallet.total_balance.toFixed(2)} CR</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f2f4f2] text-[#191c1b] flex items-center justify-center">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <span className="text-xs text-[#3f4947] block pt-2">Sum of available + escrowed credits</span>
        </div>
      </div>

      {/* Starter Grant Info Box */}
      <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ffdcc3]/60 text-[#904d00] border border-[#ffb77d] flex items-center justify-center font-bold text-xl shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#191c1b]">Onboarding Starter Grant Active</h3>
            <p className="text-xs text-[#3f4947]">
              Each new member receives 1.00 credit from the System Reserve upon completing identity setup.
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1 bg-[#9cf2e8]/40 border border-[#80d5cb] text-[#00504a] text-xs font-bold rounded-full">
          VERIFIED
        </span>
      </div>

      {/* Ledger Journal Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#191c1b]">Immutable Ledger Activity Journal</h2>
          <span className="text-xs text-[#515f5d] font-mono">Append-Only Audit Log</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white rounded-3xl border border-[#e2e8f7] animate-pulse" />
            ))}
          </div>
        ) : wallet.history.length > 0 ? (
          <div className="bg-white border border-[#e2e8f7] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f2f4f2] text-[#515f5d] font-extrabold border-b border-[#e2e8f7]">
                    <th className="py-3.5 px-5">Date & Time</th>
                    <th className="py-3.5 px-5">Transaction Type</th>
                    <th className="py-3.5 px-5">Entry Direction</th>
                    <th className="py-3.5 px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f7] text-[#191c1b]">
                  {wallet.history.map((record) => (
                    <tr key={record.id} className="hover:bg-[#f2f4f2]/50 transition-colors">
                      <td className="py-3.5 px-5 text-[#515f5d] font-mono">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-bold">
                        <span className="px-3 py-1 rounded-lg font-mono text-[11px] bg-[#f2f4f2] text-[#191c1b] border border-[#e2e8f7]">
                          {record.transaction_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            record.entry_type === 'CREDIT'
                              ? 'bg-[#9cf2e8]/40 text-[#00504a] border border-[#80d5cb]'
                              : 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30'
                          }`}
                        >
                          {record.entry_type}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-5 font-mono font-extrabold text-right text-sm ${
                          record.entry_type === 'CREDIT' ? 'text-[#0b6057]' : 'text-[#904d00]'
                        }`}
                      >
                        {record.entry_type === 'CREDIT' ? '+' : '-'}
                        {record.amount.toFixed(2)} CR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 text-center space-y-2 shadow-sm">
            <p className="text-[#191c1b] font-extrabold text-sm">Onboarding Starter Grant Journal Recorded</p>
            <p className="text-xs text-[#3f4947] max-w-md mx-auto">
              System Reserve → User Wallet (+1.00 credit). Complete booking exchanges to see double-entry audit logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
