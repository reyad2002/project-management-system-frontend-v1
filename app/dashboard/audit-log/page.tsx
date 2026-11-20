"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { auditColumns } from "@/lib/export-columns";
import { auditLogsApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { AuditLogDetailModal } from "@/components/audit/AuditLogDetailModal";
import { ACTION_LABELS, ENTITY_TYPES, actionLabel, formatAuditTime } from "@/components/audit/auditFormat";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import type { AuditLogFilters } from "@/lib/api";

const PAGE_SIZE = 25;

function actionVariant(action: string, outcome: string): BadgeVariant {
  if (outcome === "failure") return "danger";
  if (action === "delete" || action === "cancel") return "warning";
  if (action === "create") return "success";
  if (action.startsWith("login") || action.startsWith("portal_login") || action.startsWith("password")) return "info";
  return "neutral";
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const allowed = can(user, "accounts");

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useAuditLogs({ ...filters, page, limit: PAGE_SIZE });
  const { data: accountsData } = useAccounts(allowed);

  if (!allowed) {
    return <p className="py-10 text-center text-(--muted)">Only owners and admins can view the audit log.</p>;
  }

  const set = (patch: Partial<AuditLogFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const accountName = (id: string) => accountsData?.accounts.find((a) => String(a.id) === id)?.name ?? id;
  const chips: FilterChip[] = [
    filters.actor_id && { key: "actor", label: `Person: ${accountName(filters.actor_id)}`, onRemove: () => set({ actor_id: undefined, actor_type: undefined }) },
    filters.action && { key: "action", label: `Action: ${actionLabel(filters.action)}`, onRemove: () => set({ action: undefined }) },
    filters.entity_type && { key: "entity", label: `Record: ${filters.entity_type.replace(/_/g, " ")}`, onRemove: () => set({ entity_type: undefined }) },
    filters.outcome && { key: "outcome", label: `Result: ${filters.outcome}`, onRemove: () => set({ outcome: undefined }) },
    filters.from_date && { key: "from", label: `From ${filters.from_date}`, onRemove: () => set({ from_date: undefined }) },
    filters.to_date && { key: "to", label: `To ${filters.to_date}`, onRemove: () => set({ to_date: undefined }) },
  ].filter(Boolean) as FilterChip[];

  const logs = data?.logs ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit log</h1>
        <p className="mt-1 text-(--muted)">
          Every create, change, delete, sign-in and credential reveal — who did it and when. Entries can&apos;t be edited or removed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <form
              className="flex min-w-48 flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                set({ q: searchInput.trim() || undefined });
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
                <Input
                  className="pl-9"
                  placeholder="Search the summary..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <FilterDrawer
              activeCount={chips.length}
              onClear={() => {
                setFilters((f) => ({ q: f.q }));
                setPage(1);
              }}
              chips={chips}
            >
              <Select
                label="Person"
                options={[
                  { value: "", label: "Anyone" },
                  ...(accountsData?.accounts ?? []).map((a) => ({ value: String(a.id), label: a.name })),
                ]}
                value={filters.actor_id ?? ""}
                onChange={(e) => set({ actor_id: e.target.value || undefined, actor_type: e.target.value ? "user" : undefined })}
              />
              <Select
                label="Action"
                options={[{ value: "", label: "All" }, ...Object.keys(ACTION_LABELS).map((k) => ({ value: k, label: ACTION_LABELS[k] }))]}
                value={filters.action ?? ""}
                onChange={(e) => set({ action: e.target.value || undefined })}
              />
              <Select
                label="Record"
                options={[{ value: "", label: "All" }, ...ENTITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))]}
                value={filters.entity_type ?? ""}
                onChange={(e) => set({ entity_type: e.target.value || undefined })}
              />
              <Select
                label="Result"
                options={[
                  { value: "", label: "All" },
                  { value: "success", label: "Succeeded" },
                  { value: "failure", label: "Failed" },
                ]}
                value={filters.outcome ?? ""}
                onChange={(e) => set({ outcome: (e.target.value || undefined) as AuditLogFilters["outcome"] })}
              />
              <Input label="From" type="date" value={filters.from_date ?? ""} onChange={(e) => set({ from_date: e.target.value || undefined })} />
              <Input label="To" type="date" value={filters.to_date ?? ""} onChange={(e) => set({ to_date: e.target.value || undefined })} />
            </FilterDrawer>
            <ExportButton
              filename="audit-log"
              sheet="Audit log"
              columns={auditColumns}
              fetchRows={() =>
                fetchAllPages((p, limit) =>
                  auditLogsApi.list({ ...filters, page: p, limit }).then((r) => ({ rows: r.data.logs, total: r.data.pagination.total })),
                )
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-(--muted)">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-(--muted)">No entries match these filters.</p>
          ) : (
            <>
              <Table>
                <TableHead>
                  <Th>When (Cairo)</Th>
                  <Th>Who</Th>
                  <Th>Action</Th>
                  <Th>What happened</Th>
                </TableHead>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id} className="cursor-pointer" onClick={() => setOpenId(String(l.id))}>
                      <Td className="whitespace-nowrap text-(--muted)">{formatAuditTime(l.occurred_at)}</Td>
                      <Td label="Who">
                        {l.actor_name ?? "—"}
                        {l.actor_type === "client_portal_user" && <span className="ml-1 text-xs text-(--muted)">(client)</span>}
                      </Td>
                      <Td label="Action">
                        <Badge variant={actionVariant(l.action, l.outcome)} dot={false}>
                          {actionLabel(l.action)}
                        </Badge>
                      </Td>
                      <Td label="Summary">{l.summary}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-(--muted)">
                  Page {page} of {totalPages} ({total} entries){isFetching ? " · updating…" : ""}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AuditLogDetailModal logId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
