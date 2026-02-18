"use client";

import dayjs from "dayjs";
import { IoChatbubblesOutline, IoNewspaperOutline } from "react-icons/io5";
import { LuLoader } from "react-icons/lu";
import { ChatPanel } from "@/components/chat-panel";
import { StoryFeed } from "@/components/story-feed";
import { Badge } from "@/components/ui/badge";
import { useAutoSync } from "@/lib/hooks/use-hn-data";
import { type Tab, useAppStore } from "@/lib/stores/app-store";

function SyncBanner() {
  const { isSyncing, lastSyncedAt } = useAppStore();

  if (!isSyncing) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-orange-500 px-4 py-1.5 text-sm text-white">
      <LuLoader className="h-3.5 w-3.5 animate-spin" />
      <span>Syncing Hacker News data{lastSyncedAt ? " (updating)" : ""}...</span>
    </div>
  );
}

export function AppShell() {
  const { activeTab, setActiveTab, lastSyncedAt } = useAppStore();

  // Auto-sync on mount if data is stale or empty
  useAutoSync();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Sync banner */}
      <SyncBanner />

      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-500">Y</span>
            <h1 className="text-lg font-semibold">HN Chatroom</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            Hacker News AI Assistant
          </Badge>
        </div>

        {lastSyncedAt && (
          <span className="text-xs text-muted-foreground">
            Last sync: {dayjs(lastSyncedAt).format("HH:mm:ss")}
          </span>
        )}
      </header>

      {/* Tab navigation */}
      <div className="flex border-b px-6">
        {(
          [
            { key: "chat", label: "Chat with AI", icon: IoChatbubblesOutline },
            { key: "feed", label: "Story Feed", icon: IoNewspaperOutline },
          ] as { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]
        ).map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-orange-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" ? <ChatPanel /> : <StoryFeed />}
      </main>
    </div>
  );
}
