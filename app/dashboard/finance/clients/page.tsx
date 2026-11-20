"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableHead, TableRow, TableSkeletonRows, Td, Th } from "@/components/ui/Table";
import { ExportButton } from "@/components/ui/ExportButton";
import { useClientProfitability } from "@/hooks/use-insights";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { formatMoney, profitClass } from "@/components/finance/monthFormat";
import type { ClientProfit } from "@/lib/api";
import type { ExportColumn } from "@/lib/export";

type Preset = "12m" | "this_year" | "last_year" | "all";

const iso = (d: Date) => d.toISOString().slice(0, 10);

function periodFor(preset: Preset): { from?: string; to?: string; all?: boolean } {
  const now = new Date();
  const year = now.getUTCFullYear();
  if (preset === "all") return { all: true };
  if (preset === "this_year") return { from: `${year}-01-01`, to: iso(now) };
  if (preset === "last_year") return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  return {}; // the server's default: the last 12 months
}

const columns: ExportColumn<ClientProfit>[] = [
  { header: "Client", value: (r) => r.name, width: 28 },
  { header: "Projects", value: (r) => r.projects, kind: "number" },
  { header: "Revenue (payments received)", value: (r) => r.revenue, kind: "money", width: 24 },
  { header: "Direct costs", value: (r) => r.cost, kind: "money" },
  { header: "Profit", value: (r) => r.profit, kind: "money" },
  { header: "Margin %", value: (r) => r.margin, kind: "number" },
  { header: "Share of revenue %", value: (r) => r.share, kind: "number", width: 18 },
  { header: "Still owes", value: (r) => r.outstanding, kind: "money" },
  { header: "Avg days to pay", value: (r) => r.avgDaysToPay, kind: "number", width: 16 },
  { header: "Note", value: (r) => (r.flag === "loss" ? "Costs more than it pays" : r.flag === "low_margin" ? "Low margin" : ""), width: 24 },
];

export default function ClientProfitabilityPage() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<Preset>("12m");
  const { data, isLoading, error } = useClientProfitability(periodFor(preset));

  if (!can(user, "finance")) return <p className="py-10 text-center text-(--muted)">Client profitability is for the finance roles.</p>;

  const losers = data?.clients.filter((c) => c.flag === "loss") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client profitability</h1>
          <p className="mt-1 text-(--muted)">Who really makes you money: what each client paid, minus what their projects cost you.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-48">
            <Select
              label="Period"
              options={[
                { value: "12m", label: "Last 12 months" },
                { value: "this_year", label: "This year" },
                { value: "last_year", label: "Last year" },
                { value: "all", label: "All time" },
              ]}
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
            />
          </div>
          {data && <ExportButton filename="client-profitability" sheet="Clients" columns={columns} fetchRows={async () => data.clients} />}
        </div>
      </div>

      {isLoading ? (
        <Table>
          <TableHead>
            <Th>Client</Th>
            <Th>Revenue</Th>
            <Th>Costs</Th>
            <Th>Profit</Th>
            <Th>Margin</Th>
          </TableHead>
          <TableBody>
            <TableSkeletonRows columns={5} />
          </TableBody>
        </Table>
      ) : error || !data ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">Couldn&apos;t load the report. If you just updated the app, make sure the backend has been deployed too.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Revenue</p>
                <p className="num mt-1 text-2xl font-semibold">{formatMoney(data.totals.revenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Direct costs</p>
                <p className="num mt-1 text-2xl font-semibold">{formatMoney(data.totals.cost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Profit from clients</p>
                <p className={`num mt-1 text-2xl font-semibold ${profitClass(data.totals.profit)}`}>{formatMoney(data.totals.profit)}</p>
                {data.totals.margin !== null && <p className="text-xs text-(--muted)">{data.totals.margin}% margin</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Biggest client&apos;s share</p>
                <p className={`num mt-1 text-2xl font-semibold ${data.topClientShare >= 50 ? "text-(--warning)" : ""}`}>{data.topClientShare}%</p>
                {data.topClientShare >= 50 && <p className="text-xs text-(--warning)">Half your income from one client is a risk</p>}
              </CardContent>
            </Card>
          </div>

          {losers.length > 0 && (
            <p className="rounded-lg bg-(--destructive-bg) px-3 py-2 text-sm text-(--destructive)">
              {losers.length === 1 ? `${losers[0].name} costs` : `${losers.length} clients cost`} you more than {losers.length === 1 ? "it pays" : "they pay"} in this period: {losers.map((c) => c.name).join(", ")}.
            </p>
          )}

          <Card>
            <CardContent className="pt-6">
              {data.clients.length === 0 ? (
                <p className="py-8 text-center text-(--muted)">No client activity in this period.</p>
              ) : (
                <Table>
                  <TableHead>
                    <Th>Client</Th>
                    <Th>Revenue</Th>
                    <Th>Costs</Th>
                    <Th>Profit</Th>
                    <Th>Margin</Th>
                    <Th>Share</Th>
                    <Th>Still owes</Th>
                    <Th>Days to pay</Th>
                  </TableHead>
                  <TableBody>
                    {data.clients.map((c) => (
                      <TableRow key={c.client_id}>
                        <Td label="Client">
                          <Link href={`/dashboard/clients/${c.client_id}`} className="font-medium text-foreground hover:underline">
                            {c.name}
                          </Link>
                          <span className="ms-2 text-xs text-(--muted)">{c.projects} project{c.projects === 1 ? "" : "s"}</span>
                          {c.flag === "loss" && (
                            <Badge variant="danger" dot={false} className="ms-2">
                              Loss
                            </Badge>
                          )}
                          {c.flag === "low_margin" && (
                            <Badge variant="warning" dot={false} className="ms-2">
                              Low margin
                            </Badge>
                          )}
                        </Td>
                        <Td label="Revenue" className="num">{formatMoney(c.revenue)}</Td>
                        <Td label="Costs" className="num text-(--muted)">{formatMoney(c.cost)}</Td>
                        <Td label="Profit" className={`num font-medium ${profitClass(c.profit)}`}>{formatMoney(c.profit)}</Td>
                        <Td label="Margin" className="num text-(--muted)">{c.margin === null ? "—" : `${c.margin}%`}</Td>
                        <Td label="Share" className="num text-(--muted)">{c.share}%</Td>
                        <Td label="Still owes" className={`num ${c.outstanding > 0 ? "text-(--warning)" : "text-(--muted)"}`}>{c.outstanding > 0 ? formatMoney(c.outstanding) : "—"}</Td>
                        <Td label="Days to pay" className="num text-(--muted)">{c.avgDaysToPay === null ? "—" : c.avgDaysToPay}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-(--muted)">
            Cash basis, like the other reports: revenue is payments received in the period; costs are the expenses and supplier bills on the client&apos;s projects (advances and equipment are not project costs). Test projects are left out. “Still owes” is
            what unpaid invoices stand at today. Costs that belong to no project (rent, salaries) are not shared out, so “profit” here is before those.
          </p>
        </>
      )}
    </div>
  );
}
