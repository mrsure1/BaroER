// 설정 화면 (S-010)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [autoCallDefault, setAutoCallDefault] = React.useState(false);

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    // 인증 가드가 자동으로 로그인 화면으로 리디렉트
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ 설정</Text>
      </View>

      {/* 프로필 */}
      <Text style={styles.sectionTitle}>프로필</Text>
      <View style={styles.item}>
        <View>
          <Text style={styles.itemLabel}>👤 {user?.nickname || '사용자'}</Text>
          <Text style={styles.itemSub}>{user?.email}</Text>
        </View>
        <Text style={styles.itemLink}>수정 ›</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>사용자 유형</Text>
        <Text style={styles.itemValue}>
          {user?.userType === 'PARAMEDIC' ? '🚑 구급대원' : '👤 일반 사용자'}
        </Text>
      </View>

      {/* 검색 설정 */}
      <Text style={styles.sectionTitle}>검색 설정</Text>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>기본 검색 반경</Text>
        <Text style={styles.itemValue}>10km</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>자동전화 기본값</Text>
        <Switch
          value={autoCallDefault}
          onValueChange={setAutoCallDefault}
          trackColor={{ true: Colors.available, false: '#ccc' }}
          thumbColor="#fff"
        />
      </View>

      {/* 알림 */}
      <Text style={styles.sectionTitle}>알림</Text>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>푸시 알림</Text>
        <Switch
          value={pushEnabled}
          onValueChange={setPushEnabled}
          trackColor={{ true: Colors.available, false: '#ccc' }}
          thumbColor="#fff"
        />
      </View>

      {/* 기타 */}
      <Text style={styles.sectionTitle}>기타</Text>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemLabel}>개인정보 처리방침</Text>
        <Text style={styles.itemLink}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemLabel}>서비스 이용약관</Text>
        <Text style={styles.itemLink}>›</Text>
      </TouchableOpacity>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>앱 버전</Text>
        <Text style={styles.itemValue}>1.0.0</Text>
      </View>

      {/* 로그아웃 */}
      <View style={styles.logoutArea}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  header: { paddingTop: 50, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: Colors.primary },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.sm,
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  itemLabel: { fontSize: FontSize.md, color: Colors.text },
  itemSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  itemValue: { fontSize: FontSize.md, color: Colors.secondary, fontWeight: '600' },
  itemLink: { fontSize: FontSize.md, color: Colors.primary },
  logoutArea: { padding: Spacing.xl },
  logoutBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 13, alignItems: 'center',
  },
  logoutBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
