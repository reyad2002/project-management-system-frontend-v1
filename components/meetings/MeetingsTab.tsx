"use client";

import { useState } from "react";
import { Plus, Pencil, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useMeetings } from "@/hooks/use-meetings";
import type { Meeting, MeetingStatus } from "@/lib/api";
import { MeetingFormModal } from "@/app/dashboard/projects/[id]/MeetingFormModal";
import { MeetingNoteModal } from "@/app/dashboard/projects/[id]/MeetingNoteModal";

const statusVariant: Record<MeetingStatus, "neutral" | "info" | "cancelled"> = {
  scheduled: "info",
  completed: "neutral",
  cancelled: "cancelled",
};

interface MeetingsTabProps {
  projectId: string;
  clientId: string;
}

export function MeetingsTab({ projectId, clientId }: MeetingsTabProps) {
  const { data, isLoading } = useMeetings(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [notesMeeting, setNotesMeeting] = useState<Meeting | null>(null);

  const meetings = data?.meetings ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditingMeeting(null);
            setFormOpen(true);
          }}
        >
          <Plus className="me-2 h-4 w-4" />
          Schedule meeting
        </Button>
      </div>

      {isLoading ? (
        <p className="text-(--muted)">Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <p className="text-(--muted)">No meetings scheduled yet.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Title</Th>
            <Th>Scheduled at</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </TableHead>
          <TableBody>
            {meetings.map((m) => (
              <TableRow key={m.id}>
                <Td>
                  <span className="font-medium">{m.title}</span>
                  {m.meeting_link && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-2 inline-flex items-center gap-1 text-xs text-(--primary) hover:underline"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join
                    </a>
                  )}
                </Td>
                <Td>{new Date(m.scheduled_at).toLocaleString()}</Td>
                <Td>
                  <Badge variant={statusVariant[m.status]}>{m.status.replace("_", " ")}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMeeting(m);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setNotesMeeting(m)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MeetingFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMeeting(null);
        }}
        projectId={projectId}
        clientId={clientId}
        meeting={editingMeeting}
      />

      <MeetingNoteModal
        open={!!notesMeeting}
        onClose={() => setNotesMeeting(null)}
        meeting={notesMeeting}
        projectId={projectId}
        clientId={clientId}
      />
    </div>
  );
}
