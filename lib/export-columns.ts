import type {
  AuditLogEntry,
  Client,
  Expense,
  Invoice,
  Payment,
  Project,
  ProjectReport,
  ProjectType,
  RecurringExpense,
  RecurringRevenue,
  Task,
  Vendor,
} from "./api";
import { BILLING_MODELS, COST_CATEGORIES, EXPENSE_TYPES, PAYMENT_METHODS, PROJECT_TYPES, TASK_PRIORITIES, TASK_STATUSES } from "./constants";
import { REPORT_METRICS } from "../components/reports/reportMetrics";
import type { ExportColumn } from "./export";

/** id -> display name, supplied by the page (it already has the project / client lists loaded). */
export type NameLookup = (id: string | number | null | undefined) => string;

function labelOf(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((i) => i.value === value)?.label ?? value ?? "";
}
const yesNo = (v: boolean | null | undefined) => (v ? "Yes" : "No");
const words = (s: string | null | undefined) => (s ?? "").replace(/_/g, " ");

export const projectColumns = (clientName: NameLookup): ExportColumn<Project>[] => [
  { header: "ID", value: (r) => r.id, kind: "number", width: 8 },
  { header: "Title", value: (r) => r.title, width: 32 },
  { header: "Client", value: (r) => clientName(r.client_id), width: 24 },
  { header: "Type", value: (r) => labelOf(PROJECT_TYPES, r.type) },
  { header: "Billing", value: (r) => labelOf(BILLING_MODELS, r.billing_model), width: 22 },
  { header: "Status", value: (r) => words(r.status) },
  { header: "Price", value: (r) => r.price, kind: "money" },
  { header: "Client ad budget", value: (r) => r.ad_budget, kind: "money" },
  { header: "Start date", value: (r) => r.start_date },
  { header: "Due date", value: (r) => r.due_date },
  { header: "Test project", value: (r) => yesNo(r.is_test), width: 12 },
  { header: "Created", value: (r) => r.created_at?.slice(0, 10) },
];

export const clientColumns: ExportColumn<Client>[] = [
  { header: "ID", value: (r) => r.id, kind: "number", width: 8 },
  { header: "Name", value: (r) => r.name, width: 28 },
  { header: "Email", value: (r) => r.email, width: 28 },
  { header: "Phone", value: (r) => r.phone },
  { header: "Address", value: (r) => r.address, width: 32 },
  { header: "Notes", value: (r) => r.notes, width: 36 },
  { header: "Created", value: (r) => r.created_at?.slice(0, 10) },
];

export const paymentColumns = (projectName: NameLookup): ExportColumn<Payment>[] => [
  { header: "Date", value: (r) => r.payment_date },
  { header: "Project", value: (r) => projectName(r.project_id), width: 32 },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Method", value: (r) => labelOf(PAYMENT_METHODS, r.payment_method) },
  { header: "Type", value: (r) => words(r.type) },
  { header: "Invoice ID", value: (r) => r.invoice_id, width: 12 },
  { header: "Notes", value: (r) => r.notes, width: 40 },
];

export const expenseColumns = (projectName: NameLookup): ExportColumn<Expense>[] => [
  { header: "Date", value: (r) => r.expense_date },
  { header: "Title", value: (r) => r.title, width: 34 },
  { header: "Type", value: (r) => labelOf(EXPENSE_TYPES, r.type) },
  { header: "Category", value: (r) => labelOf(COST_CATEGORIES, r.cost_category), width: 28 },
  { header: "Project", value: (r) => projectName(r.project_id), width: 30 },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Description", value: (r) => r.description, width: 40 },
];

