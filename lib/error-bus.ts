import { getErrorMessage } from "./error-utils";

/**
 * One small message bus for the toasts in the corner: errors (red), confirmations (green) and plain info.
 * A toast can carry one action button ("Undo").
 */
const TOAST_EVENT = "app:toast";

export type ToastKind = "error" | "success" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastPayload {
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  /** ms before it disappears (default 5000). */
  duration?: number;
}

let lastMessage = "";
let lastAt = 0;

function dispatch(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  // The same message twice in a row (e.g. several queries failing together) shows once.
  const now = Date.now();
  if (payload.message === lastMessage && now - lastAt < 1500 && !payload.action) return;
  lastMessage = payload.message;
  lastAt = now;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function publishAppError(error: unknown) {
  dispatch({ kind: "error", message: getErrorMessage(error) });
}

export function toastSuccess(message: string, options?: { action?: ToastAction; duration?: number }) {
  dispatch({ kind: "success", message, ...options });
}

export function toastInfo(message: string, options?: { action?: ToastAction; duration?: number }) {
  dispatch({ kind: "info", message, ...options });
}

export function subscribeToToasts(handler: (payload: ToastPayload) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ToastPayload>).detail;
    if (detail?.message) handler(detail);
  };
  window.addEventListener(TOAST_EVENT, listener);
  return () => window.removeEventListener(TOAST_EVENT, listener);
}
