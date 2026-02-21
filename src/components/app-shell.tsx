"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { IoChatbubblesOutline, IoNewspaperOutline } from "react-icons/io5";
import { LuKey, LuLoader } from "react-icons/lu";
import { SiGithub } from "react-icons/si";
import { ChatPanel } from "@/components/chat-panel";
import { StoryFeed } from "@/components/story-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAutoSync } from "@/lib/hooks/use-hn-data";
import { type Tab, useAppStore } from "@/lib/stores/app-store";
import { useSettingsStore } from "@/lib/stores/settings-store";

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

function ApiKeyDialog() {
  const { apiKey, setApiKey, clearApiKey } = useSettingsStore();
  const [draft, setDraft] = useState(apiKey);
  const [open, setOpen] = useState(false);

  // Auto-open on first load if no key is set
  useEffect(() => {
    if (!useSettingsStore.getState().apiKey) setOpen(true);
  }, []);

  function handleSave() {
    const trimmed = draft.trim();
    if (trimmed) {
      setApiKey(trimmed);
    } else {
      clearApiKey();
    }
    setOpen(false);
  }

  function handleOpenChange(value: boolean) {
    if (value) setDraft(apiKey);
    setOpen(value);
  }

  const isSet = Boolean(apiKey);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={isSet ? "border-green-500 text-green-600" : ""}
        >
          <LuKey className="h-4 w-4" />
          {isSet ? "API Key Set" : "Set API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your own OpenAI API key. It is stored locally in your browser and sent with each
            request — it is never saved on the server.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Input
            type="password"
            placeholder="sk-..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoComplete="off"
          />
          <div className="flex gap-2 justify-end">
            {isSet && (
              <Button
                variant="outline"
                onClick={() => {
                  clearApiKey();
                  setDraft("");
                  setOpen(false);
                }}
              >
                Remove Key
              </Button>
            )}
            <Button onClick={handleSave}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Don&apos;t have a key?{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Get one from OpenAI
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
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

        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground">
              Last sync: {dayjs(lastSyncedAt).format("HH:mm:ss")}
            </span>
          )}
          <ApiKeyDialog />
          <Button asChild size="sm" variant="outline">
            <a href="https://github.com/1997roylee/yc-chat" target="_blank" rel="noreferrer">
              <SiGithub className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
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