export const invoiceColumns = (projectName: NameLookup, clientName: NameLookup): ExportColumn<Invoice>[] => [
  { header: "Invoice #", value: (r) => r.invoice_number, width: 16 },
  { header: "Project", value: (r) => projectName(r.project_id), width: 30 },
  { header: "Client", value: (r) => clientName(r.client_id), width: 24 },
  { header: "Issue date", value: (r) => r.issue_date },
  { header: "Due date", value: (r) => r.due_date },
  { header: "Subtotal", value: (r) => r.subtotal, kind: "money" },
  { header: "VAT %", value: (r) => r.vat_rate, kind: "number", width: 8 },
  { header: "VAT amount", value: (r) => r.vat_amount, kind: "money" },
  { header: "WHT %", value: (r) => r.wht_rate, kind: "number", width: 8 },
  { header: "WHT amount", value: (r) => r.wht_amount, kind: "money" },
  { header: "Total", value: (r) => r.total_amount, kind: "money" },
  { header: "Paid", value: (r) => r.paid_amount, kind: "money" },
  { header: "Remaining", value: (r) => r.remaining_amount, kind: "money" },
  { header: "Status", value: (r) => words(r.status) },
  { header: "Notes", value: (r) => r.notes, width: 36 },
];

export const vendorColumns: ExportColumn<Vendor>[] = [
  { header: "Name", value: (r) => r.name, width: 28 },
  { header: "Tax ID", value: (r) => r.tax_id },
  { header: "Email", value: (r) => r.email, width: 28 },
  { header: "Phone", value: (r) => r.phone },
  { header: "Address", value: (r) => r.address, width: 32 },
  { header: "Default WHT %", value: (r) => r.default_wht_rate, kind: "number", width: 14 },
  { header: "Notes", value: (r) => r.notes, width: 36 },
];

export const subscriptionColumns: ExportColumn<RecurringExpense>[] = [
  { header: "Service", value: (r) => r.name, width: 28 },
  { header: "Project", value: (r) => r.project_title, width: 28 },
  { header: "Type", value: (r) => words(r.type) },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Cycle", value: (r) => r.billing_cycle },
  { header: "Next due", value: (r) => r.next_due_date },
  { header: "Last paid", value: (r) => r.last_paid_date },
  { header: "Status", value: (r) => r.status },
  { header: "Auto-deduct", value: (r) => yesNo(r.auto_charge), width: 12 },
  { header: "Notes", value: (r) => r.notes, width: 36 },
];

export const hostingColumns: ExportColumn<RecurringRevenue>[] = [
  { header: "Type", value: (r) => words(r.type) },
  { header: "Client", value: (r) => r.client_name, width: 26 },
  { header: "Project", value: (r) => r.project_title, width: 28 },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Cycle", value: (r) => r.billing_cycle },
  { header: "Next renewal", value: (r) => r.next_renewal_date },
  { header: "Last paid", value: (r) => r.last_paid_date },
  { header: "Status", value: (r) => r.status },
  { header: "Notes", value: (r) => r.notes, width: 36 },
];

export const auditColumns: ExportColumn<AuditLogEntry>[] = [
  {
    header: "When (Cairo)",
    value: (r) =>
      new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "Africa/Cairo" }).format(
        new Date(r.occurred_at),
      ),
    width: 24,
  },
  { header: "Who", value: (r) => r.actor_name, width: 22 },
  { header: "Who is", value: (r) => (r.actor_type === "client_portal_user" ? "client" : r.actor_type) },
  { header: "Action", value: (r) => words(r.action), width: 20 },
  { header: "Record", value: (r) => words(r.entity_type), width: 20 },
  { header: "Record ID", value: (r) => r.entity_id, width: 10 },
  { header: "Result", value: (r) => r.outcome },
  { header: "Status code", value: (r) => r.status_code, kind: "number", width: 12 },
  { header: "Summary", value: (r) => r.summary, width: 60 },
  { header: "IP", value: (r) => r.ip, width: 18 },
];

type AgingInvoice = { invoice_number: string; client_name: string; due_date: string; days_overdue: number; bucket: string; remaining_amount: number };
type AgingBill = { bill_number: string | null; vendor_name: string; due_date: string; days_overdue: number; bucket: string; remaining_amount: number };

