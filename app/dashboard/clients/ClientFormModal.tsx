"use client";

import { useClient, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { ClientForm, type ClientFormData } from "@/components/clients/ClientForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "client-form";

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientFormModal({ open, onClose, clientId }: ClientFormModalProps) {
  const { data: client } = useClient(clientId ?? null);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient(clientId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: ClientFormData) => {
    if (clientId && client) {
      await updateClient.mutateAsync(data);
    } else {
      await createClient.mutateAsync({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        feedback: data.feedback || undefined,
      });
    }
    onClose();
  };

  const isLoading = createClient.isPending || updateClient.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={clientId ? "Edit client" : "New client"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {clientId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <ClientForm client={client ?? undefined} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
