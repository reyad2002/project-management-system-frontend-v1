"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type CreatePhaseInput, type UpdatePhaseInput } from "@/lib/api";

export function usePhases(
  projectId: string | null,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["projects", projectId, "phases", params],
    queryFn: () => projectsApi.phases.list(projectId!, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function usePhase(projectId: string | null, phaseId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "phases", phaseId],
    queryFn: () => projectsApi.phases.get(projectId!, phaseId!).then((r) => r.data),
    enabled: !!projectId && !!phaseId,
  });
}

export function useCreatePhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePhaseInput) =>
      projectsApi.phases.create(projectId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "phases"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

export function useUpdatePhase(projectId: string, phaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePhaseInput) =>
      projectsApi.phases.update(projectId, phaseId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "phases"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "phases", phaseId] });
    },
  });
}

export function useDeletePhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (phaseId: string) =>
      projectsApi.phases.delete(projectId, phaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "phases"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
