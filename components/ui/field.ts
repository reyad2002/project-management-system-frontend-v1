/*
 * Shared form-field chrome. Input, Textarea, Select and CustomSelect all render the
 * same border, height, label and error treatment, so it lives here once instead of
 * drifting across four files.
 */

export const fieldControl =
  "w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] " +
  "transition-[border-color,background-color] duration-150 ease-out " +
  "placeholder:text-[var(--muted)] " +
  "disabled:cursor-not-allowed disabled:bg-[var(--muted-bg)] disabled:opacity-60";

export const fieldHeight = "h-10";

export const fieldBorder =
  "border-[var(--border)] hover:border-[var(--muted)] disabled:hover:border-[var(--border)]";

export const fieldBorderError = "border-[var(--destructive)]";

export const fieldLabel =
  "mb-2 block text-sm font-medium text-[var(--foreground)]";

export const fieldError =
  "mt-2 text-xs font-medium text-[var(--destructive)]";

/** Derives a stable id from an explicit id or the visible label text. */
export function fieldId(id?: string, label?: string) {
  return id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
}
