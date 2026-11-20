"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuditLog } from "@/hooks/use-audit-logs";
import { formatAuditTime, actionLabel } from "./auditFormat";

interface AuditLogDetailModalProps {
  logId: string | null;
  onClose: () => void;
}

type Json = Record<string, unknown>;

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value === "" ? "(empty)" : value;
  try {
    const s = JSON.stringify(value);
    return s.length > 300 ? `${s.slice(0, 300)}…` : s;
  } catch {
    return String(value);
  }
}

/** Field-by-field comparison of the record before and after the change. */
function buildRows(before: Json | null, after: Json | null) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys
    .map((key) => {
      const b = before?.[key];
      const a = after?.[key];
      return { key, before: b, after: a, changed: JSON.stringify(b) !== JSON.stringify(a) };
    })
    .filter((r) => !(r.changed === false && before && after)) // update: only show what changed
    .sort((x, y) => Number(y.changed) - Number(x.changed));
}

export function AuditLogDetailModal({ logId, onClose }: AuditLogDetailModalProps) {
  const { data: log, isLoading } = useAuditLog(logId);
  if (!logId) return null;

  const before = (log?.before ?? null) as Json | null;
  const after = (log?.after ?? null) as Json | null;
  const rows = log ? buildRows(before, after) : [];
  const request = (log?.metadata as { request?: unknown } | undefined)?.request;
  const error = (log?.metadata as { error?: string } | undefined)?.error;

  return (
    <Modal
      open
      onClose={onClose}
      title="Audit entry"
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {isLoading || !log ? (
        <p className="text-(--muted)">Loading...</p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="font-medium text-foreground">{log.summary}</p>

          <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
            <dt className="text-(--muted)">When</dt>
            <dd>{formatAuditTime(log.occurred_at)} (Cairo)</dd>
            <dt className="text-(--muted)">Who</dt>
            <dd>
              {log.actor_name ?? "Unknown"}
              <span className="ms-1 text-xs text-(--muted)">
                ({log.actor_type === "client_portal_user" ? "client portal" : log.actor_type})
              </span>
            </dd>
            <dt className="text-(--muted)">Action</dt>
            <dd>
              {actionLabel(log.action)}{" "}
              <Badge variant={log.outcome === "success" ? "success" : "danger"} dot={false}>
                {log.outcome}
                {log.status_code ? ` · ${log.status_code}` : ""}
              </Badge>
            </dd>
            <dt className="text-(--muted)">Record</dt>
            <dd>
              {log.entity_type ?? "—"}
              {log.entity_id ? ` #${log.entity_id}` : ""}
            </dd>
            <dt className="text-(--muted)">Request</dt>
            <dd className="break-all font-mono text-xs">
              {log.method} {log.path}
            </dd>
            <dt className="text-(--muted)">From</dt>
            <dd className="break-all text-xs">
              {log.ip ?? "—"}
              {log.user_agent ? ` · ${log.user_agent}` : ""}
            </dd>
          </dl>

          {error && <p className="rounded-lg bg-(--destructive-bg) px-3 py-2 text-(--destructive)">{error}</p>}

          {rows.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">
                {before && after ? "What changed" : before ? "Deleted record" : "Created record"}
              </p>
              <ul className="divide-y divide-(--border-subtle) rounded-lg border border-(--card-border)">
                {rows.map((r) => (
                  <li key={r.key} className="px-3 py-2">
                    <p className="text-xs font-medium text-(--muted)">{r.key}</p>
                    {before && after ? (
                      <p className="break-words">
                        <span className="text-(--destructive) line-through decoration-1">{show(r.before)}</span>
                        <span className="mx-2 text-(--muted)">→</span>
                        <span className="font-medium text-(--success)">{show(r.after)}</span>
                      </p>
                    ) : (
                      <p className="break-words">{show(before ? r.before : r.after)}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {request !== undefined && request !== null && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-(--muted)">Request sent</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-(--muted-bg) p-3 text-xs">
                {JSON.stringify(request, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
