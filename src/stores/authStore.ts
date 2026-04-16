import { create } from 'zustand';
import { UserProfile } from '@/src/types';

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true, // 앱 초기화 시 로딩 상태로 시작

  // 사용자 정보 저장 (Firebase onAuthStateChanged에서 호출됨)
  setUser: (user: UserProfile | null) => {
    set({ user, isLoggedIn: !!user, isLoading: false });
  },

  // 로그아웃
  logout: () => {
    set({ user: null, isLoggedIn: false, isLoading: false });
  },

  // 로딩 상태 설정
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
