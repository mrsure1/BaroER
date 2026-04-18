"use client";

import type {
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
