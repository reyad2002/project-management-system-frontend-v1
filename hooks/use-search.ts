"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";

/** Results for the global search box; waits for 2+ characters. */
export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => searchApi.search(q).then((r) => r.data),
    enabled: q.length >= 2,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}
