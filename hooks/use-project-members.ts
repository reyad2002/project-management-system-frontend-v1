"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMembersApi, type AddProjectMemberInput } from "@/lib/api";

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => projectMembersApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddProjectMemberInput) => projectMembersApi.add(projectId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      qc.invalidateQueries({ queryKey: ["team", "workload"] });
    },
  });
}

export function useUpdateProjectMember(projectId: string, memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AddProjectMemberInput>) =>
      projectMembersApi.update(projectId, memberId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      qc.invalidateQueries({ queryKey: ["team", "workload"] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => projectMembersApi.remove(projectId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      qc.invalidateQueries({ queryKey: ["team", "workload"] });
    },
  });
}
