"use client";

import { useVendor, useCreateVendor, useUpdateVendor } from "@/hooks/use-vendors";
import { VendorForm, type VendorFormData } from "@/components/vendors/VendorForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "vendor-form";

interface VendorFormModalProps {
  open: boolean;
  onClose: () => void;
  vendorId: string | null;
}

export function VendorFormModal({ open, onClose, vendorId }: VendorFormModalProps) {
  const { data: vendor } = useVendor(vendorId ?? null);
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor(vendorId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: VendorFormData) => {
    const payload = {
      name: data.name,
      tax_id: data.tax_id || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      default_wht_rate: data.default_wht_rate,
      notes: data.notes || undefined,
    };
    if (vendorId && vendor) {
      await updateVendor.mutateAsync(payload);
    } else {
      await createVendor.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createVendor.isPending || updateVendor.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vendorId ? "Edit vendor" : "New vendor"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {vendorId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <VendorForm vendor={vendor ?? undefined} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
