"use client";

import type {
  BedTotals,
  HospitalSearchRequest,
  HospitalSearchResponse,
} from "@/types/hospital";

export async function fetchNearbyHospitals(
  req: HospitalSearchRequest,
  signal?: AbortSignal,
): Promise<HospitalSearchResponse> {
  const url = new URL("/api/v1/hospitals/search", window.location.origin);
  url.searchParams.set("lat", String(req.lat));
  url.searchParams.set("lng", String(req.lng));
  if (req.radiusKm) url.searchParams.set("radiusKm", String(req.radiusKm));
  if (req.limit) url.searchParams.set("limit", String(req.limit));

  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Hospital search failed: ${res.status}`);
  }
  return (await res.json()) as HospitalSearchResponse;
}

/**
 * 응급실 정원(BedTotals) 단건 lazy fetch.
 * 검색 응답 속도를 위해 메인 응답에서 정원을 뺐기 때문에,
 * 사용자가 특정 병원 카드를 펼칠 때만 호출한다.
 */
export async function fetchHospitalTotals(
  hpid: string,
  signal?: AbortSignal,
): Promise<BedTotals | null> {
  const url = new URL(
    `/api/v1/hospitals/${encodeURIComponent(hpid)}/totals`,
    window.location.origin,
  );
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const body = (await res.json()) as { totals: BedTotals | null };
  return body.totals ?? null;
}
