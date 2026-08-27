'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';

interface BookingDetail {
  id: string;
  status: string;
  scheduled_start_time: string;
  duration_minutes: number;
  credit_amount: number;
  delivery_format: string;
  meeting_location_notes?: string;
  meeting_url?: string;
  requester_id: string;
  provider_id: string;
  provider?: { id: string; display_name: string; handle: string };
  requester?: { id: string; display_name: string; handle: string };
  offer?: { title: string; description: string };
  request?: { title: string; description: string };
}

interface Message {
  id: string;
  sender_id?: string;
  sender_user_id?: string;
  content?: string;
  content_text?: string;
  created_at: string;
}

export default function BookingContainerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Schedule Conflict');
  const [disputeReason, setDisputeReason] = useState<string>('Provider Did Not Show Up');
  const [disputeNarrative, setDisputeNarrative] = useState<string>('');

  const bookingId = params?.id as string;

  const fetchThreadMessages = async (tId: string) => {
    try {
      const res = await apiClient<any>(`/messages/threads/${tId}`);
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      // Ignore polling error
    }
  };

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      setLoading(true);
      try {
        const res = await apiClient<BookingDetail>(`/bookings/${bookingId}`);
        if (res.success && res.data) {
          setBooking(res.data);
        }
        // Load thread for booking
        const threadRes = await apiClient<any>(`/messages/booking/${bookingId}`);
        if (threadRes.success && threadRes.data) {
          setThreadId(threadRes.data.id);
          if (Array.isArray(threadRes.data.messages)) {
            setMessages(threadRes.data.messages);
          }
        }
      } catch (err) {
        // Fallback
      }
      setLoading(false);
    }
    loadBooking();
  }, [bookingId]);

  // Polling interval for chat messages (every 5 seconds)
  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(() => {
      fetchThreadMessages(threadId);
    }, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4 bg-[#fcfdfd] min-h-screen">
        <div className="h-10 bg-white rounded-xl animate-pulse w-1/3 border border-[#e2e8f7]" />
        <div className="h-64 bg-white rounded-3xl animate-pulse border border-[#e2e8f7] shadow-sm" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center text-[#3f4947] space-y-4 max-w-md mx-auto min-h-screen bg-[#fcfdfd]">
        <p className="font-extrabold text-[#191c1b]">Booking not found or access restricted.</p>
        <Link href="/bookings" className="text-[#0b6057] font-bold text-xs hover:underline">
          ← Return to My Bookings
        </Link>
      </div>
    );
  }

  const isProvider = user?.user_id === booking.provider_id;
  const isRequester = user?.user_id === booking.requester_id;

  // Compute 12-hour cancellation cutoff rule
  const scheduledTime = new Date(booking.scheduled_start_time).getTime();
  const now = new Date().getTime();
  const hoursUntilStart = (scheduledTime - now) / (1000 * 60 * 60);
  const isEarlyCancel = hoursUntilStart >= 12;

  // Calendar .ics download trigger
  const handleDownloadIcs = () => {
    const title = booking.offer?.title || booking.request?.title || 'TimeSwap Session';
    const startDate = new Date(booking.scheduled_start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(scheduledTime + booking.duration_minutes * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeSwap Marketplace//EN
BEGIN:VEVENT
SUMMARY:TimeSwap: ${title}
DESCRIPTION:Skill Exchange Session on TimeSwap.
DTSTART:${startDate}
DTEND:${endDate}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timeswap_booking_${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAttestCompletion = async () => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await apiClient<{ status: string }>(`/bookings/${bookingId}/attest`, { method: 'POST' });
      if (res.success && res.data) {
        const updated = res.data;
        setBooking((prev) => (prev ? { ...prev, status: updated.status } : prev));
        setActionMessage('Completion confirmed! Settlement logged.');
      } else {
        setActionMessage(res.error?.message || 'Failed to attest completion.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error executing attestation.');
    }
    setActionLoading(false);
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await apiClient<{ status: string }>(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.success && res.data) {
        const updated = res.data;
        setBooking((prev) => (prev ? { ...prev, status: updated.status } : prev));
        setShowCancelModal(false);
        setActionMessage('Booking cancelled.');
      } else {
        setActionMessage(res.error?.message || 'Failed to cancel booking.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error cancelling booking.');
    }
    setActionLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !newMessage.trim()) return;
    try {
      const res = await apiClient.post(`/messages/threads/${threadId}/messages`, {
        content_text: newMessage.trim(),
      });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as Message]);
        setNewMessage('');
      }
    } catch (err) {
      // Fallback
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return { label: 'Awaiting Provider Acceptance', style: 'bg-[#ffdcc3]/50 text-[#663500] border-[#ffb77d]', icon: 'hourglass_empty' };
      case 'CONFIRMED':
        return { label: 'Confirmed - Upcoming', style: 'bg-[#9cf2e8]/40 text-[#00504a] border-[#80d5cb]', icon: 'check_circle' };
      case 'IN_PROGRESS':
        return { label: 'Session In Progress', style: 'bg-[#9cf2e8]/40 text-[#00504a] border-[#80d5cb]', icon: 'play_circle' };
      case 'NEEDS_ATTESTATION':
        return { label: 'Awaiting Completion Confirmation', style: 'bg-[#ffdcc3]/50 text-[#663500] border-[#ffb77d]', icon: 'verified' };
      case 'COMPLETED':
        return { label: 'Completed & Settled', style: 'bg-[#9cf2e8]/40 text-[#00504a] border-[#80d5cb]', icon: 'task_alt' };
      case 'CANCELLED':
        return { label: 'Cancelled', style: 'bg-[#f2f4f2] text-[#3f4947] border-[#e2e8f7]', icon: 'cancel' };
      case 'DISPUTED':
        return { label: 'Under Moderator Dispute', style: 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30', icon: 'report_problem' };
      default:
        return { label: status, style: 'bg-[#f2f4f2] text-[#3f4947] border-[#e2e8f7]', icon: 'bookmark' };
    }
  };

  const badge = getStatusBadge(booking.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 bg-[#fcfdfd] min-h-screen text-[#191c1b]">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f7] pb-4">
        <div>
          <Link href="/bookings" className="text-xs text-[#0b6057] hover:underline font-bold mb-2 inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to My Bookings</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#191c1b] tracking-tight">
            {booking.offer?.title || booking.request?.title || 'Time Exchange Container'}
          </h1>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${badge.style}`}>
          <span className="material-symbols-outlined text-sm">{badge.icon}</span>
          <span className="uppercase tracking-wider">{badge.label}</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-[#9cf2e8]/30 border border-[#80d5cb] text-[#00504a] rounded-2xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Session Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#e2e8f7] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2f4f2] text-[#0b6057] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#515f5d] block font-bold uppercase tracking-wider">Scheduled Time</span>
                  <span className="text-xs font-extrabold text-[#191c1b]">
                    {new Date(booking.scheduled_start_time).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2f4f2] text-[#0b6057] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#515f5d] block font-bold uppercase tracking-wider">Duration</span>
                  <span className="text-xs font-extrabold text-[#191c1b]">{booking.duration_minutes} Minutes</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">lock_clock</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#515f5d] block font-bold uppercase tracking-wider">Escrow Hold</span>
                  <span className="text-xs font-extrabold text-[#191c1b]">{Math.round(booking.credit_amount)} CR</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#f7faf8] p-4 rounded-2xl border border-[#e2e8f7] space-y-1">
                <span className="text-[10px] text-[#0b6057] uppercase font-bold tracking-wider block">Provider (Helper)</span>
                <p className="text-sm font-extrabold text-[#191c1b]">{booking.provider?.display_name || 'Provider'}</p>
                <p className="text-xs text-[#515f5d]">@{booking.provider?.handle || 'handle'}</p>
              </div>
              <div className="bg-[#f7faf8] p-4 rounded-2xl border border-[#e2e8f7] space-y-1">
                <span className="text-[10px] text-[#0b6057] uppercase font-bold tracking-wider block">Requester (Learner)</span>
                <p className="text-sm font-extrabold text-[#191c1b]">{booking.requester?.display_name || 'Requester'}</p>
                <p className="text-xs text-[#515f5d]">@{booking.requester?.handle || 'handle'}</p>
              </div>
            </div>

            {/* Meeting Venue & Calendar */}
            <div className="bg-[#f2f4f2] p-4 rounded-2xl border border-[#e2e8f7] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#191c1b]">Format: {booking.delivery_format}</span>
                <button
                  onClick={handleDownloadIcs}
                  className="text-xs text-[#0b6057] hover:underline font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">event</span>
                  <span>Add to Calendar (.ics)</span>
                </button>
              </div>
              {booking.meeting_url && (
                <p className="text-xs text-[#3f4947]">
                  <span className="font-bold text-[#515f5d]">Meeting Link: </span>
                  <a href={booking.meeting_url} target="_blank" rel="noreferrer" className="text-[#0b6057] underline font-bold">
                    {booking.meeting_url}
                  </a>
                </p>
              )}
              {booking.meeting_location_notes && (
                <p className="text-xs text-[#3f4947]">
                  🔒 Private Venue Notes: {booking.meeting_location_notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {['CONFIRMED', 'IN_PROGRESS', 'NEEDS_ATTESTATION'].includes(booking.status) && (
                <button
                  disabled={actionLoading}
                  onClick={handleAttestCompletion}
                  className="px-6 py-3 rounded-xl bg-[#0b6057] hover:bg-[#00473f] text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Confirm Session Completed</span>
                </button>
              )}

              {['PENDING_ACCEPTANCE', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-5 py-3 rounded-xl bg-white border border-[#e2e8f7] text-[#3f4947] hover:bg-[#f2f4f2] font-bold text-xs transition"
                >
                  Cancel Booking
                </button>
              )}

              {['NEEDS_ATTESTATION', 'COMPLETED', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="px-5 py-3 rounded-xl bg-white border border-[#ba1a1a]/30 text-[#93000a] hover:bg-[#ffdad6]/50 font-bold text-xs transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Report Issue / Dispute</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Chat Container */}
        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-5 flex flex-col justify-between h-[520px] shadow-sm">
          <div className="border-b border-[#e2e8f7] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#191c1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0b6057]">chat</span>
                <span>Session Context Chat</span>
              </h3>
              <p className="text-[10px] text-[#515f5d]">Coordinate meeting details with partner.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {messages.length > 0 ? (
              messages.map((m) => {
                const senderId = m.sender_user_id || m.sender_id;
                const isMe = senderId === user?.user_id;
                const textContent = m.content_text || m.content;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0b6057] text-white rounded-br-none font-medium'
                          : 'bg-[#f2f4f2] text-[#191c1b] rounded-bl-none border border-[#e2e8f7] font-medium'
                      }`}
                    >
                      {textContent}
                    </div>
                    <span className="text-[9px] text-[#515f5d] mt-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-[#515f5d] pt-12 space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#515f5d]/50">forum</span>
                <p>No messages yet. Send a greeting to coordinate!</p>
              </div>
            )}
          </div>

          {['COMPLETED', 'CANCELLED'].includes(booking.status) ? (
            <div className="p-3 bg-[#f2f4f2] rounded-xl border border-[#e2e8f7] text-center text-xs text-[#515f5d] font-semibold">
              🔒 Chat locked post-settlement.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-[#e2e8f7]">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-xs focus:outline-none focus:border-[#0b6057]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0b6057] hover:bg-[#00473f] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-[#191c1b]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#e2e8f7] rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#93000a] uppercase tracking-wider block">
                {isEarlyCancel ? 'Early Cancellation Notice' : 'Late Cancellation Notice (<12 Hours)'}
              </span>
              <h3 className="text-lg font-extrabold text-[#191c1b]">Confirm Cancellation</h3>
              <p className="text-xs text-[#3f4947] leading-relaxed bg-[#f2f4f2] p-4 rounded-2xl border border-[#e2e8f7]">
                {isEarlyCancel
                  ? 'Notice: Cancelling more than 12 hours in advance will immediately refund 100% of escrowed credits back to your wallet.'
                  : 'Warning: Cancelling within 12 hours of session start will award your escrowed credits to the Provider as indemnity compensation for reserved time.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1b] mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-xs focus:outline-none focus:border-[#0b6057]"
              >
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="Emergency">Emergency</option>
                <option value="Misunderstanding">Misunderstanding</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-white border border-[#e2e8f7] text-[#3f4947] text-xs font-bold rounded-xl"
              >
                Keep Booking
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-[#191c1b]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#e2e8f7] rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0b6057] uppercase tracking-wider block">Moderator Arbitration</span>
              <h3 className="text-lg font-extrabold text-[#191c1b]">Report Issue / Open Dispute</h3>
              <p className="text-xs text-[#3f4947]">
                Opening a dispute halts auto-settlement and freezes escrowed credits while a moderator reviews transcripts.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1b] mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-xs focus:outline-none focus:border-[#0b6057]"
                >
                  <option value="Provider Did Not Show Up">Provider Did Not Show Up</option>
                  <option value="Requester Did Not Show Up">Requester Did Not Show Up</option>
                  <option value="Severe Technical Failure">Severe Technical Failure</option>
                  <option value="Skill Misrepresentation">Skill Misrepresentation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1b] mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={disputeNarrative}
                  onChange={(e) => setDisputeNarrative(e.target.value)}
                  placeholder="Describe what occurred during the session..."
                  className="w-full p-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-xs focus:outline-none focus:border-[#0b6057]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 bg-white border border-[#e2e8f7] text-[#3f4947] text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setActionMessage('Dispute case submitted for moderator review.');
                }}
                className="px-4 py-2 bg-[#0b6057] hover:bg-[#00473f] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
