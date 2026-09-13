"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientPortalApi } from "@/lib/api";

export function useClientPortalUsers(clientId: string | null) {
  return useQuery({
    queryKey: ["clients", clientId, "portal-users"],
    queryFn: () => clientPortalApi.list(clientId!).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useInviteClientPortalUser(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      clientPortalApi.invite(clientId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients", clientId, "portal-users"] }),
  });
}

export function useRevokeClientPortalUser(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientPortalApi.revoke(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients", clientId, "portal-users"] }),
  });
}
