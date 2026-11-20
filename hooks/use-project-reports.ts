"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectReportsApi, type ProjectReportInput } from "@/lib/api";

export function useProjectReports(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "reports"],
    queryFn: () => projectReportsApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

/** Create the month's report (or replace it if that month already has one). */
export function useSaveProjectReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Report saved" },
    mutationFn: ({ id, ...data }: { id?: string } & ProjectReportInput) =>
      (id ? projectReportsApi.update(id, data) : projectReportsApi.create(projectId, data)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "reports"] }),
  });
}

export function useDeleteProjectReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Report deleted" },
    mutationFn: (id: string) => projectReportsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "reports"] }),
  });
}
