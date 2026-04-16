// 메인 대시보드 화면 (S-004)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isParamedic = user?.userType === 'PARAMEDIC';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="medkit-sharp" size={24} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.brandTitle}>바로응급실</Text>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity onPress={() => router.push('/(main)/settings')}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
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
        <View style={styles.ctaIconCircle}>
          <Ionicons name="flash-sharp" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.ctaTitle}>응급실 빠른 찾기</Text>
        <Text style={styles.ctaDesc}>현재 상태에 딱 맞는 응급실을{'\n'}AI가 실시간으로 분석하여 찾아줍니다.</Text>
      </TouchableOpacity>

      {/* 퀵 액션 */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard}>
          <Ionicons name="call-outline" size={28} color={Colors.full} style={{ marginBottom: 8 }} />
          <Text style={styles.quickLabel}>119 긴급전화</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(main)/search/list')}>
          <Ionicons name="document-text-outline" size={28} color={Colors.secondary} style={{ marginBottom: 8 }} />
          <Text style={styles.quickLabel}>최근 검색기록</Text>
        </TouchableOpacity>
      </View>

      {/* 구급대원 전용 영역 */}
      {isParamedic && (
        <TouchableOpacity
          style={styles.paramedicCard}
          onPress={() => router.push('/(main)/dispatch')}
        >
          <View style={styles.paramedicHeader}>
            <Text style={styles.paramedicBadge}>구급대원 전용</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pencil-sharp" size={20} color={Colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.paramedicTitle}>업무 기록 관리</Text>
          </View>
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
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: '#F1F3F5',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  topBarIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { fontSize: 22 },
  greeting: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  greetingText: { fontSize: FontSize.lg, color: Colors.text, fontWeight: '700' },
  greetingName: { color: Colors.primary },
  // 메인 CTA
  ctaCard: {
    marginHorizontal: Spacing.lg, padding: Spacing.xl,
    backgroundColor: Colors.primary, borderRadius: 28,
    alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  ctaIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  ctaDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  // 퀵 액션
  quickRow: { flexDirection: 'row', gap: 12, margin: Spacing.lg },
  quickCard: {
    flex: 1, paddingVertical: 24, paddingHorizontal: 12, 
    backgroundColor: Colors.background, borderRadius: 20,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#F1F3F5',
  },
  quickLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  // 구급대원 전용
  paramedicCard: {
    marginHorizontal: Spacing.lg, padding: 20, backgroundColor: '#fff',
    borderRadius: 20, borderLeftWidth: 6, borderLeftColor: Colors.secondary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  paramedicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  paramedicBadge: { fontSize: 11, color: Colors.secondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  paramedicTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  paramedicDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
