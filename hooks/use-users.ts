"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";

export function useUsersShortList() {
  return useQuery({
    queryKey: ["users", "shortList"],
    queryFn: () => usersApi.shortList().then((r) => r.data),
  });
}
