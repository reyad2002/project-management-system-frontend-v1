"use client";

import {
  useVendorBill,
  useCreateVendorBill,
  useUpdateVendorBill,
} from "@/hooks/use-vendor-bills";
import { VendorBillForm, type VendorBillFormData } from "@/components/vendor-bills/VendorBillForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Vendor } from "@/lib/api";

const FORM_ID = "vendor-bill-form";

interface VendorBillFormModalProps {
  open: boolean;
  onClose: () => void;
  vendor: Vendor;
  billId: string | null;
}

export function VendorBillFormModal({ open, onClose, vendor, billId }: VendorBillFormModalProps) {
  const { data: bill } = useVendorBill(billId ?? null);
  const createBill = useCreateVendorBill();
  const updateBill = useUpdateVendorBill(billId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: VendorBillFormData) => {
    const payload = {
      vendor_id: vendor.id,
      project_id: data.project_id || null,
      bill_number: data.bill_number || undefined,
      bill_date: data.bill_date,
      due_date: data.due_date,
      subtotal: data.subtotal,
      vat_rate: data.vat_rate,
      wht_rate: data.wht_rate,
      cost_category: data.cost_category,
      notes: data.notes || undefined,
    };
    if (billId && bill) {
      await updateBill.mutateAsync(payload);
    } else {
      await createBill.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createBill.isPending || updateBill.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={billId ? "Edit bill" : `New bill for ${vendor.name}`}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {billId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <VendorBillForm bill={bill ?? undefined} defaultWhtRate={vendor.default_wht_rate} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
