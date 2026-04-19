export type CapacityLevel = "available" | "busy" | "full" | "unknown";

/**
 * 응급실 실시간 가용 자원 — 공공데이터 응급의료정보 API
 * `getEmrrmRltmUsefulSckbdInfoInqire` 응답의 핵심 필드를 정규화한 형태.
 * 값이 알 수 없거나 미보고면 `null`.
 */
export interface RealtimeBeds {
  /** 응급실 가용 병상 (hvec) */
  er: number | null;
  /** 일반 입원실 가용 (hvgc) */
  general: number | null;
  /** 수술실 가용 (hvoc) */
  surgery: number | null;
  /** 내과 중환자실 (hvcc) */
  icuMed: number | null;
  /** 외과 중환자실 (hvicc) */
  icuSurg: number | null;
  /** 신경과 중환자실 (hvncc) */
  icuNeuro: number | null;
  /** 흉부 중환자실 (hvccc) */
  icuChest: number | null;
  /** 소아 응급실 (hv28) */
  pediatricEr: number | null;
  /** 격리 병상 (hv2) */
  isolation: number | null;
  /** 보고 시각 ISO 문자열 (hvidate → ISO) */
  updatedAt: string | null;
}

/**
 * 응급실 기본정보 — `getEgytBassInfoInqire` 의 정원/총 병상 정보.
 * 거의 변하지 않으므로 길게 캐싱 가능.
 */
export interface BedTotals {
  /** 응급실 정원 병상 (hperyn) */
  er: number | null;
  /** 입원실 정원 (hpgryn) */
  general: number | null;
  /** 수술실 정원 (hpopyn) */
  surgery: number | null;
  /** 중환자실 정원 (hpicuyn) */
  icu: number | null;
  /** 신생아 중환자실 정원 (hpnicuyn) */
  nicu: number | null;
  /** 전체 병상 정원 (hpbdn) */
  total: number | null;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMin: number;
  capacity: CapacityLevel;
  /** 응급실 가용 병상 (실시간) — RealtimeBeds.er 와 동일 */
  bedsAvailable: number;
  /**
   * 응급실 총 운영 병상.
   * 위치조회/실시간 API 모두 정확한 정원을 제공하지 않으므로
   * 현재는 가용병상 + 알파의 추정치이거나 0 일 수 있다.
   */
  bedsTotal: number;
  /** 실시간 가용 병상이 있을 때만 채워짐 */
  realtime?: RealtimeBeds;
  /** 응급실/병상 정원 (기본정보 API). 모든 hpid에 대해 받는 게 보장되지는 않음. */
  totals?: BedTotals;
  address: string;
  tel: string;
  tags: string[];
}

export interface HospitalSearchRequest {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface HospitalSearchResponse {
  source: "public-data" | "mock";
  hospitals: Hospital[];
  generatedAt: string;
}
