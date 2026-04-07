import { getErrorMessage } from "./error-utils";

const APP_ERROR_EVENT = "app:error";

export interface AppErrorPayload {
  message: string;
}

let lastPublishedMessage = "";
let lastPublishedAt = 0;

export function publishAppError(error: unknown) {
  if (typeof window === "undefined") return;

  const message = getErrorMessage(error);
  const now = Date.now();

  if (message === lastPublishedMessage && now - lastPublishedAt < 1500) {
    return;
  }

  lastPublishedMessage = message;
  lastPublishedAt = now;

  window.dispatchEvent(
    new CustomEvent<AppErrorPayload>(APP_ERROR_EVENT, { detail: { message } }),
  );
}

export function subscribeToAppErrors(
  handler: (payload: AppErrorPayload) => void,
) {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AppErrorPayload>;
    if (customEvent.detail?.message) {
      handler(customEvent.detail);
    }
  };

  window.addEventListener(APP_ERROR_EVENT, listener);

  return () => {
    window.removeEventListener(APP_ERROR_EVENT, listener);
  };
}
