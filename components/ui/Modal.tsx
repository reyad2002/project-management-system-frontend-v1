"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, description, size = "md", footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
      />
      <div
        className={`animate-scale-in relative flex max-h-[90vh] w-full ${sizeClasses[size]} flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl`}
      >
        <div className="shrink-0 border-b border-[var(--card-border)] px-5 py-3.5">
          <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
          {description && <div className="mt-1 text-xs text-[var(--muted)]">{description}</div>}
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--card-border)] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
