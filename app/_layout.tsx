// 루트 레이아웃 - 인증 가드 + 네비게이션 구조
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { auth } from '@/src/services/firebase';
import { fetchUserProfile } from '@/src/services/auth';
import { onAuthStateChanged } from 'firebase/auth';

export { ErrorBoundary } from 'expo-router';

// 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const { isLoggedIn, isLoading, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 폰트 로딩 에러 처리
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Firebase 기반 세션 모니터링
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 인증 세션이 복구된 경우, 프로필 데이터 로드
        const profile = await fetchUserProfile(user.uid);
        setUser(profile);
      } else {
        // 미인증 상태
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 폰트 + 인증 체크 완료 후 스플래시 숨김
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // 인증 기반 라우팅 가드
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      // 미인증 → 로그인 화면으로 이동
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      // 인증됨 → 메인 화면으로 이동 (자동 로그인)
      router.replace('/(main)');
    }
  }, [isLoggedIn, isLoading, fontsLoaded, segments]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return <Slot />;
}
