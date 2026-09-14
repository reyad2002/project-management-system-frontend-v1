import type { BadgeVariant } from "@/components/ui/Badge";
import type {
  InvoiceStatus,
  VendorBillStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  PortalUserStatus,
  FileStatus,
  RecurringRevenueStatus,
  RecurringExpenseStatus,
  InvestmentStatus,
} from "@/lib/api";

export const invoiceStatusVariant: Record<InvoiceStatus, BadgeVariant> = {
  draft: "neutral",
  sent: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "cancelled",
};

export const vendorBillStatusVariant: Record<VendorBillStatus, BadgeVariant> = {
  pending: "neutral",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "cancelled",
};

export const projectStatusVariant: Record<ProjectStatus, BadgeVariant> = {
  draft: "neutral",
  active: "info",
  on_hold: "warning",
  completed: "success",
  cancelled: "cancelled",
};

export const taskStatusVariant: Record<TaskStatus, BadgeVariant> = {
  todo: "neutral",
  in_progress: "info",
  in_review: "warning",
  done: "success",
  blocked: "danger",
};

export const taskPriorityVariant: Record<TaskPriority, BadgeVariant> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export const portalUserStatusVariant: Record<PortalUserStatus, BadgeVariant> = {
  invited: "warning",
  active: "success",
  disabled: "cancelled",
};

export const fileStatusVariant: Record<FileStatus, BadgeVariant> = {
  pending_review: "neutral",
  approved: "success",
  needs_changes: "danger",
  rejected: "cancelled",
};

export const recurringRevenueStatusVariant: Record<RecurringRevenueStatus, BadgeVariant> = {
  active: "success",
  overdue: "danger",
  cancelled: "cancelled",
};

export const recurringExpenseStatusVariant: Record<RecurringExpenseStatus, BadgeVariant> = {
  active: "success",
  cancelled: "cancelled",
};

export const investmentStatusVariant: Record<InvestmentStatus, BadgeVariant> = {
  active: "info",
  closed: "cancelled",
};
