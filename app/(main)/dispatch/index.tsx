// 업무 기록 목록 (S-008) — 구급대원 전용
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import NavigationHeader from '@/components/common/NavigationHeader';

type LogStatus = 'IN_PROGRESS' | 'COMPLETED';

const MOCK_LOGS = [
  {
    id: '1',
    code: '#2026-0416-001',
    date: '2026-04-16 14:00',
    symptoms: '흉통, 호흡곤란',
    hospital: 'A응급의료센터',
    status: 'COMPLETED' as LogStatus,
    duration: 35,
  },
  {
    id: '2',
    code: '#2026-0415-003',
    date: '2026-04-15 22:30',
    symptoms: '외상',
    hospital: 'D의료원',
    status: 'COMPLETED' as LogStatus,
    duration: 28,
  },
  {
    id: '3',
    code: '#2026-0417-002',
    date: '2026-04-17 09:10',
    symptoms: '복통',
    hospital: 'B대학병원',
    status: 'IN_PROGRESS' as LogStatus,
    duration: 0,
  },
];

export default function DispatchListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isParamedic = user?.userType === 'PARAMEDIC';
  const [tab, setTab] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let list = MOCK_LOGS.filter((l) => (tab === 'IN_PROGRESS' ? l.status === 'IN_PROGRESS' : l.status === 'COMPLETED'));
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (l) =>
          l.code.toLowerCase().includes(s) ||
          l.hospital.toLowerCase().includes(s) ||
          l.symptoms.toLowerCase().includes(s)
      );
    }
    return list;
  }, [tab, q]);

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
    <View style={styles.wrap}>
      <NavigationHeader title="업무 기록 관리" />
      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'IN_PROGRESS' && styles.tabActive]}
            onPress={() => setTab('IN_PROGRESS')}
          >
            <Text style={[styles.tabText, tab === 'IN_PROGRESS' && styles.tabTextActive]}>진행중</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'COMPLETED' && styles.tabActive]}
            onPress={() => setTab('COMPLETED')}
          >
            <Text style={[styles.tabText, tab === 'COMPLETED' && styles.tabTextActive]}>완료</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor={Colors.textLight}
            value={q}
            onChangeText={setQ}
          />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {filtered.map((log) => (
          <TouchableOpacity
            key={log.id}
            style={styles.card}
            onPress={() => router.push(`/(main)/dispatch/${log.id}` as Href)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardCode}>출동 {log.code}</Text>
            <Text style={styles.cardInfo}>📅 {log.date}</Text>
            <Text style={styles.cardInfo}>증상: {log.symptoms}</Text>
            <Text style={styles.cardInfo}>병원: {log.hospital}</Text>
            <Text style={styles.cardFooter}>
              {log.status === 'COMPLETED' ? `⏱️ ${log.duration}분 | ✅ 완료` : '⏳ 진행 중'}
            </Text>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 ? (
          <Text style={styles.noData}>기록이 없습니다.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.backgroundGray },
  toolbar: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    gap: 12,
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F3F5',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text },
  container: { flex: 1 },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCode: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  cardInfo: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
  cardFooter: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: '700', marginTop: 10 },
  noData: { textAlign: 'center', marginTop: 40, color: Colors.textLight, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundGray },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
