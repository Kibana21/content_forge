"use client";
import { create } from "zustand";
import type { Presenter } from "@/lib/types/presenter";
import { presentersApi } from "@/lib/api/presenters";

interface PresenterStore {
  presenters: Presenter[];
  fetch: () => Promise<void>;
  add: (p: Presenter) => void;
  update: (p: Presenter) => void;
  remove: (id: string) => void;
}

export const usePresenterStore = create<PresenterStore>((set) => ({
  presenters: [],

  fetch: async () => {
    try {
      const presenters = await presentersApi.list();
      set({ presenters });
    } catch {}
  },

  add: (p) => set((s) => ({ presenters: [p, ...s.presenters] })),

  update: (p) =>
    set((s) => ({ presenters: s.presenters.map((x) => (x.id === p.id ? p : x)) })),

  remove: (id) => set((s) => ({ presenters: s.presenters.filter((x) => x.id !== id) })),
}));
