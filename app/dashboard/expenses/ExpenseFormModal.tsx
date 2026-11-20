"use client";

import { useExpense, useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { ExpenseForm, type ExpenseFormData } from "@/components/expenses/ExpenseForm";
import { Modal } from "@/components/ui/Modal";
import { rememberLast } from "@/lib/last-used";
import { Button } from "@/components/ui/Button";

const FORM_ID = "expense-form";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expenseId: string | null;
  defaultProjectId?: string;
}

export function ExpenseFormModal({ open, onClose, expenseId, defaultProjectId }: ExpenseFormModalProps) {
  const { data: expense } = useExpense(expenseId ?? null);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(expenseId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: ExpenseFormData) => {
    const payload = {
      ...data,
      project_id: data.project_id || null,
      phase_id: data.phase_id || null,
    };
    if (expenseId && expense) {
      await updateExpense.mutateAsync(payload);
    } else {
      await createExpense.mutateAsync(payload);
      rememberLast("expense_type", data.type);
      rememberLast("expense_category", data.cost_category);
    }
    onClose();
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expenseId ? "Edit expense" : "New expense"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {expenseId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <ExpenseForm expense={expense ?? undefined} formId={FORM_ID} onSubmit={handleSubmit} defaultProjectId={defaultProjectId} />
    </Modal>
  );
}
