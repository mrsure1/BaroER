// S-001 스플래시 → 인증 분기 (1~2초)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors } from '@/constants/Colors';

const SPLASH_MS = 1600;

export default function Index() {
  const { isLoggedIn } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>바로응급실</Text>
        <Text style={styles.slogan}>
          긴급할 때, 바로 찾는{'\n'}가장 가까운 응급실
        </Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotA]} />
          <View style={[styles.dot, styles.dotB]} />
          <View style={[styles.dot, styles.dotC]} />
        </View>
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: { width: 88, height: 88, marginBottom: 20 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, opacity: 0.35 },
  dotA: { opacity: 0.9 },
  dotB: { opacity: 0.55 },
  dotC: { opacity: 0.3 },
});
