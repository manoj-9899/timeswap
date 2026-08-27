'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: string;
  sender_user_id: string;
  content_text: string;
  created_at: string;
}

interface Thread {
  id: string;
  booking_id: string;
  listing_title: string;
  unread_count: number;
  other_participant: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content_text: string;
    created_at: string;
  };
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const targetBookingId = searchParams.get('bookingId');
  const targetThreadId = searchParams.get('threadId');

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(targetThreadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    fetchThreadsAndInitial();
  }, [targetBookingId, targetThreadId]);

  // Polling interval for active thread (5 seconds)
  useEffect(() => {
    if (!activeThreadId) return;
    const interval = setInterval(() => {
      fetchMessages(activeThreadId, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeThreadId]);

  async function fetchThreadsAndInitial() {
    setLoading(true);
    try {
      // 1. Fetch user threads list
      const res = await apiClient<Thread[]>('/messages/threads');
      let threadList: Thread[] = [];
      if (res.success && res.data) {
        threadList = res.data;
        setThreads(threadList);
      }

      // 2. Handle target bookingId query if provided
      if (targetBookingId) {
        const bookingThreadRes = await apiClient<any>(`/messages/booking/${targetBookingId}`);
        if (bookingThreadRes.success && bookingThreadRes.data) {
          const threadData = bookingThreadRes.data;
          setActiveThreadId(threadData.id);
          if (Array.isArray(threadData.messages)) {
            setMessages(threadData.messages);
          }
          setLoading(false);
          return;
        }
      }

      // 3. Handle direct threadId or select first thread
      if (targetThreadId) {
        setActiveThreadId(targetThreadId);
        fetchMessages(targetThreadId);
      } else if (threadList.length > 0 && !activeThreadId) {
        setActiveThreadId(threadList[0].id);
        fetchMessages(threadList[0].id);
      }
    } catch (err) {
      // Demo fallback
    }
    setLoading(false);
  }

  async function fetchMessages(threadId: string, showLoadingState = true) {
    try {
      const res = await apiClient<any>(`/messages/threads/${threadId}`);
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      // Demo fallback
    }
  }

  function handleSelectThread(id: string) {
    setActiveThreadId(id);
    fetchMessages(id);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThreadId || !newMessage.trim()) return;

    setSending(true);
    try {
      const res = await apiClient.post(`/messages/threads/${activeThreadId}/messages`, {
        content_text: newMessage.trim(),
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as Message]);
        setNewMessage('');
      }
    } catch (err) {
      // Error handling
    }
    setSending(false);
  }

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[#0b6057] text-xs font-bold uppercase tracking-wider bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
          Session Coordination
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Gated Direct Messages</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          1-on-1 direct messaging context-gated to active booking exchanges. Cold outreach is strictly disabled.
        </p>
      </div>

      {/* Split Panel Chat View */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[500px] grid grid-cols-1 md:grid-cols-3 shadow-sm">
        {/* Threads List (Left Panel) */}
        <div className="border-r border-slate-200 p-4 space-y-3 bg-slate-50">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Conversations</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : threads.length > 0 ? (
            <div className="space-y-2">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition border flex items-center gap-3 ${
                    t.id === activeThreadId
                      ? 'bg-teal-50 border-teal-200 text-[#0b6057] shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#0b6057] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {t.other_participant.display_name.charAt(0)}
                  </div>
                  <div className="overflow-hidden space-y-0.5 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs truncate">{t.other_participant.display_name}</span>
                      {t.unread_count > 0 && (
                        <span className="bg-[#0b6057] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{t.listing_title}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No active message threads. Book a session to open context-gated chat!
            </div>
          )}
        </div>

        {/* Chat Conversation (Right Panel) */}
        <div className="md:col-span-2 flex flex-col justify-between p-6 bg-white">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeThread.other_participant.display_name}</h3>
                  <p className="text-xs text-[#0b6057] font-medium">{activeThread.listing_title}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                  GATED THREAD
                </span>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[300px] max-h-[400px]">
                {messages.length > 0 ? (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender_user_id === activeThread.other_participant.id ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                          m.sender_user_id === activeThread.other_participant.id
                            ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                            : 'bg-[#0b6057] text-white font-medium rounded-tr-none shadow-sm'
                        }`}
                      >
                        <p>{m.content_text}</p>
                        <span className="text-[9px] opacity-70 block text-right">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Send a message to coordinate your session logistics.
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type session message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0b6057] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-5 py-2.5 bg-[#0b6057] hover:bg-[#084c45] text-white font-semibold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a conversation to view session messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading messaging session...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
