"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { ExportWorkbookButton } from "@/components/ui/ExportButton";
import { MonthDetailModal } from "@/components/finance/MonthDetailModal";
import { formatMoney, monthName, profitClass } from "@/components/finance/monthFormat";
import { useMonthlyReport } from "@/hooks/use-statistics";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { statisticsApi, type MonthlyFinance, type YearReport } from "@/lib/api";
import { buildSheet, type ExportColumn, type PreparedSheet } from "@/lib/export";
import { COST_CATEGORIES, EXPENSE_TYPES, PAYMENT_METHODS } from "@/lib/constants";

const summaryColumns: ExportColumn<MonthlyFinance>[] = [
  { header: "Month", value: (r) => r.month, width: 12 },
  { header: "Revenue (payments received)", value: (r) => r.revenue, kind: "money", width: 18 },
  { header: "Payments", value: (r) => r.paymentsCount, kind: "number", width: 10 },
  { header: "Direct expenses", value: (r) => r.directExpenses, kind: "money" },
  { header: "Operational expenses", value: (r) => r.operationalExpenses, kind: "money", width: 18 },
  { header: "Total expenses", value: (r) => r.totalExpenses, kind: "money" },
  { header: "of which ad spend", value: (r) => r.adSpend, kind: "money" },
  { header: "Gross profit", value: (r) => r.grossProfit, kind: "money" },
  { header: "Net profit", value: (r) => r.netProfit, kind: "money" },
  { header: "Margin %", value: (r) => r.marginPercent, kind: "number", width: 10 },
  { header: "Advances (not in profit)", value: (r) => r.excludedFromProfit.advance, kind: "money", width: 20 },
  { header: "Equipment (not in profit)", value: (r) => r.excludedFromProfit.equipment, kind: "money", width: 20 },
];

type PaymentRow = NonNullable<YearReport["rows"]>["payments"][number];
type ExpenseRow = NonNullable<YearReport["rows"]>["expenses"][number];

const paymentColumns: ExportColumn<PaymentRow>[] = [
  { header: "Date", value: (r) => r.date },
  { header: "Project", value: (r) => r.project_title, width: 32 },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Method", value: (r) => PAYMENT_METHODS.find((m) => m.value === r.method)?.label ?? r.method },
  { header: "Notes", value: (r) => r.notes, width: 40 },
];

const expenseColumns: ExportColumn<ExpenseRow>[] = [
  { header: "Date", value: (r) => r.date },
  { header: "Title", value: (r) => r.title, width: 34 },
  { header: "Type", value: (r) => EXPENSE_TYPES.find((t) => t.value === r.type)?.label ?? r.type },
  { header: "Category", value: (r) => COST_CATEGORIES.find((c) => c.value === r.cost_category)?.label ?? r.cost_category, width: 28 },
  { header: "Project", value: (r) => r.project_title, width: 30 },
  { header: "Amount", value: (r) => r.amount, kind: "money" },
  { header: "Counted in profit", value: (r) => (r.in_profit ? "Yes" : "No (advance / equipment)"), width: 24 },
  { header: "Description", value: (r) => r.description, width: 40 },
];

async function buildSheets(year: number): Promise<PreparedSheet[]> {
  // The detail sheets come from the same server-side rules as the summary, so they always add up.
  const { data } = await statisticsApi.monthly(year, true);
  return [
    buildSheet("Summary", summaryColumns, [...data.months, { ...data.totals, month: `${year} total` }]),
    buildSheet("Payments", paymentColumns, data.rows?.payments ?? []),
    buildSheet("Expenses", expenseColumns, data.rows?.expenses ?? []),
  ];
}

