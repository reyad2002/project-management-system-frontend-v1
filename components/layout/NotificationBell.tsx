"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { AppNotification } from "@/lib/api";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-(--foreground) transition-colors hover:bg-(--muted-bg)"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--destructive) px-1 text-[0.6rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-2xl border border-(--border) bg-(--card) shadow-xl">
          <div className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
            <p className="text-sm font-semibold text-(--foreground)">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-(--primary) hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-(--muted)">No notifications yet.</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => !n.is_read && onMarkRead(n.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-(--border) px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-(--muted-bg) ${
                      n.is_read ? "opacity-70" : ""
                    }`}
                  >
                    <span className="flex w-full items-center gap-2">
                      {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--primary)" />}
                      <span className="flex-1 font-medium text-(--foreground)">{n.title}</span>
                    </span>
                    {n.body && <span className="text-xs text-(--muted)">{n.body}</span>}
                    <span className="text-[0.68rem] text-(--muted)">{timeAgo(n.created_at)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
