"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EXPENSE_TYPES } from "@/lib/constants";
import type { Expense } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  expense_date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["direct", "operational"]),
});

export type ExpenseFormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: expense?.amount ?? undefined,
      expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
      title: expense?.title ?? "",
      description: expense?.description ?? "",
      type: expense?.type ?? "direct",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Amount *"
        type="number"
        step="0.01"
        min="0.01"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />
      <Input
        label="Expense date *"
        type="date"
        error={errors.expense_date?.message}
        {...register("expense_date")}
      />
      <Input label="Title *" error={errors.title?.message} {...register("title")} />
      <Textarea label="Description" error={errors.description?.message} {...register("description")} />
      <Select
        label="Type *"
        options={EXPENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        error={errors.type?.message}
        {...register("type")}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={isLoading}>
          {expense ? "Update" : "Create"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
