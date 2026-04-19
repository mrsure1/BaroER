"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  loadNaverMaps,
  NAVER_MAP_CLIENT_ID,
  onNaverAuthFailure,
  type NaverLatLng,
  type NaverMapInstance,
  type NaverMapsNamespace,
  type NaverMarkerInstance,
} from "@/lib/naverMaps";
import type { CapacityLevel, Hospital } from "@/types/hospital";

interface NaverMapProps {
  center: { lat: number; lng: number };
  hospitals: Hospital[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number | string;
}

const CAPACITY_COLOR: Record<CapacityLevel, string> = {
  available: "#22c55e",
  busy: "#f97316",
  full: "#ef4444",
  unknown: "#94a3b8",
};

function pinHTML(label: string, color: string, active: boolean) {
  const ringColor = active ? "#111827" : "#ffffff";
  const scale = active ? "scale(1.12)" : "scale(1)";
  return `
    <div style="transform:${scale};transform-origin:bottom center;transition:transform .18s ease;display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
      <div style="position:relative;display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;background:${color};color:white;font-weight:700;font-size:13px;border:3px solid ${ringColor};box-shadow:0 6px 16px -4px rgba(0,0,0,.35);">
        ${label}
      </div>
      <div style="width:0;height:0;margin-top:-2px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div>
    </div>
  `;
}

/**
 * 사용자 현재 위치 마커 — 구글/네이버맵 표준 스타일.
 * 가운데 파란 점 + 흰 외곽 + 펄스 링(SVG <animate> 로 애니메이션).
 * 캔버스 56×56, 중심(28,28) 에 anchor 를 맞춘다.
 */
const USER_LOC_HTML = `
<div style="position:relative;width:56px;height:56px;pointer-events:none;">
  <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="28" cy="28" r="10" fill="#3b82f6" fill-opacity="0.18">
      <animate attributeName="r" values="10;26;10" dur="2s" repeatCount="indefinite" />
      <animate attributeName="fill-opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="28" cy="28" r="10" fill="#ffffff" />
    <circle cx="28" cy="28" r="7" fill="#3b82f6" />
  </svg>
</div>
`;

/**
 * 진단 단계. 모바일에선 devtools 를 못 보니 화면에 직접 노출해서
 * "어디서 멈췄는지" 를 사용자가 바로 알 수 있게 한다.
 */
type DiagStage =
  | "init"
  | "sdk-loading"
  | "sdk-loaded"
  | "map-created"
  | "tiles-ok"
  | "auth-failed"
  | "load-error"
  | "no-size";

export function NaverMap({
  center,
  hospitals,
  selectedId,
  onSelect,
  // dvh 단위는 일부 안드로이드/구형 사파리에서 0으로 평가돼 컨테이너 높이가
  // 사라지는 경우가 있어 호환성 가장 좋은 vh 를 기본으로 쓰고, 카드에
  // minHeight 도 함께 걸어 컨테이너가 절대 0이 되지 않도록 한다.
  height = "60vh",
}: NaverMapProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarkerInstance[]>([]);
  const userMarkerRef = useRef<NaverMarkerInstance | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const tileWatchRef = useRef<number | null>(null);
  // 초기 fit-bounds 를 "이 center 좌표에 대해 한 번만" 수행하기 위한 가드.
  // 사용자가 지도를 팬/줌한 이후에는 병원 리스트가 바뀌어도 자동으로 줌을
  // 재조정하지 않는다. coords 변경(새 검색) 시엔 키가 달라져 다시 1회 fit.
  const fitDoneForRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState<DiagStage>("init");
  const [containerSize, setContainerSize] = useState<{
    w: number;
    h: number;
    cardH: number;
  }>({ w: 0, h: 0, cardH: 0 });

  // Initialize the Naver map exactly once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (!NAVER_MAP_CLIENT_ID) {
      setError("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 가 설정되어 있지 않습니다.");
      return;
    }
    let cancelled = false;

    // 네이버 지도 SDK 의 도메인 인증 실패 시 호출되는 전역 콜백.
    // 등록되지 않은 도메인으로 접속하면 SDK 로드/Map 인스턴스 생성은 성공하지만
    // 타일은 빈 회색으로 그려진다. 사용자가 원인을 알 수 있도록 메시지로 노출.
    const offAuthFailure = onNaverAuthFailure(() => {
      setDiag("auth-failed");
      setError(
        "네이버 클라우드 콘솔에 현재 접속한 도메인이 등록되어 있지 않습니다.\n" +
          "Maps Application 의 'Web 서비스 URL' 에 " +
          window.location.origin +
          " 를 추가해 주세요.",
      );
    });

