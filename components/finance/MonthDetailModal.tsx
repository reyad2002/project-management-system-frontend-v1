"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMonthDetail } from "@/hooks/use-statistics";
import { COST_CATEGORIES } from "@/lib/constants";
import { formatMoney, monthName, profitClass } from "./monthFormat";

interface MonthDetailModalProps {
  /** "2026-03", or null to keep it closed. */
  month: string | null;
  onClose: () => void;
}

const categoryLabel = (value: string) => COST_CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/_/g, " ");

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-(--card-border) px-3 py-2">
      <p className="text-xs text-(--muted)">{label}</p>
      <p className={`num text-base font-semibold ${className}`}>{value}</p>
    </div>
  );
}

export function MonthDetailModal({ month, onClose }: MonthDetailModalProps) {
  const { data, isLoading } = useMonthDetail(month);
  if (!month) return null;

  const s = data?.summary;
  const excluded = (s?.excludedFromProfit.advance ?? 0) + (s?.excludedFromProfit.equipment ?? 0);

  return (
    <Modal open onClose={onClose} title={monthName(month)} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      {isLoading || !data || !s ? (
        <p className="text-(--muted)">Loading...</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Revenue" value={formatMoney(s.revenue)} />
            <Stat label="Expenses" value={formatMoney(s.totalExpenses)} />
            <Stat
              label={s.marginPercent === null ? "Net profit" : `Net profit (${s.marginPercent}%)`}
              value={formatMoney(s.netProfit)}
              className={profitClass(s.netProfit)}
            />
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">Where the money came from</h3>
            {data.revenueByProject.length === 0 ? (
              <p className="text-(--muted)">No payments this month.</p>
            ) : (
              <ul className="divide-y divide-(--border-subtle) rounded-lg border border-(--card-border)">
                {data.revenueByProject.map((r) => (
                  <li key={String(r.project_id)} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">
                      {r.title ?? "Unknown project"}
                      <span className="ms-2 text-xs text-(--muted)">
                        {r.count} payment{r.count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="num font-medium">{formatMoney(r.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">Where it went</h3>
            {data.expensesByCategory.length === 0 ? (
              <p className="text-(--muted)">No expenses this month.</p>
            ) : (
              <ul className="divide-y divide-(--border-subtle) rounded-lg border border-(--card-border)">
                {data.expensesByCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span>
                      {categoryLabel(c.category)}
                      <span className="ms-2 text-xs text-(--muted)">
                        {c.count} entr{c.count === 1 ? "y" : "ies"}
                      </span>
                    </span>
                    <span className="num font-medium">{formatMoney(c.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.topExpenses.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">Biggest costs</h3>
              <ul className="divide-y divide-(--border-subtle) rounded-lg border border-(--card-border)">
                {data.topExpenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">{e.title}</span>
                      <span className="block text-xs text-(--muted)">
                        {e.expense_date}
                        {e.project_title ? ` · ${e.project_title}` : ""}
                      </span>
                    </span>
                    <span className="num font-medium">{formatMoney(e.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {excluded > 0 && (
            <p className="rounded-lg bg-(--muted-bg) px-3 py-2 text-xs text-(--muted)">
              {formatMoney(excluded)} of employee advances and equipment was also spent this month but is kept out of profit.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
