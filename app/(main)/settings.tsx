// 설정 화면 (S-010)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.headerTitleRow}>
          <Ionicons name="settings-sharp" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>설정</Text>
        </View>
      </View>

      {/* 프로필 */}
      <Text style={styles.sectionTitle}>프로필</Text>
      <View style={styles.item}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.profileIconCircle}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.itemLabel}>{user?.nickname || '사용자'}</Text>
            <Text style={styles.itemSub}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.itemLink}>수정</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.item}>
        <Text style={styles.itemLabel}>사용자 유형</Text>
        <View style={styles.valueRow}>
          <Ionicons 
            name={user?.userType === 'PARAMEDIC' ? 'medkit-sharp' : 'person-circle-outline'} 
            size={18} 
            color={user?.userType === 'PARAMEDIC' ? Colors.secondary : Colors.textSecondary} 
            style={{ marginRight: 6 }}
          />
          <Text style={styles.itemValue}>
            {user?.userType === 'PARAMEDIC' ? '구급대원' : '일반 사용자'}
          </Text>
        </View>
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
  header: {
    paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: '#F1F3F5',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  sectionTitle: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 10,
    fontSize: 12, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: '#F8F9FA',
  },
  profileIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F1F3F5', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  itemValue: { fontSize: 15, color: Colors.secondary, fontWeight: '600' },
  itemLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  logoutArea: { padding: Spacing.xl, marginTop: Spacing.lg },
  logoutBtn: {
    backgroundColor: '#FFF1F0', borderRadius: BorderRadius.md,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FFE4E1',
  },
  logoutBtnText: { color: Colors.full, fontSize: 16, fontWeight: '700' },
});
