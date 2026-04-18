import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Linking,
  Modal,
  Switch,
  Pressable,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSearchStore } from '@/src/stores/searchStore';
import { Hospital, HospitalStatus } from '@/src/types';
import NavigationHeader from '@/components/common/NavigationHeader';
import HospitalDetailModal from '@/src/components/HospitalDetailModal';
import NaviSelectionModal from '@/src/components/NaviSelectionModal';
import { appConfig } from '@/src/config/appConfig';
import { useUiSettingsStore } from '@/src/stores/uiSettingsStore';

const BedAvailabilityRing = ({ percent, status }: { percent: number; status: HospitalStatus }) => {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  let color = '#22C55E';
  if (status === 'BUSY') color = '#F97316';
  if (status === 'FULL') color = '#EF4444';

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#EEF2F7" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={styles.chartLabelWrap}>
        <Text style={[styles.chartPercent, { color }]}>{Math.round(percent)}%</Text>
      </View>
    </View>
  );
};

export default function HospitalListScreen() {
  const router = useRouter();
  const {
    hospitals,
    isLoading,
    searchError,
    searchHospitals,
    filters,
    setFilters,
    lastUpdated,
  } = useSearchStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isNaviVisible, setIsNaviVisible] = useState(false);
  const [targetHospital, setTargetHospital] = useState<Hospital | null>(null);

  const { defaultSearchRadiusKm, autoCallDefault } = useUiSettingsStore();
  const [autoCallEnabled, setAutoCallEnabled] = useState(autoCallDefault);
  const [callProgress, setCallProgress] = useState(0);
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);

  useEffect(() => {
    setFilters({ maxDistance: defaultSearchRadiusKm });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 초기 진입 시 기본 반경만 동기화
  }, []);

  useEffect(() => {
    if (!autoCallEnabled) {
      setCallProgress(0);
      return;
    }
    setCallProgress(0);
    const id = setInterval(() => {
      setCallProgress((p) => (p >= 5 ? 5 : p + 1));
    }, 700);
    return () => clearInterval(id);
  }, [autoCallEnabled]);

  // 필터링된 목록
  const filteredHospitals = useMemo(() => {
    let list = [...hospitals];
    
    if (filters.onlyAvailable) {
      list = list.filter(h => h.status !== 'FULL');
    }
    
    if (filters.maxDistance < 30) {
      list = list.filter(h => (h.distanceKm || 0) <= filters.maxDistance);
    }

    return list;
  }, [hospitals, filters]);

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await searchHospitals();
    setRefreshing(false);
  };

  const handleHospitalPress = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsDetailVisible(true);
  };

  const handleNaviPress = (hospital: Hospital) => {
    setTargetHospital(hospital);
    setIsNaviVisible(true);
  };

  const renderHospitalItem = ({ item: hospital, index }: { item: Hospital; index: number }) => {
    const isBusy = hospital.status === 'BUSY';
    const isFull = hospital.status === 'FULL';
    
    let statusLabel = '진료가능';
    let statusBg = '#EBFBEE';
    let statusColor = '#2B8A3E';

    if (isBusy) {
      statusLabel = '혼잡';
      statusBg = '#FFF4E6';
      statusColor = '#D9480F';
    } else if (isFull) {
      statusLabel = '불가';
      statusBg = '#FFF5F5';
      statusColor = '#C92A2A';
    }

    const bedPercent = hospital.totalBeds > 0 
      ? (hospital.availableBeds / hospital.totalBeds) * 100 
      : 0;

    const trafficDot = isFull ? '🔴' : isBusy ? '🟠' : '🟢';
    const verifyPhase = (index + callProgress) % 3;
    const phoneVerifyLabel = autoCallEnabled
      ? verifyPhase === 0
        ? '✅ 확인'
        : verifyPhase === 1
          ? '📞확인 중...'
          : '❌확인실패'
      : '';

    return (
      <TouchableOpacity 
        style={[styles.hospitalCard, isFull && styles.hospitalCardFull]} 
        onPress={() => handleHospitalPress(hospital)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.trafficDot}>{trafficDot}</Text>
            <Text style={styles.hospitalName} numberOfLines={1}>{hospital.name}</Text>
            {autoCallEnabled ? (
              <Text style={styles.phoneVerifyBadge} numberOfLines={1}>
                {phoneVerifyLabel}
              </Text>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            )}
          </View>
          <Text style={styles.hospitalAddr} numberOfLines={1}>{hospital.address}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.mainInfo}>
              <View style={styles.infoRowSecondary}>
                <Text style={styles.distanceTag}>{hospital.distanceKm ?? '?'}km</Text>
                <View style={styles.dot} />
                <Text style={styles.etaText}>
                  차량 {hospital.etaMin ?? '?'}분
                  {hospital.routeSource === 'naver_traffic' ? ' · 교통 반영' : ' · 추정'}
                </Text>
              </View>

              <View style={styles.bedInfoRow}>
                <Ionicons name="bed-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.bedLabel}>가용 병상</Text>
                <Text style={styles.bedCount}>
                  <Text style={styles.bedAvailable}>{hospital.availableBeds}</Text>
                  <Text style={styles.bedTotal}> / {hospital.totalBeds}</Text>
                </Text>
              </View>
            </View>

            <BedAvailabilityRing percent={bedPercent} status={hospital.status} />
          </View>

          {hospital.phone ? (
            <Text style={styles.phoneLine} numberOfLines={1}>
              📞 {hospital.phone}
            </Text>
          ) : null}

          {hospital.seriousDiseases && hospital.seriousDiseases.length > 0 && (
            <View style={styles.diseaseTagContainer}>
              {hospital.seriousDiseases.slice(0, 3).map((d, idx) => (
                <View key={idx} style={styles.diseaseTag}>
                  <Text style={styles.diseaseTagText}>{d}</Text>
                </View>
              ))}
              {hospital.seriousDiseases.length > 3 && (
                <Text style={styles.moreText}>+{hospital.seriousDiseases.length - 3}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleNaviPress(hospital)}
          >
            <Ionicons name="navigate-circle" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>길안내</Text>
          </TouchableOpacity>
          <View style={styles.vDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (!hospital.phone) {
                Alert.alert('알림', '등록된 응급실 전화번호가 없습니다.');
                return;
              }
              const tel = hospital.phone.replace(/[^0-9+]/g, '');
              Alert.alert('전화 연결', `${hospital.name}으로 연결할까요?`, [
                { text: '취소', style: 'cancel' },
                { text: '통화', onPress: () => void Linking.openURL(`tel:${tel}`) },
              ]);
            }}
          >
            <Ionicons name="call" size={18} color={Colors.textSecondary} />
            <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>전화문의</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <NavigationHeader 
        title="응급실 검색" 
        showBack 
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={onRefresh} style={styles.headerIcon}>
              <Ionicons name="refresh" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('필터', '추가 필터는 추후 연동됩니다.')} style={styles.headerIcon}>
              <Ionicons name="menu-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.filterSection}>
        <View style={styles.toolbarRow}>
          <TouchableOpacity style={styles.radiusChip} onPress={() => setRadiusModalVisible(true)} activeOpacity={0.85}>
            <Text style={styles.radiusChipText}>{filters.maxDistance}km ▼</Text>
          </TouchableOpacity>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity style={[styles.modeBtn, styles.modeBtnActive]}>
              <Ionicons name="list" size={18} color="#fff" />
              <Text style={styles.modeBtnTextActive}>리스트</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modeBtn} onPress={() => router.push('/(main)/search/map')}>
              <Ionicons name="map-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.modeBtnText}>지도</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.autoCallRow}>
          <Text style={styles.autoCallLabel}>자동전화확인</Text>
          <Switch
            value={autoCallEnabled}
            onValueChange={setAutoCallEnabled}
            trackColor={{ true: Colors.available, false: '#D1D5DB' }}
            thumbColor="#fff"
          />
        </View>
        {autoCallEnabled ? (
          <Text style={styles.autoCallStatus}>
            📞 확인 중... ({Math.min(callProgress, 5)}/5)
          </Text>
        ) : null}
        {searchError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : null}
        {appConfig.showDevHud ? (
          <View style={styles.devHud}>
            <Text style={styles.devHudText}>DEV</Text>
          </View>
        ) : null}

        <View style={styles.statsBar}>
          <Text style={styles.resultCount}>
            검색 결과 <Text style={styles.bold}>{filteredHospitals.length}</Text>건
          </Text>
          <Text style={styles.updateTime}>{lastUpdated ? `${lastUpdated} 갱신` : ''}</Text>
        </View>
        
      </View>

      <Modal visible={radiusModalVisible} transparent animationType="fade" onRequestClose={() => setRadiusModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRadiusModalVisible(false)}>
          <Pressable style={styles.radiusModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.radiusModalTitle}>검색 반경</Text>
            {([5, 10, 20] as const).map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.radiusOption, filters.maxDistance === km && styles.radiusOptionActive]}
                onPress={() => {
                  setFilters({ maxDistance: km });
                  setRadiusModalVisible(false);
                }}
              >
                <Text style={[styles.radiusOptionText, filters.maxDistance === km && styles.radiusOptionTextActive]}>{km}km</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.id}
        renderItem={renderHospitalItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#E9ECEF" />
              <Text style={styles.emptyText}>조건에 맞는 응급실이 없습니다.</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setFilters({ onlyAvailable: false, maxDistance: 10 })}>
                <Text style={styles.resetBtnText}>필터 초기화</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>실시간 병상 정보를 확인 중입니다...</Text>
        </View>
      )}

      {/* 정보 상세 모달 */}
      {selectedHospital && (
        <HospitalDetailModal
          isVisible={isDetailVisible}
          onClose={() => setIsDetailVisible(false)}
          hospital={selectedHospital}
          onNavigate={() => {
            setIsDetailVisible(false);
            handleNaviPress(selectedHospital);
          }}
        />
      )}

      {/* 내비 선택 모달 */}
      {targetHospital && (
        <NaviSelectionModal
          isVisible={isNaviVisible}
          onClose={() => setIsNaviVisible(false)}
          hospitalName={targetHospital.name}
          lat={targetHospital.lat}
          lng={targetHospital.lng}
          address={targetHospital.address}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerIcon: { padding: 4 },
  filterSection: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  radiusChipText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  autoCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  autoCallLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  autoCallStatus: { fontSize: 12, fontWeight: '600', color: Colors.secondary, marginBottom: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  radiusModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  radiusModalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  radiusOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  radiusOptionActive: { backgroundColor: '#FFF1F0', borderWidth: 1, borderColor: Colors.primary },
  radiusOptionText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  radiusOptionTextActive: { color: Colors.primary, fontWeight: '800' },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultCount: { fontSize: 13, color: Colors.textSecondary },
  bold: { fontWeight: '700', color: Colors.text },
  updateTime: { fontSize: 11, color: Colors.textLight },

  modeToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modeBtnTextActive: { fontSize: 14, fontWeight: '700', color: '#fff' },

  listContent: { padding: 20, paddingBottom: 40 },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  hospitalCardFull: {
    backgroundColor: '#FCFCFC',
    opacity: 0.9,
  },
  cardHeader: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 },
  trafficDot: { fontSize: 14, lineHeight: 20 },
  hospitalName: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 4 },
  phoneVerifyBadge: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, maxWidth: '38%' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  hospitalAddr: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  phoneLine: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 8 },

  cardBody: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  mainInfo: { flex: 1 },
  infoRowSecondary: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  distanceTag: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  etaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB', marginHorizontal: 8 },

  bedInfoRow: { flexDirection: 'row', alignItems: 'center' },
  bedLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 6, marginRight: 8 },
  bedCount: { flexDirection: 'row', alignItems: 'baseline' },
  bedAvailable: { fontSize: 16, fontWeight: '800', color: Colors.text },
  bedTotal: { fontSize: 12, color: Colors.textLight },

  chartContainer: { marginLeft: 12, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  chartLabelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPercent: { fontSize: 11, fontWeight: '800' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', fontWeight: '600' },
  devHud: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  devHudText: { fontSize: 10, fontWeight: '800', color: '#4338CA', letterSpacing: 0.5 },

  diseaseTagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  diseaseTag: { 
    backgroundColor: '#F8F9FA', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  diseaseTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  moreText: { fontSize: 11, color: Colors.textLight, alignSelf: 'center' },

  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  vDivider: { width: 1, height: 20, backgroundColor: '#F1F3F5' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 16, color: Colors.textSecondary, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: Colors.textLight, fontWeight: '500' },
  resetBtn: { marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#F1F3F5', borderRadius: 10 },
  resetBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
});
