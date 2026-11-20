"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { hostingColumns } from "@/lib/export-columns";
import { recurringRevenueApi } from "@/lib/api";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useRecurringRevenue,
  useDeleteRecurringRevenue,
  useMarkRecurringRevenuePaid,
} from "@/hooks/use-recurring-revenue";
import { RecurringRevenueTable } from "@/components/recurring-revenue/RecurringRevenueTable";
import { RecurringRevenueFormModal } from "@/components/recurring-revenue/RecurringRevenueFormModal";
import type { RecurringRevenue, RecurringRevenueStatus } from "@/lib/api";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function HostingPage() {
  const [status, setStatus] = useState<RecurringRevenueStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecurringRevenue | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<RecurringRevenue | null>(null);

  const { data, isLoading } = useRecurringRevenue(status ? { status } : undefined);
  const deleteRecord = useDeleteRecurringRevenue();
  const markPaid = useMarkRecurringRevenuePaid();

  const records = data?.recurringRevenue ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hosting & Recurring Revenue</h1>
          <p className="mt-1 text-(--muted)">Hosting, domains, and subscription revenue billed to clients</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterDrawer
            activeCount={status ? 1 : 0}
            onClear={() => setStatus("")}
            chips={
              status
                ? [{ key: "status", label: `Status: ${statusOptions.find((s) => s.value === status)?.label ?? status}`, onRemove: () => setStatus("") }]
                : []
            }
          >
            <CustomSelect
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(v) => setStatus(v as RecurringRevenueStatus | "")}
            />
          </FilterDrawer>
          <ExportButton
            filename="hosting-and-recurring-revenue"
            sheet="Hosting"
            columns={hostingColumns}
            fetchRows={() =>
              fetchAllPages((page, limit) =>
                recurringRevenueApi.list({ status: status || undefined, page, limit }).then((r) => ({
                  rows: r.data.recurringRevenue,
                  total: r.data.pagination?.total ?? r.data.recurringRevenue.length,
                })),
              )
            }
          />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-(--muted)">Loading...</p>
          ) : (
            <RecurringRevenueTable
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
        </CardContent>
      </Card>

      <RecurringRevenueFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        title="Delete this record?"
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
