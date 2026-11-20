"use client";

import { useState } from "react";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { SavedFilters, setOnly } from "@/components/ui/SavedFilters";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { expenseColumns } from "@/lib/export-columns";
import { expensesApi } from "@/lib/api";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { EXPENSE_TYPES, COST_CATEGORIES } from "@/lib/constants";
import { useProjectsShortList } from "@/hooks/use-projects";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SubscriptionsTab } from "@/components/recurring-expenses/SubscriptionsTab";

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
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = useExpenses({
    page,
    limit: 10,
    type: type || undefined,
    cost_category: category || undefined,
    project_id: projectId || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  });
  const { data: projectsData } = useProjectsShortList();
  const deleteExpense = useDeleteExpense();
  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];
  const reset = (setter: (v: string) => void) => () => {
    setter("");
    setPage(1);
  };
  const chips: FilterChip[] = [
    type && { key: "type", label: `Type: ${EXPENSE_TYPES.find((t) => t.value === type)?.label ?? type}`, onRemove: reset(setType) },
    category && { key: "cat", label: `Category: ${COST_CATEGORIES.find((c) => c.value === category)?.label ?? category}`, onRemove: reset(setCategory) },
    projectId && { key: "proj", label: `Project: ${projectOptions.find((p) => p.value === projectId)?.label ?? projectId}`, onRemove: reset(setProjectId) },
    fromDate && { key: "from", label: `From ${fromDate}`, onRemove: reset(setFromDate) },
    toDate && { key: "to", label: `To ${toDate}`, onRemove: reset(setToDate) },
  ].filter(Boolean) as FilterChip[];

  const pagination = data?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="mt-1 text-(--muted)">
          Track direct, operational, and recurring subscription expenses
        </p>
      </div>

      <Tabs
        tabs={[
          {
            key: "one-time",
            label: "One-time expenses",
            content: (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <SavedFilters
                      page="expenses"
                      current={setOnly({ type, category, project_id: projectId, from: fromDate, to: toDate })}
                      onApply={(p) => {
                        setType(String(p.type ?? ""));
                        setCategory(String(p.category ?? ""));
                        setProjectId(String(p.project_id ?? ""));
                        setFromDate(String(p.from ?? ""));
                        setToDate(String(p.to ?? ""));
                        setPage(1);
                      }}
                    />
<FilterDrawer
                      activeCount={chips.length}
                      onClear={() => {
                        setType("");
                        setCategory("");
                        setProjectId("");
                        setFromDate("");
                        setToDate("");
                        setPage(1);
                      }}
                      chips={chips}
                    >
                      <Select
                        label="Type"
                        options={[{ value: "", label: "All" }, ...EXPENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
                        value={type}
                        onChange={(e) => {
                          setType(e.target.value);
                          setPage(1);
                        }}
                      />
                      <Select
                        label="Category"
                        options={[{ value: "", label: "All" }, ...COST_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]}
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setPage(1);
                        }}
                      />
                      <Select
                        label="Project"
                        options={[{ value: "", label: "All projects" }, ...projectOptions]}
                        value={projectId}
                        onChange={(e) => {
                          setProjectId(e.target.value);
                          setPage(1);
                        }}
                      />
                      <Input
                        type="date"
                        label="From date"
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          setPage(1);
                        }}
                      />
                      <Input
                        type="date"
                        label="To date"
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value);
                          setPage(1);
                        }}
                      />
                    </FilterDrawer>
                    <ExportButton
                      filename="expenses"
                      sheet="Expenses"
                      columns={expenseColumns((id) => projectOptions.find((p) => p.value === String(id))?.label ?? "")}
                      fetchRows={() =>
                        fetchAllPages((page, limit) =>
                          expensesApi
                            .list({
                              page,
                              limit,
                              type: type || undefined,
                              cost_category: category || undefined,
                              project_id: projectId || undefined,
                              from_date: fromDate || undefined,
                              to_date: toDate || undefined,
                            })
                            .then((r) => ({ rows: r.data.expenses, total: r.data.pagination.total })),
                        )
                      }
                    />
                    </div>
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setModalOpen(true);
                      }}
                    >
                      <Plus className="me-2 h-4 w-4" />
                      Add expense
                    </Button>
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
                    <EmptyState title="No expenses found" description="Add an expense, or loosen the filters." action={<Button size="sm" onClick={() => {
                setEditingId(null);
                setModalOpen(true);
              }}><Plus className="me-2 h-4 w-4" />Add expense</Button>} />
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
            ),
          },
          {
            key: "subscriptions",
            label: "Subscriptions",
            content: <SubscriptionsTab />,
          },
        ]}
      />

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
