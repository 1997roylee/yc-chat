import { create } from "zustand";

export type Tab = "chat" | "feed";

interface AppState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  lastSyncedAt: string | null;
  setLastSyncedAt: (date: string | null) => void;
  feedPeriod: "today" | "week" | "all";
  setFeedPeriod: (period: "today" | "week" | "all") => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "chat",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSyncing: false,
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  lastSyncedAt: null,
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
  feedPeriod: "today",
  setFeedPeriod: (period) => set({ feedPeriod: period }),
}));
