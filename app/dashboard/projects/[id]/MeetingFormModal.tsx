"use client";

import { useCreateMeeting, useUpdateMeeting } from "@/hooks/use-meetings";
import { MeetingForm, type MeetingFormData } from "@/components/meetings/MeetingForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Meeting } from "@/lib/api";

const FORM_ID = "meeting-form";

interface MeetingFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  clientId: string;
  meeting: Meeting | null;
}

export function MeetingFormModal({ open, onClose, projectId, meeting }: MeetingFormModalProps) {
  const createMeeting = useCreateMeeting(projectId);
  const updateMeeting = useUpdateMeeting(projectId);

  if (!open) return null;

  const handleSubmit = async (data: MeetingFormData) => {
    const scheduledAtIso = new Date(data.scheduled_at).toISOString();
    if (meeting) {
      await updateMeeting.mutateAsync({
        id: meeting.id,
        title: data.title,
        agenda: data.agenda || undefined,
        scheduled_at: scheduledAtIso,
        meeting_link: data.meeting_link || undefined,
      });
    } else {
      await createMeeting.mutateAsync({
        title: data.title,
        agenda: data.agenda || undefined,
        scheduled_at: scheduledAtIso,
        meeting_link: data.meeting_link || undefined,
      });
    }
    onClose();
  };

  const isLoading = createMeeting.isPending || updateMeeting.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meeting ? "Edit meeting" : "New meeting"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {meeting ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <MeetingForm meeting={meeting} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
