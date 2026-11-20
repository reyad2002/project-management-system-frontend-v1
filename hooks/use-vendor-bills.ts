"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  vendorBillsApi,
  type CreateVendorBillInput,
  type CreateVendorBillPaymentInput,
  type VendorBillStatus,
} from "@/lib/api";

export function useVendorBills(params?: {
  page?: number;
  limit?: number;
  vendor_id?: string;
  project_id?: string;
  status?: VendorBillStatus;
}) {
  return useQuery({
    queryKey: ["vendor-bills", params],
    queryFn: () => vendorBillsApi.list(params).then((r) => r.data),
  });
}

export function useVendorBill(id: string | null) {
  return useQuery({
    queryKey: ["vendor-bills", id],
    queryFn: () => vendorBillsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateVendorBill() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Bill added" },
    mutationFn: (data: CreateVendorBillInput) => vendorBillsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateVendorBill(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Bill saved" },
    mutationFn: (data: Partial<CreateVendorBillInput>) => vendorBillsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["vendor-bills", id] });
    },
  });
}

export function useDeleteVendorBill() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Bill deleted" },
    mutationFn: (id: string) => vendorBillsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-bills"] }),
  });
}

export function useAddVendorBillPayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Payment recorded" },
    mutationFn: (data: CreateVendorBillPaymentInput) => vendorBillsApi.addPayment(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["vendor-bills", id] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}
