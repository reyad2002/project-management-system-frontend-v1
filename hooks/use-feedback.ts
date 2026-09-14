"use client";

import { useQuery } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api";

export function useFeedback(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "feedback"],
    queryFn: () => feedbackApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  });
}
