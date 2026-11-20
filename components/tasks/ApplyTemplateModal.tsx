"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useTaskTemplates } from "@/hooks/use-task-templates";
import { useUsersShortList } from "@/hooks/use-users";
import { publishAppError } from "@/lib/error-bus";
import { taskTemplatesApi } from "@/lib/api";

interface ApplyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** Due dates count from this date; the project's start date if it has one. */
  projectStartDate?: string | null;
  /** The project's type: its matching template is pre-selected. */
  projectType?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

interface ConflictBody {
  code?: string;
  error?: string;
}

export function ApplyTemplateModal({ open, onClose, projectId, projectStartDate, projectType }: ApplyTemplateModalProps) {
  const qc = useQueryClient();
  const { data, isLoading } = useTaskTemplates({ enabled: open });
  const { data: usersData } = useUsersShortList();
  const templates = data?.templates ?? [];

  const [chosen, setChosen] = useState<string>("");
  const [startDate, setStartDate] = useState(projectStartDate || today());
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  if (!open) return null;

  // Until the person picks one, suggest the template made for this project's type.
  const templateId = chosen || String(templates.find((t) => t.project_type === projectType)?.id ?? templates[0]?.id ?? "");
  const template = templates.find((t) => String(t.id) === templateId);

  const submit = async (force: boolean) => {
    if (!template) return;
    setBusy(true);
    try {
      const { data: result } = await taskTemplatesApi.apply(String(template.id), {
        project_id: projectId,
        start_date: startDate || undefined,
        assignee_id: assignee || null,
        force: force || undefined,
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setDuplicateWarning(null);
      onClose();
      return result;
    } catch (err) {
      const e = err as { response?: { status?: number; data?: ConflictBody } };
      if (e.response?.status === 409 && e.response.data?.code === "already_applied") {
        setDuplicateWarning(e.response.data.error ?? "This template was already applied to the project.");
      } else {
        publishAppError(err);
      }
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setDuplicateWarning(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Apply a task template"
      description="Creates the template's tasks in this project, with due dates counted from the start date."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          {duplicateWarning ? (
            <Button type="button" variant="destructive" loading={busy} onClick={() => submit(true)}>
              Apply again anyway
            </Button>
          ) : (
            <Button type="button" loading={busy} disabled={!template} onClick={() => submit(false)}>
              Create {template?.items.length ?? 0} tasks
            </Button>
          )}
        </>
      }
    >
      {isLoading ? (
        <p className="text-(--muted)">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-(--muted)">No templates yet. Create one from Tasks → Templates.</p>
      ) : (
        <div className="space-y-4">
          <CustomSelect
            label="Template"
            options={templates.map((t) => ({ value: String(t.id), label: `${t.name} (${t.items.length} tasks)` }))}
            value={templateId}
            onChange={(v) => {
              setChosen(v);
              setDuplicateWarning(null);
            }}
          />

          {template && (
            <ul className="divide-y divide-(--border-subtle) rounded-lg border border-(--card-border) text-sm">
              {template.items.map((it, i) => (
                <li key={it.id ?? i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate">{it.title}</span>
                  <span className="num shrink-0 text-xs text-(--muted)">day {it.due_offset_days}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <CustomSelect
              label="Assign all to (optional)"
              options={[{ value: "", label: "Leave unassigned" }, ...(usersData?.users?.map((u) => ({ value: String(u.id), label: u.name })) ?? [])]}
              value={assignee}
              searchable
              onChange={setAssignee}
            />
          </div>

          {duplicateWarning && <p className="rounded-lg bg-(--warning-bg) px-3 py-2 text-sm text-(--warning)">{duplicateWarning}</p>}
        </div>
      )}
    </Modal>
  );
}
