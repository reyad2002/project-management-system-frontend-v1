"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { recurringExpenseStatusVariant } from "@/lib/status-badges";
import type { RecurringExpense } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

interface RecurringExpenseTableProps {
  records: RecurringExpense[];
  onEdit: (record: RecurringExpense) => void;
  onDelete: (record: RecurringExpense) => void;
  onMarkPaid: (record: RecurringExpense) => void;
  markingPaidId: string | null;
}

export function RecurringExpenseTable({ records, onEdit, onDelete, onMarkPaid, markingPaidId }: RecurringExpenseTableProps) {
  if (records.length === 0) {
    return <p className="text-(--muted)">No subscriptions yet.</p>;
  }

  return (
    <Table>
      <TableHead>
        <Th>Service</Th>
        <Th>Project</Th>
        <Th>Type</Th>
        <Th>Amount</Th>
        <Th>Cycle</Th>
        <Th>Next due</Th>
        <Th>Status</Th>
        <Th align="right">Actions</Th>
      </TableHead>
      <TableBody>
        {records.map((r) => {
          const isOverdue = r.status === "active" && r.next_due_date < new Date().toISOString().slice(0, 10);
          return (
          <TableRow key={r.id}>
            <Td className="font-medium">
              {r.name}
              {r.auto_charge && r.status === "active" && (
                <Badge variant="info" dot={false} className="ml-2" title="Deducted automatically on the due date">
                  Auto
                </Badge>
              )}
            </Td>
            <Td>{r.project_title ?? "—"}</Td>
            <Td className="capitalize">{r.type.replace("_", " ")}</Td>
            <Td>{formatMoney(r.amount)}</Td>
            <Td className="capitalize">{r.billing_cycle}</Td>
            <Td>{r.next_due_date}</Td>
            <Td>
              <Badge variant={isOverdue ? "danger" : recurringExpenseStatusVariant[r.status]}>
                {isOverdue ? "overdue" : r.status}
              </Badge>
            </Td>
            <Td align="right">
              <div className="flex justify-end gap-1">
                {r.status !== "cancelled" && !r.auto_charge && (
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
          );
        })}
      </TableBody>
    </Table>
  );
}
