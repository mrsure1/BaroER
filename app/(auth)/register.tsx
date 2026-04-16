// 회원가입 화면 (S-003)
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
import { UserType } from '@/src/types';
import { registerWithEmail } from '@/src/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState<UserType>('GENERAL');
  const [orgCode, setOrgCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 회원가입 처리
  const handleRegister = async () => {
    // 이메일 정규식 유효성 검사 (RSL/Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('입력 오류', '유효한 이메일 형식이 아닙니다. (예: abc@google.com)');
      return;
    }

    if (!email.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력하세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    // 구급대원 소속기관 코드는 선택 사항으로 변경 (USER 요청)

    setIsLoading(true);
    try {
      // Firebase + Firestore 회원가입
      const userProfile = await registerWithEmail(
        email.trim(),
        password,
        nickname.trim(),
        userType,
        userType === 'PARAMEDIC' ? orgCode.trim() : undefined
      );
      // 가입 성공 시 자동 로그인 처리
      setUser(userProfile);
    } catch (error: any) {
      const errorMsg = error.message.includes('operation-not-allowed') 
        ? `${error.message}\n\n💡 Firebase 콘솔의 Authentication 메뉴에서 '이메일/비밀번호' 로그인을 활성화해주세요.`
        : error.message;
      
      Alert.alert('회원가입 실패', errorMsg);
    } finally {
      setIsLoading(false);
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
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>회원가입</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          <InputField label="📧 이메일" placeholder="이메일 주소" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField label="🔒 비밀번호" placeholder="8자 이상 입력" value={password} onChangeText={setPassword} secureTextEntry />
          <InputField label="🔒 비밀번호 확인" placeholder="비밀번호 재입력" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />
          <InputField label="👤 닉네임" placeholder="닉네임 (2~20자)" value={nickname} onChangeText={setNickname} />

          {/* 사용자 유형 선택 */}
          <Text style={styles.sectionLabel}>사용자 유형</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, userType === 'GENERAL' && styles.typeBtnActive]}
              onPress={() => setUserType('GENERAL')}
            >
              <Text style={[styles.typeBtnText, userType === 'GENERAL' && styles.typeBtnTextActive]}>
                👤 일반 사용자
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, userType === 'PARAMEDIC' && styles.typeBtnActive]}
              onPress={() => setUserType('PARAMEDIC')}
            >
              <Text style={[styles.typeBtnText, userType === 'PARAMEDIC' && styles.typeBtnTextActive]}>
                🚑 구급대원
              </Text>
            </TouchableOpacity>
          </View>

          {/* 구급대원 소속기관 코드 (사용자 유형이 '구급대원'일 때만 표시) */}
          {userType === 'PARAMEDIC' && (
            <InputField
              label="🏢 소속기관 코드 (선택)"
              placeholder="사설/기타인 경우 공란 가능"
              value={orgCode}
              onChangeText={setOrgCode}
            />
          )}

          {/* 가입 버튼 */}
          <TouchableOpacity 
            style={[styles.btnPrimary, isLoading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.btnPrimaryText}>{isLoading ? '처리 중...' : '회원가입 완료'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 재사용 입력 필드 컴포넌트
function InputField({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, editable = true,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; editable?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && { backgroundColor: '#eee' }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.xl,
    paddingTop: 50, backgroundColor: Colors.primary,
  },
  backBtn: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  form: { padding: Spacing.xxl },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 14, fontSize: FontSize.md, color: Colors.text,
  },
  sectionLabel: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    fontWeight: '500', marginBottom: 8, marginTop: 4,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  typeBtn: {
    flex: 1, padding: 14, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center',
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F5' },
  typeBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.primary },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: 16, alignItems: 'center', marginTop: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
