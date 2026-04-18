/**
 * 공공데이터 응급의료기관 검색 (단순 경로) — cc5c203 Phase3 emergency.ts와 별도
 */
import axios from 'axios';
import { Hospital, HospitalStatus } from '@/src/types';
import { getNaverDrivingRoute } from '@/src/services/naver';

const SERVICE_KEY =
  process.env.EXPO_PUBLIC_DATA_SERVICE_KEY || process.env.EXPO_PUBLIC_EMERGENCY_SERVICE_KEY || '';
const BASE_URL =
  process.env.EXPO_PUBLIC_DATA_ER_BASE_URL ||
  'http://apis.data.go.kr/B552657/ErmctInfoInqireService';
const BED_PATH =
  process.env.EXPO_PUBLIC_EMERGENCY_BED_PATH || 'getEmrrmRltmUsefulSckbdInfoInqire';

function assertDataGoKrOk(data: unknown, context: string): void {
  const header = (data as { response?: { header?: { resultCode?: string; resultMsg?: string } } })?.response?.header;
  if (!header) return;
  const code = String(header.resultCode ?? '').trim();
  const msg = String(header.resultMsg ?? '').trim();
  if (code && code !== '00') {
    throw new Error(`${context}: ${msg || 'API 오류'} (${code})`);
  }
}

async function mapWithConcurrency<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

async function fetchEmergencyBeds(hpId: string) {
  if (!SERVICE_KEY) return null;
  try {
    const response = await axios.get(`${BASE_URL}/${BED_PATH}`, {
      params: {
        serviceKey: SERVICE_KEY,
        HPID: hpId,
        pageNo: 1,
        numOfRows: 10,
        _type: 'json',
      },
      timeout: 15000,
    });
    assertDataGoKrOk(response.data, '응급실 가용병상');
    const raw = response.data?.response?.body?.items?.item;
    if (raw == null) return null;
    const item = Array.isArray(raw) ? raw[0] : raw;
    const pickNum = (v: unknown) => {
      const n = parseInt(String(v ?? '0'), 10);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      availableBeds: pickNum(item.hvec ?? item.HVEC),
      totalBeds: pickNum(item.hvic ?? item.HVIC),
    };
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchNearbyHospitals(
  latitude: number,
  longitude: number,
  maxRows = 12
): Promise<Hospital[]> {
  if (!SERVICE_KEY) {
    throw new Error('공공데이터 API 키(EXPO_PUBLIC_DATA_SERVICE_KEY)가 설정되지 않았습니다.');
  }

  const response = await axios.get(`${BASE_URL}/getEgytLcinfoInqire`, {
    params: {
      serviceKey: SERVICE_KEY,
      WGS84_LON: longitude,
      WGS84_LAT: latitude,
      pageNo: 1,
      numOfRows: maxRows,
      _type: 'json',
    },
    timeout: 20000,
  });

  if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
    throw new Error('공공데이터 API가 XML을 반환했습니다. serviceKey·엔드포인트를 확인해 주세요.');
  }

  assertDataGoKrOk(response.data, '응급의료기관 위치');
  const items = response.data?.response?.body?.items?.item;
  if (!items) return [];

  const hospitalList = Array.isArray(items) ? items : [items];

  const base = await mapWithConcurrency(hospitalList, 4, async (item: Record<string, unknown>) => {
    const hpid = String(item.hpid ?? item.HPID ?? '');
    const lat = parseFloat(String(item.wgs84Lat ?? item.WGS84_LAT ?? 0));
    const lng = parseFloat(String(item.wgs84Lon ?? item.WGS84_LON ?? 0));
    const bedInfo = hpid ? await fetchEmergencyBeds(hpid) : null;

    const straightKm = haversineKm(latitude, longitude, lat, lng);
    const etaFallback = Math.max(1, Math.round((straightKm / 35) * 60));

    let status: HospitalStatus = 'AVAILABLE';
    if (bedInfo && bedInfo.availableBeds <= 0) status = 'FULL';
    else if (bedInfo && bedInfo.availableBeds <= 3) status = 'BUSY';

    const hospital: Hospital = {
      id: hpid || `${lat},${lng}`,
      name: String(item.dutyName ?? item.DUTY_NAME ?? '응급의료기관'),
      address: String(item.dutyAddr ?? item.DUTY_ADDR ?? ''),
      phone: String(item.dutyTel3 ?? item.DUTY_TEL3 ?? ''),
      lat,
      lng,
      distanceKm: parseFloat(straightKm.toFixed(2)),
      etaMin: etaFallback,
      routeSource: 'estimate',
      availableBeds: bedInfo?.availableBeds ?? 0,
      totalBeds: bedInfo?.totalBeds ?? 0,
      hasDoctorOnDuty: true,
      status,
      lastUpdated: new Date().toISOString(),
    };
    return hospital;
  });

  const withRoutes = await mapWithConcurrency(base, 3, async (h) => {
    const route = await getNaverDrivingRoute(latitude, longitude, h.lat, h.lng);
    if (!route) return h;
    return {
      ...h,
      distanceKm: parseFloat(route.distanceKm.toFixed(2)),
      etaMin: route.etaMin,
      routeSource: 'naver_traffic' as const,
    };
  });

  return withRoutes.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
