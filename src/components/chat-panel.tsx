"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { TextStreamChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import {
  LuCheck,
  LuCopy,
  LuMessageSquare,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuPlus,
  LuTrash2,
  LuUser,
  LuX,
} from "react-icons/lu";
import { SiYcombinator } from "react-icons/si";
import { MarkdownContent } from "@/components/markdown-content";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type SerializedMessage, useChatStore } from "@/lib/stores/chat-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function serializeMessages(messages: UIMessage[]): SerializedMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: (m.parts as Array<{ type: string; text?: string }>).filter((p) => p.type === "text"),
  }));
}

function deserializeMessages(messages: SerializedMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts,
  })) as UIMessage[];
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return { copied, copy };
}

// ─── Sidebar content (shared between desktop panel and mobile drawer) ──────────

function SidebarContent({
  onClose,
  onRoomSelect,
}: {
  onClose?: () => void;
  onRoomSelect?: () => void;
}) {
  const t = useTranslations("chat");
  const { rooms, activeRoomId, createRoom, deleteRoom, setActiveRoom } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">{t("sidebarTitle")}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          >
            <LuX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New chat button */}
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            createRoom();
            onRoomSelect?.();
          }}
        >
          <LuPlus className="h-4 w-4" />
          {t("newChat")}
        </Button>
      </div>

      {/* Room list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1">
        {rooms.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">{t("noChats")}</p>
        )}
        {rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
              room.id === activeRoomId
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-muted-foreground",
            )}
          >
            <button
              type="button"
              className="flex-1 text-left truncate"
              onClick={() => {
                setActiveRoom(room.id);
                onRoomSelect?.();
              }}
            >
              {room.title}
            </button>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                deleteRoom(room.id);
              }}
              title={t("deleteChat")}
            >
              <LuTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Desktop sidebar (collapsible panel) ──────────────────────────────────────

function ChatSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const t = useTranslations("chat");

  return (
    <div
      className={cn(
        "hidden sm:flex flex-col border-r bg-muted/30 transition-all duration-200 shrink-0",
        collapsed ? "w-12" : "w-64",
      )}
    >
      {collapsed ? (
        /* Collapsed: only show toggle button */
        <div className="flex flex-col items-center pt-2 gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            title={t("expandSidebar")}
          >
            <LuPanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Sidebar header with collapse button */}
          <div className="flex items-center justify-between border-b px-2 py-2">
            <span className="text-xs font-semibold text-muted-foreground pl-1">
              {t("sidebarTitle")}
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              title={t("collapseSidebar")}
            >
              <LuPanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent />
        </div>
      )}
    </div>
  );
}

// ─── Mobile drawer overlay ────────────────────────────────────────────────────

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Close on backdrop click
  return (
    <>
      {/* Backdrop */}
      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
        <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onClose} />
      )}
      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-xl transition-transform duration-200 sm:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onClose={onClose} onRoomSelect={onClose} />
      </div>
    </>
  );
}

// ─── Assistant Message ─────────────────────────────────────────────────────────

function AssistantMessage({ text }: { text: string }) {
  const t = useTranslations("chat");
  const { copied, copy } = useCopy(text);

  return (
    <div className="group relative max-w-[90%] sm:max-w-[80%]">
      <Card className="p-3 bg-card text-sm">
        <MarkdownContent content={text} />
      </Card>
      {text && (
        <button
          type="button"
          onClick={copy}
          className={cn(
            "absolute -bottom-6 right-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-all",
            "text-muted-foreground hover:text-foreground",
            "opacity-0 group-hover:opacity-100",
          )}
          title={t("copyResponse")}
        >
          {copied ? <LuCheck className="h-3 w-3" /> : <LuCopy className="h-3 w-3" />}
          {copied ? t("copied") : t("copy")}
        </button>
      )}
    </div>
  );
}

// ─── Chat Area ─────────────────────────────────────────────────────────────────

function ActiveChat({ roomId, onOpenDrawer }: { roomId: string; onOpenDrawer: () => void }) {
  const t = useTranslations("chat");
  const { saveMessages, getActiveRoom } = useChatStore();

  const saveMessagesRef = useRef(saveMessages);
  saveMessagesRef.current = saveMessages;

  const [initialMessages] = useState(() => {
    const room = getActiveRoom();
    return room?.messages ? deserializeMessages(room.messages) : [];
  });

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        headers: (): Record<string, string> => {
          const key = useSettingsStore.getState().apiKey;
          return key ? { "x-openai-api-key": key } : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: roomId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (messages.length === 0) return;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMessagesRef.current(roomId, serializeMessages(messages));
    }, 500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [messages, roomId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset state on room switch
  useEffect(() => {
    setInput("");
  }, [roomId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage({ text: input });
      setInput("");
    },
    [input, isLoading, sendMessage],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage],
  );

  const suggestions = [
    t("suggestions.trending"),
    t("suggestions.summarize"),
    t("suggestions.ai"),
    t("suggestions.debates"),
  ];

  return (
    <div className="flex h-full flex-col flex-1 min-w-0">
      {/* Mobile top bar: drawer toggle */}
      <div className="flex items-center gap-2 border-b px-3 py-2 sm:hidden">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          aria-label={t("expandSidebar")}
        >
          <LuPanelLeftOpen className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-muted-foreground truncate">
          {t("sidebarTitle")}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3 max-w-sm px-2">
              <h3 className="text-lg font-medium">{t("emptyHeading")}</h3>
              <p className="text-sm">{t("emptySubtitle")}</p>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    className="block w-full rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => {
            const text = getMessageText(message.parts as Array<{ type: string; text?: string }>);
            return (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 bg-orange-500 flex items-center justify-center text-white">
                    <SiYcombinator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Avatar>
                )}
                {message.role === "assistant" ? (
                  <AssistantMessage text={text} />
                ) : (
                  <Card className="max-w-[90%] sm:max-w-[80%] p-3 bg-primary text-primary-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                  </Card>
                )}
                {message.role === "user" && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 bg-blue-500 flex items-center justify-center text-white">
                    <LuUser className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Avatar>
                )}
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 sm:gap-3">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 bg-orange-500 flex items-center justify-center text-white">
                <SiYcombinator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Avatar>
              {/* <Card className="p-3 bg-card">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                </div>
              </Card> */}
              <Spinner className="text-2xl" />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {t("error", { message: error.message })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inputPlaceholder")}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="sm:text-sm"
          >
            <IoSend className="h-4 w-4" />
            <span className="hidden sm:inline">{t("send")}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Outer ChatPanel ───────────────────────────────────────────────────────────

export function ChatPanel() {
  const t = useTranslations("chat");
  const { activeRoomId, createRoom, rooms } = useChatStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const createRoomRef = useRef(createRoom);
  createRoomRef.current = createRoom;

  useEffect(() => {
    if (rooms.length === 0) {
      createRoomRef.current();
    }
  }, [rooms.length]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <ChatSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Chat area */}
      {activeRoomId ? (
        <ActiveChat
          key={activeRoomId}
          roomId={activeRoomId}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2 text-sm">
            <LuMessageSquare className="h-5 w-5" />
            <p>{t("noActiveRoom")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
