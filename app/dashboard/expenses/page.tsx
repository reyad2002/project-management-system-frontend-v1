"use client";

import { useState } from "react";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { EXPENSE_TYPES } from "@/lib/constants";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = useExpenses({
    page,
    limit: 10,
    type: type || undefined,
  });
  const deleteExpense = useDeleteExpense();

  const pagination = data?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="mt-1 text-(--muted)">
            Track direct and operational expenses
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Type"
              options={[
                { value: "", label: "All" },
                ...EXPENSE_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                })),
              ]}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
            </div>
          ) : !data?.expenses?.length ? (
            <p className="py-8 text-center text-(--muted)">
              No expenses found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-(--card-border)">
                <table className="w-full text-sm">
                  <thead className="bg-(--muted-bg)">
                    <tr className="text-left text-(--muted)">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e, index) => (
                      <tr
                        key={e.id}
                        className={`border-t border-(--card-border) ${
                          index % 2 === 0 ? "bg-(--card)" : "bg-(--muted-bg)/40"
                        } transition-colors hover:bg-sky-50/40`}
                      >
                        <td className="px-4 py-3 text-(--muted)">
                          {e.expense_date}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {e.title}
                        </td>
                        <td className="px-4 py-3 capitalize text-(--muted)">
                          {e.type}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatMoney(e.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              onClick={() => {
                                setEditingId(e.id);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => setDeletingExpenseId(e.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-(--muted)">
                    Page {page} of {totalPages} ({pagination?.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        expenseId={editingId}
      />

      <ConfirmDialog
        open={!!deletingExpenseId}
        title="Delete expense?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteExpense.isPending}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={() => {
          if (!deletingExpenseId) return;
          deleteExpense.mutate(deletingExpenseId, {
            onSuccess: () => setDeletingExpenseId(null),
          });
        }}
      />
    </div>
  );
}
