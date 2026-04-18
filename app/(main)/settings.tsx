// 설정 화면 (S-010)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import NavigationHeader from '@/components/common/NavigationHeader';
import { useUiSettingsStore, DefaultNavApp } from '@/src/stores/uiSettingsStore';

const NAV_LABELS: Record<DefaultNavApp, string> = {
  kakao: '카카오내비',
  naver: '네이버 지도',
  tmap: 'T맵',
  google: '구글 지도',
};

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const {
    defaultSearchRadiusKm,
    defaultNavApp,
    autoCallDefault,
    pushEnabled,
    setDefaultSearchRadiusKm,
    setDefaultNavApp,
    setAutoCallDefault,
    setPushEnabled,
  } = useUiSettingsStore();

  const [radiusOpen, setRadiusOpen] = React.useState(false);
  const [naviOpen, setNaviOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleWithdraw = () => {
    Alert.alert(
      '회원탈퇴',
      '탈퇴 시 저장된 설정이 삭제될 수 있습니다. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <NavigationHeader title="설정" />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>─── 프로필 ───</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileIconCircle}>
              <Ionicons name="person" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>👤 {user?.nickname || '사용자'}</Text>
              <Text style={styles.profileSub}>📧 {user?.email}</Text>
              <Text style={styles.profileSub}>
                🏷️ {user?.userType === 'PARAMEDIC' ? '구급대원' : '일반 사용자'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => Alert.alert('프로필 수정', '추후 연동됩니다.')}>
            <Text style={styles.outlineBtnText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>─── 검색 설정 ───</Text>
        <TouchableOpacity style={styles.item} onPress={() => setRadiusOpen(true)}>
          <Text style={styles.itemLabel}>기본 검색 반경</Text>
          <Text style={styles.itemValue}>{defaultSearchRadiusKm}km ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => setNaviOpen(true)}>
          <Text style={styles.itemLabel}>기본 내비 앱</Text>
          <Text style={styles.itemValue}>{NAV_LABELS[defaultNavApp]} ▼</Text>
        </TouchableOpacity>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>자동전화 기본값</Text>
          <Switch
            value={autoCallDefault}
            onValueChange={setAutoCallDefault}
            trackColor={{ true: Colors.available, false: '#ccc' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionTitle}>─── 알림 ───</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>푸시 알림</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ true: Colors.available, false: '#ccc' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionTitle}>─── 기타 ───</Text>
        <TouchableOpacity style={styles.item} onPress={() => Alert.alert('개인정보', '추후 웹뷰로 연결됩니다.')}>
          <Text style={styles.itemLabel}>개인정보 처리방침</Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => Alert.alert('이용약관', '추후 웹뷰로 연결됩니다.')}>
          <Text style={styles.itemLabel}>서비스 이용약관</Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => Alert.alert('오픈소스', '의존성 라이선스는 패키지 문서를 참고하세요.')}>
          <Text style={styles.itemLabel}>오픈소스 라이선스</Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>앱 버전</Text>
          <Text style={styles.itemMuted}>1.0.0</Text>
        </View>

        <View style={styles.logoutArea}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
            <Text style={styles.withdrawBtnText}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={radiusOpen} transparent animationType="fade" onRequestClose={() => setRadiusOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRadiusOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>기본 검색 반경</Text>
            {([5, 10, 20] as const).map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.modalOpt, defaultSearchRadiusKm === km && styles.modalOptOn]}
                onPress={() => {
                  setDefaultSearchRadiusKm(km);
                  setRadiusOpen(false);
                }}
              >
                <Text style={[styles.modalOptText, defaultSearchRadiusKm === km && styles.modalOptTextOn]}>{km}km</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={naviOpen} transparent animationType="fade" onRequestClose={() => setNaviOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNaviOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>기본 내비 앱</Text>
            {(Object.keys(NAV_LABELS) as DefaultNavApp[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.modalOpt, defaultNavApp === key && styles.modalOptOn]}
                onPress={() => {
                  setDefaultNavApp(key);
                  setNaviOpen(false);
                }}
              >
                <Text style={[styles.modalOptText, defaultNavApp === key && styles.modalOptTextOn]}>{NAV_LABELS[key]}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundGray },
  container: { flex: 1 },
  sectionTitle: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  profileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileName: { fontSize: 17, fontWeight: '800', color: Colors.text },
  profileSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  outlineBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  outlineBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  itemLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  itemValue: { fontSize: 15, color: Colors.secondary, fontWeight: '700' },
  itemMuted: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  chev: { fontSize: 20, color: Colors.textLight, fontWeight: '700' },
  logoutArea: { padding: Spacing.xl, marginTop: Spacing.md, gap: 10 },
  logoutBtn: {
    backgroundColor: '#FFF1F0',
    borderRadius: BorderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  logoutBtnText: { color: Colors.full, fontSize: 16, fontWeight: '700' },
  withdrawBtn: { padding: 12, alignItems: 'center' },
  withdrawBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  modalOpt: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  modalOptOn: { backgroundColor: '#FFF1F0', borderWidth: 1, borderColor: Colors.primary },
  modalOptText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  modalOptTextOn: { color: Colors.primary, fontWeight: '800' },
});
