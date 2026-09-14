"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { usePortalMeetings } from "@/hooks/use-portal";
import { PortalMeetingNotesModal } from "@/components/portal/PortalMeetingNotesModal";
import type { Meeting, MeetingStatus } from "@/lib/api";

const statusVariant: Record<MeetingStatus, "neutral" | "info" | "cancelled"> = {
  scheduled: "info",
  completed: "neutral",
  cancelled: "cancelled",
};

interface PortalMeetingsTabProps {
  projectId: string;
  onNoteFirstRead?: (noteId: string) => void;
}

export function PortalMeetingsTab({ projectId, onNoteFirstRead }: PortalMeetingsTabProps) {
  const { data, isLoading } = usePortalMeetings(projectId);
  const [openMeeting, setOpenMeeting] = useState<Meeting | null>(null);

  const meetings = data?.meetings ?? [];

  if (isLoading) return <p className="text-(--muted)">Loading meetings...</p>;
  if (meetings.length === 0) return <p className="text-(--muted)">No meetings scheduled yet.</p>;

  return (
    <>
      <Table>
        <TableHead>
          <Th>Title</Th>
          <Th>Scheduled at</Th>
          <Th>Status</Th>
        </TableHead>
        <TableBody>
          {meetings.map((m) => (
            <TableRow key={m.id} className="cursor-pointer" onClick={() => setOpenMeeting(m)}>
              <Td>
                <span className="font-medium">{m.title}</span>
                {m.meeting_link && (
                  <a
                    href={m.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-2 inline-flex items-center gap-1 text-xs text-(--primary) hover:underline"
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PortalMeetingNotesModal
        open={!!openMeeting}
        onClose={() => setOpenMeeting(null)}
        meeting={openMeeting}
        onFirstRead={onNoteFirstRead}
      />
    </>
  );
}
