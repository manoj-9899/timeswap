'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface BookingModalProps {
  offerId: string;
  providerId: string;
  providerName: string;
  offerTitle: string;
  durationMinutes: number;
  deliveryFormat: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({
  offerId,
  providerId,
  providerName,
  offerTitle,
  durationMinutes,
  deliveryFormat,
  isOpen,
  onClose,
}: BookingModalProps) {
  const router = useRouter();
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [selectedFormat, setSelectedFormat] = useState<string>(deliveryFormat === 'BOTH' ? 'ONLINE' : deliveryFormat);
  const [meetingLocationNotes, setMeetingLocationNotes] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const creditCost = 1.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scheduledStartTime) {
      setError('Please select a scheduled start date and time.');
      return;
    }

    const start = new Date(scheduledStartTime);
    if (start.getTime() <= Date.now()) {
      setError('Scheduled start time must be in the future.');
      return;
    }

    if (initialMessage.trim().length < 10) {
      setError('Initial message must be at least 10 characters explaining your session goals.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{ id: string }>('/bookings', {
        service_offer_id: offerId,
        provider_id: providerId,
        scheduled_start_time: start.toISOString(),
        duration_minutes: 60,
        delivery_format: selectedFormat,
        meeting_location_notes: meetingLocationNotes.trim() || undefined,
        initial_message: initialMessage.trim(),
      });

      if (res.success && res.data?.id) {
        const bookingId = res.data.id;
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.push(`/bookings/${bookingId}`);
        }, 1200);
      } else {
        setError(res.error?.message || 'Failed to create booking request.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl my-8 text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0b6057] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Exchange Request
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Book Session with {providerName}</h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{offerTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="p-6 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-2">
            <span className="text-3xl">🎉</span>
            <h3 className="text-lg font-bold text-[#0b6057]">Booking Request Sent!</h3>
            <p className="text-xs text-slate-600">
              1 Credit locked in escrow. Redirecting to your session container...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* 1. Duration Display */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Session Duration & Credit Cost
              </label>
              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0b6057]">60 Minutes (1 Hour)</p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">1 Credit = 1 Hour of Service</p>
                </div>
                <span className="text-xs font-extrabold text-[#0b6057] bg-white px-3 py-1 rounded-full border border-teal-200">
                  ⚡ 1 Credit
                </span>
              </div>
            </div>

            {/* 2. Schedule Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Proposed Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0b6057]"
              />
            </div>

            {/* 3. Format & Location Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Session Format</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('ONLINE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    selectedFormat === 'ONLINE'
                      ? 'bg-teal-50 border-[#0b6057] text-[#0b6057]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  🌐 Online Session
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('IN_PERSON')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    selectedFormat === 'IN_PERSON'
                      ? 'bg-teal-50 border-[#0b6057] text-[#0b6057]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  📍 In-Person Meeting
                </button>
              </div>

              {selectedFormat === 'IN_PERSON' && (
                <input
                  type="text"
                  placeholder="Proposed public meeting location (e.g. Central Public Library Room B)"
                  value={meetingLocationNotes}
                  onChange={(e) => setMeetingLocationNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0b6057]"
                />
              )}
            </div>

            {/* 4. Context Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Session Goals & Introduction Message
              </label>
              <textarea
                required
                minLength={10}
                rows={3}
                placeholder="Describe what specific skills or topic you would like to cover in this exchange session..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0b6057]"
              />
            </div>

            {/* 5. Escrow Callout */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#0b6057]">🔒 Escrow Credit Guarantee</span>
                <span className="text-slate-900">1 Credit</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1 Credit will be locked in Escrow from your wallet available balance. Credits are held safely and only transferred to {providerName} after the exchange is completed.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#0b6057] hover:bg-[#084c45] text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Reserving Credits...' : 'Confirm & Reserve 1 Credit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
