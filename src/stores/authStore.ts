"use client";

import { create } from "zustand";

export type UserType = "GENERAL" | "PARAMEDIC";

export interface AuthUser {
  uid: string;
  email: string | null;
  nickname: string | null;
  userType: UserType;
  orgCode?: string;
  photoURL?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, loading: false }),
}));