    setDiag("sdk-loading");
    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        setDiag("sdk-loaded");
        const initialPos = new maps.LatLng(center.lat, center.lng);
        mapRef.current = new maps.Map(containerRef.current, {
          center: initialPos,
          zoom: 13,
          zoomControl: true,
          mapDataControl: false,
          logoControl: true,
          scaleControl: false,
          tileTransition: true,
        });
        setDiag("map-created");

        // 사용자 위치 마커는 map 인스턴스가 만들어진 직후 동기적으로 생성한다.
        // (별도 useEffect 에서 만들면 mount 시점엔 mapRef 가 아직 null 이라
        //  early return 되어 마커가 영원히 안 그려지는 race 가 발생.)
        userMarkerRef.current = new maps.Marker({
          position: initialPos,
          map: mapRef.current,
          zIndex: 200,
          icon: {
            content: USER_LOC_HTML,
            anchor: new maps.Point(28, 28),
          },
          title: "내 위치",
        });

        const forceResize = () => {
          const el = containerRef.current;
          const m = mapRef.current;
          if (!el || !m || !m.setSize) return;
          const w = el.clientWidth;
          const h = el.clientHeight;
          const cardH = cardRef.current?.clientHeight ?? 0;
          setContainerSize({ w, h, cardH });
          if (w > 0 && h > 0) m.setSize(new maps.Size(w, h));
        };
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            forceResize();
            window.setTimeout(forceResize, 300);
          }),
        );

        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          resizeObsRef.current = new ResizeObserver(forceResize);
          resizeObsRef.current.observe(containerRef.current);
        }

        // 새 NCP Application Services Maps 는 도메인 미등록 시 authFailure 콜백을
        // 호출하지 않는 케이스가 있다. 컨테이너 안에 실제 타일 <img> 가 그려졌는지
        // 4 초 뒤 확인해서, 비어 있으면 인증/타일 로드 실패로 간주.
        tileWatchRef.current = window.setTimeout(() => {
          const el = containerRef.current;
          if (!el) return;
          const hasTile = el.querySelector("img, canvas") !== null;
          if (hasTile) {
            setDiag("tiles-ok");
          } else if (el.clientWidth === 0 || el.clientHeight === 0) {
            setDiag("no-size");
          } else {
            setDiag("auth-failed");
            setError(
              "지도 타일이 로드되지 않았습니다.\n" +
                "네이버 클라우드 콘솔의 Maps Application →\n" +
                "'Web 서비스 URL' 에 다음 도메인을 추가하세요:\n" +
                window.location.origin,
            );
          }
        }, 4000);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setDiag("load-error");
          setError(e.message);
        }
      });
    return () => {
      cancelled = true;
      offAuthFailure();
      if (tileWatchRef.current) {
        window.clearTimeout(tileWatchRef.current);
        tileWatchRef.current = null;
      }
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center map + sync user-location marker whenever origin changes.
  // (마커 자체는 map 초기화 useEffect 에서 동기적으로 생성된다.)
  // SDK 가 이미 로드된 상태(거의 항상 그렇다)면 동기적으로 처리해 한 프레임 빨리.
  useEffect(() => {
    if (!mapRef.current) return;
    const maps = window.naver?.maps;
    if (!maps) return; // 초기화 effect 가 아직 안 끝남 — 다음 사이클에 다시 이 effect 호출됨
    const pos = new maps.LatLng(center.lat, center.lng);
    mapRef.current.setCenter(pos);
    const um = userMarkerRef.current as unknown as
      | { setPosition: (p: NaverLatLng) => void }
      | null;
    um?.setPosition(pos);
  }, [center.lat, center.lng]);

  // Sync hospital markers — 동기 path 우선, SDK 미로드 시에만 await.
  useEffect(() => {
    if (!mapRef.current) return;

    const drawMarkers = (maps: NaverMapsNamespace) => {
      if (!mapRef.current) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = hospitals.map((h, i) => {
        const active = selectedId === h.id;
        const marker = new maps.Marker({
          position: new maps.LatLng(h.lat, h.lng),
          map: mapRef.current!,
          zIndex: active ? 100 : 10 + i,
          icon: {
            content: pinHTML(String(i + 1), CAPACITY_COLOR[h.capacity], active),
            anchor: new maps.Point(17, 42),
          },
          title: h.name,
        });
        if (onSelect) {
          maps.Event.addListener(marker, "click", () => onSelect(h.id));
        }
        return marker;
      });

      // 검색 결과가 처음 도착했을 때 단 한 번 "내 위치 + 모든 병원" 이 한
      // 화면에 담기도록 fit. 사용자가 이후에 직접 팬/줌한 걸 덮어쓰지 않게
      // coords 기준 키를 저장해두고 동일 키에서는 재실행하지 않는다.
      const fitKey = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
      if (
        hospitals.length > 0 &&
        fitDoneForRef.current !== fitKey &&
        typeof mapRef.current.fitBounds === "function"
      ) {
        try {
          const userLL = new maps.LatLng(center.lat, center.lng);
          const bounds = new maps.LatLngBounds(userLL, userLL);
          for (const h of hospitals) {
            bounds.extend(new maps.LatLng(h.lat, h.lng));
          }
          // 네이버 지도 SDK 는 padding 을 객체로 받는다 (숫자로 넣으면 무시됨).
          // 상단은 선택 병원 요약 overlay, 하단은 디버그 칩 공간을 고려해 여유.
          mapRef.current.fitBounds(bounds, {
            top: 56,
            right: 40,
            bottom: 80,
            left: 40,
          });
          // fitBounds 는 모든 마커가 들어가는 "최소 줌" 을 선택하기 때문에
          // 보이는 거리감이 멀게 느껴질 수 있다. 사용자 요청에 따라 한 단계
          // 더 줌인해서 병원 위치를 좀 더 가까이 보여준다.
          // (사용자가 직접 줌아웃 하면 이후엔 fitDoneForRef 로 잠겨서 자동
          //  재조정되지 않으니 안전.)
          try {
            const z = mapRef.current.getZoom?.();
            if (typeof z === "number") {
              mapRef.current.setZoom(z + 1, true);
            }
          } catch {
            /* zoom 조정 실패는 무시 */
          }
          fitDoneForRef.current = fitKey;
        } catch {
          /* fit 실패는 치명적이지 않음 — 기본 줌으로 표시 */
        }
      }
    };

    const ready = window.naver?.maps;
    if (ready) {
      // Fast path: SDK 캐시 hit. 동기적으로 즉시 마커 그리기.
      drawMarkers(ready);
      return;
    }
    let cancelled = false;
    loadNaverMaps()
      .then((maps) => {
        if (!cancelled) drawMarkers(maps);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hospitals, selectedId, onSelect, center.lat, center.lng]);

  if (error || !NAVER_MAP_CLIENT_ID) {
    return (
      <Card
        className="relative grid place-items-center overflow-hidden border-dashed"
        style={{ height }}
      >
        <div className="px-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2 text-text-muted">
            <MapPin className="size-5" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-text">
            지도를 표시할 수 없어요
          </p>
          <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-text-subtle">
            {error ?? "환경변수에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 를 설정해 주세요."}
          </p>
        </div>
      </Card>
    );
  }

  const showDiag =
    process.env.NODE_ENV !== "production" && diag !== "tiles-ok";

  return (
    <Card
      ref={cardRef}
      className="relative overflow-hidden p-0"
      style={{ height, minHeight: 360 }}
    >
      {/*
        부모 Card 가 어떤 이유로 minHeight 를 무시당해 0 이 되더라도
        컨테이너만큼은 절대 0 높이가 되지 않도록 인라인으로 fallback 픽셀을 박는다.
      */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ minHeight: 360 }}
      />
      {showDiag && (
        <div
          className="pointer-events-none absolute left-2 top-2 z-50 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white"
          style={{ maxWidth: "calc(100% - 16px)" }}
        >
          <div>map: {diag}</div>
          <div>
            size: {containerSize.w}×{containerSize.h} card:{containerSize.cardH}
          </div>
          <div>hosp: {hospitals.length}</div>
        </div>
      )}
    </Card>
  );
}
