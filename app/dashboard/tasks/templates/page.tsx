"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TemplateFormModal } from "@/components/tasks/TemplateFormModal";
import { useDeleteTaskTemplate, useRestoreDefaultTemplates, useTaskTemplates } from "@/hooks/use-task-templates";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { PROJECT_TYPES } from "@/lib/constants";
import type { TaskTemplate } from "@/lib/api";

type Editing = { mode: "new" } | { mode: "edit"; template: TaskTemplate } | { mode: "copy"; template: TaskTemplate } | null;

export default function TaskTemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useTaskTemplates();
  const deleteTemplate = useDeleteTaskTemplate();
  const restore = useRestoreDefaultTemplates();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<TaskTemplate | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!can(user, "taskAdmin")) {
    return <p className="py-10 text-center text-(--muted)">Task templates are managed by managers and above.</p>;
  }

  const templates = data?.templates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => router.push("/dashboard/tasks")} className="mb-1 flex items-center gap-1 text-sm text-(--muted) hover:text-(--foreground)">
            <ArrowLeft className="h-4 w-4" /> Tasks
          </button>
          <h1 className="text-2xl font-bold text-foreground">Task templates</h1>
          <p className="mt-1 text-(--muted)">Ready-made task lists. Apply one from a project&apos;s Tasks tab to create all its tasks at once. Edit, delete or add your own.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            loading={restore.isPending}
            onClick={() =>
              restore.mutate(undefined, {
                onSuccess: (r) => setNotice(r.added > 0 ? `Added ${r.added} default template${r.added > 1 ? "s" : ""}.` : "All the default templates are already here."),
              })
            }
          >
            <RotateCcw className="me-2 h-4 w-4" />
            Restore defaults
          </Button>
          <Button onClick={() => setEditing({ mode: "new" })}>
            <Plus className="me-2 h-4 w-4" />
            New template
          </Button>
        </div>
      </div>

      {notice && <p className="rounded-lg bg-(--muted-bg) px-3 py-2 text-sm text-(--foreground)">{notice}</p>}

      {isLoading ? (
        <p className="py-8 text-center text-(--muted)">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="py-8 text-center text-(--muted)">No templates. Create one, or restore the defaults.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">{t.name}</h2>
                    {t.description && <p className="mt-0.5 text-sm text-(--muted)">{t.description}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {t.project_type && (
                      <Badge variant="info" dot={false}>
                        {PROJECT_TYPES.find((p) => p.value === t.project_type)?.label ?? t.project_type}
                      </Badge>
                    )}
                    <span className="text-xs text-(--muted)">{t.items.length} tasks</span>
                  </div>
                </div>
                <ol className="space-y-1 text-sm">
                  {t.items.slice(0, 5).map((it, i) => (
                    <li key={it.id ?? i} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-(--foreground)">{it.title}</span>
                      <span className="num shrink-0 text-xs text-(--muted)">day {it.due_offset_days}</span>
                    </li>
                  ))}
                  {t.items.length > 5 && <li className="text-xs text-(--muted)">+ {t.items.length - 5} more</li>}
                </ol>
                <div className="flex justify-end gap-1 border-t border-(--border-subtle) pt-3">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: "edit", template: t })}>
                    <Pencil className="me-1.5 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: "copy", template: t })}>
                    <Copy className="me-1.5 h-4 w-4" /> Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-(--destructive)" onClick={() => setDeleting(t)}>
                    <Trash2 className="me-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <TemplateFormModal
          key={editing.mode === "new" ? "new" : `${editing.mode}-${editing.template.id}`}
          template={editing.mode === "edit" ? editing.template : null}
          copyOf={editing.mode === "copy" ? editing.template : null}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="Tasks already created from it stay in their projects. This can't be undone."
        confirmText="Delete"
        isLoading={deleteTemplate.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteTemplate.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}
