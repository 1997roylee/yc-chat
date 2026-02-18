import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SerializedMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: string; text?: string }>;
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: SerializedMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;

  // Actions
  createRoom: () => string;
  deleteRoom: (id: string) => void;
  renameRoom: (id: string, title: string) => void;
  setActiveRoom: (id: string) => void;
  saveMessages: (roomId: string, messages: SerializedMessage[]) => void;
  getActiveRoom: () => ChatRoom | undefined;
}

function generateId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function deriveTitle(messages: SerializedMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Chat";
  const text = firstUserMsg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
  return text.length > 40 ? `${text.slice(0, 40)}...` : text || "New Chat";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      rooms: [],
      activeRoomId: null,

      createRoom: () => {
        const id = generateId();
        const now = new Date().toISOString();
        const room: ChatRoom = {
          id,
          title: "New Chat",
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          rooms: [room, ...state.rooms],
          activeRoomId: id,
        }));
        return id;
      },

      deleteRoom: (id) => {
        set((state) => {
          const rooms = state.rooms.filter((r) => r.id !== id);
          const activeRoomId =
            state.activeRoomId === id ? (rooms[0]?.id ?? null) : state.activeRoomId;
          return { rooms, activeRoomId };
        });
      },

      renameRoom: (id, title) => {
        set((state) => ({
          rooms: state.rooms.map((r) => (r.id === id ? { ...r, title } : r)),
        }));
      },

      setActiveRoom: (id) => {
        set({ activeRoomId: id });
      },

      saveMessages: (roomId, messages) => {
        set((state) => ({
          rooms: state.rooms.map((r) => {
            if (r.id !== roomId) return r;
            const title = r.title === "New Chat" ? deriveTitle(messages) : r.title;
            return {
              ...r,
              messages,
              title,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      getActiveRoom: () => {
        const { rooms, activeRoomId } = get();
        return rooms.find((r) => r.id === activeRoomId);
      },
    }),
    {
      name: "hn-chatroom-storage",
      version: 1,
    },
  ),
);
