"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

interface Group {
  head: AppNotification;
  items: AppNotification[];
}

/** Five comments on one task are one line ("5 updates"), not five. Newest first, as they come. */
function groupNotifications(list: AppNotification[]): Group[] {
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const n of list) {
    const key = n.related_id ? `${n.type}:${n.related_type}:${n.related_id}` : `single:${n.id}`;
    const existing = byKey.get(key);
    if (existing) existing.items.push(n);
    else {
      const g = { head: n, items: [n] };
      byKey.set(key, g);
      groups.push(g);
    }
  }
  return groups;
}

export function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const openNotification = (n: AppNotification) => {
    if (!n.is_read) onMarkRead(n.id);
    // Task notifications take you straight to the task.
    if (n.related_type === "task" && n.related_id && n.type !== "task_assigned_to_client") {
      setOpen(false);
      router.push(`/dashboard/tasks?task=${n.related_id}`);
    } else if (n.type === "task_escalated") {
      setOpen(false);
      router.push("/dashboard/tasks?overdue=1");
    }
  };

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
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--destructive) px-1 text-[0.6rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-11 z-40 w-80 rounded-2xl border border-(--border) bg-(--card) shadow-xl">
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
              groupNotifications(notifications).map(({ head: n, items }) => {
                const unread = items.filter((i) => !i.is_read);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        unread.slice(1).forEach((i) => onMarkRead(i.id));
                        openNotification(unread[0] ?? n);
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 border-b border-(--border) px-4 py-2.5 text-start text-sm transition-colors last:border-b-0 hover:bg-(--muted-bg) ${
                        unread.length === 0 ? "opacity-70" : ""
                      }`}
                    >
                      <span className="flex w-full items-center gap-2">
                        {unread.length > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--primary)" />}
                        <span className="flex-1 font-medium text-(--foreground)">{n.title}</span>
                        {items.length > 1 && <span className="num shrink-0 rounded-full bg-(--muted-bg) px-1.5 text-xs text-(--muted)">{items.length} updates</span>}
                      </span>
                      {n.body && <span className="text-xs text-(--muted)">{n.body}</span>}
                      <span className="text-[0.68rem] text-(--muted)">{timeAgo(n.created_at)}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
