import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/src/types';

const AUTH_STORAGE_KEY = 'baroer_user_v1';

type SetUserOptions = { persist?: boolean };

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null, options?: SetUserOptions) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user, options) => {
    const persist = options?.persist !== false;
    if (user) {
      if (persist) {
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user)).catch(() => {});
      } else {
        AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
      }
    } else {
      AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
    }
    set({ user, isLoggedIn: !!user, isLoading: false });
  },

  logout: () => {
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
    set({ user: null, isLoggedIn: false, isLoading: false });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  checkAuth: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const user = JSON.parse(raw) as UserProfile;
        set({ user, isLoggedIn: true, isLoading: false });
        return;
      }
    } catch {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
    set({ isLoading: false });
  },
}));
