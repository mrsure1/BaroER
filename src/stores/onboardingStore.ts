"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 첫 로그인 직후 한 번만 노출되는 "사용법 카드 투어" 의 상태.
 *
 * - `seen` 이 true 가 되면 (main) 레이아웃 위의 OnboardingGate 가 더 이상
 *   오버레이를 띄우지 않는다.
 * - localStorage 단위라 디바이스당 1회. 사용자가 언제든 "설정 → 앱 사용
 *   안내 다시 보기" 에서 `reset()` 호출로 다시 볼 수 있다.
 */
interface OnboardingState {
  seen: boolean;
  markSeen: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      seen: false,
      markSeen: () => set({ seen: true }),
      reset: () => set({ seen: false }),
    }),
    {
      name: "baroer-onboarding",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
