import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type {
  CapacityLevel,
  Hospital,
  HospitalSearchResponse,
  RealtimeBeds,
} from "@/types/hospital";
import { MOCK_HOSPITALS } from "@/lib/mockHospitals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// `.env` 의 DATA_SERVICE_KEY 가 1순위 (이 프로젝트의 표준 변수명).
// 이전 코드 호환을 위해 PUBLIC_DATA_PORTAL_SERVICE_KEY 도 받아준다.
const SERVICE_KEY =
  process.env.DATA_SERVICE_KEY ??
  process.env.PUBLIC_DATA_PORTAL_SERVICE_KEY ??
  "";

const BASE = "https://apis.data.go.kr/B552657/ErmctInfoInqireService";
/**
 * 시·도(Q0) 단위 응급실 목록 — 좌표 포함, 시·도 당 수십~백 개.
 * 메인 데이터 소스로 사용. 위치 조회(`getEgytLcinfoInqire`)는
 * `totalCount` 가 2 안팎으로 매우 적게 반환되어 부적합.
 */
const LIST_ENDPOINT = `${BASE}/getEgytListInfoInqire`;
/**
 * 좌표 기반 위치 조회 — `totalCount` 가 2 안팎으로 매우 적게 응답하므로
 * 메인 데이터로는 부적합하지만, 사용자가 실제로 위치한 시·도(STAGE1) 를
 * 정확히 알아내는 시드 용도로 쓴다.
 */
const LOC_ENDPOINT = `${BASE}/getEgytLcinfoInqire`;
/** 응급실 실시간 가용병상 정보 (시·도·시·군·구 단위) */
const RTM_ENDPOINT = `${BASE}/getEmrrmRltmUsefulSckbdInfoInqire`;

/**
 * 17 개 광역자치단체 중심좌표 — 사용자 좌표에서 가까운 시·도를 골라
 * 응급실 풀을 결정하는 데 사용한다.
 * 표기는 공공데이터 dutyAddr / Q0 파라미터와 동일.
 */
const STAGE1_CENTROIDS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "서울특별시", lat: 37.5665, lng: 126.978 },
  { name: "부산광역시", lat: 35.1796, lng: 129.0756 },
  { name: "대구광역시", lat: 35.8714, lng: 128.6014 },
  { name: "인천광역시", lat: 37.4563, lng: 126.7052 },
  { name: "광주광역시", lat: 35.1595, lng: 126.8526 },
  { name: "대전광역시", lat: 36.3504, lng: 127.3845 },
  { name: "울산광역시", lat: 35.5384, lng: 129.3114 },
  { name: "세종특별자치시", lat: 36.4801, lng: 127.289 },
  { name: "경기도", lat: 37.4138, lng: 127.5183 },
  { name: "강원특별자치도", lat: 37.8228, lng: 128.1555 },
  { name: "충청북도", lat: 36.6357, lng: 127.4917 },
  { name: "충청남도", lat: 36.5184, lng: 126.8 },
  { name: "전북특별자치도", lat: 35.7167, lng: 127.1531 },
  { name: "전라남도", lat: 34.8161, lng: 126.463 },
  { name: "경상북도", lat: 36.4919, lng: 128.8889 },
  { name: "경상남도", lat: 35.4606, lng: 128.2132 },
  { name: "제주특별자치도", lat: 33.4996, lng: 126.5312 },
];

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(200).default(15),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 거리 → 도심 평균 주행 25km/h 가정 ETA */
function estimateEtaMin(km: number) {
  return Math.max(2, Math.round((km / 25) * 60));
}

/**
 * 응급실 가용/정원 비율을 이용해 분류.
 * - er null         → unknown
 * - er === 0        → full
 * - 정원 있음      → er/erTotal 비율 기반 (≤20%: busy, 그 외: available)
 * - 정원 없음      → er≤2 일 때 busy, 그 외 available (절대값 기반 fallback)
 */
function classifyCapacity(er: number | null, erTotal: number | null): CapacityLevel {
  if (er === null) return "unknown";
  if (er <= 0) return "full";
  if (erTotal && erTotal > 0) {
    return er / erTotal < 0.2 ? "busy" : "available";
  }
  return er <= 2 ? "busy" : "available";
}

