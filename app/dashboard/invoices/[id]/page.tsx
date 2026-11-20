"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInvoice, useSendInvoice, useCancelInvoice } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ArrowLeft, Calendar, Send, Ban, Wallet, Pencil } from "lucide-react";
import { PaymentFormModal } from "@/app/dashboard/payments/PaymentFormModal";
import { InvoiceFormModal } from "@/app/dashboard/invoices/InvoiceFormModal";
import { invoiceStatusVariant } from "@/lib/status-badges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: invoice, isLoading, error } = useInvoice(id);
  const sendInvoice = useSendInvoice();
  const cancelInvoice = useCancelInvoice();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Invoice not found.
        <Button variant="outline" size="sm" className="ml-4" onClick={() => router.push("/dashboard/invoices")}>
          Back to list
        </Button>
      </div>
    );
  }

  const payments = invoice.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button variant="secondary" size="sm" loading={sendInvoice.isPending} onClick={() => sendInvoice.mutate(invoice.id)}>
              <Send className="mr-2 h-4 w-4" />
              Send invoice
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{invoice.invoice_number}</CardTitle>
          <Badge variant={invoiceStatusVariant[invoice.status]}>{invoice.status.replace("_", " ")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--muted)]" />
              Issued: {invoice.issue_date}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--muted)]" />
              Due: {invoice.due_date}
            </span>
          </div>
          <div className="rounded-lg bg-[var(--muted-bg)] px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">VAT ({invoice.vat_rate}%)</span>
              <span>{formatMoney(invoice.vat_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">WHT ({invoice.wht_rate}%)</span>
              <span>−{formatMoney(invoice.wht_amount)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-1 font-medium">
              <span>Total</span>
              <span>{formatMoney(invoice.total_amount)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Paid: <span className="font-medium text-green-600 dark:text-green-400">{formatMoney(invoice.paid_amount)}</span>
            </span>
            <span>
              Remaining: <span className="font-medium">{formatMoney(invoice.remaining_amount)}</span>
            </span>
          </div>
          {invoice.notes && <p className="text-sm text-[var(--muted)]">{invoice.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Record payment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-[var(--muted)]">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm">
                  <span>
                    {p.payment_date} · {p.payment_method.replace("_", " ")}
                  </span>
                  <span className="font-medium">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PaymentFormModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentId={null}
        defaultProjectId={invoice.project_id}
        defaultInvoiceId={invoice.id}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel invoice?"
        description="This will void the invoice. Advance payments linked to it will be freed up as unassigned."
        confirmText="Cancel invoice"
        isLoading={cancelInvoice.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelInvoice.mutate({ id: invoice.id }, { onSuccess: () => setCancelOpen(false) });
        }}
      />

      <InvoiceFormModal open={editOpen} onClose={() => setEditOpen(false)} invoiceId={invoice.id} />
    </div>
  );
}
