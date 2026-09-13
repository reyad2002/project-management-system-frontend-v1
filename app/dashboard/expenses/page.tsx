"use client";

import { useState } from "react";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
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
            <Table>
              <TableHead>
                <Th>Date</Th>
                <Th>Title</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={5} />
              </TableBody>
            </Table>
          ) : !data?.expenses?.length ? (
            <p className="py-8 text-center text-(--muted)">
              No expenses found.
            </p>
          ) : (
            <>
              <Table>
                <TableHead>
                  <Th>Date</Th>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th align="right">Actions</Th>
                </TableHead>
                <TableBody>
                  {data.expenses.map((e) => (
                    <TableRow key={e.id}>
                      <Td className="text-(--muted)">{e.expense_date}</Td>
                      <Td className="font-medium text-foreground">{e.title}</Td>
                      <Td className="capitalize text-(--muted)">{e.type}</Td>
                      <Td className="font-medium text-foreground">{formatMoney(e.amount)}</Td>
                      <Td align="right">
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
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
