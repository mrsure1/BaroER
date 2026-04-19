"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NavAppId } from "@/lib/navApps";

/**
 * 사용자가 길안내 시 첫 사용 시점에 고른 "기본 내비 앱" 을 디바이스 로컬에
 * 저장한다. 다음 길안내부터는 picker 없이 바로 해당 앱으로 진입하고,
 * 설정 → 기본 내비 메뉴에서 다시 선택 / 초기화할 수 있다.
 */
interface NavPrefState {
  navId: NavAppId | null;
  setNav: (id: NavAppId) => void;
  clear: () => void;
}

export const useNavPrefStore = create<NavPrefState>()(
  persist(
    (set) => ({
      navId: null,
      setNav: (id) => set({ navId: id }),
      clear: () => set({ navId: null }),
    }),
    {
      name: "baroer-nav-pref",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
