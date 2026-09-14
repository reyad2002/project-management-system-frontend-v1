"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { FileComment } from "@/lib/api";

interface FileCommentsModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  comments: FileComment[];
  isAdding: boolean;
  onAddComment: (content: string) => Promise<void>;
}

export function FileCommentsModal({ open, onClose, fileName, comments, isAdding, onAddComment }: FileCommentsModalProps) {
  const [draft, setDraft] = useState("");

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Comments — ${fileName}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            loading={isAdding}
            disabled={!draft.trim()}
            onClick={async () => {
              await onAddComment(draft.trim());
              setDraft("");
            }}
          >
            Post comment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-(--muted)">No comments yet.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-(--muted-bg) px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-(--foreground)">
                    {c.author_type === "client" ? "Client" : "Team"}
                  </span>
                  <span className="text-xs text-(--muted)">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-(--foreground)">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
        <Textarea
          placeholder="Write a comment..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
    </Modal>
  );
}