/** `getEgytListInfoInqire` 응답 항목. 좌표는 wgs84Lat/Lon 으로 옴. */
interface ListItem {
  hpid?: string;
  dutyName?: string;
  dutyAddr?: string;
  dutyTel1?: string;
  dutyTel3?: string;
  wgs84Lat?: string | number;
  wgs84Lon?: string | number;
  /** 응급의료기관 분류 코드 (G001=권역응급의료센터, G006=지역응급의료센터, G009=신고기관 등) */
  dutyEmcls?: string;
  dutyEmclsName?: string;
}

interface RealtimeItem {
  hpid?: string;
  dutyName?: string;
  dutyTel3?: string;
  /** 응급실 가용 병상 — -1 등 음수는 미보고 */
  hvec?: string | number;
  /** 일반 입원실 가용 */
  hvgc?: string | number;
  /** 수술실 가용 */
  hvoc?: string | number;
  /** 내과 중환자실 */
  hvcc?: string | number;
  /** 외과 중환자실 */
  hvicc?: string | number;
  /** 신경과 중환자실 */
  hvncc?: string | number;
  /** 흉부 중환자실 */
  hvccc?: string | number;
  /** 격리 병상 */
  hv2?: string | number;
  /** 소아응급 */
  hv28?: string | number;
  /** 보고시각 (yyyyMMddHHmmss) */
  hvidate?: string | number;
}

/** API 의 카운트 필드는 "-1"/"" 같은 미보고 값을 섞어 보낸다. 정수만 신뢰. */
function parseCount(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n;
}

/** "20260419145017" → "2026-04-19T14:50:17+09:00" */
function parseHvidate(v: string | number | undefined): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s.length < 12) return null;
  const y = s.slice(0, 4);
  const mo = s.slice(4, 6);
  const d = s.slice(6, 8);
  const h = s.slice(8, 10);
  const mi = s.slice(10, 12);
  const se = s.length >= 14 ? s.slice(12, 14) : "00";
  // 공공데이터 응답 시각은 KST 기준이므로 +09:00 명시.
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}+09:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRealtimeBeds(it: RealtimeItem): RealtimeBeds {
  return {
    er: parseCount(it.hvec),
    general: parseCount(it.hvgc),
    surgery: parseCount(it.hvoc),
    icuMed: parseCount(it.hvcc),
    icuSurg: parseCount(it.hvicc),
    icuNeuro: parseCount(it.hvncc),
    icuChest: parseCount(it.hvccc),
    pediatricEr: parseCount(it.hv28),
    isolation: parseCount(it.hv2),
    updatedAt: parseHvidate(it.hvidate),
  };
}