function MonthlyChart({ months }: { months: MonthlyFinance[] }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.revenue, m.totalExpenses]));
  return (
    <div aria-hidden>
      <div className="flex h-40 items-end gap-1.5 sm:gap-3">
        {months.map((m) => (
          <div key={m.month} className="flex h-full flex-1 flex-col justify-end gap-1">
            <div className="flex h-full items-end justify-center gap-0.5">
              <div
                className="w-1/2 max-w-4 rounded-t bg-emerald-500/80"
                style={{ height: `${(m.revenue / max) * 100}%` }}
                title={`${monthName(m.month)} revenue: ${formatMoney(m.revenue)}`}
              />
              <div
                className="w-1/2 max-w-4 rounded-t bg-rose-400/80"
                style={{ height: `${(m.totalExpenses / max) * 100}%` }}
                title={`${monthName(m.month)} expenses: ${formatMoney(m.totalExpenses)}`}
              />
            </div>
            <span className="text-center text-[10px] text-(--muted)">{monthName(m.month, "short")}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-(--muted)">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/80" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-400/80" /> Expenses
        </span>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, className = "" }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">{label}</p>
        <p className={`num mt-2 text-2xl font-bold tracking-tight ${className}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-(--muted)">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function MonthlyReportPage() {
  const { user } = useAuth();
  const allowed = can(user, "finance");
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const { data, isLoading, error } = useMonthlyReport(year, allowed);

  if (!allowed) {
    return <p className="py-10 text-center text-(--muted)">The financial report is available to finance roles only.</p>;
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(thisYear - i)).map((y) => ({ value: y, label: y }));
  const months = data?.months ?? [];
  const totals = data?.totals;
  const best = months.reduce<MonthlyFinance | null>((b, m) => (m.revenue > 0 && (!b || m.netProfit > b.netProfit) ? m : b), null);
  const excluded = (totals?.excludedFromProfit.advance ?? 0) + (totals?.excludedFromProfit.equipment ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monthly financial report</h1>
          <p className="mt-1 text-(--muted)">What came in, what went out and what was left — month by month.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-28">
            <Select label="Year" options={yearOptions} value={String(year)} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <ExportWorkbookButton filename={`monthly-financial-report-${year}`} buildSheets={() => buildSheets(year)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
        </div>
      ) : error || !data || !totals ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">
          Couldn&apos;t load the report. If you just updated the app, make sure the backend has been deployed too.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label={`Revenue ${year}`} value={formatMoney(totals.revenue)} sub={`${totals.paymentsCount} payments`} className="text-emerald-700" />
            <Kpi label={`Expenses ${year}`} value={formatMoney(totals.totalExpenses)} sub={totals.adSpend > 0 ? `${formatMoney(totals.adSpend)} of it ad spend` : undefined} className="text-rose-700" />
            <Kpi
              label="Net profit"
              value={formatMoney(totals.netProfit)}
              sub={totals.marginPercent === null ? undefined : `${totals.marginPercent}% margin`}
              className={profitClass(totals.netProfit)}
            />
            <Kpi label="Best month" value={best ? monthName(best.month) : "—"} sub={best ? `${formatMoney(best.netProfit)} net profit` : "No revenue yet"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart months={months} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Month by month</CardTitle>
              <p className="mt-1 text-sm text-(--muted)">Select a month to see where the money came from and where it went.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHead>
                  <Th>Month</Th>
                  <Th align="right">Revenue</Th>
                  <Th align="right">Direct</Th>
                  <Th align="right">Operational</Th>
                  <Th align="right">Total expenses</Th>
                  <Th align="right">Net profit</Th>
                  <Th align="right">Margin</Th>
                </TableHead>
                <TableBody>
                  {months.map((m) => {
                    const empty = m.revenue === 0 && m.totalExpenses === 0;
                    return (
                      <TableRow
                        key={m.month}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => setOpenMonth(m.month)}
                        onKeyDown={(e) => e.key === "Enter" && setOpenMonth(m.month)}
                      >
                        <Td className="font-medium">{monthName(m.month)}</Td>
                        <Td align="right" label="Revenue" className={`num ${empty ? "text-(--muted)" : ""}`}>
                          {formatMoney(m.revenue)}
                        </Td>
                        <Td align="right" label="Direct" className="num text-(--muted)">
                          {formatMoney(m.directExpenses)}
                        </Td>
                        <Td align="right" label="Operational" className="num text-(--muted)">
                          {formatMoney(m.operationalExpenses)}
                        </Td>
                        <Td align="right" label="Total expenses" className={`num ${empty ? "text-(--muted)" : ""}`}>
                          {formatMoney(m.totalExpenses)}
                        </Td>
                        <Td align="right" label="Net profit" className={`num font-semibold ${profitClass(m.netProfit)}`}>
                          {formatMoney(m.netProfit)}
                        </Td>
                        <Td align="right" label="Margin" className="num text-(--muted)">
                          {m.marginPercent === null ? "—" : `${m.marginPercent}%`}
                        </Td>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-(--surface-sunken) font-semibold">
                    <Td>Total {year}</Td>
                    <Td align="right" label="Revenue" className="num">
                      {formatMoney(totals.revenue)}
                    </Td>
                    <Td align="right" label="Direct" className="num">
                      {formatMoney(totals.directExpenses)}
                    </Td>
                    <Td align="right" label="Operational" className="num">
                      {formatMoney(totals.operationalExpenses)}
                    </Td>
                    <Td align="right" label="Total expenses" className="num">
                      {formatMoney(totals.totalExpenses)}
                    </Td>
                    <Td align="right" label="Net profit" className={`num ${profitClass(totals.netProfit)}`}>
                      {formatMoney(totals.netProfit)}
                    </Td>
                    <Td align="right" label="Margin" className="num">
                      {totals.marginPercent === null ? "—" : `${totals.marginPercent}%`}
                    </Td>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ul className="space-y-1 text-xs text-(--muted)">
            <li>Cash basis: revenue is payments received and expenses are costs recorded, each in the month they happened.</li>
            <li>Test projects are left out.</li>
            {excluded > 0 && (
              <li>
                {formatMoney(excluded)} of employee advances and equipment purchases was spent this year but is kept out of profit (shown in the Excel export).
              </li>
            )}
            <li>Months with no expenses recorded look more profitable than they were — make sure salaries and subscriptions are entered.</li>
          </ul>
        </>
      )}

      <MonthDetailModal month={openMonth} onClose={() => setOpenMonth(null)} />
    </div>
  );
}
