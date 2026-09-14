"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { CreateCredentialInput } from "@/lib/api";

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  panel_url: z.string().optional(),
  notes: z.string().optional(),
});

export type CredentialFormData = z.infer<typeof schema>;

interface CredentialFormProps {
  formId: string;
  onSubmit: (data: CreateCredentialInput) => Promise<void>;
}

export function CredentialForm({ formId, onSubmit }: CredentialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", username: "", password: "", panel_url: "", notes: "" },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          label: data.label,
          username: data.username,
          password: data.password,
          panel_url: data.panel_url || undefined,
          notes: data.notes || undefined,
        })
      )}
      className="form-stagger space-y-4"
    >
      <Input label="Label *" placeholder="cPanel, Server SSH, Domain Registrar..." error={errors.label?.message} {...register("label")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Username *" error={errors.username?.message} {...register("username")} />
        <Input label="Password *" type="password" error={errors.password?.message} {...register("password")} />
      </div>
      <Input label="Panel URL" placeholder="https://..." error={errors.panel_url?.message} {...register("panel_url")} />
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