function mapListItem(
  it: ListItem,
  origin: { lat: number; lng: number },
): Hospital | null {
  const lat = Number(it.wgs84Lat);
  const lng = Number(it.wgs84Lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const distanceKm = haversineKm(origin, { lat, lng });
  return {
    id: it.hpid ?? `${lat},${lng}`,
    name: it.dutyName ?? "응급의료기관",
    type: it.dutyEmclsName ?? "응급의료기관",
    lat,
    lng,
    distanceKm,
    etaMin: estimateEtaMin(distanceKm),
    capacity: "unknown",
    bedsAvailable: 0,
    bedsTotal: 0,
    address: it.dutyAddr ?? "",
    tel: it.dutyTel3 ?? it.dutyTel1 ?? "",
    tags: [],
  };
}

/**
 * 사용자 좌표에서 가까운 시·도 N 개를 거리순으로 반환.
 * 광역단위만 가져오는 list 호출의 풀을 결정한다.
 *
 * 주의: 경기도·강원도 등 면적이 큰 광역도는 사용자가 그 안에 있어도
 * "중심좌표"까지 거리가 멀어 누락될 수 있다 (예: 김포에서 경기도 중심까지 67km).
 * 이 함수는 보조용이며, 실제 위치 시·도는 `fetchNearestStage1Seeds` 가 보강한다.
 *
 * 반경에 비례해 더 많은 시·도를 가져온다.
 */
function pickNearbyStage1(
  origin: { lat: number; lng: number },
  radiusKm: number,
): string[] {
  const sorted = STAGE1_CENTROIDS.map((c) => ({
    name: c.name,
    d: haversineKm(origin, { lat: c.lat, lng: c.lng }),
  })).sort((a, b) => a.d - b.d);

  // 작은 반경에서도 인접 시·도(특히 광역도)를 놓치지 않도록 기본값을 넉넉히.
  let n = 3;
  if (radiusKm > 30) n = 4;
  if (radiusKm > 80) n = 5;
  if (radiusKm > 150) n = 6;

  // 반경 + 안전 여유(150km)보다 먼 중심만 제외 (광역도 포함을 위해 충분히 관대하게).
  const candidates = sorted.filter((s) => s.d <= radiusKm + 150);
  const picked = (candidates.length > 0 ? candidates : sorted).slice(0, n);
  return picked.map((p) => p.name);
}

/**
 * dutyAddr 의 첫 토큰을 시·도(STAGE1)로 추출. "서울특별시 동대문구 …" → "서울특별시"
 * 공공데이터 Q0 파라미터는 dutyAddr 의 표기를 그대로 받는 것이 가장 안전.
 */
function extractStage1FromAddr(addr: string | undefined): string | null {
  if (!addr) return null;
  const m = addr.trim().match(/^(\S+)/);
  return m ? m[1] : null;
}

/**
 * 위치 조회 API 로 nearest 응급실 1~3 개를 받아 그 주소에서 STAGE1 을 추출한다.
 * 사용자가 실제로 속한 광역시·도를 정확히 알아내는 용도이며, 결과 자체는 버린다.
 */
async function fetchNearestStage1Seeds(
  origin: { lat: number; lng: number },
  signal: AbortSignal,
): Promise<string[]> {
  try {
    const url = new URL(LOC_ENDPOINT);
    url.searchParams.set("serviceKey", SERVICE_KEY);
    url.searchParams.set("WGS84_LON", String(origin.lng));
    url.searchParams.set("WGS84_LAT", String(origin.lat));
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set("_type", "json");
    const body = await fetchJson<PublicDataEnvelope<ListItem>>(url, signal);
    const raw = body?.response?.body?.items;
    if (!raw) return [];
    const item = raw.item;
    if (!item) return [];
    const arr = Array.isArray(item) ? item : [item];
    const seen = new Set<string>();
    for (const it of arr) {
      const s = extractStage1FromAddr(it.dutyAddr);
      if (s) seen.add(s);
    }
    return Array.from(seen);
  } catch {
    return [];
  }
}

interface PublicDataEnvelope<T> {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      items?: { item?: T | T[] } | "";
      totalCount?: number;
    };
  };
}

