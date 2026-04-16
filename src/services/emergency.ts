// 공공데이터 API - 국립중앙의료원 응급의료기관 정보 조회 서비스
// 참조: https://data.go.kr → "국립중앙의료원_전국 응급의료기관 정보 조회 서비스"
import { Hospital, HospitalStatus } from '@/src/types';

// 환경변수에서 API 설정 로드 (Expo: EXPO_PUBLIC_ 접두사 필요)
const getServiceKey = (): string =>
  process.env.EXPO_PUBLIC_DATA_SERVICE_KEY || '';

const getBaseUrl = (): string =>
  process.env.EXPO_PUBLIC_DATA_ER_BASE_URL || 'https://apis.data.go.kr/B552657/ErmctInfoInqireService';

const getOperation = (): string =>
  process.env.EXPO_PUBLIC_DATA_ER_OPERATION || 'getEmrrmRltmUsefulSckbdInfoInqire';

// 응급실 실시간 가용병상 정보 조회
interface EmergencyBedResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: EmergencyBedItem[] | EmergencyBedItem };
      totalCount: number;
    };
  };
}

// 응급실 병상 정보 항목
interface EmergencyBedItem {
  hpid: string;       // 기관 ID
  phpid?: string;     // 기관 코드
  dutyName: string;   // 기관명
  dutyAddr: string;   // 주소
  dutyTel1?: string;  // 대표 전화
  dutyTel3?: string;  // 응급실 전화
  wgs84Lat: number;   // 위도
  wgs84Lon: number;   // 경도
  hvec?: number;      // 응급실 가용 병상 수
  hvoc?: number;      // 수술실 가용 수
  hvgc?: number;      // 일반 가용 병상 수
  hvs01?: number;     // 신경과 가용
  hvs02?: number;     // 신경외과 가용
  hvs04?: number;     // 흉부외과 가용
  hvs07?: number;     // 정형외과 가용
  hv1?: number;       // 응급실 전체 병상 수
  hvidate?: string;   // 입력 일시
  dutyEryn?: number;  // 응급실 운영 여부 (1=운영)
}

// 중증응급질환 수용 가능 정보 조회 응답
interface SeriousDiseaseResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: SeriousDiseaseItem[] | SeriousDiseaseItem };
      totalCount: number;
    };
  };
}

// 중증응급질환 항목 (HV1~HV12 등)
export interface SeriousDiseaseItem {
  hpid: string;
  dutyName: string;
  hv1?: 'Y' | 'N'; // 심근경색
  hv2?: 'Y' | 'N'; // 뇌출혈
  hv3?: 'Y' | 'N'; // 뇌경색
  hv10?: 'Y' | 'N'; // 중증화상
  hv11?: 'Y' | 'N'; // 다발성외상
  hv12?: 'Y' | 'N'; // 아나필락시스
  msg?: string;    // 실시간 특이사항 메시지
}

// 응급의료기관 기본 정보 조회
interface HospitalInfoItem {
  hpid: string;
  dutyName: string;
  dutyAddr: string;
  dutyTel1?: string;
  dutyTel3?: string;
  wgs84Lat: number;
  wgs84Lon: number;
  dutyEryn?: number;
  dgidIdName?: string; // 진료과목
  dutyTime1s?: string; // 진료시간 (월요일 시작)
  dutyTime1c?: string; // 진료시간 (월요일 종료)
}

// 수용 상태 판정
function determineStatus(availableBeds: number, totalBeds: number): HospitalStatus {
  if (availableBeds <= 0) return 'FULL';
  if (availableBeds <= totalBeds * 0.3) return 'BUSY';
  return 'AVAILABLE';
}

// API 항목을 Hospital 타입으로 변환
function mapToHospital(item: EmergencyBedItem, userLat?: number, userLng?: number): Hospital {
  const availableBeds = item.hvec ?? 0;
  const totalBeds = item.hv1 ?? availableBeds;
  const status = determineStatus(availableBeds, totalBeds > 0 ? totalBeds : 1);

  const hospital: Hospital = {
    id: item.hpid,
    name: item.dutyName,
    address: item.dutyAddr || '',
    lat: item.wgs84Lat,
    lng: item.wgs84Lon,
    phone: item.dutyTel3 || item.dutyTel1 || '',
    totalBeds: totalBeds,
    availableBeds: availableBeds,
    hasDoctorOnDuty: (item.dutyEryn ?? 0) === 1,
    status,
    lastUpdated: String(item.hvidate || new Date().toISOString().replace('T', ' ').split('.')[0]),
  };

  // 사용자 위치와 병원 좌표가 모두 있다면 거리/ETA 계산
  if (userLat !== undefined && userLng !== undefined && item.wgs84Lat && item.wgs84Lon) {
    hospital.distanceKm = calculateDistance(userLat, userLng, item.wgs84Lat, item.wgs84Lon);
    hospital.etaMin = estimateETA(hospital.distanceKm);
  }

  return hospital;
}

// Haversine 공식으로 두 좌표 간 거리 계산 (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 소수점 1자리
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// 거리 기반 예상 소요시간 추정 (분)
function estimateETA(distanceKm: number): number {
  // 도심 평균 속도 ~30km/h 기준
  return Math.round((distanceKm / 30) * 60);
}

