import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useSearchStore } from '@/src/stores/searchStore';
import { openNavigation } from '@/src/services/navigation';
import { Hospital } from '@/src/types';

// 카카오 맵 HTML 템플릿 생성을 위한 헬퍼 함수
const generateKakaoMapHtml = (kakaoKey: string, center: { lat: number, lng: number }, hospitals: Hospital[] = []) => {
  const markersJson = JSON.stringify((hospitals || []).map(h => ({
    id: h.id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    beds: h.availableBeds,
    status: h.status,
    color: h.status === 'AVAILABLE' ? Colors.available : (h.status === 'BUSY' ? Colors.busy : Colors.full)
  })));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}"></script>
      <style>
        body, html, #map { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background-color: #f0f0f0; }
        #error-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255,255,255,0.9); display: none;
          align-items: center; justify-content: center; text-align: center;
          padding: 20px; font-family: sans-serif; z-index: 9999;
        }
        .custom-overlay {
          position: relative; bottom: 45px; border-radius: 12px; background: white;
          padding: 4px 8px; border: 2px solid; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          font-family: sans-serif; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;
        }
        .custom-overlay:after {
          content: ''; position: absolute; bottom: -8px; left: 50%; margin-left: -8px;
          border-top: 8px solid white; border-left: 8px solid transparent; border-right: 8px solid transparent;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div id="error-overlay">
        <div>
          <h3 style="color: #FF4444;">지도 로드 오류</h3>
          <p id="error-msg">SDK를 불러올 수 없습니다.<br/>도메인 등록이나 API 키를 확인해 주세요.</p>
        </div>
      </div>
      <script>
        // 에러 로깅 함수
        function logError(msg) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', message: msg}));
        }

        window.onerror = function(msg, url, line) {
          logError("JS Error: " + msg + " at " + line);
          return false;
        };

        try {
          logError("Using Key: " + "${kakaoKey}".substring(0, 4) + "****");
          if (typeof kakao === 'undefined' || !kakao.maps) {
            document.getElementById('error-overlay').style.display = 'flex';
            logError("Kakao SDK not loaded");
          } else {
            var container = document.getElementById('map');
            var options = {
              center: new kakao.maps.LatLng(${center.lat}, ${center.lng}),
              level: 4
            };
            var map = new kakao.maps.Map(container, options);

            // 내 위치 마커
            var meMarker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(${center.lat}, ${center.lng}),
              map: map
            });

            // 병원 마커 데이터 로드
            var hospitalData = ${markersJson};
            hospitalData.forEach(function(h) {
              var content = '<div class="custom-overlay" style="border-color: ' + h.color + '; color: #333;" ' +
                            'onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: \\'SELECT_HOSPITAL\\', id: \\'' + h.id + '\\'}))">' +
                            h.beds + '</div>';

              var customOverlay = new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(h.lat, h.lng),
                content: content,
                yAnchor: 1
              });
              customOverlay.setMap(map);
            });

            kakao.maps.event.addListener(map, 'click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'DESELECT'}));
            });
            
            logError("Map initialized successfully");
          }
        } catch (e) {
          logError("Init Exception: " + e.message);
          document.getElementById('error-overlay').style.display = 'flex';
          document.getElementById('error-msg').innerText = e.message;
        }
      </script>
    </body>
    </html>
  `;
};

export default function MapScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const {
    hospitals, isSearching, userLocation, searchRadius, setSearchRadius,
    searchHospitals, severityScore,
  } = useSearchStore();

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // KAKAO_APP_KEY (여기서는 환경변수 사용)
  // 카카오 지도 API 키 (JavaScript 키 사용 필수)
  const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY || process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY || ''; 

  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
    searchHospitals();
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // WebView로부터의 메시지 처리
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_HOSPITAL') {
        const hospital = hospitals.find(h => h.id === data.id);
        if (hospital) setSelectedHospital(hospital);
      } else if (data.type === 'DESELECT') {
        setSelectedHospital(null);
      } else if (data.type === 'LOG') {
        console.log('[WebView Log]', data.message);
      }
    } catch (e) {
      console.warn('WebView Message Error:', e);
    }
  };

  // 상세 카드 배경색
  const getCardBgColor = (status: string) => {
    if (status === 'AVAILABLE') return '#F0FDF4';
    if (status === 'BUSY') return '#FFFBEB';
    return '#FEF2F2';
  };

  const getStatusColor = (status: string) => {
    if (status === 'AVAILABLE') return Colors.available;
    if (status === 'BUSY') return Colors.busy;
    return Colors.full;
  };

  const centerCoord = {
    lat: userLocation?.latitude || 37.5665,
    lng: userLocation?.longitude || 126.9780
  };

  return (
    <View style={styles.container}>
      {/* 상단 컨트롤 레이어 */}
      <View style={styles.headerLayer}>
        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeTab, styles.modeTabActive]}>
            <Text style={[styles.modeTabText, styles.modeTabTextActive]}>🗺️ 지도</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeTab} onPress={() => router.replace('/(main)/search/list')}>
            <Text style={styles.modeTabText}>📋 리스트</Text>
          </TouchableOpacity>
        </View>

        <View 
          style={styles.radiusSliderBox}
          onLayout={(e) => {
            // 트랙의 실제 너비를 저장하여 정밀한 계산 가능 (생략 가능하나 정확도를 위해 유지)
          }}
        >
          <Text style={styles.sliderLabel}>🔍 검색 반경: <Text style={styles.sliderValue}>{searchRadius}km</Text></Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLimit}>5km</Text>
            <View 
              style={styles.sliderTrack}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderMove={(e) => {
                const { locationX } = e.nativeEvent;
                // 트랙의 대략적인 너비를 220 정도로 가정 (Padding 제외)
                const newRadius = Math.round((locationX / 220) * 95 + 5);
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

        {severityScore && (
          <View style={styles.triageMiniBadge}>
            <Text style={styles.triageMiniText}>KTAS Lv.{severityScore}</Text>
          </View>
        )}
      </View>

      {/* 카카오맵 영역 (WebView) */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ 
          html: generateKakaoMapHtml(KAKAO_KEY, centerCoord, hospitals),
          baseUrl: 'http://localhost' 
        }}
        style={styles.map}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        scalesPageToFit={true}
      />

      {/* 하단 선택 카드 */}
      {selectedHospital && (
        <View style={[styles.detailCard, { backgroundColor: getCardBgColor(selectedHospital.status) }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.hospitalName}>{selectedHospital.name}</Text>
              <Text style={styles.hospitalDist}>
                📏 {selectedHospital.distanceKm}km | ⏱️ 약 {selectedHospital.etaMin}분
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedHospital.status) + '20' }]}>
              <Text style={[styles.statusTagText, { color: getStatusColor(selectedHospital.status) }]}>
                {selectedHospital.availableBeds}석 가용
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
              onPress={() => handleCall(selectedHospital.phone)}
            >
              <Text style={styles.actionBtnText}>📞 전화 문의</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: Colors.available }]}
              onPress={() => openNavigation('kakao', selectedHospital.name, selectedHospital.lat, selectedHospital.lng)}
            >
              <Text style={styles.actionBtnText}>🧭 길 안내 시작</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isSearching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerLayer: {
    position: 'absolute', top: 50, left: 16, right: 16, zIndex: 10,
    gap: 12,
  },
  modeToggle: { 
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 14, padding: 4, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: Colors.primary },
  modeTabText: { fontSize: FontSize.sm, fontWeight: '700', color: '#868E96' },
  modeTabTextActive: { color: '#fff' },
  
  radiusSliderBox: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, 
    padding: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15,
  },
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
  sliderSteppers: { flexDirection: 'row', marginTop: 10 },
  stepBtn: { backgroundColor: '#F8F9FA', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DEE2E6' },
  stepBtnText: { fontSize: 12, color: '#495057', fontWeight: '700' },

  triageMiniBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  triageMiniText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  map: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },

  detailCard: {
    position: 'absolute', bottom: 30, left: 16, right: 16,
    borderRadius: 24, padding: 20, elevation: 10, 
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  hospitalDist: { fontSize: 13, color: '#666', fontWeight: '500' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusTagText: { fontSize: 12, fontWeight: '800' },
  
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
