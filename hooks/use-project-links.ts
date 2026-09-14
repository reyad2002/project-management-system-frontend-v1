"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectLinksApi, type CreateProjectLinkInput } from "@/lib/api";

export function useProjectLinks(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "links"],
    queryFn: () => projectLinksApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateProjectLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectLinkInput) => projectLinksApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "links"] }),
  });
}

export function useDeleteProjectLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectLinksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "links"] }),
  });
}
