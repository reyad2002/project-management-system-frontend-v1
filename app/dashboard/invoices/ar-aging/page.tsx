"use client";

import Link from "next/link";
import { useArAging } from "@/hooks/use-statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import { ExportButton } from "@/components/ui/ExportButton";
import { arAgingColumns } from "@/lib/export-columns";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

const bucketLabels: Record<string, string> = {
  current: "Current",
  "1_30": "1–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  over_90: "90+ days",
};

const bucketStyles: Record<string, string> = {
  current: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "1_30": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  "31_60": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "61_90": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  over_90: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function ArAgingPage() {
  const { data, isLoading } = useArAging();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Finance
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounts Receivable Aging</h1>
        <p className="mt-1 text-(--muted)">Outstanding client invoices by age</p>
      </div>

      {isLoading || !data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Table>
            <TableHead>
              <Th>Invoice #</Th>
              <Th>Client</Th>
              <Th>Due date</Th>
              <Th>Days overdue</Th>
              <Th>Remaining</Th>
              <Th align="right">Bucket</Th>
            </TableHead>
            <TableBody>
              <TableSkeletonRows columns={6} />
            </TableBody>
          </Table>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(data.buckets).map(([key, bucket]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${bucketStyles[key]}`}>
                    {bucketLabels[key] ?? key}
                  </span>
                  <p className="mt-2 text-lg font-semibold">{formatMoney(bucket.amount)}</p>
                  <p className="text-xs text-(--muted)">{bucket.count} invoice(s)</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Overdue invoices</CardTitle>
                <ExportButton filename="ar-aging" sheet="AR aging" columns={arAgingColumns} fetchRows={async () => data.invoices ?? []} />
              </div>
            </CardHeader>
            <CardContent>
              {!data.invoices?.length ? (
                <p className="py-8 text-center text-(--muted)">No outstanding invoices.</p>
              ) : (
                <Table>
                  <TableHead>
                    <Th>Invoice #</Th>
                    <Th>Client</Th>
                    <Th>Due date</Th>
                    <Th>Days overdue</Th>
                    <Th>Remaining</Th>
                    <Th align="right">Bucket</Th>
                  </TableHead>
                  <TableBody>
                    {data.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <Td>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-[var(--primary)] hover:underline">
                            {inv.invoice_number}
                          </Link>
                        </Td>
                        <Td>{inv.client_name}</Td>
                        <Td className="text-(--muted)">{inv.due_date}</Td>
                        <Td>{inv.days_overdue}</Td>
                        <Td className="font-medium">{formatMoney(inv.remaining_amount)}</Td>
                        <Td align="right">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${bucketStyles[inv.bucket]}`}>
                            {bucketLabels[inv.bucket] ?? inv.bucket}
                          </span>
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
