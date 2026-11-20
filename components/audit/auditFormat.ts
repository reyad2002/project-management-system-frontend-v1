export function formatAuditTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

export const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  send: "Sent",
  cancel: "Cancelled",
  approve: "Approved",
  mark_paid: "Marked paid",
  reorder: "Reordered",
  status_change: "Status changed",
  reveal_credential: "Revealed credential",
  export: "Exported",
  password_reset: "Password reset",
  password_change: "Password changed",
  password_changed: "Password changed",
  password_change_failed: "Password change failed",
  login: "Signed in",
  login_failed: "Failed sign-in",
  login_blocked: "Blocked sign-in",
  portal_login: "Client signed in",
  portal_login_failed: "Failed client sign-in",
  accept_invite: "Accepted invite",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export const ENTITY_TYPES = [
  "client",
  "project",
  "phase",
  "payment",
  "expense",
  "invoice",
  "vendor",
  "vendor_bill",
  "meeting",
  "meeting_note",
  "project_link",
  "project_file",
  "project_report",
  "credential",
  "recurring_revenue",
  "recurring_expense",
  "investment",
  "task",
  "account",
  "client_portal_user",
];
