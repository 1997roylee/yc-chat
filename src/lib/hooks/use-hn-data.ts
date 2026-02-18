import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/stores/app-store";

export interface StoryWithComments {
  id: number;
  title: string;
  url: string | null;
  text: string | null;
  by: string;
  score: number;
  descendants: number | null;
  time: number;
  type: string;
  syncedAt: string;
  comments: {
    id: number;
    storyId: number;
    parentId: number | null;
    by: string | null;
    text: string | null;
    time: number | null;
    syncedAt: string;
  }[];
}

interface StoriesResponse {
  stories: StoryWithComments[];
  total: number;
  period: string;
}

interface SyncStatusResponse {
  lastSyncedAt: string | null;
  storyCount: number;
  isStale: boolean;
}

// Fetch stories
export function useStories(period: "today" | "week" | "all" = "today") {
  return useQuery<StoriesResponse>({
    queryKey: ["stories", period],
    queryFn: async () => {
      const res = await fetch(`/api/stories?period=${period}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Trigger sync (used internally by useAutoSync)
export function useSync() {
  const queryClient = useQueryClient();
  const { setIsSyncing, setLastSyncedAt } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onMutate: () => {
      setIsSyncing(true);
    },
    onSuccess: (data) => {
      setIsSyncing(false);
      setLastSyncedAt(data.syncedAt);
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: () => {
      setIsSyncing(false);
    },
  });
}

/**
 * Checks data freshness on mount and auto-triggers sync if data is
 * stale (>1 hour old) or the database is empty.
 * Only triggers once per app session.
 */
export function useAutoSync() {
  const sync = useSync();
  const hasTriggered = useRef(false);
  const { isSyncing, setLastSyncedAt } = useAppStore();

  // Keep function refs stable to avoid putting them in useEffect deps
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const setLastSyncedAtRef = useRef(setLastSyncedAt);
  setLastSyncedAtRef.current = setLastSyncedAt;

  const statusQuery = useQuery<SyncStatusResponse>({
    queryKey: ["sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/sync/status");
      if (!res.ok) throw new Error("Failed to check sync status");
      return res.json();
    },
    // Only fetch once on mount
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!statusQuery.data || hasTriggered.current || isSyncing) return;

    // Set last synced time from server if we have it
    if (statusQuery.data.lastSyncedAt) {
      setLastSyncedAtRef.current(statusQuery.data.lastSyncedAt);
    }

    // Auto-sync if stale or empty
    if (statusQuery.data.isStale) {
      hasTriggered.current = true;
      syncRef.current.mutate();
    }
  }, [statusQuery.data, isSyncing]);

  return {
    isChecking: statusQuery.isLoading,
    isStale: statusQuery.data?.isStale ?? false,
    storyCount: statusQuery.data?.storyCount ?? 0,
  };
}
