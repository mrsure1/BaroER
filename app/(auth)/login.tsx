import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors } from '@/constants/Colors';
import { signInWithGoogle, signInWithKakao, signInWithEmailPassword } from '@/src/services/auth';
import { appConfig } from '@/src/config/appConfig';

WebBrowser.maybeCompleteAuthSession();

/** Kakao OAuth — useAuthRequest의 discovery로 사용 */
const KAKAO_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
};

/** Expo Go 앱에는 Google 네이티브 모듈이 없음 → 상단 import 금지, require는 개발 빌드에서만 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * - Expo Go: auth.expo.io 프록시 URL (`getRedirectUrl`) — 카카오에 동일 문자열 등록.
 * - 개발/프로덕션 빌드: `baroer://kakao` — auth.expo.io "Something went wrong" 회피, 카카오에 동일 URI 등록 필수.
 */
function resolveKakaoRedirectUri(): string {
  const override = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI?.trim();
  if (override) return override;

  if (Constants.appOwnership !== 'expo') {
    return AuthSession.makeRedirectUri({
      scheme: 'baroer',
      path: 'kakao',
    });
  }

  try {
    return AuthSession.getRedirectUrl();
  } catch {
    const fullName = Constants.expoConfig?.originalFullName;
    if (fullName) return `https://auth.expo.io/${fullName}`;
    const slug = Constants.expoConfig?.slug ?? 'BaroER';
    return `https://auth.expo.io/@anonymous/${slug}`;
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const kakaoClientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY || '';
  const redirectUri = useMemo(() => resolveKakaoRedirectUri(), []);

  useEffect(() => {
    if (__DEV__) {
      console.warn('[Kakao] Redirect URI (콘솔에도 출력) — 카카오 디벨로퍼스 Redirect URI에 등록:', redirectUri);
    }
  }, [redirectUri]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      // 훅은 항상 호출되어야 하므로 키가 없을 때는 placeholder (버튼은 비활성)
      clientId: kakaoClientId || 'missing-kakao-key',
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
      extraParams: { prompt: 'login' as const },
    },
    KAKAO_DISCOVERY
  );

  const handleKakaoExchange = useCallback(
    async (code: string) => {
      if (!kakaoClientId) {
        Alert.alert('설정 오류', '카카오 REST API 키(EXPO_PUBLIC_KAKAO_REST_API_KEY)를 확인해 주세요.');
        return;
      }
      setIsLoading(true);
      try {
        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', kakaoClientId);
        body.set('redirect_uri', redirectUri);
        body.set('code', code);
        const secret = process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET;
        if (secret) body.set('client_secret', secret);

        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
          body: body.toString(),
        });
        const tokenData = (await tokenResponse.json()) as {
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        if (!tokenResponse.ok || !tokenData.access_token) {
          throw new Error(tokenData.error_description || tokenData.error || '토큰 교환 실패');
        }

        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const kakaoUser = await userResponse.json();

        const profile = await signInWithKakao(kakaoUser);
        setUser(profile, { persist: rememberMe });
        router.replace('/(main)');
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '카카오 연동 중 문제가 발생했습니다.';
        if (__DEV__) console.warn('[Kakao]', error);
        Alert.alert('로그인 오류', msg);
      } finally {
        setIsLoading(false);
      }
    },
    [kakaoClientId, redirectUri, router, setUser, rememberMe]
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const code = response.params.code;
      if (code) void handleKakaoExchange(code);
    } else if (response?.type === 'error') {
      Alert.alert('카카오 로그인', response.error?.message ?? '인증에 실패했습니다.');
    }
  }, [response, handleKakaoExchange]);

  const handleKakaoLogin = async () => {
    if (!request || !kakaoClientId) return;
    try {
      /** Android는 openBrowserAsync+Linking만 쓰면 auth.expo.io 완료 전에 앱으로 안 넘어가 “Something went wrong”만 보일 수 있음 → promptAsync(openAuthSession)로 통일 */
      await promptAsync({
        preferEphemeralSession: false,
        showInRecents: true,
      });
    } catch (e: unknown) {
      if (__DEV__) console.warn('[Kakao] promptAsync', e);
      Alert.alert('카카오 로그인', e instanceof Error ? e.message : '인증을 시작할 수 없습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!web) {
      Alert.alert('설정 오류', 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID가 필요합니다.');
      return;
    }
    if (isExpoGo) {
      Alert.alert(
        'Expo Go 제한',
        'Google 로그인은 네이티브 모듈(@react-native-google-signin)이 필요합니다.\n\nExpo Go에서는 사용할 수 없습니다.\n→ 카카오 또는 게스트로 테스트하거나,\n→ `npm run android`로 만든 개발 빌드에서 이용하세요.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const { GoogleSignin, statusCodes } =
        require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: web,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type !== 'success') {
        return;
      }
      let idToken = result.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) throw new Error('Google ID 토큰을 받지 못했습니다.');

      const profile = await signInWithGoogle(idToken);
      setUser(profile, { persist: rememberMe });
      router.replace('/(main)');
    } catch (error: unknown) {
      let isCancelled = false;
      try {
        const { statusCodes } =
          require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
        isCancelled =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === statusCodes.SIGN_IN_CANCELLED;
      } catch {
        /* 모듈 없음 */
      }
      if (isCancelled) {
        return;
      }
      if (__DEV__) console.warn('[Google]', error);
      Alert.alert('로그인 오류', 'Google 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력하세요.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('입력 오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }
    setIsLoading(true);
    try {
      const profile = await signInWithEmailPassword(trimmed, password);
      setUser(profile, { persist: rememberMe });
      router.replace('/(main)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '로그인에 실패했습니다.';
      Alert.alert('로그인 오류', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setUser(
        {
          id: 'guest-' + Date.now(),
          email: 'guest@baroer.local',
          nickname: '게스트',
          userType: 'GENERAL',
          isAdmin: false,
          createdAt: new Date().toISOString(),
        },
        { persist: rememberMe }
      );
      router.replace('/(main)');
    } finally {
      setIsLoading(false);
    }
  };

  const kakaoDisabled = isLoading || !request || !kakaoClientId;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>🏥 바로응급실</Text>
          <Text style={styles.subtitle}>긴급할 때, 바로 찾는{'\n'}가장 가까운 응급실</Text>
        </View>

        {/* S-002 이메일 로그인 */}
        <View style={styles.formBlock}>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>자동 로그인 유지</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ true: Colors.primary, false: '#D1D5DB' }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={() => void handleEmailLogin()}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>로그인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>또는</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[styles.loginBtn, styles.kakaoBtn, kakaoDisabled && styles.btnDisabled]}
            onPress={() => void handleKakaoLogin()}
            disabled={kakaoDisabled}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#191600" />
            <Text style={styles.kakaoBtnText}>카카오 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, styles.googleBtn, (isLoading || isExpoGo) && styles.btnDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading || isExpoGo}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={20} color={isExpoGo ? '#9CA3AF' : '#1F2937'} />
            <Text style={[styles.googleBtnText, isExpoGo && styles.googleBtnTextMuted]}>
              구글 로그인{isExpoGo ? ' (개발 빌드 전용)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin} disabled={isLoading}>
            <Text style={styles.guestBtnText}>로그인 없이 시작</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
          <Text style={styles.linkSep}>|</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                '비밀번호 찾기',
                '비밀번호 재설정 링크는 Firebase Authentication 설정에 따라 제공됩니다. (추후 이메일 발송 연동)'
              )
            }
          >
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        {appConfig.showAuthDebugHints && (
          <View style={styles.hint}>
            <Text style={styles.hintTextSmall}>
              JS 번들·연동 판별: 20260418-b (개발 빌드=baroer 네이티브 리다이렉트 / Expo Go=auth.expo.io)
            </Text>
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
              <Text style={styles.hintText}>
                개발 빌드(직접 설치한 APK): 아래 Redirect URI를 카카오 콘솔에 넣으세요. Expo Go: 보통
                `https://auth.expo.io/@…/BaroER` 형태입니다. 아래에 보이는 값과 한 글자도 다르면 로그인 실패합니다.
              </Text>
            </View>
            <Text style={styles.redirectMono} selectable>
              {redirectUri}
            </Text>
            <Text style={styles.hintTextSmall}>
              변경 사항이 반영 안 되면 Metro가 예전 번들을 쓰는 겁니다. 터미널에서 `npx expo start --clear` 후 앱에서 Reload 하거나, 끊겼다면
              `npx expo run:android`로 다시 설치하세요. (카카오만 바꾼 경우에도 JS는 Metro가 새로 받아야 합니다.)
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>계속하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.</Text>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 28, flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 20 },
  formBlock: { gap: 12, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 12 },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rememberLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  linkText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  linkSep: { color: '#D1D5DB', fontSize: 14 },
  logo: { width: 96, height: 96, marginBottom: 20 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  hint: {
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  hintRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  hintText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
  hintTextSmall: { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  redirectMono: {
    marginTop: 8,
    fontSize: 11,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#EEF2F7',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loginSection: { width: '100%' },
  loginBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  btnDisabled: { opacity: 0.55 },
  kakaoBtn: { backgroundColor: '#FEE500' },
  kakaoBtnText: { color: '#191600', fontSize: 16, fontWeight: '700' },
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  googleBtnText: { color: '#1F2937', fontSize: 16, fontWeight: '700' },
  googleBtnTextMuted: { color: '#9CA3AF', fontSize: 14 },
  guestBtn: { paddingVertical: 14, alignItems: 'center' },
  guestBtnText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250,250,250,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { marginTop: 'auto' },
  footerText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },
});
