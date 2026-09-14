"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { subscribeToAppErrors } from "@/lib/error-bus";

interface ToastState {
  id: number;
  message: string;
}

const TOAST_DURATION_MS = 5000;

export function ErrorToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAppErrors(({ message }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, message }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, TOAST_DURATION_MS);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-scale-in pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--destructive)]/25 bg-[var(--destructive-bg)] px-4 py-3 shadow-md"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--destructive)]"
            strokeWidth={2}
          />
          <p className="flex-1 text-sm font-medium leading-5 text-[var(--destructive)]">
            {toast.message}
          </p>
          <button
            type="button"
            className="-m-1 shrink-0 rounded-md p-1 text-[var(--destructive)] opacity-70 transition-opacity duration-150 hover:opacity-100"
            onClick={() =>
              setToasts((current) => current.filter((item) => item.id !== toast.id))
            }
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
