"use client";

import { useSyncExternalStore } from "react";

/**
 * Small per-person lists kept in the browser: recently opened search results and pinned projects.
 * Best effort (storage can be blocked); a change in one tab or component updates every reader.
 */
const EVENT = "local-lists-changed";

function read<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
  cache.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

// useSyncExternalStore needs the same array back while nothing changed.
const cache = new Map<string, { raw: string | null; value: unknown[] }>();
function snapshot<T>(key: string): T[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T[];
  const value = read<T>(key);
  cache.set(key, { raw, value });
  return value;
}

const EMPTY: never[] = [];

function useLocalList<T>(key: string | null): T[] {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => (key ? snapshot<T>(key) : (EMPTY as T[])),
    () => EMPTY as T[],
  );
}

// ---- recent search results
export interface RecentItem {
  key: string;
  group: string;
  title: string;
  sub?: string;
  href: string;
}
const RECENTS = "search-recents";

export function pushRecent(item: RecentItem) {
  write(RECENTS, [item, ...read<RecentItem>(RECENTS).filter((r) => r.key !== item.key)].slice(0, 8));
}
export const useRecents = () => useLocalList<RecentItem>(RECENTS);

// ---- pinned projects (per user, since a browser can be shared)
export interface PinnedProject {
  id: string;
  title: string;
}
const pinsKey = (userId: string | number | undefined) => (userId ? `pinned-projects:${userId}` : null);

export function usePinnedProjects(userId: string | number | undefined) {
  return useLocalList<PinnedProject>(pinsKey(userId));
}

export function togglePin(userId: string | number | undefined, project: PinnedProject) {
  const key = pinsKey(userId);
  if (!key) return;
  const list = read<PinnedProject>(key);
  const exists = list.some((p) => String(p.id) === String(project.id));
  write(key, exists ? list.filter((p) => String(p.id) !== String(project.id)) : [...list, { id: String(project.id), title: project.title }].slice(0, 10));
}
