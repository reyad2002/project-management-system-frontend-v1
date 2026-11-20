"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterChip {
  key: string;
  /** e.g. "Status: Active" */
  label: string;
  onRemove: () => void;
}

interface FilterDrawerProps {
  /** The filter fields (Select / Input / CustomSelect ...). They apply instantly. */
  children: React.ReactNode;
  /** How many filters are currently set — shown as a badge on the icon. */
  activeCount: number;
  onClear: () => void;
  /** Applied filters, shown next to the icon so people can see (and drop) them without opening it. */
  chips?: FilterChip[];
  title?: string;
}

/**
 * Filters live behind one icon instead of eating a row of the page. Click it and a panel slides in
 * from the side with every available filter; the current selection stays visible as small chips.
 * The panel closes only via its backdrop, the X, "Done" or Escape — never on an outside click inside
 * a dropdown, so portal'd selects (CustomSelect) work inside it.
 */
export function FilterDrawer({ children, activeCount, onClear, chips = [], title = "Filters" }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          ref={triggerRef}
          type="button"
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={activeCount > 0 ? `${title} (${activeCount} active)` : title}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="ms-2 hidden sm:inline">{title}</span>
          {activeCount > 0 && (
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--primary) px-1.5 text-xs font-semibold text-(--primary-foreground)">
              {activeCount}
            </span>
          )}
        </Button>
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full border border-(--border) bg-(--muted-bg) py-0.5 ps-2.5 pe-1 text-xs text-foreground"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter ${chip.label}`}
              className="rounded-full p-0.5 text-(--muted) transition-colors hover:bg-(--card-border) hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[55]">
            <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="absolute end-0 top-0 flex h-full w-full max-w-sm flex-col border-s border-(--border) bg-(--surface) shadow-xl outline-none animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
                <h2 id={titleId} className="text-base font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="rounded-md p-1.5 text-(--muted) transition-colors hover:bg-(--muted-bg) hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">{children}</div>
              <div className="flex items-center justify-between gap-2 border-t border-(--border) px-5 py-4">
                <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}>
                  Clear all
                </Button>
                <Button type="button" size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
