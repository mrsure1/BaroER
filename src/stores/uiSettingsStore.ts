import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DefaultNavApp = 'kakao' | 'naver' | 'tmap' | 'google';

interface UiSettingsState {
  defaultSearchRadiusKm: 5 | 10 | 20;
  defaultNavApp: DefaultNavApp;
  autoCallDefault: boolean;
  pushEnabled: boolean;
  setDefaultSearchRadiusKm: (v: 5 | 10 | 20) => void;
  setDefaultNavApp: (v: DefaultNavApp) => void;
  setAutoCallDefault: (v: boolean) => void;
  setPushEnabled: (v: boolean) => void;
}

export const useUiSettingsStore = create<UiSettingsState>()(
  persist(
    (set) => ({
      defaultSearchRadiusKm: 10,
      defaultNavApp: 'kakao',
      autoCallDefault: false,
      pushEnabled: true,
      setDefaultSearchRadiusKm: (v) => set({ defaultSearchRadiusKm: v }),
      setDefaultNavApp: (v) => set({ defaultNavApp: v }),
      setAutoCallDefault: (v) => set({ autoCallDefault: v }),
      setPushEnabled: (v) => set({ pushEnabled: v }),
    }),
    {
      name: 'baroer_ui_settings_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
