"use client";

import { useCreateRecurringRevenue, useUpdateRecurringRevenue } from "@/hooks/use-recurring-revenue";
import { RecurringRevenueForm, type RecurringRevenueFormData } from "@/components/recurring-revenue/RecurringRevenueForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { RecurringRevenue } from "@/lib/api";

const FORM_ID = "recurring-revenue-form";

interface RecurringRevenueFormModalProps {
  open: boolean;
  onClose: () => void;
  record: RecurringRevenue | null;
}

export function RecurringRevenueFormModal({ open, onClose, record }: RecurringRevenueFormModalProps) {
  const createRecord = useCreateRecurringRevenue();
  const updateRecord = useUpdateRecurringRevenue(record?.id ?? "");

  if (!open) return null;

  const handleSubmit = async (data: RecurringRevenueFormData) => {
    const payload = {
      client_id: data.client_id,
      project_id: data.project_id || null,
      type: data.type,
      amount: data.amount,
      billing_cycle: data.billing_cycle,
      next_renewal_date: data.next_renewal_date,
      notes: data.notes || undefined,
    };
    if (record) {
      await updateRecord.mutateAsync(payload);
    } else {
      await createRecord.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createRecord.isPending || updateRecord.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Edit recurring revenue" : "New recurring revenue"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {record ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <RecurringRevenueForm record={record} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
