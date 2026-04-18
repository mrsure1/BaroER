import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors, FontSize } from '@/constants/Colors';
import NavigationHeader from '@/components/common/NavigationHeader';
import { useSearchStore } from '@/src/stores/searchStore';
import { useUiSettingsStore } from '@/src/stores/uiSettingsStore';
import { openNavigation } from '@/src/services/navigation';
import { Hospital } from '@/src/types';
import { buildNaverMapHtml } from '@/src/utils/naverMapHtml';
import { getMetroHttpOrigin } from '@/src/utils/metroHttpOrigin';

export default function MapScreen() {
  const router = useRouter();
  const {
    hospitals,
    isLoading,
    userLocation,
    filters,
    setFilters,
    searchHospitals,
  } = useSearchStore();

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const { defaultSearchRadiusKm, autoCallDefault, defaultNavApp } = useUiSettingsStore();
  const [autoCallEnabled, setAutoCallEnabled] = useState(autoCallDefault);

  useEffect(() => {
    setFilters({ maxDistance: defaultSearchRadiusKm });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 지도 진입 시 기본 반경만 동기화
  }, []);

  useEffect(() => {
    if (hospitals.length === 0) {
      void searchHospitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 지도 진입 시 데이터 없을 때만 1회 검색
  }, []);

  const naverClientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';

  const filtered = useMemo(
    () => hospitals.filter((h) => (h.distanceKm ?? 0) <= filters.maxDistance),
    [hospitals, filters.maxDistance]
  );

  const centerCoord = {
    lat: userLocation?.latitude ?? 37.5665,
    lng: userLocation?.longitude ?? 126.978,
  };

  /** 검색 완료 전에 WebView를 띄우면 기본 좌표 → 실제 위치로 HTML이 바뀌며 전체 리로드·깜빡임이 난다 */
  const mapHtmlReady = Boolean(naverClientId) && !isLoading;

  const mapHtml = useMemo(() => {
    if (!naverClientId || !mapHtmlReady) return '';
    return buildNaverMapHtml(naverClientId, centerCoord.lat, centerCoord.lng, filtered);
  }, [naverClientId, mapHtmlReady, centerCoord.lat, centerCoord.lng, filtered]);

  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id?: string;
        };
        if (data.type === 'SELECT_HOSPITAL' && data.id) {
          const h = filtered.find((x) => x.id === data.id);
          if (h) setSelectedHospital(h);
        } else if (data.type === 'DESELECT') {
          setSelectedHospital(null);
        }
      } catch {
        /* ignore */
      }
    },
    [filtered]
  );

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  const getCardBg = (status: Hospital['status']) => {
    if (status === 'AVAILABLE') return '#F0FDF4';
    if (status === 'BUSY') return '#FFFBEB';
    return '#FEF2F2';
  };

  const getStatusTint = (status: Hospital['status']) => {
    if (status === 'AVAILABLE') return Colors.available;
    if (status === 'BUSY') return Colors.busy;
    return Colors.full;
  };

  const etaLabel = (h: Hospital) => {
    if (h.routeSource === 'naver_traffic') return `약 ${h.etaMin}분 · 실시간 교통`;
    return `약 ${h.etaMin}분 · 직선 거리 기준`;
  };

  const navProvider = defaultNavApp === 'google' ? 'kakao' : defaultNavApp;

  /** NCP Maps 웹 서비스 URL = 이 origin 과 동일하게 등록 (실기기는 Metro IP가 바뀌므로 getMetroHttpOrigin 사용) */
  const naverMapWebOrigin = getMetroHttpOrigin();

  return (
    <View style={styles.container}>
      <NavigationHeader
        title="응급실 검색"
        showBack
        rightElement={
          <TouchableOpacity onPress={() => Alert.alert('필터', '추가 필터는 추후 연동됩니다.')} style={{ padding: 4 }}>
            <Ionicons name="menu-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.mapArea}>
        <View style={[styles.headerLayer, { paddingTop: 8 }]}>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              style={styles.radiusChip}
              onPress={() => {
                const order: (5 | 10 | 20)[] = [5, 10, 20];
                const cur = filters.maxDistance as 5 | 10 | 20;
                const idx = Math.max(0, order.indexOf(cur));
                const next = order[(idx + 1) % order.length];
                setFilters({ maxDistance: next });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.radiusChipText}>{filters.maxDistance}km ▼</Text>
            </TouchableOpacity>
            <View style={styles.modeToggle}>
              <TouchableOpacity style={[styles.modeTab, styles.modeTabActive]}>
                <Ionicons name="map" size={18} color="#fff" style={{ marginRight: 4 }} />
                <Text style={[styles.modeTabText, styles.modeTabTextActive]}>지도</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modeTab} onPress={() => router.replace('/(main)/search/list')}>
                <Ionicons name="list-outline" size={18} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.modeTabText}>리스트</Text>
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
        </View>

      {!naverClientId ? (
        <View style={styles.fallback}>
          <Ionicons name="map-outline" size={48} color="#D1D5DB" />
          <Text style={styles.fallbackText}>EXPO_PUBLIC_NAVER_CLIENT_ID를 설정해 주세요.</Text>
        </View>
      ) : !mapHtmlReady || !mapHtml ? (
        <View style={styles.fallback}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>위치와 병원 정보를 불러오는 중…</Text>
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml, baseUrl: naverMapWebOrigin }}
          style={styles.map}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          setBuiltInZoomControls={false}
        />
      )}

      {selectedHospital && (
        <View style={[styles.detailCard, { backgroundColor: getCardBg(selectedHospital.status) }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.hospitalName} numberOfLines={2}>
                {selectedHospital.status === 'FULL' ? '🔴 ' : selectedHospital.status === 'BUSY' ? '🟠 ' : '🟢 '}
                {selectedHospital.name}
              </Text>
              <Text style={styles.hospitalDist}>
                {selectedHospital.distanceKm}km · {etaLabel(selectedHospital)}
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: getStatusTint(selectedHospital.status) + '22' }]}>
              <Text style={[styles.statusTagText, { color: getStatusTint(selectedHospital.status) }]}>
                가용 {selectedHospital.availableBeds} / {selectedHospital.totalBeds}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={() => handleCall(selectedHospital.phone)}
            >
              <Ionicons name="call-outline" size={18} color={Colors.text} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextDark}>전화</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() =>
                openNavigation(
                  navProvider,
                  selectedHospital.name,
                  selectedHospital.lat,
                  selectedHospital.lng,
                  selectedHospital.address
                )
              }
            >
              <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextLight}>길안내</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading && mapHtmlReady && (
        <View style={styles.loadingBanner} pointerEvents="none">
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingBannerText}>목록 갱신 중…</Text>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapArea: { flex: 1, position: 'relative' },
  headerLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 8,
    zIndex: 10,
    gap: 8,
  },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  radiusChipText: { fontSize: 13, fontWeight: '800', color: Colors.text },
  autoCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  autoCallLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 14,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    flexDirection: 'row',
  },
  modeTabActive: { backgroundColor: Colors.primary },
  modeTabText: { fontSize: FontSize.sm, fontWeight: '700', color: '#6B7280' },
  modeTabTextActive: { color: '#fff' },

  map: { flex: 1 },

  loadingBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  loadingBannerText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '600', textAlign: 'center' },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  fallbackText: { marginTop: 12, textAlign: 'center', color: '#9CA3AF', fontSize: 14 },

  detailCard: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  hospitalName: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 4 },
  hospitalDist: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusTagText: { fontSize: 12, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  actionPrimary: { backgroundColor: Colors.primary },
  actionBtnTextDark: { color: '#111827', fontSize: 15, fontWeight: '700' },
  actionBtnTextLight: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
