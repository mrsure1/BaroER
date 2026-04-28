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
  /**
   * 좌표의 한글 주소(역지오코딩 결과). 미확인 시 null — 카드 UI 에서는
   * 좌표 폴백으로 대체 표시된다.
   */
  address?: string | null;
  /** Top result snapshot — display only */
  topResults: Pick<Hospital, "id" | "name" | "etaMin" | "distanceKm" | "capacity">[];
  /** 검색 후 실제로 수행한 행동 (길안내 또는 전화). */
  actionTaken?: {
    type: "navigate" | "call";
    hospitalId: string;
    hospitalName: string;
    ts: number;
  };
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: Omit<HistoryEntry, "id" | "ts">) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** 가장 최근 기록 항목의 행동 결과(길안내/전화)를 업데이트한다. */
  updateLatestAction: (action: HistoryEntry["actionTaken"]) => void;
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
      updateLatestAction: (action) =>
        set((s) => {
          if (s.entries.length === 0) return s;
          return {
            entries: s.entries.map((e, i) =>
              i === 0 ? { ...e, actionTaken: action } : e,
            ),
          };
        }),
    }),
    {
      name: "baroer-search-history",
      storage: createJSONStorage(() => localStorage),
      // v2: replaced numeric `age` with `ageBand` enum.
      // v3: added optional `address` (reverse-geocoded Korean address).
      version: 3,
      migrate: (persisted, fromVersion) => {
        if (!persisted || typeof persisted !== "object") return persisted as HistoryState;
        let entries = (persisted as { entries?: Array<Record<string, unknown>> }).entries ?? [];
        if (fromVersion < 2) {
          // v1 → v2: drop numeric `age`, seed `ageBand: null`.
          entries = entries.map(({ age: _drop, ...rest }) => ({ ...rest, ageBand: null }));
        }
        if (fromVersion < 3) {
          // v2 → v3: add address (null) — 기존 레코드는 좌표로만 표시.
          entries = entries.map((e) => ({ address: null, ...e }));
        }
        // migrate 는 저장 대상 state shape 만 반환 — 타입은 partial 로 안전하게.
        return { entries } as unknown as HistoryState;
      },
    },
  ),
);
