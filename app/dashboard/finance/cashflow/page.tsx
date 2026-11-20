"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableHead, TableRow, Td, Th } from "@/components/ui/Table";
import { ExportWorkbookButton } from "@/components/ui/ExportButton";
import { useCashflow } from "@/hooks/use-insights";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { buildSheet, type ExportColumn, type PreparedSheet } from "@/lib/export";
import { formatMoney, profitClass } from "@/components/finance/monthFormat";
import type { Cashflow, CashflowEvent } from "@/lib/api";

const OPENING_KEY = "cashflow.opening";
const KIND_LABEL: Record<CashflowEvent["kind"], string> = {
  invoice: "Invoice",
  renewal: "Renewal",
  bill: "Supplier bill",
  subscription: "Subscription",
  salary: "Salaries",
  running_costs: "Running costs",
};

function storedOpening() {
  try {
    const n = Number(window.localStorage.getItem(OPENING_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

const shortDate = (d: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

function EventList({ title, events, sign }: { title: string; events: Cashflow["biggestIn"]; sign: 1 | -1 }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <p className="py-4 text-center text-sm text-(--muted)">Nothing expected.</p>
        ) : (
          <ul className="divide-y divide-(--border-subtle)">
            {events.map((e, i) => (
              <li key={`${e.date}-${e.label}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-(--foreground)">{e.label}</span>
                  <span className="block text-xs text-(--muted)">
                    {shortDate(e.date)} · {KIND_LABEL[e.kind]}
                    {e.late && " · assumed late"}
                    {e.estimate && " · estimate"}
                  </span>
                </span>
                <span className={`num shrink-0 text-sm font-semibold ${sign > 0 ? "text-(--success)" : "text-(--destructive)"}`}>{formatMoney(e.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const weeklyColumns: ExportColumn<Cashflow["weekly"][number]>[] = [
  { header: "Week from", value: (r) => r.from },
  { header: "Week to", value: (r) => r.to },
  { header: "Money in", value: (r) => r.inflow, kind: "money" },
  { header: "Money out", value: (r) => r.outflow, kind: "money" },
  { header: "Net", value: (r) => r.net, kind: "money" },
  { header: "Running balance", value: (r) => r.balance, kind: "money", width: 18 },
];
const eventColumns: ExportColumn<Cashflow["events"][number]>[] = [
  { header: "Date", value: (r) => r.date },
  { header: "Type", value: (r) => KIND_LABEL[r.kind], width: 16 },
  { header: "What", value: (r) => r.label, width: 36 },
  { header: "Amount (+in / -out)", value: (r) => r.amount, kind: "money", width: 20 },
  { header: "Assumed late", value: (r) => (r.late ? "Yes" : "") },
  { header: "Estimate", value: (r) => (r.estimate ? "Yes" : "") },
];

function sheetsFor(data: Cashflow): PreparedSheet[] {
  const summary = [...data.windows.map((w) => ({ what: `Next ${w.days} days`, inflow: w.inflow, outflow: w.outflow, net: w.net, ending: w.endingBalance }))];
  return [
    buildSheet("Summary", [
      { header: "Window", value: (r) => r.what, width: 16 },
      { header: "Money in", value: (r) => r.inflow, kind: "money" },
      { header: "Money out", value: (r) => r.outflow, kind: "money" },
      { header: "Net", value: (r) => r.net, kind: "money" },
      { header: "Ending balance", value: (r) => r.ending, kind: "money", width: 16 },
    ], summary),
    buildSheet("Weekly", weeklyColumns, data.weekly),
    buildSheet("Items", eventColumns, data.events.map((e) => ({ ...e, amount: e.amount }))),
    buildSheet("Assumptions", [{ header: "Assumption", value: (r) => r.text, width: 120 }], data.assumptions.map((text) => ({ text }))),
  ];
}

export default function CashflowPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<30 | 60 | 90>(90);
  // The bank balance is typed once and remembered in this browser (the system doesn't hold bank accounts).
  const [openingText, setOpeningText] = useState(() => {
    const stored = storedOpening();
    return stored ? String(stored) : "";
  });
  const [opening, setOpening] = useState(storedOpening);

  useEffect(() => {
    const timer = setTimeout(() => {
      const n = Number(openingText);
      const value = openingText.trim() === "" || !Number.isFinite(n) ? 0 : n;
      setOpening(value);
      try {
        window.localStorage.setItem(OPENING_KEY, String(value));
      } catch {
        /* storage unavailable */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [openingText]);

  const { data, isLoading, error } = useCashflow(days, opening);

  if (!can(user, "finance")) return <p className="py-10 text-center text-(--muted)">The cash-flow forecast is for the finance roles.</p>;

  const maxBar = data ? Math.max(1, ...data.weekly.flatMap((w) => [w.inflow, w.outflow])) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash-flow forecast</h1>
          <p className="mt-1 text-(--muted)">What is likely to come in and go out, week by week.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <Select label="Look ahead" options={[{ value: "30", label: "30 days" }, { value: "60", label: "60 days" }, { value: "90", label: "90 days" }]} value={String(days)} onChange={(e) => setDays(Number(e.target.value) as 30 | 60 | 90)} />
          </div>
          <div className="w-48">
            <Input label="Cash on hand today (optional)" type="number" step="0.01" value={openingText} onChange={(e) => setOpeningText(e.target.value)} placeholder="Bank + cash" />
          </div>
          {data && <ExportWorkbookButton filename={`cashflow-forecast-${data.days}-days`} buildSheets={async () => sheetsFor(data)} />}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">Couldn&apos;t load the forecast. If you just updated the app, make sure the backend has been deployed too.</div>
      ) : (
        <>
          {data.firstNegativeDate && (
            <div className="flex items-start gap-3 rounded-xl border border-(--destructive)/30 bg-(--destructive-bg) px-4 py-3 text-(--destructive)">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                {opening > 0 ? "Cash is forecast to run out" : "Cumulative cash goes negative"} around {shortDate(data.firstNegativeDate)}; the lowest point is {formatMoney(data.lowest.balance)} on {shortDate(data.lowest.date)}.
              </p>
            </div>
          )}
          {data.overdueBeyondHorizon > 0 && (
            <p className="rounded-lg bg-(--warning-bg) px-3 py-2 text-sm text-(--warning)">{formatMoney(data.overdueBeyondHorizon)} of overdue invoices is not counted, because it would arrive after this period.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {data.windows.map((w) => (
              <Card key={w.days}>
                <CardContent className="p-4">
                  <p className="text-xs text-(--muted)">Next {w.days} days</p>
                  <p className={`num mt-1 text-2xl font-semibold ${profitClass(w.net)}`}>{w.net > 0 ? "+" : ""}{formatMoney(w.net)}</p>
                  <p className="mt-1 text-xs text-(--muted)">
                    {formatMoney(w.inflow)} in · {formatMoney(w.outflow)} out
                  </p>
                  {opening !== 0 && <p className="mt-1 text-xs text-(--muted)">Ending balance {formatMoney(w.endingBalance)}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Week by week</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {data.weekly.map((w) => (
                  <div key={w.from} className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 sm:grid-cols-[5.5rem_1fr_7rem]">
                    <span className="text-xs text-(--muted)">{shortDate(w.from)}</span>
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-(--success)/80" style={{ width: `${(w.inflow / maxBar) * 100}%`, minWidth: w.inflow > 0 ? "2px" : 0 }} title={`In ${formatMoney(w.inflow)}`} />
                      <div className="h-2 rounded-full bg-(--destructive)/70" style={{ width: `${(w.outflow / maxBar) * 100}%`, minWidth: w.outflow > 0 ? "2px" : 0 }} title={`Out ${formatMoney(w.outflow)}`} />
                    </div>
                    <span className={`num text-end text-xs font-medium ${profitClass(w.balance)}`}>{formatMoney(w.balance)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--muted)">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-(--success)/80" /> money in</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-(--destructive)/70" /> money out</span>
                <span>Right column: running balance{opening === 0 ? " (starting from zero, so it shows the cumulative net)" : ""}</span>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <EventList title="Biggest money in" events={data.biggestIn} sign={1} />
            <EventList title="Biggest money out" events={data.biggestOut} sign={-1} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Weekly detail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHead>
                  <Th>Week</Th>
                  <Th>In</Th>
                  <Th>Out</Th>
                  <Th>Net</Th>
                  <Th>Balance</Th>
                </TableHead>
                <TableBody>
                  {data.weekly.map((w) => (
                    <TableRow key={w.from}>
                      <Td label="Week" className="text-(--muted)">{shortDate(w.from)} – {shortDate(w.to)}</Td>
                      <Td label="In" className="num">{formatMoney(w.inflow)}</Td>
                      <Td label="Out" className="num">{formatMoney(w.outflow)}</Td>
                      <Td label="Net" className={`num font-medium ${profitClass(w.net)}`}>{formatMoney(w.net)}</Td>
                      <Td label="Balance" className={`num ${profitClass(w.balance)}`}>{formatMoney(w.balance)}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How this is calculated</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="list-disc space-y-1.5 ps-5 text-sm text-(--muted)">
                {data.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-(--muted)">A forecast is a guide, not a promise. Items marked “estimate” or “assumed late” are guesses.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
