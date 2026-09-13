"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usePortalInvoice } from "@/hooks/use-portal";
import { invoiceStatusVariant } from "@/lib/status-badges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: invoice, isLoading, error } = usePortalInvoice(id);

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
        <Button variant="outline" size="sm" className="ml-4" onClick={() => router.push("/portal/invoices")}>
          Back to invoices
        </Button>
      </div>
    );
  }

  const payments = invoice.payments ?? [];

  return (
    <div className="space-y-6">
      <Link href="/portal/invoices">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{invoice.invoice_number}</CardTitle>
          <Badge variant={invoiceStatusVariant[invoice.status]}>{invoice.status.replace("_", " ")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-(--muted)" />
              Issued: {invoice.issue_date}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-(--muted)" />
              Due: {invoice.due_date}
            </span>
          </div>
          <div className="rounded-lg bg-(--muted-bg) px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-(--muted)">Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--muted)">VAT ({invoice.vat_rate}%)</span>
              <span>{formatMoney(invoice.vat_amount)}</span>
            </div>
            {invoice.wht_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-(--muted)">WHT ({invoice.wht_rate}%)</span>
                <span>−{formatMoney(invoice.wht_amount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-(--border) pt-1 font-medium">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-(--muted)">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-(--muted-bg) px-3 py-2 text-sm">
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
    </div>
  );
}
