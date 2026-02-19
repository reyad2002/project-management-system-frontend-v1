"use client";

import { useClient, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { ClientForm, type ClientFormData } from "@/components/clients/ClientForm";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {clientId ? "Edit client" : "New client"}
        </h2>
        <div className="mt-4">
          <ClientForm
            client={client ?? undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
