"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  meetingsApi,
  type CreateMeetingInput,
  type UpdateMeetingInput,
  type MeetingStatus,
  type ActionItemInput,
} from "@/lib/api";

export function useMeetings(projectId: string | null, params?: { status?: MeetingStatus }) {
  return useQuery({
    queryKey: ["meetings", projectId, params],
    queryFn: () => meetingsApi.list(projectId!, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateMeeting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingInput) => meetingsApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings", projectId] }),
  });
}

export function useUpdateMeeting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateMeetingInput) =>
      meetingsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings", projectId] }),
  });
}

export function useMeetingNotes(meetingId: string | null) {
  return useQuery({
    queryKey: ["meetings", meetingId, "notes"],
    queryFn: () => meetingsApi.notes.list(meetingId!).then((r) => r.data),
    enabled: !!meetingId,
  });
}

export function useAddMeetingNote(meetingId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; action_items?: ActionItemInput[] }) =>
      meetingsApi.notes.add(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "notes"] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}
