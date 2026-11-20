"use client";

import { useState } from "react";
import { KeyRound, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { TemporaryPasswordModal } from "@/components/accounts/TemporaryPasswordModal";
import { useAccounts, useSetAccountStatus, useResetAccountPassword } from "@/hooks/use-accounts";
import { useAuth } from "@/lib/auth-context";
import { can, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import type { Account, UserRole } from "@/lib/api";

const roleVariant: Record<UserRole, BadgeVariant> = {
  owner: "success",
  admin: "info",
  manager: "neutral",
  accountant: "warning",
  member: "neutral",
};

const statusVariant: Record<string, BadgeVariant> = {
  active: "success",
  inactive: "neutral",
  blocked: "danger",
  pending: "warning",
};

function formatWhen(iso: string | null) {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(
    new Date(iso),
  );
}

export default function AccountsPage() {
  const { user } = useAuth();
  const allowed = can(user, "accounts");
  const { data, isLoading } = useAccounts(allowed);
  const setStatus = useSetAccountStatus();
  const resetPassword = useResetAccountPassword();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [disabling, setDisabling] = useState<Account | null>(null);
  const [resetting, setResetting] = useState<Account | null>(null);
  const [shown, setShown] = useState<{ name: string; email?: string; password: string; reason: "created" | "reset" } | null>(null);

  if (!allowed) {
    return <p className="py-10 text-center text-(--muted)">Only owners and admins can manage accounts.</p>;
  }

  const accounts = data?.accounts ?? [];
  const assignable = (data?.assignableRoles ?? []) as UserRole[];
  const manageable = (a: Account) => assignable.includes(a.role) && String(a.id) !== String(user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="mt-1 text-(--muted)">Who can sign in, and what each person can do. Every change is written to the audit log.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add account
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <p className="text-(--muted)">Loading accounts...</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <Td>
                      <p className="font-medium text-foreground">
                        {a.name}
                        {String(a.id) === String(user?.id) && <span className="ml-2 text-xs text-(--muted)">(you)</span>}
                      </p>
                      <p className="text-xs text-(--muted)">{a.email}</p>
                    </Td>
                    <Td label="Role">
                      <Badge variant={roleVariant[a.role]} dot={false}>
                        {ROLE_LABELS[a.role]}
                      </Badge>
                    </Td>
                    <Td label="Status">
                      <Badge variant={statusVariant[a.status] ?? "neutral"}>{a.status}</Badge>
                      {a.must_change_password && <p className="mt-1 text-xs text-(--caution)">Must set a new password</p>}
                    </Td>
                    <Td label="Last sign-in" className="text-(--muted)">
                      {formatWhen(a.last_login_at)}
                    </Td>
                    <Td align="right">
                      {manageable(a) ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit"
                            onClick={() => {
                              setEditing(a);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Reset password" onClick={() => setResetting(a)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {a.status === "active" ? (
                            <Button variant="ghost" size="sm" aria-label="Disable" onClick={() => setDisabling(a)}>
                              <UserX className="h-4 w-4 text-(--destructive)" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Enable"
                              onClick={() => setStatus.mutate({ id: a.id, status: "active" })}
                            >
                              <UserCheck className="h-4 w-4 text-(--success)" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-(--muted)">—</span>
                      )}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What each role can do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <li key={r} className="flex flex-wrap items-baseline gap-2">
                <Badge variant={roleVariant[r]} dot={false}>
                  {ROLE_LABELS[r]}
                </Badge>
                <span className="text-(--muted)">{ROLE_DESCRIPTIONS[r]}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {formOpen && (
        <AccountFormModal
          key={editing?.id ?? "new"}
          open
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          account={editing}
          assignableRoles={assignable}
          onCreated={(r) => setShown({ ...r, reason: "created" })}
        />
      )}

      <ConfirmDialog
        open={!!disabling}
        title={`Disable ${disabling?.name ?? "this account"}?`}
        description="They are signed out immediately and can't sign in until you enable the account again."
        confirmText="Disable"
        isLoading={setStatus.isPending}
        onClose={() => setDisabling(null)}
        onConfirm={() => {
          if (!disabling) return;
          setStatus.mutate({ id: disabling.id, status: "blocked" }, { onSuccess: () => setDisabling(null) });
        }}
      />

      <ConfirmDialog
        open={!!resetting}
        title={`Reset ${resetting?.name ?? "this"}'s password?`}
        description="Their current password stops working. You'll get a temporary one to hand over; they must choose their own at next sign-in."
        confirmText="Reset password"
        isLoading={resetPassword.isPending}
        onClose={() => setResetting(null)}
        onConfirm={() => {
          if (!resetting) return;
          const target = resetting;
          resetPassword.mutate(target.id, {
            onSuccess: (res) => {
              setResetting(null);
              setShown({ name: target.name, email: target.email, password: res.temporary_password, reason: "reset" });
            },
          });
        }}
      />

      {shown && (
        <TemporaryPasswordModal
          open
          onClose={() => setShown(null)}
          name={shown.name}
          email={shown.email}
          password={shown.password}
          reason={shown.reason}
        />
      )}
    </div>
  );
}
