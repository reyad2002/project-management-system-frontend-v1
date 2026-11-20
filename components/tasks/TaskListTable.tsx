"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Repeat, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableHead, TableRow, TableSkeletonRows, Td, Th } from "@/components/ui/Table";
import { isOverdue } from "@/components/tasks/TaskDetailModal";
import { useBulkUpdateTasks, useDeleteTasksWithUndo, useSetAnyTaskStatus, useUpdateAnyTask } from "@/hooks/use-tasks";
import { useUsersShortList } from "@/hooks/use-users";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { tasksApi, type Task, type TaskBulkPatch, type TaskPriority, type TaskStatus } from "@/lib/api";

const PAGE_SIZES = [20, 50, 100];

const STATUS_TONE: Record<TaskStatus, string> = {
  todo: "bg-(--muted-bg) text-(--foreground)",
  in_progress: "bg-(--accent-muted) text-(--primary)",
  in_review: "bg-(--warning-bg) text-(--warning)",
  done: "bg-(--success-bg) text-(--success)",
  blocked: "bg-(--destructive-bg) text-(--destructive)",
};
const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "text-(--muted)",
  medium: "text-(--foreground)",
  high: "text-(--warning)",
  urgent: "font-semibold text-(--destructive)",
};

/** A select that looks like plain text until you use it (inline editing in the table). */
const inline =
  "max-w-full cursor-pointer appearance-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-(--border) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20";

