"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInvoices, useSendInvoice, useCancelInvoice } from "@/hooks/use-invoices";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useClientsShortList } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { SavedFilters, setOnly } from "@/components/ui/SavedFilters";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { invoiceColumns } from "@/lib/export-columns";
import { invoicesApi, type InvoiceStatus as ExportInvoiceStatus } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { Plus, Send, Ban, Eye } from "lucide-react";
import { INVOICE_STATUSES } from "@/lib/constants";
import { invoiceStatusVariant } from "@/lib/status-badges";
import { InvoiceFormModal } from "./InvoiceFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { InvoiceStatus } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project_id") ?? "";

  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState(projectIdFromUrl);
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  const { data, isLoading } = useInvoices({
    page,
    limit: 10,
    project_id: projectId || undefined,
    client_id: clientId || undefined,
    status: (status as InvoiceStatus) || undefined,
  });
  const { data: projectsData } = useProjectsShortList();
  const { data: clientsData } = useClientsShortList();
  const sendInvoice = useSendInvoice();
  const cancelInvoice = useCancelInvoice();

  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];
  const clientOptions = clientsData?.clients?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

  const chips: FilterChip[] = [
    projectId && {
      key: "project",
      label: `Project: ${projectOptions.find((p) => p.value === projectId)?.label ?? projectId}`,
      onRemove: () => {
        setProjectId("");
        setPage(1);
      },
    },
    clientId && {
      key: "client",
      label: `Client: ${clientOptions.find((c) => c.value === clientId)?.label ?? clientId}`,
      onRemove: () => {
        setClientId("");
        setPage(1);
      },
    },
    status && {
      key: "status",
      label: `Status: ${INVOICE_STATUSES.find((s) => s.value === status)?.label ?? status}`,
      onRemove: () => {
        setStatus("");
        setPage(1);
      },
    },
  ].filter(Boolean) as FilterChip[];

  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-(--muted)">Track invoices issued to clients</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          New invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <SavedFilters
            page="invoices"
            current={setOnly({ project_id: projectId, client_id: clientId, status })}
            onApply={(p) => {
              setProjectId(String(p.project_id ?? ""));
              setClientId(String(p.client_id ?? ""));
              setStatus(String(p.status ?? ""));
              setPage(1);
            }}
          />
<FilterDrawer
            activeCount={[projectId, clientId, status].filter(Boolean).length}
            onClear={() => {
              setProjectId("");
              setClientId("");
              setStatus("");
              setPage(1);
            }}
            chips={chips}
          >
            <Select
              label="Project"
              options={[{ value: "", label: "All projects" }, ...projectOptions]}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Client"
              options={[{ value: "", label: "All clients" }, ...clientOptions]}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Status"
              options={[{ value: "", label: "All statuses" }, ...INVOICE_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
          </FilterDrawer>
          <ExportButton
            filename="invoices"
            sheet="Invoices"
            columns={invoiceColumns(
              (id) => projectOptions.find((p) => p.value === String(id))?.label ?? "",
              (id) => clientOptions.find((c) => c.value === String(id))?.label ?? "",
            )}
            fetchRows={() =>
              fetchAllPages((page, limit) =>
                invoicesApi
                  .list({
                    page,
                    limit,
                    project_id: projectId || undefined,
                    client_id: clientId || undefined,
                    status: (status as ExportInvoiceStatus) || undefined,
                  })
                  .then((r) => ({ rows: r.data.invoices, total: r.data.pagination.total })),
              )
            }
          />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Table>
              <TableHead>
                <Th>Invoice #</Th>
                <Th>Issue date</Th>
                <Th>Due date</Th>
                <Th>Total</Th>
                <Th>Remaining</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={7} />
              </TableBody>
            </Table>
          ) : !data?.invoices?.length ? (
            <EmptyState title="No invoices found" description="Create an invoice, or loosen the filters." action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="me-2 h-4 w-4" />New invoice</Button>} />
          ) : (
            <>
              <Table>
                <TableHead>
                  <Th>Invoice #</Th>
                  <Th>Issue date</Th>
                  <Th>Due date</Th>
                  <Th>Total</Th>
                  <Th>Remaining</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </TableHead>
                <TableBody>
                  {data.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <Td className="font-medium text-foreground">{inv.invoice_number}</Td>
                      <Td className="text-(--muted)">{inv.issue_date}</Td>
                      <Td className="text-(--muted)">{inv.due_date}</Td>
                      <Td className="font-medium">{formatMoney(inv.total_amount)}</Td>
                      <Td>{formatMoney(inv.remaining_amount)}</Td>
                      <Td>
                        <Badge variant={invoiceStatusVariant[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                      </Td>
                      <Td align="right">
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/dashboard/invoices/${inv.id}`}>
                            <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {inv.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              loading={sendInvoice.isPending}
                              onClick={() => sendInvoice.mutate(inv.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => setCancellingId(inv.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <InvoiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultProjectId={projectIdFromUrl || undefined}
      />

      <ConfirmDialog
        open={!!cancellingId}
        title="Cancel invoice?"
        description="This will void the invoice. Advance payments linked to it will be freed up as unassigned."
        confirmText="Cancel invoice"
        isLoading={cancelInvoice.isPending}
        onClose={() => setCancellingId(null)}
        onConfirm={() => {
          if (!cancellingId) return;
          cancelInvoice.mutate(
            { id: cancellingId },
            { onSuccess: () => setCancellingId(null) }
          );
        }}
      />
    </div>
  );
}
