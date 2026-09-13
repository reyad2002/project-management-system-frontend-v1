"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Vendor } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  tax_id: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  default_wht_rate: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export type VendorFormData = z.infer<typeof schema>;

interface VendorFormProps {
  vendor?: Vendor | null;
  formId: string;
  onSubmit: (data: VendorFormData) => Promise<void>;
}

const defaultEmpty: VendorFormData = {
  name: "",
  tax_id: "",
  email: "",
  phone: "",
  address: "",
  default_wht_rate: 0,
  notes: "",
};

export function VendorForm({ vendor, formId, onSubmit }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name ?? "",
        tax_id: vendor.tax_id ?? "",
        email: vendor.email ?? "",
        phone: vendor.phone ?? "",
        address: vendor.address ?? "",
        default_wht_rate: vendor.default_wht_rate ?? 0,
        notes: vendor.notes ?? "",
      });
    } else {
      reset(defaultEmpty);
    }
  }, [vendor, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name *" error={errors.name?.message} {...register("name")} />
        <Input label="Tax ID" error={errors.tax_id?.message} {...register("tax_id")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Address" error={errors.address?.message} {...register("address")} />
        <Input
          label="Default WHT rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          error={errors.default_wht_rate?.message}
          {...register("default_wht_rate", { valueAsNumber: true })}
        />
      </div>
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
