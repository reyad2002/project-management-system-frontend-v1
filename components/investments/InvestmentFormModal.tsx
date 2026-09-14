"use client";

import { useCreateInvestment, useUpdateInvestment } from "@/hooks/use-investments";
import { InvestmentForm, type InvestmentFormData } from "@/components/investments/InvestmentForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Investment } from "@/lib/api";

const FORM_ID = "investment-form";

interface InvestmentFormModalProps {
  open: boolean;
  onClose: () => void;
  investment: Investment | null;
}

export function InvestmentFormModal({ open, onClose, investment }: InvestmentFormModalProps) {
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment(investment?.id ?? "");

  if (!open) return null;

  const handleSubmit = async (data: InvestmentFormData) => {
    if (investment) {
      await updateInvestment.mutateAsync(data);
    } else {
      await createInvestment.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createInvestment.isPending || updateInvestment.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={investment ? "Edit investment" : "New investment"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {investment ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <InvestmentForm investment={investment} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
