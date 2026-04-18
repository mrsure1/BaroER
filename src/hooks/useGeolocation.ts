"use client";

/** Seoul City Hall — sane fallback when permission denied / unavailable. */
export const FALLBACK_COORDS = { lat: 37.5665, lng: 126.978 } as const;

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
  fallback?: boolean;
}

/**
 * Promise-based one-shot geolocation helper. Always resolves with coords —
 * uses the fallback if permission denied / unavailable / timed out.
 */
export function getCurrentCoords(timeoutMs = 8000): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve({ ...FALLBACK_COORDS, fallback: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve({ ...FALLBACK_COORDS, fallback: true }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
