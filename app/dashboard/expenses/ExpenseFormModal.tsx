"use client";

import { useExpense, useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { ExpenseForm, type ExpenseFormData } from "@/components/expenses/ExpenseForm";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expenseId: string | null;
}

export function ExpenseFormModal({ open, onClose, expenseId }: ExpenseFormModalProps) {
  const { data: expense } = useExpense(expenseId ?? null);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(expenseId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: ExpenseFormData) => {
    if (expenseId && expense) {
      await updateExpense.mutateAsync(data);
    } else {
      await createExpense.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()} role="button" tabIndex={0} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {expenseId ? "Edit expense" : "New expense"}
        </h2>
        <div className="mt-4">
          <ExpenseForm
            expense={expense ?? undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
