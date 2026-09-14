"use client";

import { Download, CheckCircle2 } from "lucide-react";
import { useMeetingNotes, useAddMeetingNote } from "@/hooks/use-meetings";
import { MeetingNoteForm } from "@/components/meetings/MeetingNoteForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { meetingsApi } from "@/lib/api";
import type { Meeting } from "@/lib/api";

const FORM_ID = "meeting-note-form";

interface MeetingNoteModalProps {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  projectId: string;
  clientId: string;
}

export function MeetingNoteModal({ open, onClose, meeting, projectId, clientId }: MeetingNoteModalProps) {
  const { data: notesData } = useMeetingNotes(meeting?.id ?? null);
  const addNote = useAddMeetingNote(meeting?.id ?? "", projectId);

  if (!open || !meeting) return null;

  const notes = notesData?.notes ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Notes — ${meeting.title}`}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" form={FORM_ID} loading={addNote.isPending}>
            Save note
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {notes.length > 0 && (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg bg-(--muted-bg) p-3 text-sm">
                <p className="whitespace-pre-wrap text-(--foreground)">{note.content}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {note.reads.map((r) => (
                      <span
                        key={r.portal_user_id}
                        className="flex items-center gap-1 text-xs text-(--success)"
                        title={new Date(r.read_at).toLocaleString()}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Seen by {r.portal_user_name}
                      </span>
                    ))}
                  </div>
                  <a
                    href={meetingsApi.notes.exportUrl(meeting.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-(--primary) hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export as Word
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <MeetingNoteForm
          clientId={clientId}
          formId={FORM_ID}
          onSubmit={async (data) => {
            await addNote.mutateAsync(data);
          }}
        />
      </div>
    </Modal>
  );
}
