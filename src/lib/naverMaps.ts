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
export interface NaverMapInstance {
  setCenter(latlng: NaverLatLng): void;
  setZoom(z: number, useEffect?: boolean): void;
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
  }
}

export const NAVER_MAP_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

let inflight: Promise<NaverMapsNamespace> | null = null;

export function loadNaverMaps(): Promise<NaverMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Naver Maps cannot be loaded on the server."));
  }
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
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
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
