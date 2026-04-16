// 메인 대시보드 화면 (S-004)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isParamedic = user?.userType === 'PARAMEDIC';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>🏥 바로응급실</Text>
        <View style={styles.topBarIcons}>
          <TouchableOpacity onPress={() => router.push('/(main)/settings')}>
            <Text style={styles.iconBtn}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 인사말 */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          안녕하세요, <Text style={styles.greetingName}>{user?.nickname || '사용자'}</Text>님 👋
        </Text>
      </View>

      {/* 메인 CTA - 응급실 찾기 */}
      <TouchableOpacity
        style={styles.ctaCard}
        onPress={() => router.push('/(main)/search/input')}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaEmoji}>🚨</Text>
        <Text style={styles.ctaTitle}>응급실 찾기</Text>
        <Text style={styles.ctaDesc}>환자 상태를 입력하고{'\n'}가장 가까운 응급실을 즉시 찾아보세요</Text>
      </TouchableOpacity>

      {/* 퀵 액션 */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard}>
          <Text style={styles.quickEmoji}>📞</Text>
          <Text style={styles.quickLabel}>119 긴급전화</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard}>
          <Text style={styles.quickEmoji}>📋</Text>
          <Text style={styles.quickLabel}>최근 검색기록</Text>
        </TouchableOpacity>
      </View>

      {/* 구급대원 전용 영역 */}
      {isParamedic && (
        <TouchableOpacity
          style={styles.paramedicCard}
          onPress={() => router.push('/(main)/dispatch')}
        >
          <Text style={styles.paramedicBadge}>구급대원 전용</Text>
          <Text style={styles.paramedicTitle}>📝 업무 기록 관리</Text>
          <Text style={styles.paramedicDesc}>출동 기록 조회 및 문서 다운로드</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  content: { paddingBottom: 30 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 50, paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  brandTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  topBarIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { fontSize: 22 },
  greeting: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  greetingText: { fontSize: FontSize.lg, color: Colors.text, fontWeight: '600' },
  greetingName: { color: Colors.primary },
  // 메인 CTA
  ctaCard: {
    marginHorizontal: Spacing.lg, padding: Spacing.xxl,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  ctaEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  ctaTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', marginBottom: 6 },
  ctaDesc: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20 },
  // 퀵 액션
  quickRow: { flexDirection: 'row', gap: 10, margin: Spacing.lg },
  quickCard: {
    flex: 1, padding: Spacing.xl, backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: 4 },
  quickLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  // 구급대원 전용
  paramedicCard: {
    marginHorizontal: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg, borderLeftWidth: 4, borderLeftColor: Colors.secondary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  paramedicBadge: { fontSize: 11, color: Colors.secondary, fontWeight: '700', marginBottom: 4 },
  paramedicTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  paramedicDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
