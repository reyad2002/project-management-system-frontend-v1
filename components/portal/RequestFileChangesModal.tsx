"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface RequestFileChangesModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  isSubmitting: boolean;
  onSubmit: (reviewNote: string) => Promise<void>;
}

export function RequestFileChangesModal({ open, onClose, fileName, isSubmitting, onSubmit }: RequestFileChangesModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request changes — ${fileName}`}
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isSubmitting}
            disabled={!reason.trim()}
            onClick={async () => {
              await onSubmit(reason.trim());
              setReason("");
            }}
          >
            Send request
          </Button>
        </>
      }
    >
      <Textarea
        label="What needs to change? *"
        placeholder="Explain what you'd like the team to fix or adjust..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
      />
    </Modal>
  );
}
