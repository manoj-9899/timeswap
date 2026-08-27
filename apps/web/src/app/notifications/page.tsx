'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const res = await apiClient<NotificationItem[]>('/notifications');
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (err) {
        // Fallback
      }
      setLoading(false);
    }
    loadNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiClient('/notifications/mark-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // Fallback
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return 'calendar_today';
      case 'MESSAGE':
        return 'chat_bubble';
      case 'DISPUTE':
        return 'gavel';
      case 'CREDIT':
        return 'schedule';
      default:
        return 'notifications';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 bg-[#fcfdfd] min-h-screen text-[#191c1b]">
      <div className="flex items-center justify-between border-b border-[#e2e8f7] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#191c1b] tracking-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-[#3f4947] mt-1">Updates regarding your exchange bookings, credits, and community messages.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#f2f4f2] text-[#0b6057] border border-[#e2e8f7] text-xs font-bold shadow-sm transition"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-[#e2e8f7] shadow-sm" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-3xl border flex items-start gap-4 transition shadow-sm ${
                n.is_read
                  ? 'bg-white border-[#e2e8f7] text-[#3f4947]'
                  : 'bg-[#9cf2e8]/20 border-[#80d5cb] text-[#191c1b]'
              }`}
            >
              <div className="w-11 h-11 rounded-2xl bg-[#9cf2e8]/40 border border-[#80d5cb] flex items-center justify-center text-[#00504a] flex-shrink-0">
                <span className="material-symbols-outlined text-xl">{getNotificationIcon(n.type)}</span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#191c1b]">{n.title}</h3>
                  <span className="text-[10px] text-[#515f5d] font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#3f4947]">{n.message}</p>

                {n.link_url && (
                  <Link
                    href={n.link_url}
                    className="text-xs font-bold text-[#0b6057] hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>View Details</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 bg-white border border-[#e2e8f7] rounded-3xl text-center space-y-3 max-w-md mx-auto my-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#9cf2e8]/40 border border-[#80d5cb] text-[#00504a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">notifications_active</span>
          </div>
          <h3 className="text-base font-extrabold text-[#191c1b]">You&apos;re All Caught Up!</h3>
          <p className="text-xs text-[#515f5d] leading-relaxed">
            Booking updates, session reminders, and messaging alerts will appear here when active.
          </p>
        </div>
      )}
    </div>
  );
}
