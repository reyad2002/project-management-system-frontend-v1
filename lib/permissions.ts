import type { User, UserRole } from "./api";

/**
 * Who may use which area. Mirrors ACCESS in the backend (api/middleware/auth.js) — the backend is the
 * real gate (it answers 403); this only decides what the UI shows so people aren't offered buttons
 * that would fail.
 */
export const ACCESS = {
  accounts: ["owner", "admin"], // create / disable accounts, audit log
  finance: ["owner", "admin", "manager", "accountant"], // invoices, payments, expenses, reports
  credentials: ["owner", "admin", "manager", "member"], // project credentials (not accountants)
} as const satisfies Record<string, readonly UserRole[]>;

export type Area = keyof typeof ACCESS;

export function can(user: Pick<User, "role"> | null | undefined, area: Area): boolean {
  return !!user && (ACCESS[area] as readonly string[]).includes(user.role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  accountant: "Accountant",
  member: "Member",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: "Everything, including accounts and the audit log. Can manage every role.",
  admin: "Everything, including accounts and the audit log. Can manage managers, accountants and members.",
  manager: "All projects, clients, meetings and finance. No account management or audit log.",
  accountant: "Finance (invoices, payments, expenses, reports) plus clients and projects. No credentials.",
  member: "Projects, clients, meetings, files and credentials. No finance.",
};
