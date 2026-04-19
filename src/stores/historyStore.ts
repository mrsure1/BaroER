"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Hospital } from "@/types/hospital";
import type { AgeBand, Gender, SymptomId } from "@/stores/searchStore";

export interface HistoryEntry {
  id: string;
  ts: number;
  symptoms: SymptomId[];
  gender: Gender | null;
  ageBand: AgeBand | null;
  notes: string;
  coords: { lat: number; lng: number; fallback?: boolean } | null;
  /** Top result snapshot — display only */
  topResults: Pick<Hospital, "id" | "name" | "etaMin" | "distanceKm" | "capacity">[];
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: Omit<HistoryEntry, "id" | "ts">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX_ENTRIES = 50;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((s) => {
          const next: HistoryEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ts: Date.now(),
          };
          return { entries: [next, ...s.entries].slice(0, MAX_ENTRIES) };
        }),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "baroer-search-history",
      storage: createJSONStorage(() => localStorage),
      // v2: replaced numeric `age` with `ageBand` enum.
      version: 2,
      migrate: (persisted, fromVersion) => {
        // From v1: drop the legacy numeric `age` and seed `ageBand: null`.
        if (fromVersion < 2 && persisted && typeof persisted === "object") {
          const prev = persisted as { entries?: Array<Record<string, unknown>> };
          const entries = (prev.entries ?? []).map(({ age: _drop, ...rest }) => ({
            ...rest,
            ageBand: null,
          }));
          return { entries } as HistoryState;
        }
        return persisted as HistoryState;
      },
    },
  ),
);
