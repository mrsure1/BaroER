"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  loadNaverMaps,
  NAVER_MAP_CLIENT_ID,
  type NaverMapInstance,
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

export function NaverMap({
  center,
  hospitals,
  selectedId,
  onSelect,
  height = "60dvh",
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarkerInstance[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize the Naver map exactly once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (!NAVER_MAP_CLIENT_ID) {
      setError("Naver 지도 클라이언트 ID가 설정되어 있지 않아 placeholder가 표시됩니다.");
      return;
    }
    let cancelled = false;
    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(center.lat, center.lng),
          zoom: 13,
          zoomControl: true,
          mapDataControl: false,
          logoControl: true,
          scaleControl: false,
          tileTransition: true,
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when the origin changes.
  useEffect(() => {
    if (!mapRef.current) return;
    loadNaverMaps()
      .then((maps) => {
        mapRef.current?.setCenter(new maps.LatLng(center.lat, center.lng));
      })
      .catch(() => undefined);
  }, [center.lat, center.lng]);

  // Sync markers.
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
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
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hospitals, selectedId, onSelect]);

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
          <p className="mt-1 text-[12px] text-text-subtle">
            {error ?? "환경변수에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 를 설정해 주세요."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden p-0" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
    </Card>
  );
}
