"use client";

import { useCreateCredential } from "@/hooks/use-credentials";
import { CredentialForm } from "@/components/credentials/CredentialForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "credential-form";

interface CredentialFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function CredentialFormModal({ open, onClose, projectId }: CredentialFormModalProps) {
  const createCredential = useCreateCredential(projectId);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add credential"
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={createCredential.isPending}>
            Save
          </Button>
        </>
      }
    >
      <CredentialForm
        formId={FORM_ID}
        onSubmit={async (data) => {
          await createCredential.mutateAsync(data);
          onClose();
        }}
      />
    </Modal>
  );
}
