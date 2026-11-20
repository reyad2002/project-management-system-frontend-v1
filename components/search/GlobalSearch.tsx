"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarClock, CheckSquare, FileText, Search, Truck, Users, X } from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-search";
import type { SearchResults } from "@/lib/api";
import { pushRecent, useRecents } from "@/lib/local-lists";

interface Hit {
  key: string;
  group: string;
  title: string;
  sub?: string;
  href: string;
  icon: typeof Users;
}

const GROUPS: { key: keyof SearchResults; label: string; icon: typeof Users }[] = [
  { key: "clients", label: "Clients", icon: Users },
  { key: "projects", label: "Projects", icon: Briefcase },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "vendors", label: "Vendors", icon: Truck },
  { key: "meetings", label: "Meetings", icon: CalendarClock },
];

const words = (s: string) => s.replace(/_/g, " ");

/** Flatten the grouped answer into one keyboard-navigable list. */
function toHits(r: SearchResults | undefined): Hit[] {
  if (!r) return [];
  const hits: Hit[] = [];
  for (const g of GROUPS) {
    for (const row of r[g.key] as never[]) {
      const x = row as Record<string, string | number | null>;
      const base = { group: g.label, icon: g.icon, key: `${g.key}-${x.id}` };
      if (g.key === "clients") hits.push({ ...base, title: String(x.name), sub: String(x.email ?? x.phone ?? ""), href: `/dashboard/clients/${x.id}` });
      else if (g.key === "projects") hits.push({ ...base, title: String(x.title), sub: `${words(String(x.type))} · ${words(String(x.status))}`, href: `/dashboard/projects/${x.id}` });
      else if (g.key === "tasks") hits.push({ ...base, title: String(x.title), sub: `${words(String(x.status))}${x.due_date ? ` · ${x.due_date}` : ""}`, href: `/dashboard/tasks?task=${x.id}` });
      else if (g.key === "invoices") hits.push({ ...base, title: String(x.invoice_number), sub: words(String(x.status)), href: `/dashboard/invoices/${x.id}` });
      else if (g.key === "vendors") hits.push({ ...base, title: String(x.name), sub: String(x.email ?? ""), href: `/dashboard/vendors/${x.id}` });
      else hits.push({ ...base, title: String(x.title), sub: String(x.scheduled_at).slice(0, 16).replace("T", " "), href: `/dashboard/projects/${x.project_id}` });
    }
  }
  return hits;
}

/**
 * The search box on every page: Ctrl/Cmd + K (or the magnifier in the header) opens it. Type two or more
 * letters, use the arrow keys, Enter opens the highlighted result. People only see what their role may open.
 *
 * It is drawn in a portal on <body>: the header uses backdrop-filter, which makes a "fixed" child position
 * itself inside the header instead of over the page.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const close = () => {
    setOpen(false);
    setText("");
    setQ("");
    setActive(0);
  };

  // Ctrl/Cmd + K toggles; Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    // "/" (see KeyboardShortcuts) opens it too.
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-global-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-global-search", onOpen);
    };
  }, []);

  // While it is open the page behind must not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  const { data, isFetching } = useGlobalSearch(q);
  const recents = useRecents();
  // Before typing, the box offers what you opened last.
  const hits = useMemo<Hit[]>(
    () =>
      q.length >= 2
        ? toHits(data?.results)
        : recents.map((r) => ({ ...r, group: "Recent", icon: GROUPS.find((g) => g.label === r.group)?.icon ?? Search })),
    [data, q, recents],
  );

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (hit: Hit) => {
    pushRecent({ key: hit.key, group: hit.group === "Recent" ? (recents.find((r) => r.key === hit.key)?.group ?? "Recent") : hit.group, title: hit.title, sub: hit.sub, href: hit.href });
    close();
    router.push(hit.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        title="Search (Ctrl+K)"
        className="flex h-9 items-center gap-2 rounded-full px-2.5 text-(--foreground) transition-colors hover:bg-(--muted-bg) md:border md:border-(--border) md:px-3"
      >
        <Search className="h-5 w-5 md:h-4 md:w-4" />
        <span className="hidden text-sm text-(--muted) md:inline">Search</span>
        <kbd className="hidden rounded border border-(--border) px-1.5 text-[0.65rem] text-(--muted) lg:inline">Ctrl K</kbd>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search">
            <div aria-hidden onClick={close} className="animate-fade-in absolute inset-0 bg-(--foreground)/50" />
            <div className="relative mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col px-3 pt-3 sm:pt-[10dvh]">
              <div className="animate-scale-in flex min-h-0 flex-col overflow-hidden rounded-2xl border border-(--card-border) bg-(--surface) shadow-xl">
                <div className="flex items-center gap-2 border-b border-(--border-subtle) px-3">
                  <Search className="h-5 w-5 shrink-0 text-(--muted)" />
                  <input
                    autoFocus
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActive((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter" && hits[active]) {
                        e.preventDefault();
                        go(hits[active]);
                      }
                    }}
                    placeholder="Search clients, projects, tasks, invoices..."
                    aria-label="Search"
                    role="combobox"
                    aria-expanded={hits.length > 0}
                    aria-controls="global-search-results"
                    // 16px+ keeps iPhones from zooming the page when the box is focused
                    className="h-14 min-w-0 flex-1 bg-transparent text-base text-(--foreground) outline-none placeholder:text-(--muted)"
                  />
                  <button type="button" onClick={close} aria-label="Close search" className="shrink-0 rounded-lg p-2 text-(--muted) hover:bg-(--muted-bg) hover:text-(--foreground)">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain">
                  {q.length < 2 && hits.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-(--muted)">Type at least 2 letters.</p>
                  ) : hits.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-(--muted)">{isFetching ? "Searching..." : `Nothing found for “${q}”.`}</p>
                  ) : (
                    <ul id="global-search-results" ref={listRef} role="listbox" className="p-2">
                      {hits.map((h, i) => {
                        const Icon = h.icon;
                        const showGroup = i === 0 || hits[i - 1].group !== h.group;
                        return (
                          <li key={h.key} role="presentation">
                            {showGroup && <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-(--muted) first:pt-1">{h.group}</p>}
                            <button
                              type="button"
                              role="option"
                              aria-selected={i === active}
                              data-index={i}
                              onMouseEnter={() => setActive(i)}
                              onClick={() => go(h)}
                              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-start ${i === active ? "bg-(--muted-bg)" : ""}`}
                            >
                              <Icon className="h-4 w-4 shrink-0 text-(--muted)" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-(--foreground)">{h.title}</span>
                                {h.sub && <span className="block truncate text-xs text-(--muted)">{h.sub}</span>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="hidden items-center gap-4 border-t border-(--border-subtle) bg-(--surface-sunken) px-4 py-2 text-xs text-(--muted) sm:flex">
                  <span>↑ ↓ to move</span>
                  <span>Enter to open</span>
                  <span>Esc to close</span>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
