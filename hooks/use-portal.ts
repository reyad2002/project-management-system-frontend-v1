"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalDataApi } from "@/lib/portal-api";

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
