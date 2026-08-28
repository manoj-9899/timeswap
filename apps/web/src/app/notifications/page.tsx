'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface NotificationItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body_text: string;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsApiResponse {
  items: NotificationItem[];
  unread_count: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'BOOKINGS' | 'SYSTEM'>('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient<NotificationsApiResponse>('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markSingleAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Fallback
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Fallback
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.startsWith('BOOKING') || type.startsWith('SESSION') || type.startsWith('COMPLETION')) {
      return 'calendar_today';
    }
    if (type.startsWith('STARTER') || type.startsWith('CREDIT')) {
      return 'schedule';
    }
    if (type.startsWith('DISPUTE')) {
      return 'gavel';
    }
    if (type.startsWith('REVIEW')) {
      return 'star';
    }
    return 'notifications';
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'BOOKINGS') return n.notification_type.startsWith('BOOKING') || n.notification_type.startsWith('SESSION') || n.notification_type.startsWith('COMPLETION');
    if (filter === 'SYSTEM') return n.notification_type.startsWith('STARTER') || n.notification_type.startsWith('CREDIT') || n.notification_type.startsWith('DISPUTE');
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 bg-[#fcfdfd] min-h-screen text-[#191c1b]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e2e8f7] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1b] tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ba1a1a] text-white text-xs font-bold shadow-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#3f4947] mt-1">
            Stay updated with your TimeSwap booking requests, session reminders, credit grants, and disputes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white hover:bg-[#f2f4f2] text-[#0b6057] border border-[#e2e8f7] text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'BOOKINGS', label: 'Bookings' },
          { id: 'SYSTEM', label: 'Wallet & System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === tab.id
                ? 'bg-[#0b6057] text-white shadow-xs'
                : 'bg-white text-[#3f4947] border border-[#e2e8f7] hover:bg-[#f2f4f2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-[#e2e8f7] shadow-xs" />
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markSingleAsRead(n.id, n.is_read)}
              className={`p-5 rounded-3xl border flex items-start gap-4 transition shadow-xs cursor-pointer group ${
                n.is_read
                  ? 'bg-white border-[#e2e8f7] text-[#3f4947] hover:border-[#80d5cb]'
                  : 'bg-[#9cf2e8]/15 border-[#80d5cb] text-[#191c1b] hover:bg-[#9cf2e8]/25'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition ${
                  n.is_read
                    ? 'bg-[#f2f4f2] text-[#3f4947] border border-[#e2e8f7]'
                    : 'bg-[#0b6057] text-white shadow-xs'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{getNotificationIcon(n.notification_type)}</span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#191c1b]">{n.title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#0b6057]" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#515f5d] font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-[#3f4947]">{n.body_text}</p>

                {n.action_url && (
                  <div className="pt-1">
                    <Link
                      href={n.action_url}
                      className="text-xs font-bold text-[#0b6057] hover:underline inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 bg-white border border-[#e2e8f7] rounded-3xl text-center space-y-3 max-w-md mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#9cf2e8]/40 border border-[#80d5cb] text-[#00504a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">notifications_active</span>
          </div>
          <h3 className="text-base font-extrabold text-[#191c1b]">
            {filter === 'UNREAD' ? 'No Unread Notifications' : "You're All Caught Up!"}
          </h3>
          <p className="text-xs text-[#515f5d] leading-relaxed">
            Booking requests, session attestations, and credit grants will appear here when active.
          </p>
        </div>
      )}
    </div>
  );
}
