"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAddTaskComment, useDeleteTaskComment, useTaskComments, useUpdateTaskComment } from "@/hooks/use-tasks";
import { useUsersShortList } from "@/hooks/use-users";
import { useAuth } from "@/lib/auth-context";
import { canSeeAllTasks } from "@/lib/permissions";
import type { TaskComment } from "@/lib/api";

// Mentions live in the stored text as @[Name](userId); the box shows the friendlier "@Name".
const MENTION = /@\[([^\]]{1,80})\]\((\d+)\)/g;

interface Mention {
  id: string;
  name: string;
}

/** Stored text -> what the person edits, plus the mentions it already holds. */
function toEditable(body: string): { text: string; mentions: Mention[] } {
  const mentions: Mention[] = [];
  const text = body.replace(MENTION, (_m, name: string, id: string) => {
    mentions.push({ id, name });
    return `@${name}`;
  });
  return { text, mentions };
}

/** What the person typed -> stored text: each picked "@Name" becomes @[Name](id). */
function toStored(text: string, mentions: Mention[]): string {
  let out = text;
  for (const m of mentions) {
    const token = `@${m.name}`;
    const at = out.indexOf(token);
    if (at !== -1 && !out.slice(at).startsWith(`@[`)) out = `${out.slice(0, at)}@[${m.name}](${m.id})${out.slice(at + token.length)}`;
  }
  return out;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

function CommentBody({ body }: { body: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of body.matchAll(MENTION)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(body.slice(last, start));
    parts.push(
      <span key={`${start}-${m[2]}`} className="rounded bg-(--accent-muted) px-1 font-medium text-(--primary)">
        @{m[1]}
      </span>,
    );
    last = start + m[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return <p className="whitespace-pre-wrap break-words text-sm text-(--foreground)">{parts}</p>;
}

interface ComposerProps {
  initial?: string;
  /** Keep what is typed (not yet sent) in this browser under this key. */
  draftKey?: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (stored: string) => Promise<void> | void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/** A text box where typing "@" offers the team to mention. Ctrl+Enter sends. */
function readDraft(key?: string) {
  if (!key) return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function writeDraft(key: string | undefined, value: string) {
  if (!key) return;
  try {
    if (value.trim()) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

function Composer({ initial = "", draftKey, submitLabel, busy, onSubmit, onCancel, autoFocus }: ComposerProps) {
  const start = toEditable(initial || readDraft(draftKey));
  const [text, setText] = useState(start.text);
  const [mentions, setMentions] = useState<Mention[]>(start.mentions);
  const [query, setQuery] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const { data: usersData } = useUsersShortList();

  const people = (usersData?.users ?? []).map((u) => ({ id: String(u.id), name: u.name }));
  const matches = query === null ? [] : people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  const onChange = (value: string, caret: number) => {
    setText(value);
    writeDraft(draftKey, value);
    // "@" typed at the start or after a space opens the picker; anything with a space after it closes it.
    const found = /(?:^|\s)@([^\s@]{0,30})$/.exec(value.slice(0, caret));
    setQuery(found ? found[1] : null);
  };

  const pick = (p: Mention) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@[^\s@]{0,30}$/, `@${p.name} `);
    const next = before + text.slice(caret);
    setText(next);
    setMentions((list) => (list.some((m) => m.id === p.id) ? list : [...list, p]));
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSubmit(toStored(trimmed, mentions));
    writeDraft(draftKey, "");
    setText("");
    setMentions([]);
  };

  return (
    <div className="relative space-y-2">
      <textarea
        ref={ref}
        value={text}
        autoFocus={autoFocus}
        rows={3}
        maxLength={4000}
        placeholder="Write a comment... type @ to mention someone"
        aria-label="Comment"
        onChange={(e) => onChange(e.target.value, e.target.selectionStart)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && query !== null) {
            e.stopPropagation();
            setQuery(null);
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void send();
          }
        }}
        className="w-full resize-y rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20"
      />
      {matches.length > 0 && (
        <ul role="listbox" aria-label="People to mention" className="absolute start-0 z-10 -mt-1 max-h-48 w-64 overflow-auto rounded-lg border border-(--border) bg-(--card) shadow-lg">
          {matches.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="block w-full px-3 py-1.5 text-start text-sm hover:bg-(--muted-bg)">
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-(--muted)">Ctrl + Enter to send</span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" size="sm" loading={busy} disabled={!text.trim()} onClick={send}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommentsPanel({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useTaskComments(taskId);
  const add = useAddTaskComment(taskId);
  const update = useUpdateTaskComment(taskId);
  const remove = useDeleteTaskComment(taskId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const comments: TaskComment[] = data?.comments ?? [];
  const manager = canSeeAllTasks(user);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-(--muted)">Comments {comments.length > 0 && `(${comments.length})`}</p>

      {isLoading ? (
        <p className="text-sm text-(--muted)">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-(--muted)">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const mine = String(c.author_id) === String(user?.id);
            return (
              <li key={c.id} className="rounded-lg bg-(--muted-bg) px-3 py-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-(--foreground)">
                    {c.author_name}
                    <span className="ms-2 text-xs font-normal text-(--muted)">
                      {timeAgo(c.created_at)}
                      {c.edited_at && " · edited"}
                    </span>
                  </p>
                  {(mine || manager) && editingId !== c.id && (
                    <div className="flex shrink-0 gap-1">
                      {mine && (
                        <button type="button" aria-label="Edit comment" onClick={() => setEditingId(c.id)} className="rounded p-1 text-(--muted) hover:text-(--foreground)">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button" aria-label="Delete comment" onClick={() => remove.mutate(c.id)} className="rounded p-1 text-(--muted) hover:text-(--destructive)">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === c.id ? (
                  <Composer
                    initial={c.body}
                    submitLabel="Save"
                    busy={update.isPending}
                    autoFocus
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (stored) => {
                      const saved = await update.mutateAsync({ id: c.id, body: stored });
                      setSkipped(saved.skipped_mentions ?? []);
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <CommentBody body={c.body} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Composer
        key={comments.length}
        draftKey={`comment-draft:${taskId}`}
        submitLabel="Comment"
        busy={add.isPending}
        onSubmit={async (stored) => {
          const saved = await add.mutateAsync(stored);
          setSkipped(saved.skipped_mentions ?? []);
        }}
      />
      {skipped.length > 0 && (
        <p className="rounded-lg bg-(--warning-bg) px-3 py-2 text-xs text-(--warning)">
          {skipped.join(", ")} can&apos;t open this task, so {skipped.length > 1 ? "weren't" : "wasn't"} notified.
        </p>
      )}
    </div>
  );
}
