"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { Notification, PaginatedResponse, UnreadCount } from "@/lib/types";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.get<UnreadCount>("/api/notifications/unread-count/");
      setUnreadCount(data.count);
    } catch {
      // Silently ignore — endpoint may not exist yet
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setIsLoadingNotifications(true);
      try {
        const data = await api.get<PaginatedResponse<Notification>>(
          "/api/notifications/?page_size=10"
        );
        setNotifications(data.results);
      } catch {
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/api/notifications/mark-all-read/");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.is_read) return;
    try {
      await api.patch(`/api/notifications/${notification.id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="relative header-actions" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="header-dropdown absolute top-12 z-50 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
          style={{ insetInlineEnd: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-900 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-600 font-medium transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    n.is_read ? "" : "bg-accent/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                    <div className={!n.is_read ? "" : "ml-4"}>
                      <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