// ===== 공개 API 함수 =====

// 실시간 응급실 가용병상 조회 (위치 기반)
export async function fetchEmergencyBeds(
  lat: number,
  lng: number,
  stage1?: string,  // 시/도
  stage2?: string,  // 시/군/구
): Promise<Hospital[]> {
  const serviceKey = getServiceKey();
  if (!serviceKey) {
    console.warn('공공데이터 API 키가 설정되지 않았습니다.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: '1',
      numOfRows: '100',
      _type: 'json', // JSON 형식 강제
      ...(stage1 && { STAGE1: stage1 }),
      ...(stage2 && { STAGE2: stage2 }),
    });

    const url = `${getBaseUrl()}/${getOperation()}?${params}`;
    console.log('[API Request] URL:', url);

    const response = await fetch(url, { 
      headers: { Accept: 'application/json' } 
    });

    if (!response.ok) {
      console.error(`[API Error] Status: ${response.status}, URL: ${url}`);
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const rawData = await response.text();
    console.log('[API Response] Length:', rawData.length);
    
    // JSON 파싱 시도 전 형식 확인
    if (!rawData.trim().startsWith('{')) {
      console.warn('[API Warning] Response is NOT JSON. Check Service Key or API setting.');
      return [];
    }

    const data: EmergencyBedResponse = JSON.parse(rawData);
    console.log('[API Result] Items Count:', data.response?.body?.totalCount || 0);

    // 결과 없음
    if (!data.response?.body?.items?.item) return [];

    // 단건/다건 처리
    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    // Hospital 변환
    let hospitals = items.map((item) => mapToHospital(item, lat, lng));

    // 좌표가 없는 병원 보강 (상세 정보를 조회하여 좌표 확보)
    const hospitalsToEnrich = hospitals.filter(h => !h.lat || !h.lng);
    
    if (hospitalsToEnrich.length > 0) {
      console.log(`[Data Enrichment] Enriching ${hospitalsToEnrich.length} hospitals with missing coordinates...`);
      
      const enrichedData = await Promise.all(
        hospitalsToEnrich.map(async (h) => {
          try {
            const detail = await fetchHospitalDetail(h.id);
            if (detail && detail.wgs84Lat && detail.wgs84Lon) {
              return { id: h.id, lat: detail.wgs84Lat, lng: detail.wgs84Lon };
            }
          } catch (e) {
            console.warn(`[Data Enrichment] Failed for ${h.name}:`, e);
          }
          return null;
        })
      );

      // 데이터 병합 및 거리 재계산
      hospitals = hospitals.map(h => {
        const enriched = enrichedData.find(e => e && e.id === h.id);
        if (enriched) {
          h.lat = enriched.lat;
          h.lng = enriched.lng;
          // 거리와 ETA 재계산
          h.distanceKm = calculateDistance(lat, lng, h.lat, h.lng);
          h.etaMin = estimateETA(h.distanceKm);
        }
        return h;
      });
    }

    // 거리 기준 정렬
    hospitals.sort((a, b) => {
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });

    console.log(`[Service Result] Final Hospitals Mapped & Enriched: ${hospitals.length}`);
    return hospitals;
  } catch (error) {
    console.error('응급실 정보 조회 실패:', error);
    return [];
  }
}

// 응급의료기관 기본 정보 조회 (기관 ID로 상세 조회)
export async function fetchHospitalDetail(hpid: string): Promise<HospitalInfoItem | null> {
  const serviceKey = getServiceKey();
  if (!serviceKey) return null;

  try {
    const params = new URLSearchParams({
      serviceKey,
      HPID: hpid,
    });

    const response = await fetch(
      `${getBaseUrl()}/getEgytBassInfoInqire?${params}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.response?.body?.items?.item || null;
  } catch (error) {
    console.error('병원 상세 정보 조회 실패:', error);
    return null;
  }
}

// 중증응급질환 수용가능 정보 조회 (지역 기반)
export async function fetchSeriousDiseaseStatus(
  stage1?: string,
  stage2?: string
): Promise<SeriousDiseaseItem[]> {
  const serviceKey = getServiceKey();
  if (!serviceKey) return [];

  try {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: '1',
      numOfRows: '100',
      _type: 'json',
      ...(stage1 && { STAGE1: stage1 }),
      ...(stage2 && { STAGE2: stage2 }),
    });

    // 중증질환 수용가능 정보 오퍼레이션 사용
    const url = `${getBaseUrl()}/getSrsillDissAceptncPosblInfoInqire?${params}`;
    console.log('[Serious API Request] URL:', url);

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API 응답 오류: ${response.status}`);

    const rawData = await response.text();
    if (!rawData.trim().startsWith('{')) return [];

    const data: SeriousDiseaseResponse = JSON.parse(rawData);
    if (!data.response?.body?.items?.item) return [];

    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    return items;
  } catch (error) {
    console.error('중증응급질환 정보 조회 실패:', error);
    return [];
  }
}

// 시/도 코드 매핑
export const STAGE1_CODES: Record<string, string> = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전라북도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};
