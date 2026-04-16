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
import { loginWithEmail } from '@/src/services/auth';

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

  // 소셜 로그인 (목업 버전)
  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      `${provider} 로그인`,
      `현재 ${provider} 로그인은 UI 확인용 데모 모드입니다. 테스트 계정으로 로그인하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '테스트 계정 로그인', 
          onPress: () => {
            setUser({
              id: `test-${provider}`,
              email: `test@${provider.toLowerCase()}.com`,
              nickname: `테스트_${provider}`,
              userType: 'GENERAL',
              createdAt: new Date().toISOString(),
            });
          } 
        }
      ]
    );
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
