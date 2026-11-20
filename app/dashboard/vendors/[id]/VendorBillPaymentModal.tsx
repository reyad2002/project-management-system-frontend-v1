"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useAddVendorBillPayment } from "@/hooks/use-vendor-bills";
import type { VendorBill } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  payment_date: z.string().min(1, "Date is required"),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "other"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const FORM_ID = "vendor-bill-payment-form";

interface VendorBillPaymentModalProps {
  open: boolean;
  onClose: () => void;
  bill: VendorBill | null;
}

export function VendorBillPaymentModal({ open, onClose, bill }: VendorBillPaymentModalProps) {
  const addPayment = useAddVendorBillPayment(bill?.id ?? "");
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "bank_transfer",
      notes: "",
    },
  });

  useEffect(() => {
    if (bill) {
      reset({
        amount: bill.remaining_amount,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "bank_transfer",
        notes: "",
      });
    }
  }, [bill, reset]);

  if (!open || !bill) return null;

  const watchedAmount = watch("amount");
  const isOverpaying = watchedAmount > bill.remaining_amount;

  const onSubmit = async (data: FormData) => {
    await addPayment.mutateAsync(data);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record payment · ${bill.bill_number ?? bill.id.slice(0, 8)}`}
      description={`Remaining: ${new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(bill.remaining_amount)}`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={addPayment.isPending} disabled={isOverpaying}>
            Record payment
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
        <Input
          label="Amount *"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        {isOverpaying && (
          <p className="text-xs text-[var(--destructive)]">Amount exceeds the remaining balance</p>
        )}
        <Input
          label="Payment date *"
          type="date"
          error={errors.payment_date?.message}
          {...register("payment_date")}
        />
        <Controller
          name="payment_method"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Payment method *"
              options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Select method"
              error={errors.payment_method?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
      </form>
    </Modal>
  );
}
