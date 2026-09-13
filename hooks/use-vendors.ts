"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorsApi, type CreateVendorInput } from "@/lib/api";

export function useVendors(params?: { page?: number; limit?: number; q?: string }) {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => vendorsApi.list(params).then((r) => r.data),
  });
}

export function useVendorsShortList() {
  return useQuery({
    queryKey: ["vendors", "shortList"],
    queryFn: () => vendorsApi.shortList().then((r) => r.data),
  });
}

export function useVendor(id: string | null) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => vendorsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendorInput) => vendorsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateVendorInput>) => vendorsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendors", id] });
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}
