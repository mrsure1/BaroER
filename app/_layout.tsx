import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { Colors } from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

const FONT_BOOTSTRAP_MS = 6000;
const AUTH_BOOTSTRAP_MS = 10000;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black,
  });

  const [fontTimedOut, setFontTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFontTimedOut(true), FONT_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, []);

  const fontsReady = fontsLoaded || fontError != null || fontTimedOut;

  const { isLoggedIn, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    if (__DEV__ && fontError) console.warn('[fonts] load failed, using system fonts', fontError);
  }, [fontError]);

  /** AsyncStorage 등이 멈출 때 무한 로딩 방지 */
  useEffect(() => {
    const id = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, AUTH_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, []);

  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 앱 시작 시 1회만
  }, []);

  useEffect(() => {
    if (isLoading || !fontsReady) return;

    const atRootSplash = pathname === '/' || pathname === '';
    if (atRootSplash) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isLoggedIn, isLoading, segments, fontsReady, pathname, router]);

  /** 네이티브 스플래시 걷기 — 실패해도 앱이 빨간 RN 오류 화면으로 안 넘어가게 */
  useEffect(() => {
    void SplashScreen.hideAsync().catch((e) => {
      if (__DEV__) console.warn('[splash] hideAsync', e);
    });
  }, [fontsReady, isLoading]);

  /** null 대신 흰 배경 — Android에서 검은 화면처럼 보이는 문제 완화 */
  if (!fontsReady || isLoading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