interface TaskListTableProps {
  tasks: Task[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpen: (id: string) => void;
  emptyText: string;
}

/**
 * The task list: tick a task off, change its status / priority / assignee / due date right in the row,
 * or select several and change them together. Opening a row prefetches it so the detail opens instantly.
 */
export function TaskListTable({ tasks, loading, total, page, pageSize, onPageChange, onPageSizeChange, onOpen, emptyText }: TaskListTableProps) {
  const qc = useQueryClient();
  const setStatus = useSetAnyTaskStatus();
  const update = useUpdateAnyTask();
  const bulk = useBulkUpdateTasks();
  const deleteWithUndo = useDeleteTasksWithUndo();
  const { data: usersData } = useUsersShortList();
  const users = usersData?.users ?? [];
  // A selection belongs to the rows it was made on: a new page or new filters start with nothing selected.
  const pageKey = tasks.map((t) => t.id).join(",");
  const [selection, setSelection] = useState<{ key: string; ids: Set<string> }>({ key: pageKey, ids: new Set() });
  const selected = useMemo(() => (selection.key === pageKey ? selection.ids : new Set<string>()), [selection, pageKey]);
  const setSelected = (next: Set<string> | ((s: Set<string>) => Set<string>)) =>
    setSelection({ key: pageKey, ids: typeof next === "function" ? next(selected) : next });

  const allOnPage = tasks.length > 0 && tasks.every((t) => selected.has(String(t.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ids = useMemo(() => [...selected], [selected]);
  const applyBulk = (patch: TaskBulkPatch) => bulk.mutate({ ids, patch }, { onSuccess: () => setSelected(new Set()) });

  const prefetch = (id: string) =>
    qc.prefetchQuery({ queryKey: ["tasks", "detail", id], queryFn: () => tasksApi.get(id).then((r) => r.data), staleTime: 30_000 });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const head = (
    <TableHead>
      <Th className="w-10">
        <input
          type="checkbox"
          aria-label="Select all on this page"
          checked={allOnPage}
          onChange={() => setSelected(allOnPage ? new Set() : new Set(tasks.map((t) => String(t.id))))}
          className="h-4 w-4 accent-(--primary)"
        />
      </Th>
      <Th>Task</Th>
      <Th>Status</Th>
      <Th>Priority</Th>
      <Th>Assignee</Th>
      <Th>Due</Th>
    </TableHead>
  );

  if (loading) {
    return (
      <Table>
        {head}
        <TableBody>
          <TableSkeletonRows columns={6} />
        </TableBody>
      </Table>
    );
  }
  if (tasks.length === 0) return <p className="py-8 text-center text-(--muted)">{emptyText}</p>;

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-(--primary)/30 bg-(--accent-muted) px-3 py-2 shadow-sm">
          <span className="text-sm font-medium text-(--foreground)">{selected.size} selected</span>
          <select aria-label="Set status" value="" onChange={(e) => e.target.value && applyBulk({ status: e.target.value as TaskStatus })} className="h-8 rounded-md border border-(--border) bg-(--card) px-2 text-sm">
            <option value="">Status...</option>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select aria-label="Set priority" value="" onChange={(e) => e.target.value && applyBulk({ priority: e.target.value as TaskPriority })} className="h-8 rounded-md border border-(--border) bg-(--card) px-2 text-sm">
            <option value="">Priority...</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            aria-label="Set assignee"
            value=""
            onChange={(e) => e.target.value && applyBulk({ assignee_id: e.target.value === "none" ? null : e.target.value })}
            className="h-8 rounded-md border border-(--border) bg-(--card) px-2 text-sm"
          >
            <option value="">Assign to...</option>
            <option value="none">Nobody</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-(--muted)">
            Due
            <input type="date" aria-label="Set due date" onChange={(e) => e.target.value && applyBulk({ due_date: e.target.value })} className="h-8 rounded-md border border-(--border) bg-(--card) px-2 text-sm text-(--foreground)" />
          </label>
          <Button
            size="sm"
            variant="ghost"
            className="text-(--destructive)"
            onClick={() => {
              deleteWithUndo(tasks.filter((t) => selected.has(String(t.id))).map((t) => ({ id: String(t.id), title: t.title })));
              setSelected(new Set());
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} aria-label="Clear selection" className="ms-auto rounded p-1 text-(--muted) hover:text-(--foreground)">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Table>
        {head}
        <TableBody>
          {tasks.map((t) => {
            const id = String(t.id);
            const late = isOverdue(t);
            const done = t.status === "done";
            const clientTask = t.assignee_type === "client";
            const stop = (e: React.SyntheticEvent) => e.stopPropagation();
            return (
              <TableRow key={id} className="cursor-pointer" onClick={() => onOpen(id)} onMouseEnter={() => prefetch(id)}>
                <Td>
                  <input type="checkbox" aria-label={`Select ${t.title}`} checked={selected.has(id)} onClick={stop} onChange={() => toggle(id)} className="h-4 w-4 accent-(--primary)" />
                </Td>
                <Td label="Task">
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      aria-label={done ? "Mark as not done" : "Mark as done"}
                      title={done ? "Mark as not done" : "Mark as done"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatus.mutate({ id, status: done ? "todo" : "done" });
                      }}
                      className="mt-0.5 shrink-0 text-(--muted) hover:text-(--primary)"
                    >
                      {done ? <CheckCircle2 className="h-5 w-5 text-(--success)" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`font-medium ${done ? "text-(--muted) line-through" : "text-foreground"}`}>
                        {t.title}
                        {t.recurring_task_id && <Repeat className="ms-1.5 inline h-3.5 w-3.5 text-(--muted)" aria-label="Recurring task" />}
                      </p>
                      <p className="truncate text-xs text-(--muted)">
                        {t.project_title ?? "Internal"}
                        {t.checklist_progress.total > 0 && ` · ${t.checklist_progress.done}/${t.checklist_progress.total} checklist`}
                        {t.subtasks_count > 0 && ` · ${t.subtasks_count} sub-task${t.subtasks_count > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td label="Status">
                  <select
                    aria-label="Status"
                    value={t.status}
                    onClick={stop}
                    onChange={(e) => setStatus.mutate({ id, status: e.target.value as TaskStatus })}
                    className={`${inline} rounded-full px-2.5 text-xs font-medium ${STATUS_TONE[t.status]}`}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Td>
                <Td label="Priority">
                  <select
                    aria-label="Priority"
                    value={t.priority}
                    onClick={stop}
                    onChange={(e) => bulk.mutate({ ids: [id], patch: { priority: e.target.value as TaskPriority } })}
                    className={`${inline} ${PRIORITY_TONE[t.priority]}`}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Td>
                <Td label="Assignee">
                  {clientTask ? (
                    <span className="text-sm text-(--muted)">{t.client_assignee_name ?? "Client"} (client)</span>
                  ) : (
                    <select
                      aria-label="Assignee"
                      value={t.assignee_id ? String(t.assignee_id) : ""}
                      onClick={stop}
                      onChange={(e) => update.mutate({ id, data: { assignee_id: e.target.value || null } })}
                      className={`${inline} text-(--muted)`}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={String(u.id)}>{u.name}</option>
                      ))}
                    </select>
                  )}
                </Td>
                <Td label="Due">
                  <input
                    type="date"
                    aria-label="Due date"
                    value={t.due_date ?? ""}
                    onClick={stop}
                    onChange={(e) => update.mutate({ id, data: { due_date: e.target.value || null } })}
                    className={`${inline} ${late ? "font-medium text-(--destructive)" : "text-(--muted)"}`}
                  />
                </Td>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-(--muted)">
          <span>
            {total} task{total === 1 ? "" : "s"}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </span>
          <select aria-label="Tasks per page" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="h-8 rounded-md border border-(--border) bg-(--card) px-2 text-sm">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
