"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface TemporaryPasswordModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  email?: string;
  password: string;
  reason: "created" | "reset";
}

export function TemporaryPasswordModal({ open, onClose, name, email, password, reason }: TemporaryPasswordModalProps) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the password is selectable on screen */
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={reason === "created" ? "Account created" : "Password reset"}
      description={`Give ${name}${email ? ` (${email})` : ""} this temporary password.`}
      footer={<Button onClick={onClose}>I&apos;ve copied it</Button>}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--muted-bg) px-3 py-2">
          <code className="flex-1 select-all break-all font-mono text-base">{password}</code>
          <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy password">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-(--muted)">
          This is the only time it is shown — it isn&apos;t stored in readable form and is hidden in the audit log.
          {` ${name}`} will be asked to choose their own password at first sign-in.
        </p>
      </div>
    </Modal>
  );
}