async function fetchJson<T>(url: URL, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 20 },
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchListForStage1(
  stage1: string,
  signal: AbortSignal,
): Promise<ListItem[]> {
  const url = new URL(LIST_ENDPOINT);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("Q0", stage1);
  url.searchParams.set("pageNo", "1");
  // 시·도 당 응급실 ~150 개 수준. 여유 있게.
  url.searchParams.set("numOfRows", "300");
  url.searchParams.set("_type", "json");
  const body = await fetchJson<PublicDataEnvelope<ListItem>>(url, signal);
  const raw = body?.response?.body?.items;
  if (!raw) return [];
  const item = raw.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function fetchListItems(
  stage1List: string[],
  signal: AbortSignal,
): Promise<ListItem[]> {
  const results = await Promise.allSettled(
    stage1List.map((s) => fetchListForStage1(s, signal)),
  );
  const merged: ListItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const it of r.value) {
      const key = it.hpid ?? `${it.wgs84Lat},${it.wgs84Lon}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(it);
    }
  }
  return merged;
}

async function fetchRealtimeMapForStage1(
  stage1: string,
  signal: AbortSignal,
): Promise<Map<string, RealtimeBeds>> {
  const url = new URL(RTM_ENDPOINT);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("STAGE1", stage1);
  url.searchParams.set("pageNo", "1");
  // 광역시·도 단위 응급실 수는 최대 ~150 개 수준. 여유 있게.
  url.searchParams.set("numOfRows", "300");
  url.searchParams.set("_type", "json");
  const body = await fetchJson<PublicDataEnvelope<RealtimeItem>>(url, signal);
  const raw = body?.response?.body?.items;
  const map = new Map<string, RealtimeBeds>();
  if (!raw) return map;
  const item = raw.item;
  if (!item) return map;
  const arr = Array.isArray(item) ? item : [item];
  for (const it of arr) {
    if (!it.hpid) continue;
    map.set(it.hpid, toRealtimeBeds(it));
  }
  return map;
}

async function fetchRealtimeMap(
  stage1List: string[],
  signal: AbortSignal,
): Promise<Map<string, RealtimeBeds>> {
  const merged = new Map<string, RealtimeBeds>();
  // 1~3 개의 시·도만 호출되므로 병렬.
  const results = await Promise.allSettled(
    stage1List.map((s) => fetchRealtimeMapForStage1(s, signal)),
  );
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const [k, v] of r.value) merged.set(k, v);
  }
  return merged;
}

function mockResponse(
  origin: { lat: number; lng: number },
  limit: number,
): HospitalSearchResponse {
  const hospitals: Hospital[] = MOCK_HOSPITALS.slice(0, limit).map((m, i) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    lat: 37.5665 + (i - 2) * 0.01,
    lng: 126.978 + (i - 2) * 0.012,
    distanceKm: m.distanceKm,
    etaMin: m.etaMin,
    capacity: m.capacity,
    bedsAvailable: m.bedsAvailable,
    bedsTotal: m.bedsTotal,
    address: m.address,
    tel: m.tel,
    tags: m.tags,
  }));
  return {
    source: "mock",
    hospitals,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const { lat, lng, radiusKm, limit } = parsed.data;
  const origin = { lat, lng };

  if (!SERVICE_KEY) {
    return NextResponse.json(mockResponse(origin, limit), {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const ctrl = new AbortController();
  // 클라이언트가 끊으면 upstream 요청도 정리.
  req.signal.addEventListener("abort", () => ctrl.abort(), { once: true });

  try {
    // 1) 사용자 좌표가 실제로 속한 시·도를 위치조회 API 의 nearest 결과에서 추출하고,
    //    centroid 기반으로 인접 시·도를 보강한다. 두 시드를 합쳐 응급실 풀을 결정.
    //    centroid 단독으로는 광역도(경기·강원 등) 중심까지 멀어 작은 반경에서
    //    사용자가 속한 시·도가 통째로 빠지는 문제가 발생하기 때문.
    const [seedFromLoc, seedFromCentroid] = await Promise.all([
      fetchNearestStage1Seeds(origin, ctrl.signal),
      Promise.resolve(pickNearbyStage1(origin, radiusKm)),
    ]);
    const stage1List = Array.from(new Set([...seedFromLoc, ...seedFromCentroid]));

    // 2) 같은 stage1List 를 입력으로 하는 두 호출(목록/실시간 가용병상)을
    //    동시에 시작한다. 이전에는 listItems → base → realtimeMap 순차였는데,
    //    realtimeMap 은 base 와 무관하므로 동시 시작이 가능하다.
    //    bedTotals(정원) 는 응답에서 제외 — 병원당 1회 호출 × 20개로 응답
    //    시간의 70% 를 차지하던 주범. 정원은 마커/카드 표시에 필수가 아니라
    //    capacity 색상은 realtime.er 절대값 폴백으로도 정확히 분류된다.
    //    정원 정보가 필요한 화면은 별도 엔드포인트로 lazy fetch 권장.
    const [listItems, realtimeByHpid] = await Promise.all([
      fetchListItems(stage1List, ctrl.signal),
      fetchRealtimeMap(stage1List, ctrl.signal),
    ]);

    // 3) 좌표 → Haversine 거리 → 반경 필터 → 거리순 정렬 → 상위 limit 만 채택.
    const base = listItems
      .map((it) => mapListItem(it, origin))
      .filter((h): h is Hospital => h !== null)
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    if (base.length === 0) {
      const empty: HospitalSearchResponse = {
        source: "public-data",
        hospitals: [],
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(empty, {
        status: 200,
        headers: { "Cache-Control": "private, max-age=15" },
      });
    }

    const hospitals: Hospital[] = base.map((h) => {
      const rt = realtimeByHpid.get(h.id);
      const er = rt?.er ?? null;

      // 정원 정보 없이도 capacity 분류는 절대값 fallback 으로 정확.
      // bedsAvailable 은 realtime.er 그대로, bedsTotal 은 0 (UI 에서 단독 표시).
      const bedsAvailable = er !== null && er > 0 ? er : 0;

      return {
        ...h,
        capacity: classifyCapacity(er, null),
        bedsAvailable,
        bedsTotal: 0,
        realtime: rt,
      };
    });

    const out: HospitalSearchResponse = {
      source: "public-data",
      hospitals,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(out, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=15" },
    });
  } catch {
    return NextResponse.json(mockResponse(origin, limit), { status: 200 });
  }
}
