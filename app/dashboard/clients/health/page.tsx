"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { ExportButton } from "@/components/ui/ExportButton";
import { HealthBadge, healthLabel } from "@/components/clients/HealthBadge";
import { useClientHealth } from "@/hooks/use-insights";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import type { ClientHealth, HealthLevel } from "@/lib/api";
import type { ExportColumn } from "@/lib/export";

const columns: ExportColumn<ClientHealth>[] = [
  { header: "Client", value: (r) => r.name, width: 28 },
  { header: "Health score", value: (r) => r.score, kind: "number" },
  { header: "Level", value: (r) => healthLabel(r.level) },
  { header: "Days since contact", value: (r) => r.daysSinceContact, kind: "number", width: 18 },
  { header: "Why", value: (r) => r.reasons.map((x) => x.text).join("; "), width: 80 },
];

export default function ClientHealthPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useClientHealth();
  const [level, setLevel] = useState<"" | HealthLevel>("");

  if (!can(user, "finance")) return <p className="py-10 text-center text-(--muted)">Client health is for the finance roles.</p>;

  const clients = (data?.clients ?? []).filter((c) => !level || c.level === level);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client health</h1>
          <p className="mt-1 text-(--muted)">Who needs a call before they drift away: late payments, late projects, silence, lapsed renewals.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-48">
            <Select
              label="Show"
              options={[
                { value: "", label: "All clients" },
                { value: "at_risk", label: "At risk" },
                { value: "watch", label: "Needs a look" },
                { value: "healthy", label: "Healthy" },
              ]}
              value={level}
              onChange={(e) => setLevel(e.target.value as "" | HealthLevel)}
            />
          </div>
          {data && <ExportButton filename="client-health" sheet="Clients" columns={columns} fetchRows={async () => data.clients} />}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">Couldn&apos;t load client health. If you just updated the app, make sure the backend has been deployed too.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(["at_risk", "watch", "healthy"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLevel(level === l ? "" : l)} aria-pressed={level === l} className={`rounded-xl border bg-(--card) px-4 py-3 text-start transition-colors hover:border-(--primary) ${level === l ? "border-(--primary)" : "border-(--card-border)"}`}>
                <p className="text-xs text-(--muted)">{healthLabel(l)}</p>
                <p className={`num mt-0.5 text-2xl font-semibold ${l === "at_risk" && data.counts.at_risk > 0 ? "text-(--destructive)" : l === "watch" && data.counts.watch > 0 ? "text-(--warning)" : ""}`}>{data.counts[l]}</p>
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {clients.length === 0 ? (
                <p className="py-10 text-center text-(--muted)">{data.clients.length === 0 ? "No clients yet." : "No clients at this level."}</p>
              ) : (
                <ul className="divide-y divide-(--border-subtle)">
                  {clients.map((c) => (
                    <li key={c.client_id} className="space-y-1.5 px-4 py-3.5 sm:px-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/dashboard/clients/${c.client_id}`} className="font-medium text-foreground hover:underline">
                          {c.name}
                        </Link>
                        <HealthBadge level={c.level} score={c.score} />
                      </div>
                      {c.reasons.length === 0 ? (
                        <p className="flex items-center gap-1.5 text-sm text-(--muted)">
                          <CheckCircle2 className="h-4 w-4 text-(--success)" /> Nothing to worry about.
                        </p>
                      ) : (
                        <ul className="space-y-0.5">
                          {c.reasons.map((r) => (
                            <li key={r.code} className={`flex items-start gap-1.5 text-sm ${r.severity === "good" ? "text-(--success)" : "text-(--muted)"}`}>
                              {r.severity === "good" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-(--warning)" />}
                              <span>{r.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-(--muted)">
            Every client starts at 100 and loses points: overdue invoices (up to 45), projects past their due date (up to 20), no contact for 2+ weeks (up to 30), lapsed renewals (up to 30), no active work (15). 75+ healthy, 50–74 needs a look, under 50 at risk. “Contact” is a
            call or message logged on the client page, or a meeting on one of its projects.
          </p>
        </>
      )}
    </div>
  );
}
