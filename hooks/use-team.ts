"use client";

import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";

export function useTeamWorkload() {
  return useQuery({
    queryKey: ["team", "workload"],
    queryFn: () => teamApi.workload().then((r) => r.data),
  });
}
