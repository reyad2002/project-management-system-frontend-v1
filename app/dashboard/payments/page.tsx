"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePayments, useDeletePayment } from "@/hooks/use-payments";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useClientsShortList } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PaymentFormModal } from "./PaymentFormModal";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project_id") ?? "";
  const clientIdFromUrl = searchParams.get("client_id") ?? "";
  const fromDateFromUrl = searchParams.get("from_date") ?? "";
  const toDateFromUrl = searchParams.get("to_date") ?? "";

  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState(projectIdFromUrl);
  const [clientId, setClientId] = useState(clientIdFromUrl);
  const [fromDate, setFromDate] = useState(fromDateFromUrl);
  const [toDate, setToDate] = useState(toDateFromUrl);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setProjectId(projectIdFromUrl);
    setClientId(clientIdFromUrl);
    setFromDate(fromDateFromUrl);
    setToDate(toDateFromUrl);
  }, [projectIdFromUrl, clientIdFromUrl, fromDateFromUrl, toDateFromUrl]);

  const { data, isLoading } = usePayments({
    page,
    limit: 10,
    project_id: projectId || undefined,
    client_id: clientId || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  });
  const { data: projectsData } = useProjectsShortList();
  const { data: clientsData } = useClientsShortList();
  const deletePayment = useDeletePayment();

  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];
  const clientOptions = clientsData?.clients?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Payments</h1>
          <p className="mt-1 text-[var(--muted)]">Track payments received</p>
        </div>
        <Button onClick={() => { setEditingId(null); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <Select
              label="Project"
              options={[{ value: "", label: "All projects" }, ...projectOptions]}
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
            />
            <Select
              label="Client"
              options={[{ value: "", label: "All clients" }, ...clientOptions]}
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              label="From date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              label="To date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : !data?.payments?.length ? (
            <p className="py-8 text-center text-[var(--muted)]">No payments found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Method</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3">{p.payment_date}</td>
                        <td className="py-3 font-medium">{formatMoney(p.amount)}</td>
                        <td className="py-3 capitalize">{p.payment_method.replace("_", " ")}</td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingId(p.id); setModalOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this payment?")) deletePayment.mutate(p.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">
                    Page {page} of {totalPages} ({pagination?.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PaymentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        paymentId={editingId}
        defaultProjectId={projectIdFromUrl || undefined}
      />
    </div>
  );
}
