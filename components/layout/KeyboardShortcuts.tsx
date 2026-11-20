"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { openQuickCreate } from "@/components/layout/QuickCreate";

const GO: Record<string, { href: string; label: string }> = {
  h: { href: "/dashboard/today", label: "Today" },
  t: { href: "/dashboard/tasks", label: "Tasks" },
  p: { href: "/dashboard/projects", label: "Projects" },
  c: { href: "/dashboard/clients", label: "Clients" },
  i: { href: "/dashboard/invoices", label: "Invoices" },
  e: { href: "/dashboard/expenses", label: "Expenses" },
  d: { href: "/dashboard", label: "Dashboard" },
};

const LIST: [string, string][] = [
  ["Ctrl K  or  /", "Search everything"],
  ["N", "New task"],
  ...Object.entries(GO).map(([k, v]) => [`G then ${k.toUpperCase()}`, `Go to ${v.label}`] as [string, string]),
  ["?", "Show these shortcuts"],
  ["Esc", "Close a window"],
];

/** Shortcuts never fire while you type in a field. */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest("[role=dialog]");
}

/**
 * Keyboard shortcuts for people who live in the app all day:
 * N new task, / search, G then a letter to jump (G T = tasks), ? for the list.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      const key = e.key.toLowerCase();

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        if (GO[key]) {
          e.preventDefault();
          router.push(GO[key].href);
        }
        return;
      }
      if (key === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 1200);
      } else if (key === "n") {
        e.preventDefault();
        openQuickCreate("task");
      } else if (key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event("open-global-search"));
      } else if (e.key === "?") {
        e.preventDefault();
        setHelp(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <Modal open={help} onClose={() => setHelp(false)} title="Keyboard shortcuts" size="md">
      <ul className="divide-y divide-(--border-subtle) text-sm">
        {LIST.map(([keys, what]) => (
          <li key={keys} className="flex items-center justify-between gap-4 py-2">
            <span className="text-(--foreground)">{what}</span>
            <kbd className="shrink-0 rounded border border-(--border) bg-(--muted-bg) px-2 py-0.5 text-xs text-(--muted)">{keys}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
