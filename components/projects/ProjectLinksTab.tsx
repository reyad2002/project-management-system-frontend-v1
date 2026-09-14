"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink, Globe, LayoutDashboard, Rocket, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useProjectLinks, useCreateProjectLink, useDeleteProjectLink } from "@/hooks/use-project-links";
import type { ProjectLinkType } from "@/lib/api";

const linkIcons: Record<ProjectLinkType, React.ComponentType<{ className?: string }>> = {
  staging: Rocket,
  live: Globe,
  dashboard: LayoutDashboard,
  other: ExternalLink,
};

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL (https://...)"),
  type: z.enum(["staging", "live", "dashboard", "other"]),
});
type LinkFormData = z.infer<typeof schema>;

interface ProjectLinksTabProps {
  projectId: string;
}

export function ProjectLinksTab({ projectId }: ProjectLinksTabProps) {
  const { data, isLoading } = useProjectLinks(projectId);
  const createLink = useCreateProjectLink(projectId);
  const deleteLink = useDeleteProjectLink(projectId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkFormData>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", url: "", type: "other" },
  });

  const links = data?.links ?? [];

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(async (values) => {
          await createLink.mutateAsync(values);
          reset({ label: "", url: "", type: "other" });
        })}
        className="grid gap-3 rounded-lg border border-(--card-border) p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <Input placeholder="Label (e.g. Staging)" error={errors.label?.message} {...register("label")} />
        <Input placeholder="https://..." error={errors.url?.message} {...register("url")} />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              options={[
                { value: "staging", label: "Staging" },
                { value: "live", label: "Live" },
                { value: "dashboard", label: "Admin dashboard" },
                { value: "other", label: "Other" },
              ]}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Button type="submit" loading={createLink.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </form>

      {isLoading ? (
        <p className="text-(--muted)">Loading links...</p>
      ) : links.length === 0 ? (
        <p className="text-(--muted)">No links added yet.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = linkIcons[link.type];
            return (
              <li
                key={link.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 text-(--foreground) hover:text-(--primary)"
                >
                  <Icon className="h-4 w-4 shrink-0 text-(--muted)" />
                  <span className="truncate font-medium">{link.label}</span>
                  <span className="truncate text-(--muted)">{link.url}</span>
                </a>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(link.id)}>
                  <Trash2 className="h-4 w-4 text-(--destructive)" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete link?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteLink.isPending}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (!deletingId) return;
          deleteLink.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
      />
    </div>
  );
}
