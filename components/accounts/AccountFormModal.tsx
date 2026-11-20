"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-accounts";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import type { Account, UserRole } from "@/lib/api";

const FORM_ID = "account-form";

interface AccountFormModalProps {
  open: boolean;
  onClose: () => void;
  /** null = create a new account. */
  account: Account | null;
  assignableRoles: UserRole[];
  onCreated: (result: { name: string; email: string; password: string }) => void;
}

export function AccountFormModal({ open, onClose, account, assignableRoles, onCreated }: AccountFormModalProps) {
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [role, setRole] = useState<UserRole>(account?.role ?? assignableRoles[assignableRoles.length - 1] ?? "member");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const editing = !!account;
  const options = assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!editing && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email");
    if (!editing && password && password.length < 10) return setError("Password must be at least 10 characters (or leave it empty to generate one)");
    setError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: account.id, name: name.trim(), role });
        onClose();
      } else {
        const created = await create.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          role,
          ...(password ? { password } : {}),
        });
        onCreated({ name: created.name, email: created.email, password: created.temporary_password });
        onClose();
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Couldn't save the account");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit account" : "New account"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={create.isPending || update.isPending}>
            {editing ? "Update" : "Create account"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="form-stagger space-y-4">
        <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email *"
          type="email"
          value={email}
          disabled={editing}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <CustomSelect label="Role *" options={options} value={role} onChange={(v) => setRole(v as UserRole)} />
          <p className="mt-1 text-xs text-(--muted)">{ROLE_DESCRIPTIONS[role]}</p>
        </div>
        {!editing && (
          <Input
            label="Password (optional)"
            type="text"
            autoComplete="off"
            placeholder="Leave empty to generate a strong one"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-(--destructive)">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
