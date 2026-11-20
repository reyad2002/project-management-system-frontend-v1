"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedFiltersApi, type FilterValue, type SavedFilterPage } from "@/lib/api";

export function useSavedFilters(page: SavedFilterPage) {
  return useQuery({
    queryKey: ["saved-filters", page],
    queryFn: () => savedFiltersApi.list(page).then((r) => r.data),
  });
}

export function useSaveFilter(page: SavedFilterPage) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "View saved" },
    mutationFn: ({ name, params }: { name: string; params: Record<string, FilterValue> }) => savedFiltersApi.create(page, name, params).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-filters", page] }),
  });
}

export function useDeleteSavedFilter(page: SavedFilterPage) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "View deleted" },
    mutationFn: (id: string) => savedFiltersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-filters", page] }),
  });
}
