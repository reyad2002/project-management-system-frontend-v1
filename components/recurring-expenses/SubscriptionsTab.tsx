"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useRecurringExpenses,
  useDeleteRecurringExpense,
  useMarkRecurringExpensePaid,
} from "@/hooks/use-recurring-expenses";
import { RecurringExpenseTable } from "@/components/recurring-expenses/RecurringExpenseTable";
import { RecurringExpenseFormModal } from "@/components/recurring-expenses/RecurringExpenseFormModal";
import type { RecurringExpense, RecurringExpenseStatus } from "@/lib/api";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
];

export function SubscriptionsTab() {
  const [status, setStatus] = useState<RecurringExpenseStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecurringExpense | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<RecurringExpense | null>(null);

  const { data, isLoading } = useRecurringExpenses(status ? { status } : undefined);
  const deleteRecord = useDeleteRecurringExpense();
  const markPaid = useMarkRecurringExpensePaid();

  const records = data?.recurringExpenses ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="max-w-xs flex-1">
          <CustomSelect
            label="Filter by status"
            options={statusOptions}
            value={status}
            onChange={(v) => setStatus(v as RecurringExpenseStatus | "")}
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingRecord(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add subscription
        </Button>
      </div>

      {isLoading ? (
        <p className="text-(--muted)">Loading...</p>
      ) : (
        <RecurringExpenseTable
          records={records}
          onEdit={(r) => {
            setEditingRecord(r);
            setModalOpen(true);
          }}
          onDelete={(r) => setDeletingRecord(r)}
          onMarkPaid={(r) => markPaid.mutate(r.id)}
          markingPaidId={markPaid.isPending ? markPaid.variables ?? null : null}
        />
      )}

      <RecurringExpenseFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        title="Delete this subscription?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteRecord.isPending}
        onClose={() => setDeletingRecord(null)}
        onConfirm={() => {
          if (!deletingRecord) return;
          deleteRecord.mutate(deletingRecord.id, { onSuccess: () => setDeletingRecord(null) });
        }}
      />
    </div>
  );
}
