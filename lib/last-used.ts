/**
 * Remember the last value someone picked in a form field (payment method, expense category...) so the
 * next form starts there. Per browser, best effort: storage can be blocked, so every call is guarded.
 */
const PREFIX = "last-used:";

export function lastUsed<T extends string>(key: string, fallback: T, allowed?: readonly string[]): T {
  try {
    const value = window.localStorage.getItem(PREFIX + key);
    if (value && (!allowed || allowed.includes(value))) return value as T;
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

export function rememberLast(key: string, value: string | null | undefined) {
  if (!value) return;
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    /* storage unavailable */
  }
}

/** Today's date on the person's own calendar (YYYY-MM-DD). */
export function localToday() {
  return new Date().toLocaleDateString("en-CA");
}
