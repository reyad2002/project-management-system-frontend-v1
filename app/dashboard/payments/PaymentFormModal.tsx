"use client";

import { useState } from "react";
import { usePayment, useCreatePayment, useUpdatePayment } from "@/hooks/use-payments";
import { useProjectsShortList } from "@/hooks/use-projects";
import { PaymentForm, type PaymentFormData } from "@/components/payments/PaymentForm";
import { Modal } from "@/components/ui/Modal";
import { rememberLast } from "@/lib/last-used";
import { Button } from "@/components/ui/Button";

const FORM_ID = "payment-form";

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  paymentId: string | null;
  defaultProjectId?: string;
  defaultInvoiceId?: string;
}

export function PaymentFormModal({ open, onClose, paymentId, defaultProjectId, defaultInvoiceId }: PaymentFormModalProps) {
  const { data: payment } = usePayment(paymentId ?? null);
  const { data: projectsData } = useProjectsShortList();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment(paymentId ?? "");
  const [isOverpaying, setIsOverpaying] = useState(false);

  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];

  if (!open) return null;

  const handleSubmit = async (data: PaymentFormData) => {
    const payload = {
      project_id: data.project_id,
      invoice_id: data.invoice_id || null,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      type: (data.invoice_id ? "invoice_settlement" : "advance") as "invoice_settlement" | "advance",
      notes: data.notes,
    };
    if (paymentId && payment) {
      await updatePayment.mutateAsync(payload);
    } else {
      await createPayment.mutateAsync(payload);
      rememberLast("payment_method", data.payment_method);
    }
    onClose();
  };

  const isLoading = createPayment.isPending || updatePayment.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paymentId ? "Edit payment" : "New payment"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading} disabled={isOverpaying}>
            {paymentId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <PaymentForm
        payment={payment ?? undefined}
        projectOptions={projectOptions}
        defaultProjectId={defaultProjectId}
        defaultInvoiceId={defaultInvoiceId}
        formId={FORM_ID}
        onSubmit={handleSubmit}
        onOverpayingChange={setIsOverpaying}
      />
    </Modal>
  );
}
