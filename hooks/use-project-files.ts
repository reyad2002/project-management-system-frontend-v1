"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesApi, type FileCategory, type CreateProjectFileInput } from "@/lib/api";

export function useProjectFiles(projectId: string | null, params?: { category?: FileCategory }) {
  return useQuery({
    queryKey: ["projects", projectId, "files", params],
    queryFn: () => filesApi.list(projectId!, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useUploadProjectFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "File added" },
    mutationFn: (data: CreateProjectFileInput) => filesApi.upload(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "files"] }),
  });
}

export function useFileComments(fileId: string | null) {
  return useQuery({
    queryKey: ["files", fileId, "comments"],
    queryFn: () => filesApi.comments.list(fileId!).then((r) => r.data),
    enabled: !!fileId,
  });
}

export function useAddFileComment(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => filesApi.comments.add(fileId, content).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", fileId, "comments"] }),
  });
}
