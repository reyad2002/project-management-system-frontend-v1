"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { subscribeToToasts, type ToastAction, type ToastKind } from "@/lib/error-bus";

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

const STYLE: Record<ToastKind, { box: string; text: string; icon: typeof Info }> = {
  error: { box: "border-[var(--destructive)]/25 bg-[var(--destructive-bg)]", text: "text-[var(--destructive)]", icon: AlertCircle },
  success: { box: "border-[var(--success)]/25 bg-[var(--success-bg)]", text: "text-[var(--success)]", icon: CheckCircle2 },
  info: { box: "border-[var(--border)] bg-[var(--card)]", text: "text-[var(--foreground)]", icon: Info },
};

/** The toasts in the corner (top on phones, top-right on wider screens). */
export function ErrorToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const dismiss = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  useEffect(
    () =>
      subscribeToToasts(({ kind, message, action, duration }) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        // Confirmations stack up quickly; keep the three most recent.
        setToasts((current) => [...current.slice(-2), { id, kind, message, action }]);
        window.setTimeout(() => dismiss(id), duration ?? (kind === "error" ? 6000 : 4000));
      }),
    [],
  );

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-2 sm:start-auto sm:end-4 sm:w-full sm:max-w-sm" role="region" aria-label="Messages">
      {toasts.map((toast) => {
        const s = STYLE[toast.kind];
        const Icon = s.icon;
        return (
          <div
            key={toast.id}
            className={`animate-scale-in pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-md ${s.box}`}
            role={toast.kind === "error" ? "alert" : "status"}
            aria-live={toast.kind === "error" ? "assertive" : "polite"}
          >
            <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${s.text}`} strokeWidth={2} />
            <p className={`flex-1 text-sm font-medium leading-5 ${s.text}`}>{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                className={`-my-1 shrink-0 rounded-md px-2 py-1 text-sm font-semibold underline-offset-2 hover:underline ${s.text}`}
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className={`-m-1 shrink-0 rounded-md p-1 opacity-70 transition-opacity duration-150 hover:opacity-100 ${s.text}`} onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
