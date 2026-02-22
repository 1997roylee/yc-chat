"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
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
import { type Locale, useLocaleStore } from "@/lib/stores/locale-store";
import { useSettingsStore } from "@/lib/stores/settings-store";

function SyncBanner() {
  const t = useTranslations("sync");
  const { isSyncing, lastSyncedAt } = useAppStore();

  if (!isSyncing) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-orange-500 px-4 py-1.5 text-sm text-white">
      <LuLoader className="h-3.5 w-3.5 animate-spin" />
      <span>{lastSyncedAt ? t("syncingUpdating") : t("syncing")}</span>
    </div>
  );
}

function ApiKeyDialog() {
  const t = useTranslations("apiKey");
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
          {/* Hide text label on very small screens */}
          <span className="hidden sm:inline">{isSet ? t("buttonSet") : t("buttonUnset")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Input
            type="password"
            placeholder={t("placeholder")}
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
                {t("removeKey")}
              </Button>
            )}
            <Button onClick={handleSave}>{t("save")}</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("noKeyPrompt")}{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              {t("getKeyLink")}
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

function LocaleSwitcher() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="flex items-center rounded-md border overflow-hidden">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            locale === value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AppShell() {
  const t = useTranslations();
  const { activeTab, setActiveTab, lastSyncedAt } = useAppStore();

  // Auto-sync on mount if data is stale or empty
  useAutoSync();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Sync banner */}
      <SyncBanner />

      {/* Header */}
      <header className="flex items-center justify-between border-b px-3 py-2 sm:px-6 sm:py-3">
        {/* Left: logo + name + badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-orange-500">Y</span>
            <h1 className="text-base sm:text-lg font-semibold truncate">
              {/* Show abbreviated name on mobile */}
              <span className="hidden sm:inline">{t("header.appName")}</span>
              <span className="sm:hidden">HN Chat</span>
            </h1>
          </div>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            {t("header.badge")}
          </Badge>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Last sync time — hidden on mobile */}
          {lastSyncedAt && (
            <span className="hidden md:block text-xs text-muted-foreground">
              {t("header.lastSync", { time: dayjs(lastSyncedAt).format("HH:mm:ss") })}
            </span>
          )}
          <LocaleSwitcher />
          <ApiKeyDialog />
          <Button asChild size="sm" variant="outline" className="px-2 sm:px-3">
            <a href="https://github.com/1997roylee/yc-chat" target="_blank" rel="noreferrer">
              <SiGithub className="h-4 w-4" />
              <span className="hidden sm:inline">{t("header.github")}</span>
            </a>
          </Button>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="flex border-b px-3 sm:px-6">
        {(
          [
            { key: "chat", label: t("tabs.chat"), icon: IoChatbubblesOutline },
            { key: "feed", label: t("tabs.feed"), icon: IoNewspaperOutline },
          ] as { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]
        ).map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
