"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { usePortalInvoices } from "@/hooks/use-portal";
import { invoiceStatusVariant } from "@/lib/status-badges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function PortalInvoicesPage() {
  const { data, isLoading } = usePortalInvoices();
  const invoices = data?.invoices ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <p className="mt-1 text-(--muted)">All invoices issued to you</p>
      </div>

      <Card>
        <CardContent>
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
          ) : invoices.length === 0 ? (
            <p className="py-8 text-center text-(--muted)">No invoices yet.</p>
          ) : (
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
                {invoices.map((inv) => (
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
                      <Link href={`/portal/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
