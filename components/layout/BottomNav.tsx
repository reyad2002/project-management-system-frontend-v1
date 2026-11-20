"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, ListChecks, Menu, Sun, Users } from "lucide-react";

const ITEMS = [
  { href: "/dashboard/today", label: "Today", icon: Sun },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
] as const;

/**
 * Phones: the four places people open most, one tap away at the bottom, plus the full menu.
 * The team mostly works from their phones, where a side menu behind a button is slow to reach.
 */
export function BottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  const base = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.68rem] font-medium transition-colors";

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-(--border) bg-(--card)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`${base} ${active ? "text-(--primary)" : "text-(--muted)"}`}>
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
      <button type="button" onClick={onMenuClick} className={`${base} text-(--muted)`} aria-label="Open menu">
        <Menu className="h-5 w-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
