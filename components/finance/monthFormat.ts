export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

/** "2026-03" -> "March 2026" (long) or "Mar" (short). Parsed as UTC so the label never slips a month. */
export function monthName(key: string, style: "long" | "short" = "long"): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  return style === "long"
    ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(date)
    : new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
}

export function profitClass(n: number): string {
  if (n > 0) return "text-(--success)";
  if (n < 0) return "text-(--destructive)";
  return "text-(--muted)";
}
