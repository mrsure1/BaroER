// 업무 기록 상세 / 다운로드 (S-009)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import NavigationHeader from '@/components/common/NavigationHeader';

export default function DispatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.wrap}>
      <NavigationHeader title="기록 상세" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>출동 #2026-0416-001</Text>
        <Text style={styles.meta}>기록 ID: {id}</Text>

        <Text style={styles.section}>─── 환자 정보 ───</Text>
        <Text style={styles.line}>증상: 흉통, 호흡곤란</Text>
        <Text style={styles.line}>성별/연령: 남성 / 60대</Text>
        <Text style={styles.line}>의식상태: 혼미</Text>
        <Text style={styles.line}>중증도: 3등급</Text>

        <Text style={styles.section}>─── 수용 병원 ───</Text>
        <Text style={styles.line}>🏥 A응급의료센터</Text>
        <Text style={styles.line}>📍 서울시 강남구 테헤란로 일대</Text>
        <Text style={styles.line}>📞 02-1234-5678</Text>

        <Text style={styles.section}>─── 시간 기록 ───</Text>
        <Text style={styles.line}>출동 시작 : 14:00</Text>
        <Text style={styles.line}>환자 접촉 : 14:05</Text>
        <Text style={styles.line}>병원 출발 : 14:15</Text>
        <Text style={styles.line}>병원 도착 : 14:32</Text>
        <Text style={styles.line}>상황 종료 : 14:35</Text>
        <Text style={styles.line}>총 소요시간: 35분</Text>

        <Text style={styles.section}>─── 메모 ───</Text>
        <Text style={styles.line}>환자 안정 후 이송 완료</Text>

        <View style={styles.downloadRow}>
          <TouchableOpacity
            style={styles.dlBtn}
            onPress={() => Alert.alert('PDF', 'PDF 다운로드는 Phase 5에서 연동됩니다.')}
          >
            <Text style={styles.dlBtnText}>📄 PDF 다운로드</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dlBtn}
            onPress={() => Alert.alert('Excel', 'Excel 다운로드는 Phase 5에서 연동됩니다.')}
          >
            <Text style={styles.dlBtnText}>📊 Excel 다운로드</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.backgroundGray },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  meta: { fontSize: FontSize.xs, color: Colors.textLight, marginBottom: Spacing.lg },
  section: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  line: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24, marginBottom: 4 },
  downloadRow: { flexDirection: 'row', gap: 12, marginTop: Spacing.xl },
  dlBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  dlBtnText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary },
});
