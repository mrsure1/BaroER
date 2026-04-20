"use client";

import { create } from "zustand";

export type Gender = "M" | "F";

export interface Symptom {
  id: string;
  label: string;
  emoji: string;
  critical?: boolean;
}

export const SYMPTOMS: readonly Symptom[] = [
  { id: "unconscious", label: "의식 없음", emoji: "😵", critical: true },
  { id: "breathing", label: "호흡 곤란", emoji: "😮‍💨", critical: true },
  { id: "bleeding", label: "출혈", emoji: "🩸", critical: true },
  { id: "fracture", label: "골절", emoji: "🦴" },
  { id: "pain", label: "심한 통증", emoji: "🤕" },
  { id: "allergy", label: "알레르기 반응", emoji: "🤧" },
  { id: "seizure", label: "발작", emoji: "⚡", critical: true },
  { id: "burn", label: "화상", emoji: "🔥" },
  { id: "headache", label: "두통", emoji: "🤯" },
];

export type SymptomId = string;

export type AgeBand = "infant" | "child" | "adolescent" | "adult" | "elderly";

export interface AgeBandOption {
  value: AgeBand;
  label: string;
  range: string;
}

export const AGE_BANDS: readonly AgeBandOption[] = [
  { value: "infant", label: "유아", range: "0–6세" },
  { value: "child", label: "소아", range: "7–12세" },
  { value: "adolescent", label: "청소년", range: "13–18세" },
  { value: "adult", label: "성인", range: "19–64세" },
  { value: "elderly", label: "노인", range: "65세 이상" },
];

export type GeoReason =
  | "unsupported"
  | "insecure_context"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export interface SearchCoords {
  lat: number;
  lng: number;
  fallback?: boolean;
  reason?: GeoReason;
}

interface SearchState {
  symptoms: SymptomId[];
  gender: Gender | null;
  ageBand: AgeBand | null;
  notes: string;
  coords: SearchCoords | null;
  toggleSymptom: (id: SymptomId) => void;
  setGender: (g: Gender) => void;
  setAgeBand: (a: AgeBand | null) => void;
  setNotes: (n: string) => void;
  setCoords: (c: SearchCoords | null) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  symptoms: [],
  gender: null,
  ageBand: null,
  notes: "",
  coords: null,
  toggleSymptom: (id) =>
    set((s) => ({
      symptoms: s.symptoms.includes(id)
        ? s.symptoms.filter((x) => x !== id)
        : [...s.symptoms, id],
    })),
  setGender: (gender) => set({ gender }),
  setAgeBand: (ageBand) => set({ ageBand }),
  setNotes: (notes) => set({ notes }),
  setCoords: (coords) => set({ coords }),
  reset: () => set({ symptoms: [], gender: null, ageBand: null, notes: "", coords: null }),
}));
