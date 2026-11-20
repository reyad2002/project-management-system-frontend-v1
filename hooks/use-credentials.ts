"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { credentialsApi, type CreateCredentialInput } from "@/lib/api";

export function useCredentials(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "credentials"],
    queryFn: () => credentialsApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateCredential(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Credential saved" },
    mutationFn: (data: CreateCredentialInput) => credentialsApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "credentials"] }),
  });
}

export function useRevealCredential() {
  return useMutation({
    mutationFn: (id: string) => credentialsApi.reveal(id).then((r) => r.data.password),
  });
}

export function useCredentialAccessLog(id: string | null) {
  return useQuery({
    queryKey: ["credentials", id, "access-log"],
    queryFn: () => credentialsApi.accessLog(id!).then((r) => r.data),
    enabled: !!id,
  });
}
