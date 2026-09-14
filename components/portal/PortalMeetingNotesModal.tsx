"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { usePortalMeetingNotes, useMarkMeetingNoteRead } from "@/hooks/use-portal";
import { portalMeetingsApi } from "@/lib/portal-api";
import type { Meeting } from "@/lib/api";

interface PortalMeetingNotesModalProps {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onFirstRead?: (noteId: string) => void;
}

export function PortalMeetingNotesModal({ open, onClose, meeting, onFirstRead }: PortalMeetingNotesModalProps) {
  const { data } = usePortalMeetingNotes(meeting?.id ?? null);
  const markRead = useMarkMeetingNoteRead();
  const markedIds = useRef(new Set<string>());

  const notes = data?.notes ?? [];

  useEffect(() => {
    if (!open) return;
    for (const note of notes) {
      if (markedIds.current.has(note.id)) continue;
      markedIds.current.add(note.id);
      markRead.mutate(note.id);

      const feedbackKey = `feedback-shown-${note.id}`;
      try {
        if (!localStorage.getItem(feedbackKey)) {
          localStorage.setItem(feedbackKey, "1");
          onFirstRead?.(note.id);
        }
      } catch {
        onFirstRead?.(note.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notes]);

  if (!open || !meeting) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Notes — ${meeting.title}`} size="lg" footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      {notes.length === 0 ? (
        <p className="text-sm text-(--muted)">No notes published for this meeting yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg bg-(--muted-bg) p-3 text-sm">
              <p className="whitespace-pre-wrap text-(--foreground)">{note.content}</p>
              <a
                href={portalMeetingsApi.exportUrl(note.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-fit items-center gap-1 text-xs font-medium text-(--primary) hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Export as Word
              </a>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
