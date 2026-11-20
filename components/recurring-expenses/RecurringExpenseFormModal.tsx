"use client";

import { useCreateRecurringExpense, useUpdateRecurringExpense } from "@/hooks/use-recurring-expenses";
import { RecurringExpenseForm, type RecurringExpenseFormData } from "@/components/recurring-expenses/RecurringExpenseForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { RecurringExpense } from "@/lib/api";

const FORM_ID = "recurring-expense-form";

interface RecurringExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  record: RecurringExpense | null;
}

export function RecurringExpenseFormModal({ open, onClose, record }: RecurringExpenseFormModalProps) {
  const createRecord = useCreateRecurringExpense();
  const updateRecord = useUpdateRecurringExpense(record?.id ?? "");

  if (!open) return null;

  const handleSubmit = async (data: RecurringExpenseFormData) => {
    const payload = {
      name: data.name,
      linked_project_id: data.linked_project_id || null,
      type: data.type,
      amount: data.amount,
      billing_cycle: data.billing_cycle,
      next_due_date: data.next_due_date,
      auto_charge: data.auto_charge,
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
      title={record ? "Edit subscription" : "New subscription"}
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
      <RecurringExpenseForm record={record} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
