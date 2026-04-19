"use client";

/**
 * Lazy-loads the Naver Maps JS v3 SDK exactly once. Subsequent callers
 * receive the same in-flight promise, so we never inject the script twice.
 *
 * We avoid pulling in @types/navermaps; the public surface we need is
 * narrow enough to declare inline.
 */

export interface NaverLatLng {
  lat(): number;
  lng(): number;
}
export interface NaverSize {
  width: number;
  height: number;
}
export interface NaverLatLngBounds {
  extend(latlng: NaverLatLng): void;
}
export interface NaverMapInstance {
  setCenter(latlng: NaverLatLng): void;
  setZoom(z: number, useEffect?: boolean): void;
  setSize?(size: NaverSize): void;
  /** padding 은 네이버 SDK v3 에서 `{ top, right, bottom, left }` 형태의 객체를 받는다. */
  fitBounds?(
    bounds: NaverLatLngBounds,
    padding?: number | { top: number; right: number; bottom: number; left: number },
  ): void;
  destroy(): void;
}
export interface NaverMarkerInstance {
  setMap(map: NaverMapInstance | null): void;
  addListener(event: string, cb: () => void): void;
}

export interface NaverMapsNamespace {
  Map: new (
    el: HTMLElement,
    opts: {
      center: NaverLatLng;
      zoom?: number;
      zoomControl?: boolean;
      logoControl?: boolean;
      mapDataControl?: boolean;
      scaleControl?: boolean;
      tileTransition?: boolean;
    },
  ) => NaverMapInstance;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Marker: new (opts: {
    position: NaverLatLng;
    map: NaverMapInstance;
    icon?: { content: string; anchor?: NaverPoint };
    title?: string;
    zIndex?: number;
  }) => NaverMarkerInstance;
  Point: new (x: number, y: number) => NaverPoint;
  Size: new (width: number, height: number) => NaverSize;
  LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds;
  Event: {
    addListener: (
      target: NaverMarkerInstance | NaverMapInstance,
      event: string,
      cb: () => void,
    ) => void;
  };
}

export interface NaverPoint {
  x: number;
  y: number;
}

declare global {
  interface Window {
    naver?: { maps: NaverMapsNamespace };
    /** 네이버 지도 인증 실패 콜백 — SDK 가 호출. 도메인 미등록 등의 사유. */
    navermap_authFailure?: () => void;
  }
}

/** 인증 실패 발생 시 호출될 리스너들. */
type AuthFailureListener = () => void;
const authFailureListeners = new Set<AuthFailureListener>();

export function onNaverAuthFailure(cb: AuthFailureListener): () => void {
  authFailureListeners.add(cb);
  return () => {
    authFailureListeners.delete(cb);
  };
}

/** 전역 콜백을 한 번만 설치한다. */
function installAuthFailureHook() {
  if (typeof window === "undefined") return;
  if (window.navermap_authFailure) return;
  window.navermap_authFailure = () => {
    for (const cb of authFailureListeners) {
      try {
        cb();
      } catch {
        /* swallow */
      }
    }
  };
}

export const NAVER_MAP_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

let inflight: Promise<NaverMapsNamespace> | null = null;

export function loadNaverMaps(): Promise<NaverMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Naver Maps cannot be loaded on the server."));
  }
  installAuthFailureHook();
  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps);
  }
  if (!NAVER_MAP_CLIENT_ID) {
    return Promise.reject(new Error("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not set."));
  }
  if (inflight) return inflight;

  inflight = new Promise((resolve, reject) => {
    const existing = document.getElementById("naver-maps-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.naver?.maps) resolve(window.naver.maps);
        else reject(new Error("Naver Maps loaded but namespace missing."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Naver Maps script failed to load.")),
      );
      return;
    }
    const s = document.createElement("script");
    s.id = "naver-maps-sdk";
    s.async = true;
    // 2024년 후반 NCP Application Services Maps 로 마이그레이션되며
    // 인증 파라미터가 ncpClientId → ncpKeyId 로 변경됐다.
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      NAVER_MAP_CLIENT_ID,
    )}`;
    s.onload = () => {
      if (window.naver?.maps) resolve(window.naver.maps);
      else reject(new Error("Naver Maps loaded but namespace missing."));
    };
    s.onerror = () => {
      inflight = null;
      reject(new Error("Naver Maps script failed to load."));
    };
    document.head.appendChild(s);
  });

  return inflight;
}
