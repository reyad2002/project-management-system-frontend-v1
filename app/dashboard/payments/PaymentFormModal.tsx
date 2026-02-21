"use client";

import { usePayment, useCreatePayment, useUpdatePayment } from "@/hooks/use-payments";
import { useProjectsShortList } from "@/hooks/use-projects";
import { PaymentForm, type PaymentFormData } from "@/components/payments/PaymentForm";

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  paymentId: string | null;
  defaultProjectId?: string;
}

export function PaymentFormModal({ open, onClose, paymentId, defaultProjectId }: PaymentFormModalProps) {
  const { data: payment } = usePayment(paymentId ?? null);
  const { data: projectsData } = useProjectsShortList();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment(paymentId ?? "");

  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];

  if (!open) return null;

  const handleSubmit = async (data: PaymentFormData) => {
    if (paymentId && payment) {
      await updatePayment.mutateAsync({
        project_id: data.project_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        notes: data.notes,
      });
    } else {
      await createPayment.mutateAsync({
        project_id: data.project_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        notes: data.notes,
      });
    }
    onClose();
  };

  const isLoading = createPayment.isPending || updatePayment.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()} role="button" tabIndex={0} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl">
        <div className="border-b border-[var(--card-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {paymentId ? "Edit payment" : "New payment"}
          </h2>
        </div>
        <div className="p-6">
          <PaymentForm
            payment={payment ?? undefined}
            projectOptions={projectOptions}
            defaultProjectId={defaultProjectId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
