"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { PROJECT_TYPES, TASK_PRIORITIES } from "@/lib/constants";
import { useSaveTaskTemplate } from "@/hooks/use-task-templates";
import type { ProjectType, TaskPriority, TaskTemplate } from "@/lib/api";

interface DraftItem {
  key: number;
  title: string;
  days: string;
  priority: TaskPriority;
  /** One checklist item per line. */
  checklist: string;
}

interface TemplateFormModalProps {
  onClose: () => void;
  /** Edit this template; omit to create. */
  template?: TaskTemplate | null;
  /** Start a new template from a copy of this one. */
  copyOf?: TaskTemplate | null;
}

let keyCounter = 0;
const nextKey = () => (keyCounter += 1);

const toDraft = (items: TaskTemplate["items"]): DraftItem[] =>
  items.map((it) => ({ key: nextKey(), title: it.title, days: String(it.due_offset_days), priority: it.priority, checklist: it.checklist.join("\n") }));

/** Create / edit a template: its name, type and the ordered list of tasks (each with a due offset and a checklist). */
export function TemplateFormModal({ onClose, template, copyOf }: TemplateFormModalProps) {
  const source = template ?? copyOf ?? null;
  const save = useSaveTaskTemplate();

  const [name, setName] = useState(copyOf ? `Copy of ${copyOf.name}` : (template?.name ?? ""));
  const [description, setDescription] = useState(source?.description ?? "");
  const [projectType, setProjectType] = useState<string>(source?.project_type ?? "");
  const [items, setItems] = useState<DraftItem[]>(() =>
    source ? toDraft(source.items) : [{ key: nextKey(), title: "", days: "0", priority: "medium", checklist: "" }],
  );
  const [error, setError] = useState<string | null>(null);

  const update = (key: number, patch: Partial<DraftItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const move = (index: number, by: -1 | 1) =>
    setItems((list) => {
      const target = index + by;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const submit = async () => {
    if (!name.trim()) return setError("Give the template a name.");
    if (items.length === 0) return setError("Add at least one task.");
    for (let i = 0; i < items.length; i += 1) {
      if (!items[i].title.trim()) return setError(`Task ${i + 1} needs a title.`);
      const days = Number(items[i].days);
      if (!Number.isInteger(days) || days < 0) return setError(`Task ${i + 1}: "days after start" must be a whole number, 0 or more.`);
    }
    setError(null);
    await save.mutateAsync({
      id: template?.id,
      data: {
        name: name.trim(),
        description: description.trim() || null,
        project_type: (projectType || null) as ProjectType | null,
        items: items.map((i) => ({
          title: i.title.trim(),
          priority: i.priority,
          due_offset_days: Number(i.days),
          checklist: i.checklist.split("\n").map((l) => l.trim()).filter(Boolean),
        })),
      },
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={template ? "Edit template" : copyOf ? "Duplicate template" : "New template"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={save.isPending} onClick={submit}>
            {template ? "Save changes" : "Create template"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Select
            label="For project type"
            options={[{ value: "", label: "Any" }, ...PROJECT_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-(--foreground)">Tasks ({items.length})</p>
            <p className="text-xs text-(--muted)">Due date = project start date + the days shown</p>
          </div>
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={item.key} className="space-y-3 rounded-xl border border-(--card-border) p-3">
                <div className="flex items-start gap-2">
                  <span className="num mt-2.5 w-5 shrink-0 text-center text-xs text-(--muted)">{index + 1}</span>
                  <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_7rem_8rem]">
                    <Input label="Title" value={item.title} onChange={(e) => update(item.key, { title: e.target.value })} />
                    <Input label="Days after start" type="number" min={0} value={item.days} onChange={(e) => update(item.key, { days: e.target.value })} />
                    <Select
                      label="Priority"
                      options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                      value={item.priority}
                      onChange={(e) => update(item.key, { priority: e.target.value as TaskPriority })}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded p-1 text-(--muted) hover:text-(--foreground) disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down" className="rounded p-1 text-(--muted) hover:text-(--foreground) disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setItems((l) => l.filter((i) => i.key !== item.key))} aria-label="Remove task" className="rounded p-1 text-(--muted) hover:text-(--destructive)">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Textarea
                  label="Checklist (one item per line, optional)"
                  value={item.checklist}
                  rows={2}
                  onChange={(e) => update(item.key, { checklist: e.target.value })}
                />
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setItems((l) => [...l, { key: nextKey(), title: "", days: l.length ? l[l.length - 1].days : "0", priority: "medium", checklist: "" }])}>
            <Plus className="me-2 h-4 w-4" />
            Add task
          </Button>
        </div>

        {error && <p className="rounded-lg bg-(--destructive-bg) px-3 py-2 text-sm text-(--destructive)">{error}</p>}
      </div>
    </Modal>
  );
}
