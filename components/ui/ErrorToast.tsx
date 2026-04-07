"use client";

import { useEffect, useState } from "react";
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
      className="pointer-events-none fixed right-4 top-4 flex w-full max-w-sm flex-col gap-2"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-red-700">{toast.message}</p>
            <button
              type="button"
              className="text-lg leading-none text-red-500 transition hover:text-red-700"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
