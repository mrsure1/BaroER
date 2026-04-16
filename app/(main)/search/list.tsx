// 응급실 리스트 모드 검색 결과 (S-007) — Phase 3: 실데이터 연동
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useSearchStore } from '@/src/stores/searchStore';
import { Hospital, HospitalStatus } from '@/src/types';
import { openNavigation } from '@/src/services/navigation';
// RADIUS_OPTIONS 제거 (슬라이더로 대체)
import Svg, { Circle } from 'react-native-svg';
import { getKTASMessage } from '@/src/services/triage';

// 수용 상태 설정
const STATUS_CONFIG: Record<HospitalStatus, { color: string; label: string; badgeBg: string }> = {
  AVAILABLE: { color: Colors.available, label: '수용가능', badgeBg: Colors.badgeGreen },
  BUSY: { color: Colors.busy, label: '혼잡', badgeBg: Colors.badgeOrange },
  FULL: { color: Colors.full, label: '수용불가', badgeBg: Colors.badgeRed },
};

export default function HospitalListScreen() {
  const router = useRouter();
  const {
    hospitals, isSearching, searchError, searchRadius, setSearchRadius,
    searchHospitals, autoCallEnabled, setAutoCallEnabled,
    severityScore, // 중증도 점수 가져오기
  } = useSearchStore();

  // 원형 차트 컴포넌트
  const RadialChart = ({ percent, color }: { percent: number; color: string }) => {
    const radius = 22;
    const stroke = 5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <View style={styles.radialWrapper}>
        <Svg height={radius * 2} width={radius * 2}>
          <Circle
            stroke={Colors.border}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            opacity={0.3}
          />
          <Circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </Svg>
        <View style={styles.radialLabel}>
          <Text style={[styles.radialText, { color }]}>{percent}%</Text>
        </View>
      </View>
    );
  };

  // 전화 걸기
  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() =>
        Alert.alert('오류', '전화를 걸 수 없습니다.')
      );
    }
  };

  // 길안내 (웹에서는 카카오맵 웹으로 연결)
  const handleNavigation = (hospital: Hospital) => {
    openNavigation('kakao', hospital.name, hospital.lat, hospital.lng);
  };

  // 반경 변경 시 재검색
  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
    searchHospitals();
  };

  return (
    <ScrollView style={styles.container}>
      {/* 검색 컨트롤 */}
      <View style={styles.controls}>
        {hospitals?.length > 0 && (
          <>
            <Text style={styles.sliderLabel}>🔍 검색 반경: <Text style={styles.sliderValue}>{searchRadius}km</Text></Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLimit}>5km</Text>
              <View 
                style={styles.sliderTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderMove={(e) => {
                  const { locationX } = e.nativeEvent;
                  const width = 200; // 대략적인 트랙 너비 (실제로는 onLayout으로 측정하면 좋음)
                  // 여기서는 5~100 사이의 값을 계산
                  const newRadius = Math.round((locationX / width) * 95 + 5);
                  const clamped = Math.max(5, Math.min(100, Math.round(newRadius / 5) * 5));
                  if (clamped !== searchRadius) {
                    setSearchRadius(clamped);
                  }
                }}
                onResponderRelease={() => {
                  searchHospitals();
                }}
              >
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${((searchRadius - 5) / 95) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.sliderThumb,
                    { left: `${((searchRadius - 5) / 95) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.sliderLimit}>100km</Text>
            </View>
          </>
        )}
        
        {/* 모드 전환 */}
        <View style={[styles.modeToggle, { marginTop: 16 }]}>
          <TouchableOpacity style={styles.modeTab} onPress={() => router.replace('/(main)/search/map')}>
            <Text style={styles.modeTabText}>🗺️ 지도</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, styles.modeTabActive]}>
            <Text style={[styles.modeTabText, styles.modeTabTextActive]}>📋 리스트</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 자동전화 토글 */}
      <TouchableOpacity
        style={[styles.autoCallBar, autoCallEnabled && styles.autoCallBarActive]}
        onPress={() => setAutoCallEnabled(!autoCallEnabled)}
      >
        <Text style={styles.autoCallText}>
          {autoCallEnabled ? '📞 자동전화 확인 ON' : '자동전화 확인'}
        </Text>
        <View style={[styles.toggle, autoCallEnabled && styles.toggleOn]}>
          <View style={[styles.toggleThumb, autoCallEnabled && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      {/* 로딩 */}
      {isSearching && (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>응급실 정보를 검색하고 있습니다...</Text>
        </View>
      )}

      {/* 에러 */}
      {searchError && (
        <View style={styles.errorArea}>
          <Text style={styles.errorText}>⚠️ {searchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={searchHospitals}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 중증도 가이드 (KTAS) */}
      {!isSearching && severityScore && (
        <View style={styles.triageBanner}>
          <View style={[styles.triageBadge, { backgroundColor: severityScore <= 2 ? Colors.full : Colors.available }]}>
            <Text style={styles.triageBadgeText}>KTAS Level {severityScore}</Text>
          </View>
          <Text style={styles.triageMsg}>{getKTASMessage(severityScore)}</Text>
        </View>
      )}

      {/* 결과 수 */}
      {!isSearching && hospitals?.length > 0 && (
        <Text style={styles.resultCount}>
          🚑 주변 응급실 {hospitals.length}곳이 발견되었습니다.
        </Text>
      )}

      {/* 빈 결과 */}
      {!isSearching && !searchError && hospitals?.length === 0 && (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyEmoji}>🏥</Text>
          <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubtext}>주변에 가용한 응급실이 없거나{"\n"}검색 반경이 너무 좁을 수 있습니다.</Text>
          
          <View style={[styles.controls, { width: '100%', marginTop: 20 }]}>
            <Text style={styles.sliderLabel}>🔍 반경 넓혀보기: <Text style={styles.sliderValue}>{searchRadius}km</Text></Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLimit}>5km</Text>
              <View 
                style={styles.sliderTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderMove={(e) => {
                  const { locationX } = e.nativeEvent;
                  // 빈 화면에서는 너비가 다를 수 있으므로 대략 240으로 계산
                  const newRadius = Math.round((locationX / 240) * 95 + 5);
                  const clamped = Math.max(5, Math.min(100, Math.round(newRadius / 5) * 5));
                  if (clamped !== searchRadius) setSearchRadius(clamped);
                }}
                onResponderRelease={() => searchHospitals()}
              >
                <View style={[styles.sliderFill, { width: `${((searchRadius - 5) / 95) * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${((searchRadius - 5) / 95) * 100}%` }]} />
              </View>
              <Text style={styles.sliderLimit}>100km</Text>
            </View>
          </View>
        </View>
      )}

      {/* 병원 카드 목록 */}
      {hospitals?.map((hospital) => {
        const config = STATUS_CONFIG[hospital.status];
        const isFull = hospital.status === 'FULL';
        const occupancyRate = Math.round((hospital.availableBeds / Math.max(hospital.totalBeds, 1)) * 100);

        // 상태별 배경색 설정 (USER 요청 반영)
        const getBgColor = () => {
          if (hospital.status === 'AVAILABLE') return '#F0FDF4'; // 연한 초록
          if (hospital.status === 'BUSY') return '#FFFBEB';      // 연한 노랑
          return '#FEF2F2';                                      // 연한 빨강
        };

        return (
          <TouchableOpacity 
            key={hospital.id} 
            style={[styles.glassCard, { backgroundColor: getBgColor() }, isFull && { opacity: 0.8 }]}
            activeOpacity={0.8}
          >
            <View style={styles.cardMain}>
              {/* 왼쪽: 원형 그래프 */}
              <RadialChart percent={occupancyRate} color={config.color} />
              
              {/* 중간: 서술 정보 */}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.hospitalName} numberOfLines={1}>{hospital.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.distanceText}>{hospital.distanceKm ?? '?'}km</Text>
                  <View style={styles.dot} />
                  <Text style={styles.etaText}>{hospital.etaMin ?? '?'}분 소요</Text>
                </View>
                <Text style={styles.updateText}>업데이트: {hospital.lastUpdated.split(' ')[1] || '최근'}</Text>
              </View>

              {/* 오른쪽: 상태 배지 */}
              <View style={[styles.statusBadge, { backgroundColor: config.badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>

            {/* 하단 액션바 */}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleCall(hospital.phone)}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>전화하기</Text>
              </TouchableOpacity>
              <View style={styles.vDivider} />
              <TouchableOpacity style={styles.actionItem} onPress={() => handleNavigation(hospital)}>
                <Text style={styles.actionIcon}>🧭</Text>
                <Text style={styles.actionText}>길 안내</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  controls: {
    padding: Spacing.lg, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  radiusBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: '#eee',
  },
  radiusBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F2' },
  radiusBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  radiusBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F1F3F5', borderRadius: 12, padding: 4 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  modeTabText: { fontSize: FontSize.sm, fontWeight: '600', color: '#868E96' },
  modeTabTextActive: { color: Colors.primary },
  // 슬라이더 스타일 (지도와 공용화 고려)
  sliderLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 12 },
  sliderValue: { color: Colors.primary, fontSize: 16 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLimit: { fontSize: 11, color: '#999', fontWeight: '600' },
  sliderTrack: { flex: 1, height: 6, backgroundColor: '#E9ECEF', borderRadius: 3, position: 'relative' },
  sliderFill: { position: 'absolute', height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  sliderThumb: { 
    position: 'absolute', width: 20, height: 20, borderRadius: 10, 
    backgroundColor: '#fff', borderWidth: 3, borderColor: Colors.primary,
    top: -7, marginLeft: -10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
  },
  // 자동전화
  autoCallBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, paddingHorizontal: Spacing.lg,
    backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FEF3C7',
  },
  autoCallBarActive: { backgroundColor: '#F0FDF4', borderBottomColor: '#DCFCE7' },
  autoCallText: { fontSize: FontSize.sm, fontWeight: '600', color: '#451A03' },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB',
    justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: Colors.available },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  // 중증도 배너
  triageBanner: {
    margin: Spacing.lg, padding: 16, backgroundColor: '#fff',
    borderRadius: BorderRadius.lg, borderLeftWidth: 5, borderLeftColor: Colors.primary,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
  },
  triageBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  triageBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  triageMsg: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600', lineHeight: 22 },
  // 카드 (Glassmorphism 컨셉 + 상태별 색상 반영)
  glassCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderRadius: BorderRadius.xl, 
    borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  radialWrapper: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  radialLabel: { position: 'absolute', width: '100%', alignItems: 'center' },
  radialText: { fontSize: 11, fontWeight: '800' },
  cardBody: { flex: 1, marginLeft: 16 },
  hospitalName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  etaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ADB5BD', marginHorizontal: 8 },
  updateText: { fontSize: 11, color: '#ADB5BD', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  // 카드 액션
  cardActions: { 
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F3F5',
    backgroundColor: 'rgba(248, 249, 250, 0.5)',
  },
  actionItem: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { marginRight: 6, fontSize: 14 },
  actionText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  vDivider: { width: 1, backgroundColor: '#F1F3F5' },
  // 기타
  loadingArea: { alignItems: 'center', paddingVertical: 80 },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 12, fontWeight: '600' },
  resultCount: { paddingHorizontal: Spacing.xl, paddingTop: 8, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  errorArea: { alignItems: 'center', paddingVertical: 40 },
  errorText: { fontSize: FontSize.md, color: Colors.full, marginBottom: 16 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  emptyArea: { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
});
