"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { investmentStatusVariant } from "@/lib/status-badges";
import type { Investment } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

type InvestmentRow = Investment & { total_returns: number };

interface InvestmentsTableProps {
  investments: InvestmentRow[];
  onOpen: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
}

export function InvestmentsTable({ investments, onOpen, onEdit, onDelete }: InvestmentsTableProps) {
  if (investments.length === 0) {
    return <p className="text-(--muted)">No investments recorded yet.</p>;
  }

  return (
    <Table>
      <TableHead>
        <Th>Name</Th>
        <Th>Invested</Th>
        <Th>Date</Th>
        <Th>Returns so far</Th>
        <Th>Status</Th>
        <Th align="right">Actions</Th>
      </TableHead>
      <TableBody>
        {investments.map((inv) => (
          <TableRow key={inv.id} className="cursor-pointer" onClick={() => onOpen(inv)}>
            <Td className="font-medium">{inv.name}</Td>
            <Td>{formatMoney(inv.amount_invested)}</Td>
            <Td>{inv.investment_date}</Td>
            <Td className="text-(--success)">{formatMoney(inv.total_returns)}</Td>
            <Td>
              <Badge variant={investmentStatusVariant[inv.status]}>{inv.status}</Badge>
            </Td>
            <Td align="right">
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => onEdit(inv)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(inv)}>
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
