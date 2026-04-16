// Firebase 초기화 모듈
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 환경 변수에서 설정값 가져오기 (Expo에서는 EXPO_PUBLIC_ 접두어가 필요)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore } from 'firebase/firestore';

// 중복 초기화 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 인증 상태 유지를 위해 AsyncStorage 적용 (중복 초기화 방지)
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    return getAuth(app);
  }
})();

// Firestore 오프라인 에러 방지를 위해 설정 강화 (롱폴링 강제)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
