"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 사용자 알림 설정 (디바이스 로컬). 백엔드 푸시가 준비되기 전이라
 * 이 값들은 현재 "인앱 노출 여부" 토글로만 동작한다. 디바이스 푸시 권한은
 * 브라우저 `Notification.permission` 을 직접 사용.
 */
export interface NotificationPrefs {
  criticalAlerts: boolean; // KTAS 1·2 수준 경고
  nearbyCapacityChange: boolean; // 검색 반경 내 병상 변동
  dispatchReminders: boolean; // 구급대원 작성 미완 리포트 리마인더
  marketing: boolean; // 앱 업데이트 · 이벤트
  sound: boolean;
  vibrate: boolean;
}

const DEFAULT: NotificationPrefs = {
  criticalAlerts: true,
  nearbyCapacityChange: true,
  dispatchReminders: true,
  marketing: false,
  sound: true,
  vibrate: true,
};

interface State {
  prefs: NotificationPrefs;
  set: <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => void;
  reset: () => void;
}

export const useNotificationPrefs = create<State>()(
  persist(
    (set) => ({
      prefs: DEFAULT,
      set: (key, value) =>
        set((s) => ({ prefs: { ...s.prefs, [key]: value } })),
      reset: () => set({ prefs: DEFAULT }),
    }),
    {
      name: "baroer-notification-prefs",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
