"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ChangePasswordModalProps {
  open: boolean;
  /** Forced = the account was created / reset by an admin: the dialog can't be dismissed until done. */
  forced?: boolean;
  onClose: () => void;
}

const FORM_ID = "change-password-form";
const MIN_LENGTH = 10;

export function ChangePasswordModal({ open, forced = false, onClose }: ChangePasswordModalProps) {
  const { user, setUser, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters`);
    if (next !== confirm) return setError("The two new passwords don't match");
    if (next === current) return setError("New password must be different from the current one");
    setError(null);
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      if (user) setUser({ ...user, must_change_password: false });
      setCurrent("");
      setNext("");
      setConfirm("");
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Couldn't change the password",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={forced ? () => {} : onClose}
      title={forced ? "Choose a new password" : "Change password"}
      description={
        forced ? "An administrator created or reset this account. Pick your own password to continue." : undefined
      }
      footer={
        <>
          {forced ? (
            <Button type="button" variant="outline" onClick={() => logout()}>
              <LogOut className="me-2 h-4 w-4" />
              Log out
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" form={FORM_ID} loading={saving}>
            Save password
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={forced ? "Temporary password *" : "Current password *"}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          label={`New password * (at least ${MIN_LENGTH} characters)`}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          label="Repeat new password *"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-(--destructive)">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
