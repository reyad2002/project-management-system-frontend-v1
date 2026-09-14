"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  portalDataApi,
  portalMeetingsApi,
  portalProjectLinksApi,
  portalTasksApi,
  portalCredentialsApi,
  portalFeedbackApi,
  portalFilesApi,
} from "@/lib/portal-api";
import type { FileCategory } from "@/lib/api";

export function usePortalProjects() {
  return useQuery({
    queryKey: ["portal", "projects"],
    queryFn: () => portalDataApi.projects().then((r) => r.data),
  });
}

export function usePortalProject(id: string | null) {
  return useQuery({
    queryKey: ["portal", "projects", id],
    queryFn: () => portalDataApi.project(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: () => portalDataApi.invoices().then((r) => r.data),
  });
}

export function usePortalInvoice(id: string | null) {
  return useQuery({
    queryKey: ["portal", "invoices", id],
    queryFn: () => portalDataApi.invoice(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePortalPaymentSummary() {
  return useQuery({
    queryKey: ["portal", "payment-summary"],
    queryFn: () => portalDataApi.paymentSummary().then((r) => r.data),
  });
}

export function useApprovePhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (phaseId: string) => portalDataApi.approvePhase(phaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "projects", projectId] }),
  });
}

// ---- Meetings ----
export function usePortalMeetings(projectId: string | null) {
  return useQuery({
    queryKey: ["portal", "projects", projectId, "meetings"],
    queryFn: () => portalMeetingsApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function usePortalMeetingNotes(meetingId: string | null) {
  return useQuery({
    queryKey: ["portal", "meetings", meetingId, "notes"],
    queryFn: () => portalMeetingsApi.notes(meetingId!).then((r) => r.data),
    enabled: !!meetingId,
  });
}

export function useMarkMeetingNoteRead() {
  return useMutation({
    mutationFn: (noteId: string) => portalMeetingsApi.markNoteRead(noteId),
  });
}

// ---- Project Links ----
export function usePortalProjectLinks(projectId: string | null) {
  return useQuery({
    queryKey: ["portal", "projects", projectId, "links"],
    queryFn: () => portalProjectLinksApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

// ---- Pending on Client ----
export function usePendingOnClientTasks(projectId: string | null) {
  return useQuery({
    queryKey: ["portal", "projects", projectId, "tasks", "pending-on-client"],
    queryFn: () => portalTasksApi.pendingOnClient(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

// ---- Credentials ----
export function usePortalCredentials(projectId: string | null) {
  return useQuery({
    queryKey: ["portal", "projects", projectId, "credentials"],
    queryFn: () => portalCredentialsApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useRevealPortalCredential() {
  return useMutation({
    mutationFn: (id: string) => portalCredentialsApi.reveal(id).then((r) => r.data.password),
  });
}

// ---- Micro-feedback ----
export function useSubmitPortalFeedback() {
  return useMutation({
    mutationFn: portalFeedbackApi.submit,
  });
}

// ---- Project Files ----
export function usePortalFiles(projectId: string | null, params?: { category?: FileCategory }) {
  return useQuery({
    queryKey: ["portal", "projects", projectId, "files", params],
    queryFn: () => portalFilesApi.list(projectId!, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useUploadPortalFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { file_name: string; file_url: string; description?: string }) =>
      portalFilesApi.upload(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "projects", projectId, "files"] }),
  });
}

export function useUpdatePortalFileStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: "approved" | "needs_changes"; comment?: string }) =>
      portalFilesApi.updateStatus(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "projects", projectId, "files"] }),
  });
}

export function usePortalFileComments(fileId: string | null) {
  return useQuery({
    queryKey: ["portal", "files", fileId, "comments"],
    queryFn: () => portalFilesApi.comments.list(fileId!).then((r) => r.data),
    enabled: !!fileId,
  });
}

export function useAddPortalFileComment(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => portalFilesApi.comments.add(fileId, content).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "files", fileId, "comments"] }),
  });
}
