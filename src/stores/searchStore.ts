"use client";

import { create } from "zustand";

export type Gender = "M" | "F" | "U";

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
  { id: "etc", label: "기타", emoji: "❓" },
];

export type SymptomId = string;

export interface SearchCoords {
  lat: number;
  lng: number;
  fallback?: boolean;
}

interface SearchState {
  symptoms: SymptomId[];
  gender: Gender | null;
  age: number | null;
  notes: string;
  coords: SearchCoords | null;
  toggleSymptom: (id: SymptomId) => void;
  setGender: (g: Gender) => void;
  setAge: (a: number | null) => void;
  setNotes: (n: string) => void;
  setCoords: (c: SearchCoords | null) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  symptoms: [],
  gender: null,
  age: null,
  notes: "",
  coords: null,
  toggleSymptom: (id) =>
    set((s) => ({
      symptoms: s.symptoms.includes(id)
        ? s.symptoms.filter((x) => x !== id)
        : [...s.symptoms, id],
    })),
  setGender: (gender) => set({ gender }),
  setAge: (age) => set({ age }),
  setNotes: (notes) => set({ notes }),
  setCoords: (coords) => set({ coords }),
  reset: () => set({ symptoms: [], gender: null, age: null, notes: "", coords: null }),
}));
