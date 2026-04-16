// 로그인 화면 (S-002)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { loginWithEmail, signInWithGoogle, signInWithKakao } from '@/src/services/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true); // 자동 로그인 상태 추가

  // 로그인 처리
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const userProfile = await loginWithEmail(email.trim(), password);
      setUser(userProfile);
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUri = AuthSession.makeRedirectUri();

  // 디버깅을 위한 로그 추가 (콘솔 설정 시 필요)
  React.useEffect(() => {
    console.log('--- Social Auth Debug Info ---');
    console.log('Redirect URI:', redirectUri);
    console.log('------------------------------');
  }, []);

  // 구글 로그인 설정
  const [googleRequest, googleResponse, promptAsyncGoogle] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    redirectUri, // Redirect URI 명시
  });

  // 카카오 로그인 설정 (useAuthRequest 방식으로 변경)
  const [kakaoRequest, kakaoResponse, promptAsyncKakao] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!,
      redirectUri,
    },
    { authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize' }
  );

  // 구글 응답 처리
  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleSignIn(id_token);
    } else if (googleResponse?.type === 'error') {
      console.error('구글 로그인 상세 에러:', googleResponse.error);
    }
  }, [googleResponse]);

  // 카카오 응답 처리
  React.useEffect(() => {
    if (kakaoResponse?.type === 'success') {
      const { code } = kakaoResponse.params;
      handleKakaoExchange(code);
    } else if (kakaoResponse?.type === 'error') {
      console.error('카카오 로그인 상세 에러:', kakaoResponse.error);
    }
  }, [kakaoResponse]);

  const handleGoogleSignIn = async (idToken: string) => {
    setIsLoading(true);
    try {
      const userProfile = await signInWithGoogle(idToken);
      setUser(userProfile);
    } catch (error: any) {
      Alert.alert('구글 로그인 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오 토큰 교환 및 프로필 처리
  const handleKakaoExchange = async (code: string) => {
    setIsLoading(true);
    try {
      // 1. 토큰 교환
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=authorization_code&client_id=${process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&code=${code}`,
      });
      const tokenData = await tokenResponse.json();

      if (tokenData.error) throw new Error(tokenData.error_description);

      // 2. 사용자 정보 가져오기
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userResponse.json();

      // 3. 서비스 로그인 처리 (Firebase Auth 통합)
      const userProfile = await signInWithKakao(userData);
      setUser(userProfile);
    } catch (error: any) {
      Alert.alert('카카오 로그인 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 진입점
  const handleSocialLogin = (provider: string) => {
    if (provider === '구글') {
      if (googleRequest) {
        promptAsyncGoogle();
      } else {
        Alert.alert('오류', '구글 로그인을 초기화할 수 없습니다. 설정을 확인해 주세요.');
      }
    } else if (provider === '카카오') {
      if (kakaoRequest) {
        promptAsyncKakao();
      } else {
        Alert.alert('오류', '카카오 로그인을 초기화할 수 없습니다.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 로고 */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🏥</Text>
          <Text style={styles.logoText}>바로응급실</Text>
        </View>

        {/* 입력 필드 */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* 자동 로그인 체크 */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAutoLogin(!autoLogin)}
          >
            <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
              {autoLogin && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>자동 로그인 유지</Text>
          </TouchableOpacity>

          {/* 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.btnPrimary, isLoading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.btnPrimaryText}>{isLoading ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={[styles.btnSocial, { backgroundColor: '#FEE500' }]}
              onPress={() => handleSocialLogin('카카오')}
            >
              <Text style={[styles.btnSocialText, { color: '#3B1E1E' }]}>🟡 카카오</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.btnSocial}
              onPress={() => handleSocialLogin('구글')}
            >
              <Text style={styles.btnSocialText}>🔵 구글</Text>
            </TouchableOpacity>
          </View>

          {/* 하단 링크 */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.linkPrimary}>회원가입</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity>
              <Text style={styles.linkSecondary}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: Spacing.xxl },
  logoArea: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logoEmoji: { fontSize: 60 },
  logoText: { fontSize: FontSize.title, fontWeight: '900', color: Colors.primary, marginTop: 8 },
  form: {},
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: FontSize.sm, color: Colors.textLight },
  socialRow: { flexDirection: 'row', gap: 10 },
  btnSocial: {
    flex: 1, padding: 13, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', backgroundColor: '#fff',
  },
  btnSocialText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  bottomLinks: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: Spacing.xxl,
  },
  linkPrimary: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '500' },
  linkDivider: { marginHorizontal: 12, color: Colors.border },
  linkSecondary: { fontSize: FontSize.md, color: Colors.textSecondary },
});
