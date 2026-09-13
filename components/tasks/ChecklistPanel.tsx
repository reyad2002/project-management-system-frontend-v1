"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  useTaskChecklist,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from "@/hooks/use-tasks";

interface ChecklistPanelProps {
  taskId: string;
}

export function ChecklistPanel({ taskId }: ChecklistPanelProps) {
  const { data } = useTaskChecklist(taskId);
  const addItem = useAddChecklistItem(taskId);
  const updateItem = useUpdateChecklistItem(taskId);
  const deleteItem = useDeleteChecklistItem(taskId);
  const [newTitle, setNewTitle] = useState("");

  const items = data?.items ?? [];

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    addItem.mutate(title);
    setNewTitle("");
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-(--muted)">
        Checklist {items.length > 0 && `(${items.filter((i) => i.is_done).length}/${items.length})`}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-lg bg-(--muted-bg) px-2.5 py-1.5">
            <input
              type="checkbox"
              checked={item.is_done}
              onChange={(e) => updateItem.mutate({ id: item.id, is_done: e.target.checked })}
              className="h-4 w-4 shrink-0 accent-(--primary)"
            />
            <span className={`flex-1 text-sm ${item.is_done ? "text-(--muted) line-through" : "text-(--foreground)"}`}>
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => deleteItem.mutate(item.id)}
              className="shrink-0 text-(--muted) hover:text-(--destructive)"
              aria-label="Delete checklist item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add checklist item..."
          className="h-9 flex-1 rounded-lg border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--border) text-(--muted) hover:text-(--foreground)"
          aria-label="Add checklist item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
