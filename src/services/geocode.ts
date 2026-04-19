"use client";

/**
 * 좌표 → 한글 주소(Reverse Geocoding) 클라이언트 래퍼.
 *
 * 서버 라우트 `/api/v1/geocode/reverse` 를 호출한다. 실패하거나 결과가
 * 없으면 `null` 을 리턴 — 호출부는 좌표 폴백으로 표시하면 된다.
 *
 * 동일 좌표(소수점 4자리까지 반올림) 는 세션 내에서 캐시해 API 호출을 아낀다.
 */

const cache = new Map<string, string | null>();

function keyOf(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const k = keyOf(lat, lng);
  if (cache.has(k)) return cache.get(k) ?? null;

  try {
    const url = new URL("/api/v1/geocode/reverse", window.location.origin);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      cache.set(k, null);
      return null;
    }
    const body = (await res.json()) as { address: string | null };
    cache.set(k, body.address);
    return body.address;
  } catch {
    cache.set(k, null);
    return null;
  }
}
