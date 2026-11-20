"use client";

import { useQuery } from "@tanstack/react-query";
import { todayApi } from "@/lib/api";

export function useToday() {
  return useQuery({
    queryKey: ["today"],
    queryFn: () => todayApi.get().then((r) => r.data),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}
