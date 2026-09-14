"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { recurringRevenueStatusVariant } from "@/lib/status-badges";
import type { RecurringRevenue } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

interface RecurringRevenueTableProps {
  records: RecurringRevenue[];
  onEdit: (record: RecurringRevenue) => void;
  onDelete: (record: RecurringRevenue) => void;
  onMarkPaid: (record: RecurringRevenue) => void;
  markingPaidId: string | null;
}

export function RecurringRevenueTable({ records, onEdit, onDelete, onMarkPaid, markingPaidId }: RecurringRevenueTableProps) {
  if (records.length === 0) {
    return <p className="text-(--muted)">No recurring revenue records yet.</p>;
  }

  return (
    <Table>
      <TableHead>
        <Th>Client</Th>
        <Th>Project</Th>
        <Th>Type</Th>
        <Th>Amount</Th>
        <Th>Cycle</Th>
        <Th>Next renewal</Th>
        <Th>Status</Th>
        <Th align="right">Actions</Th>
      </TableHead>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <Td className="font-medium">{r.client_name}</Td>
            <Td>{r.project_title ?? "—"}</Td>
            <Td className="capitalize">{r.type}</Td>
            <Td>{formatMoney(r.amount)}</Td>
            <Td className="capitalize">{r.billing_cycle}</Td>
            <Td>{r.next_renewal_date}</Td>
            <Td>
              <Badge variant={recurringRevenueStatusVariant[r.status]}>{r.status}</Badge>
            </Td>
            <Td align="right">
              <div className="flex justify-end gap-1">
                {r.status !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-(--success)"
                    loading={markingPaidId === r.id}
                    onClick={() => onMarkPaid(r)}
                    title="Mark as paid"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(r)}>
                  <Trash2 className="h-4 w-4 text-(--destructive)" />
                </Button>
              </div>
            </Td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
