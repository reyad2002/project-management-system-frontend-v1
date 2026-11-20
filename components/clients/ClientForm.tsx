"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Client } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
});

export type ClientFormData = z.infer<typeof schema>;

interface ClientFormProps {
  client?: Client | null;
  formId: string;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

const defaultEmpty = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  feedback: "",
};

export function ClientForm({ client, formId, onSubmit }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        notes: client.notes ?? "",
        feedback: client.feedback ?? "",
      });
    } else {
      reset(defaultEmpty);
    }
  }, [client, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name *" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
        <Input label="Address" error={errors.address?.message} {...register("address")} />
      </div>
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
      <Textarea label="Feedback" error={errors.feedback?.message} {...register("feedback")} />
    </form>
  );
}
