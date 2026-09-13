"use client";

import { useQuery } from "@tanstack/react-query";
import { timelineApi } from "@/lib/api";

export function useProjectTimeline(projectId: string | null) {
  return useQuery({
    queryKey: ["timeline", projectId],
    queryFn: () => timelineApi.get(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}
