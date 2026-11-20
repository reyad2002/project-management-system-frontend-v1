"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useVendor } from "@/hooks/use-vendors";
import { useVendorBills, useDeleteVendorBill } from "@/hooks/use-vendor-bills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { VendorBillFormModal } from "./VendorBillFormModal";
import { VendorFormModal } from "@/app/dashboard/vendors/VendorFormModal";
import { VendorBillPaymentModal } from "./VendorBillPaymentModal";
import { vendorBillStatusVariant } from "@/lib/status-badges";
import type { VendorBill } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: vendor, isLoading, error } = useVendor(id);
  const { data: billsData } = useVendorBills({ vendor_id: id, limit: 100 });
  const deleteBill = useDeleteVendorBill();

  const [editOpen, setEditOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [payingBill, setPayingBill] = useState<VendorBill | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Vendor not found.
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => router.push("/dashboard/vendors")}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const bills = billsData?.vendorBills ?? [];
  const totalOwed = bills.reduce((s, b) => s + b.total_amount, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paid_amount, 0);
  const totalRemaining = bills.reduce((s, b) => s + b.remaining_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/vendors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{vendor.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vendor.email && (
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Mail className="h-4 w-4 text-[var(--muted)]" />
              <a href={`mailto:${vendor.email}`} className="text-[var(--primary)] hover:underline">
                {vendor.email}
              </a>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--muted)]" />
              <span>{vendor.phone}</span>
            </div>
          )}
          {vendor.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--muted)]" />
              <span>{vendor.address}</span>
            </div>
          )}
          {vendor.tax_id && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--muted)]" />
              <span>Tax ID: {vendor.tax_id}</span>
            </div>
          )}
          {vendor.notes && (
            <div className="flex items-start gap-2 border-t border-[var(--border)] pt-4 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <p>
                <span className="text-[var(--muted)]">Notes:</span> {vendor.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[var(--muted)]" />
            Payables summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-[var(--muted)]">Total owed</p>
            <p className="text-lg font-semibold">{formatMoney(totalOwed)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Paid</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatMoney(totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Remaining</p>
            <p className="text-lg font-semibold">{formatMoney(totalRemaining)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bills</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingBillId(null);
              setBillModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add bill
          </Button>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-[var(--muted)]">No bills yet.</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Bill #</Th>
                <Th>Due date</Th>
                <Th>Total</Th>
                <Th>Remaining</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <Td className="font-medium text-foreground">{b.bill_number ?? b.id.slice(0, 8)}</Td>
                    <Td className="text-(--muted)">{b.due_date}</Td>
                    <Td className="font-medium">{formatMoney(b.total_amount)}</Td>
                    <Td>{formatMoney(b.remaining_amount)}</Td>
                    <Td>
                      <Badge variant={vendorBillStatusVariant[b.status]}>{b.status.replace("_", " ")}</Badge>
                    </Td>
                    <Td align="right">
                      <div className="inline-flex items-center gap-1">
                        {b.status !== "paid" && b.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                            onClick={() => setPayingBill(b)}
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          onClick={() => {
                            setEditingBillId(b.id);
                            setBillModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={() => setDeletingBillId(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VendorBillFormModal
        open={billModalOpen}
        onClose={() => {
          setBillModalOpen(false);
          setEditingBillId(null);
        }}
        vendor={vendor}
        billId={editingBillId}
      />

      <VendorBillPaymentModal
        open={!!payingBill}
        onClose={() => setPayingBill(null)}
        bill={payingBill}
      />

      <ConfirmDialog
        open={!!deletingBillId}
        title="Delete bill?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteBill.isPending}
        onClose={() => setDeletingBillId(null)}
        onConfirm={() => {
          if (!deletingBillId) return;
          deleteBill.mutate(deletingBillId, {
            onSuccess: () => setDeletingBillId(null),
          });
        }}
      />

      <VendorFormModal open={editOpen} onClose={() => setEditOpen(false)} vendorId={vendor.id} />
    </div>
  );
}
