"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { CreateProjectFileInput } from "@/lib/api";

const schema = z.object({
  file_name: z.string().min(1, "File name is required"),
  file_url: z.string().url("Must be a valid URL (https://...)"),
  description: z.string().optional(),
});

export type FileUploadFormData = z.infer<typeof schema>;

interface FileUploadFormProps {
  formId: string;
  onSubmit: (data: CreateProjectFileInput) => Promise<void>;
}

export function FileUploadForm({ formId, onSubmit }: FileUploadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FileUploadFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: { file_name: "", file_url: "", description: "" },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({ file_name: data.file_name, file_url: data.file_url, description: data.description || undefined })
      )}
      className="form-stagger space-y-4"
    >
      <Input label="File name *" placeholder="e.g. Homepage-final.pdf" error={errors.file_name?.message} {...register("file_name")} />
      <Input
        label="File link *"
        placeholder="https://drive.google.com/..."
        error={errors.file_url?.message}
        {...register("file_url")}
      />
      <p className="-mt-2 text-xs text-(--muted)">
        Upload the file to Drive/Dropbox/S3 first, then paste the shareable link here.
      </p>
      <Textarea label="Description" error={errors.description?.message} {...register("description")} />
    </form>
  );
}
