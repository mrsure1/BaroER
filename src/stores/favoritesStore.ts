"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface FavoriteHospital {
  id: string;
  name: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
  savedAt: number;
}

interface FavoritesState {
  favorites: FavoriteHospital[];
  add: (hospital: Omit<FavoriteHospital, "savedAt">) => void;
  remove: (id: string) => void;
}

const MAX_FAVORITES = 30;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],
      add: (hospital) =>
        set((s) => {
          if (s.favorites.some((f) => f.id === hospital.id)) return s;
          const next: FavoriteHospital = { ...hospital, savedAt: Date.now() };
          return {
            favorites: [next, ...s.favorites].slice(0, MAX_FAVORITES),
          };
        }),
      remove: (id) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
    }),
    {
      name: "baroer-favorites",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
