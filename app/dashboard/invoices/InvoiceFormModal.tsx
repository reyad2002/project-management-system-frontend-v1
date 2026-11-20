"use client";

import { useProjects } from "@/hooks/use-projects";
import { useCreateInvoice, useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { InvoiceForm, type InvoiceFormData } from "@/components/invoices/InvoiceForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "invoice-form";

interface InvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  /** Edit this (draft) invoice instead of creating a new one. */
  invoiceId?: string | null;
}

export function InvoiceFormModal({ open, onClose, defaultProjectId, invoiceId }: InvoiceFormModalProps) {
  const { data: projectsData } = useProjects({ limit: 100 });
  const createInvoice = useCreateInvoice();
  const { data: invoice } = useInvoice(invoiceId ?? null);
  const updateInvoice = useUpdateInvoice(invoiceId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: InvoiceFormData) => {
    const project = projectsData?.projects?.find((p) => String(p.id) === data.project_id);
    if (!project) return;
    const payload = {
      client_id: project.client_id,
      project_id: data.project_id,
      phase_id: data.phase_id || undefined,
      issue_date: data.issue_date,
      due_date: data.due_date,
      subtotal: data.subtotal,
      vat_rate: data.vat_rate,
      wht_rate: data.wht_rate,
      notes: data.notes || undefined,
    };
    if (invoiceId) await updateInvoice.mutateAsync(payload);
    else await createInvoice.mutateAsync(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={invoiceId ? "Edit invoice" : "New invoice"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={createInvoice.isPending || updateInvoice.isPending}>
            {invoiceId ? "Save changes" : "Create invoice"}
          </Button>
        </>
      }
    >
      <InvoiceForm invoice={invoiceId ? invoice : null} defaultProjectId={defaultProjectId} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
