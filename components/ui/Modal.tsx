"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-3xl",
};

// Open dialogs, newest last: only the top one reacts to Escape / Tab (a dialog opened from a dialog,
// like "+ New client" inside the project form, must not close its parent too).
const openStack: number[] = [];
let nextModalId = 1;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, size = "md", footer, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const modalId = useRef(0);
  if (modalId.current === 0) modalId.current = nextModalId++;

  // Escape to close, Tab cycles within the dialog, and focus returns where it came from.
  useEffect(() => {
    if (!open) return;
    const me = modalId.current;
    openStack.push(me);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== me) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      const at = openStack.lastIndexOf(me);
      if (at !== -1) openStack.splice(at, 1);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Rendered on <body>: a parent with backdrop-filter or transform (the sticky header, a card) would
  // otherwise trap this "fixed" overlay inside itself instead of covering the screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-[var(--foreground)]/50"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`animate-scale-in relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-lg sm:rounded-2xl ${sizeClasses[size]}`}
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-[var(--foreground)]">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm leading-5 text-[var(--muted)]">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-m-2 shrink-0 rounded-md p-2 text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
