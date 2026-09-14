"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalNotificationsApi } from "@/lib/portal-api";

export function usePortalNotifications(params?: { is_read?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ["portal", "notifications", params],
    queryFn: () => portalNotificationsApi.list(params).then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useMarkPortalNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portalNotificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "notifications"] }),
  });
}

export function useMarkAllPortalNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => portalNotificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "notifications"] }),
  });
}
