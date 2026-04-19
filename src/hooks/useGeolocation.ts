"use client";

/** Seoul City Hall — sane fallback when permission denied / unavailable. */
export const FALLBACK_COORDS = { lat: 37.5665, lng: 126.978 } as const;

export type GeoFallbackReason =
  | "unsupported"
  | "insecure_context"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
  fallback?: boolean;
  reason?: GeoFallbackReason;
}

function fallback(reason: GeoFallbackReason): Coords {
  return { ...FALLBACK_COORDS, fallback: true, reason };
}

/**
 * Promise-based one-shot geolocation helper. Always resolves with coords —
 * uses Seoul City Hall when permission denied / unavailable / timed out,
 * and propagates the precise reason so the UI can guide the user.
 *
 * 전략 (모바일 친화):
 *  1. 우선 `enableHighAccuracy: true` 로 GPS 측위 시도 (모바일에서 정확).
 *  2. timeout / position_unavailable 발생 시 `enableHighAccuracy: false` (Wi-Fi / IP) 로 폴백 재시도.
 *  3. 그래도 실패하면 reason 과 함께 서울시청 좌표로 폴백.
 *
 * 주의: `secure context` 가 아니면 브라우저가 즉시 거부하므로 HTTPS / localhost 필요.
 */
export function getCurrentCoords(timeoutMs = 15_000): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      console.warn("[geo] navigator.geolocation 사용 불가");
      resolve(fallback("unsupported"));
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      console.warn(
        "[geo] insecure context — HTTPS 또는 localhost 가 아닌 origin 에서는 위치 권한이 차단됩니다.",
      );
      resolve(fallback("insecure_context"));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) =>
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });

    const reasonOf = (err: GeolocationPositionError): GeoFallbackReason =>
      err.code === err.PERMISSION_DENIED
        ? "permission_denied"
        : err.code === err.POSITION_UNAVAILABLE
          ? "position_unavailable"
          : err.code === err.TIMEOUT
            ? "timeout"
            : "unknown";

    // Stage 1 — 고정밀(GPS) 시도. 모바일에서 5~20m 정확도.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        const reason = reasonOf(err);
        console.warn(`[geo] high-accuracy 실패 (${reason}):`, err.message);
        // 권한 거부는 폴백 재시도해도 의미 없음 — 즉시 종료.
        if (reason === "permission_denied") {
          resolve(fallback("permission_denied"));
          return;
        }
        // Stage 2 — 저정밀(Wi-Fi / IP) 폴백 시도. 캐시된 위치도 허용(maximumAge 5분).
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err2) => {
            const reason2 = reasonOf(err2);
            console.warn(
              `[geo] low-accuracy 폴백도 실패 (${reason2}):`,
              err2.message,
            );
            resolve(fallback(reason2));
          },
          { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
