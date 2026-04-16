// 업무 기록 목록 (구급대원 전용)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';

// MVP: 목업 데이터 (Phase 5에서 Firestore 연동)
const MOCK_LOGS = [
  { id: '1', code: '#2026-0416-001', date: '2026-04-16 14:00', hospital: 'A응급의료센터', status: 'COMPLETED' as const, duration: 35 },
  { id: '2', code: '#2026-0415-003', date: '2026-04-15 08:23', hospital: 'B대학병원', status: 'COMPLETED' as const, duration: 42 },
];

export default function DispatchListScreen() {
  const { user } = useAuthStore();
  const isParamedic = user?.userType === 'PARAMEDIC';

  if (!isParamedic) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔒</Text>
        <Text style={styles.emptyText}>구급대원 전용 기능입니다</Text>
        <Text style={styles.emptySubtext}>설정에서 사용자 유형을{'\n'}구급대원으로 변경하세요</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 업무 기록</Text>
      </View>
      {MOCK_LOGS.map((log) => (
        <TouchableOpacity key={log.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardCode}>{log.code}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✅ 완료</Text>
            </View>
          </View>
           <Text style={styles.cardInfo}>🏥 {log.hospital}</Text>
          <Text style={styles.cardInfo}>📅 {log.date}</Text>
          <Text style={styles.cardInfo}>⏱️ 소요시간: {log.duration}분</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  header: { paddingTop: 50, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: Colors.primary },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardCode: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  statusBadge: { backgroundColor: Colors.badgeGreen, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  cardInfo: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundGray },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
