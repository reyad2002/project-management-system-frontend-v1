"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAddInvestmentReturn } from "@/hooks/use-investments";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  received_date: z.string().min(1, "Date is required"),
});
type FormData = z.infer<typeof schema>;

const FORM_ID = "add-investment-return-form";

interface AddReturnModalProps {
  open: boolean;
  onClose: () => void;
  investmentId: string;
}

export function AddReturnModal({ open, onClose, investmentId }: AddReturnModalProps) {
  const addReturn = useAddInvestmentReturn(investmentId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, received_date: new Date().toISOString().slice(0, 10) },
  });

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add return"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={addReturn.isPending}>
            Add
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="form-stagger space-y-4"
        onSubmit={handleSubmit(async (data) => {
          await addReturn.mutateAsync(data);
          reset();
          onClose();
        })}
      >
        <Input
          label="Amount received *"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Input label="Received date *" type="date" error={errors.received_date?.message} {...register("received_date")} />
      </form>
    </Modal>
  );
}
