"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useAddTaskAttachment, useDeleteTaskAttachment, useTaskAttachments } from "@/hooks/use-tasks";

const field =
  "h-9 rounded-lg border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20";

function host(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Links attached to a task (Drive, Figma, a brief...). Files themselves live where the team already keeps them. */
export function TaskLinksPanel({ taskId }: { taskId: string }) {
  const { data } = useTaskAttachments(taskId);
  const add = useAddTaskAttachment(taskId);
  const remove = useDeleteTaskAttachment(taskId);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  const links = data?.attachments ?? [];

  const submit = async () => {
    if (!url.trim()) return;
    await add.mutateAsync({ url: url.trim(), name: name.trim() || undefined });
    setUrl("");
    setName("");
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-(--muted)">Links {links.length > 0 && `(${links.length})`}</p>
      {links.length > 0 && (
        <ul className="space-y-1.5">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-lg bg-(--muted-bg) px-2.5 py-1.5">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-(--primary) hover:underline">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{l.name}</span>
                <span className="shrink-0 text-xs text-(--muted)">{host(l.url)}</span>
              </a>
              <button type="button" aria-label="Remove link" onClick={() => remove.mutate(l.id)} className="shrink-0 text-(--muted) hover:text-(--destructive)">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link..." aria-label="Link URL" className={`${field} min-w-0 flex-[2]`} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void submit())} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Link name" className={`${field} min-w-0 flex-1`} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void submit())} />
        <button type="button" onClick={submit} disabled={!url.trim() || add.isPending} aria-label="Add link" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--border) text-(--muted) hover:text-(--foreground) disabled:opacity-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
