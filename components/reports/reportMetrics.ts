import type { ProjectReport, ProjectType } from "@/lib/api";

export type MetricKey = "ad_spend" | "reach" | "leads" | "followers_gained" | "posts_published";

export interface MetricDef {
  key: MetricKey;
  label: string;
  money?: boolean;
  /** Whole-number fields accept empty (= not tracked); ad_spend defaults to 0. */
  allowNegative?: boolean;
}

const AD_SPEND: MetricDef = { key: "ad_spend", label: "Ad spend", money: true };
const REACH: MetricDef = { key: "reach", label: "Reach" };
const LEADS: MetricDef = { key: "leads", label: "Leads" };
const FOLLOWERS: MetricDef = { key: "followers_gained", label: "Followers gained", allowNegative: true };
const POSTS: MetricDef = { key: "posts_published", label: "Posts published" };

/** Which metrics each project type tracks (the Reports tab only exists for these types). */
export const REPORT_METRICS: Partial<Record<ProjectType, MetricDef[]>> = {
  marketing: [AD_SPEND, REACH, LEADS],
  social_media: [POSTS, REACH, FOLLOWERS, AD_SPEND],
};

export function hasReports(type: ProjectType | undefined): boolean {
  return !!type && !!REPORT_METRICS[type];
}

export function formatMonth(periodMonth: string): string {
  // period_month is "YYYY-MM-DD" (first of month). Parse as UTC so the label never shifts a month.
  const [y, m] = periodMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

export function formatMetric(def: MetricDef, report: ProjectReport): string {
  const raw = report[def.key];
  if (raw === null || raw === undefined) return "—";
  return def.money ? formatMoney(Number(raw)) : new Intl.NumberFormat("en-EG").format(Number(raw));
}

/** Cost per lead, only when both numbers exist and there is at least one lead. */
export function costPerLead(report: ProjectReport): string | null {
  const leads = report.leads;
  if (!leads || leads <= 0) return null;
  return formatMoney(Number(report.ad_spend) / leads);
}
