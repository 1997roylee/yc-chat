import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",

      setApiKey: (key) => set({ apiKey: key }),

      clearApiKey: () => set({ apiKey: "" }),
    }),
    {
      name: "hn-chatroom-settings",
      version: 1,
    },
  ),
);