const bucketLabels: Record<string, string> = {
  current: "Current",
  "1_30": "1-30 days",
  "31_60": "31-60 days",
  "61_90": "61-90 days",
  over_90: "90+ days",
};

export const arAgingColumns: ExportColumn<AgingInvoice>[] = [
  { header: "Invoice #", value: (r) => r.invoice_number, width: 16 },
  { header: "Client", value: (r) => r.client_name, width: 28 },
  { header: "Due date", value: (r) => r.due_date },
  { header: "Days overdue", value: (r) => r.days_overdue, kind: "number", width: 14 },
  { header: "Bucket", value: (r) => bucketLabels[r.bucket] ?? r.bucket },
  { header: "Remaining", value: (r) => r.remaining_amount, kind: "money" },
];

export const apAgingColumns: ExportColumn<AgingBill>[] = [
  { header: "Bill #", value: (r) => r.bill_number, width: 16 },
  { header: "Vendor", value: (r) => r.vendor_name, width: 28 },
  { header: "Due date", value: (r) => r.due_date },
  { header: "Days overdue", value: (r) => r.days_overdue, kind: "number", width: 14 },
  { header: "Bucket", value: (r) => bucketLabels[r.bucket] ?? r.bucket },
  { header: "Remaining", value: (r) => r.remaining_amount, kind: "money" },
];

// ---- Monthly reports of a marketing / social-media project ----
export function reportColumns(projectType: ProjectType): ExportColumn<ProjectReport>[] {
  const metrics = REPORT_METRICS[projectType] ?? [];
  const hasCostPerLead = metrics.some((m) => m.key === "leads") && metrics.some((m) => m.key === "ad_spend");
  return [
    // YYYY-MM sorts correctly in Excel; the full month name lives in the app.
    { header: "Month", value: (r) => r.period_month.slice(0, 7), width: 10 },
    ...metrics.map<ExportColumn<ProjectReport>>((m) => ({
      header: m.label,
      value: (r) => r[m.key],
      kind: m.money ? "money" : "number",
    })),
    ...(hasCostPerLead
      ? [
          {
            header: "Cost per lead",
            value: (r: ProjectReport) => (r.leads && r.leads > 0 ? Number(r.ad_spend) / r.leads : null),
            kind: "money" as const,
          },
        ]
      : []),
    { header: "Summary", value: (r) => r.summary, width: 60 },
  ];
}

/** "Clinica / Booking" -> "Clinica-Booking": safe inside a file name, Arabic letters kept. */
export function fileSafe(name: string | undefined, fallback: string): string {
  const cleaned = (name ?? "").trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export const taskColumns: ExportColumn<Task>[] = [
  { header: "ID", value: (r) => r.id, kind: "number", width: 8 },
  { header: "Title", value: (r) => r.title, width: 36 },
  { header: "Project", value: (r) => r.project_title ?? "Internal", width: 28 },
  { header: "Status", value: (r) => labelOf(TASK_STATUSES, r.status), width: 14 },
  { header: "Priority", value: (r) => labelOf(TASK_PRIORITIES, r.priority), width: 10 },
  { header: "Assignee", value: (r) => (r.assignee_type === "client" ? r.client_assignee_name : r.assignee_name), width: 20 },
  { header: "Start date", value: (r) => r.start_date },
  { header: "Due date", value: (r) => r.due_date },
  { header: "Completed", value: (r) => r.completed_at?.slice(0, 10) },
  { header: "Checklist", value: (r) => (r.checklist_progress.total ? `${r.checklist_progress.done}/${r.checklist_progress.total}` : ""), width: 10 },
  { header: "Sub-tasks", value: (r) => r.subtasks_count, kind: "number", width: 10 },
  { header: "From meeting", value: (r) => yesNo(r.source === "meeting"), width: 12 },
  { header: "Created", value: (r) => r.created_at?.slice(0, 10) },
];
