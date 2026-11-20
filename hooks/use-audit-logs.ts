"use client";

import { useQuery } from "@tanstack/react-query";
import { auditLogsApi, type AuditLogFilters } from "@/lib/api";

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditLogsApi.list(filters).then((r) => r.data),
    placeholderData: (previous) => previous,
  });
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: ["audit-logs", id],
    queryFn: () => auditLogsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}
