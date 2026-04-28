"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ArrowUpDown,
  BedDouble,
  Clock,
  HeartPulse,
  List,
  Loader2,
  Map as MapIcon,
  MapPinOff,
  Navigation,
  Phone,
  Scissors,
  Search as SearchIcon,
  ShieldAlert,
  Star,
  StarOff,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { NaverMap } from "@/components/maps/NaverMap";
import { loadNaverMaps } from "@/lib/naverMaps";
import { CAPACITY_META } from "@/lib/mockHospitals";
import { fetchNearbyHospitals, fetchHospitalTotals } from "@/services/hospitals";
import { getNavApp, launchNavigation, type NavAppId } from "@/lib/navApps";
import { useNavPrefStore } from "@/stores/navPrefStore";
import { NavigatorPickerSheet } from "@/components/maps/NavigatorPickerSheet";
import { useSearchStore, type GeoReason } from "@/stores/searchStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { Hospital } from "@/types/hospital";
import { cn } from "@/lib/cn";

type View = "list" | "map";
type Sort = "eta" | "distance" | "capacity";
type SelectedHospitalSnapshot = Pick<Hospital, "id" | "name" | "etaMin" | "distanceKm" | "capacity">;

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 200;
const DEFAULT_RADIUS_KM = 15;
const RADIUS_PRESETS = [5, 15, 30, 50, 100, 200] as const;

const viewOptions = [
  { value: "list" as const, label: "리스트", icon: <List className="size-4" /> },
  { value: "map" as const, label: "지도", icon: <MapIcon className="size-4" /> },
];
const sortOptions = [
  { value: "eta" as const, label: "빠른 순" },
  { value: "distance" as const, label: "가까운 순" },
  { value: "capacity" as const, label: "수용 가능" },
];

export default function SearchResultsPage() {
  const router = useRouter();
  const coords = useSearchStore((s) => s.coords);
  const symptoms = useSearchStore((s) => s.symptoms);
  const gender = useSearchStore((s) => s.gender);
  const ageBand = useSearchStore((s) => s.ageBand);
  const notes = useSearchStore((s) => s.notes);
  const addHistory = useHistoryStore((s) => s.add);
  const updateLatestAction = useHistoryStore((s) => s.updateLatestAction);
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.add);
  const removeFavorite = useFavoritesStore((s) => s.remove);

  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<Sort>("eta");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const latestRecordedHospitalId = useRef<string | null>(null);

  // 길안내(navigation) — 사용자가 첫 사용 시 picker 로 내비 앱을 고르고,
  // 한 번 선택된 앱은 navPrefStore 에 저장되어 다음 길안내부터는 picker 없이
  // 곧장 해당 앱으로 진입한다. 설정 → 기본 내비 메뉴에서 초기화 가능.
  const navId = useNavPrefStore((s) => s.navId);
  const setNavPref = useNavPrefStore((s) => s.setNav);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDest, setPendingDest] = useState<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    etaMin: number;
    distanceKm: number;
    capacity: Hospital["capacity"];
  } | null>(null);

  const recordHospital = (
    hospital: SelectedHospitalSnapshot,
    actionType?: "navigate" | "call",
  ) => {
    const actionTaken = actionType
      ? {
          type: actionType,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          ts: Date.now(),
        }
      : undefined;

    if (latestRecordedHospitalId.current === hospital.id) {
      if (actionTaken) updateLatestAction(actionTaken);
      return;
    }

    addHistory({
      symptoms,
      gender,
      ageBand,
      notes,
      coords,
      address: null,
      selectedHospital: {
        id: hospital.id,
        name: hospital.name,
        etaMin: hospital.etaMin,
        distanceKm: hospital.distanceKm,
        capacity: hospital.capacity,
      },
      actionTaken,
    });
    latestRecordedHospitalId.current = hospital.id;
  };

  const handleNavigate = (hospital: Hospital) => {
    if (!coords) return;
    const dest = {
      id: hospital.id,
      lat: hospital.lat,
      lng: hospital.lng,
      name: hospital.name,
      etaMin: hospital.etaMin,
      distanceKm: hospital.distanceKm,
      capacity: hospital.capacity,
    };
    const origin = { lat: coords.lat, lng: coords.lng, name: "현재 위치" };
    const saved = getNavApp(navId);
    if (saved) {
      recordHospital(hospital, "navigate");
      launchNavigation(saved, origin, dest);
      return;
    }
    setPendingDest(dest);
    setPickerOpen(true);
  };

  const handlePickerSelect = (id: NavAppId) => {
    setNavPref(id);
    setPickerOpen(false);
    if (!coords || !pendingDest) return;
    const app = getNavApp(id);
    if (!app) return;
    const origin = { lat: coords.lat, lng: coords.lng, name: "현재 위치" };
    recordHospital(pendingDest, "navigate");
    // 사용자 탭 → 내비 앱 진입을 같은 user gesture 내에서 처리해야
    // iOS Safari 등에서 deep link 차단을 피한다.
    launchNavigation(app, origin, pendingDest);
    setPendingDest(null);
  };

  // 검색 결과 페이지 진입 즉시 네이버 지도 SDK 를 백그라운드 preload.
  // 사용자가 list view 를 보는 동안 SDK 다운로드 + namespace 평가가 끝나서,
  // "지도" 탭으로 전환할 때 이미 ready 상태가 된다.
  useEffect(() => {
    loadNaverMaps().catch(() => undefined);
  }, []);

  // view 전환 시 스크롤을 상단으로 리셋. 리스트에서 스크롤을 내려둔 상태로
  // 지도 탭을 눌렀을 때 지도 뷰의 실제 콘텐츠 길이를 넘어선 빈 여백이
  // 보이는 UX 이슈를 방지한다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const enabled = Boolean(coords);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hospitals", coords?.lat, coords?.lng, radiusKm],
    queryFn: ({ signal }) =>
      fetchNearbyHospitals(
        { lat: coords!.lat, lng: coords!.lng, radiusKm, limit: 20 },
        signal,
      ),
    enabled,
    staleTime: 15_000,
    // 응급실 가용병상은 1분 주기로 갱신되므로 백그라운드에서 주기적으로 다시 받아온다.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const resultHospitals = data?.hospitals ?? [];

  // 정원(BedTotals) 은 응답 속도를 위해 메인 검색 응답에서 빠져 있다.
  // 그래프를 카드 선택 전부터 보여주기 위해 검색 결과가 도착하면 각 병원의
  // 정원 정보를 병렬로 받아와 카드에 병합한다. 결과는 24h 캐싱된다.
  const totalsQueries = useQueries({
    queries: resultHospitals.map((hospital) => ({
      queryKey: ["hospitalTotals", hospital.id],
      queryFn: ({ signal }) => fetchHospitalTotals(hospital.id, signal),
      staleTime: 60 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  });

  const hospitals = useMemo(() => {
    const list = resultHospitals.map((hospital, index) => {
      const totals = totalsQueries[index]?.data;
      return totals && !hospital.totals ? { ...hospital, totals } : hospital;
    });
    if (sort === "eta") list.sort((a, b) => a.etaMin - b.etaMin);
    if (sort === "distance") list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "capacity") {
      const score = { available: 0, busy: 1, full: 2, unknown: 3 } as const;
      list.sort((a, b) => score[a.capacity] - score[b.capacity]);
    }
    return list;
  }, [resultHospitals, sort, totalsQueries]);

  const availableCount = hospitals.filter((h) => h.capacity === "available").length;

  // No coords → user landed here directly. Bounce to /search.
  if (!enabled) {
    return (
      <>
        <ScreenHeader title="검색 결과" back />
        <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4 px-5 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-surface-2 text-text-muted">
            <SearchIcon className="size-7" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-text">먼저 검색을 시작해주세요</h2>
            <p className="mt-1 text-[13.5px] text-text-muted">
              환자의 증상과 상태를 입력해야 결과를 표시할 수 있어요.
            </p>
          </div>
          <Button onClick={() => router.replace("/search")} size="lg">
            검색 화면으로 가기
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title="검색 결과"
        subtitle={
          isLoading
            ? `반경 ${radiusKm}km · 응급실을 찾는 중…`
            : `반경 ${radiusKm}km · ${hospitals.length}개 · 수용 가능 ${availableCount}곳`
        }
        back
        right={<SortMenu sort={sort} onChange={setSort} />}
      />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-6">
        {coords?.fallback && (
          <Card className="mb-3 flex items-start gap-2.5 border-status-busy/40 bg-status-busy-soft p-3">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-status-busy" />
            <div className="text-[12.5px] leading-relaxed text-text">
              <p>
                <strong>서울시청</strong> 좌표 기준으로 표시됩니다 — {fallbackReasonText(coords.reason)}
              </p>
              <p className="mt-1 text-text-muted">
                {fallbackHowToFix(coords.reason)}
              </p>
            </div>
          </Card>
        )}

        {data?.source === "mock" && (
          <Card className="mb-3 border-dashed border-border-strong p-3">
            <p className="text-[12px] text-text-muted">
              <span className="font-semibold text-text">데모 데이터</span>를 표시하고 있어요.
              `PUBLIC_DATA_PORTAL_SERVICE_KEY` 환경변수를 설정하면 실제 응급실 정보를 가져옵니다.
            </p>
          </Card>
        )}

        <Card className="mb-3 px-3 py-2">
          <RadiusSlider value={radiusKm} onCommit={setRadiusKm} />
        </Card>

        <SegmentedControl
          options={viewOptions}
          value={view}
          onChange={setView}
          fullWidth
          ariaLabel="결과 표시 방식"
        />

        <div className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <Card className="p-5 text-center">
              <p className="text-[14px] text-text">결과를 불러오지 못했어요.</p>
              <Button className="mt-3" variant="outline" onClick={() => refetch()}>
                다시 시도
              </Button>
            </Card>
          ) : (
            // view 전환 정책 — 빈 여백 vs. 지도 재초기화의 trade-off.
            //
            // (1) **List view** 가 비활성일 때는 `height: 0` 로 접는다.
            //     → 지도 탭에서 리스트 카드의 높이만큼 빈 스크롤이 남는
            //        문제를 원천 제거.
            //     → 카드 컴포넌트는 unmount 되지 않으므로 다시 list 탭으로
            //        돌아갈 때 즉시 보인다.
            //
            // (2) **Map view** 는 비활성일 때 화면 밖(absolute+offscreen)으로
            //     옮겨 NaverMap 인스턴스를 살아있게 둔다 — SDK 가 0×0
            //     컨테이너에서는 타일 요청을 하지 않기 때문에, 사이즈를 유지해야
            //     "지도" 탭 전환 시 즉시 보인다.
            <div className="relative">
              <div
                aria-hidden={view !== "list"}
                style={
                  view === "list"
                    ? undefined
                    : {
                        // 빈 스크롤 영역 제거 — 카드들의 자연 높이가 부모에
                        // 흘러들어가지 않도록 0 으로 접는다.
                        height: 0,
                        overflow: "hidden",
                        visibility: "hidden",
                        pointerEvents: "none",
                      }
                }
                className="flex flex-col gap-2.5"
              >
                {hospitals.length === 0 ? (
                  <EmptyResults radiusKm={radiusKm} />
                ) : (
                  hospitals.map((h, i) => (
                    <HospitalCard
                      key={h.id}
                      hospital={h}
                      index={i}
                      active={selectedId === h.id}
                      onTap={() => {
                        setSelectedId(h.id);
                        recordHospital(h);
                      }}
                      onDirections={() => handleNavigate(h)}
                      isFavorited={favorites.some((f) => f.id === h.id)}
                      onToggleFavorite={() => {
                        if (favorites.some((f) => f.id === h.id)) {
                          removeFavorite(h.id);
                        } else {
                          addFavorite({ id: h.id, name: h.name, address: h.address ?? "", tel: h.tel, lat: h.lat, lng: h.lng });
                        }
                      }}
                      onCall={() => recordHospital(h, "call")}
                    />
                  ))
                )}
              </div>

              <div
                aria-hidden={view !== "map"}
                style={
                  view === "map"
                    ? undefined
                    : {
                        position: "absolute",
                        left: -9999,
                        top: 0,
                        width: "100%",
                        pointerEvents: "none",
                      }
                }
              >
                <div className="relative">
                  <NaverMap
                    center={coords!}
                    hospitals={hospitals}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                  />
                  {/*
                    선택된 병원 정보는 지도 카드 위에 absolute 로 띄워, 지도 영역과
                    하단 빈 공간을 한 화면에서 모두 활용한다. wrapper 는
                    pointer-events-none 으로 두고 카드만 pointer-events-auto 를
                    켜서 지도의 패닝/마커 클릭을 가리지 않도록 한다.
                  */}
                  <AnimatePresence>
                    {selectedId && view === "map" && (
                      <motion.div
                        key="selected-overlay"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.18 }}
                        className="pointer-events-none absolute inset-x-3 bottom-3 z-20"
                      >
                        <div className="pointer-events-auto">
                          <SelectedSummary
                            hospital={
                              hospitals.find((h) => h.id === selectedId) ?? null
                            }
                            onDirections={() => {
                              const sel = hospitals.find((h) => h.id === selectedId);
                              if (sel) handleNavigate(sel);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/*
                  지도 아래 컴팩트 리스트 — 지도의 핀 번호/색상과 1:1 매칭되는
                  축약 행. 행을 탭하면 기존 selectedId 흐름을 그대로 타고 지도
                  위에 SelectedSummary 가 뜬다. 전화/길안내 같은 풀 액션은
                  리스트 뷰에 유지하여 역할을 분리.
                */}
                {hospitals.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1">
                    {hospitals.map((h, i) => (
                      <MapCompactRow
                        key={h.id}
                        index={i}
                        hospital={h}
                        active={selectedId === h.id}
                        onTap={() => {
                          setSelectedId(h.id);
                          recordHospital(h);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <NavigatorPickerSheet
        open={pickerOpen}
        currentId={navId}
        onSelect={handlePickerSelect}
        onClose={() => {
          setPickerOpen(false);
          setPendingDest(null);
        }}
      />
    </>
  );
}

function SortMenu({ sort, onChange }: { sort: Sort; onChange: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <IconButton variant="surface" aria-label="정렬" onClick={() => setOpen((v) => !v)}>
        <ArrowUpDown />
      </IconButton>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <motion.ul
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-12 z-40 min-w-[160px] overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg p-1 shadow-[var(--shadow-lg)]"
            >
              {sortOptions.map((opt) => {
                const active = opt.value === sort;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[14px] transition-colors",
                        active
                          ? "bg-primary-soft font-semibold text-primary"
                          : "text-text hover:bg-surface-2",
                      )}
                    >
                      {opt.label}
                      {active && <span className="size-1.5 rounded-full bg-primary" />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HospitalCard({
  hospital,
  index,
  active,
  onTap,
  onDirections,
  isFavorited = false,
  onToggleFavorite,
  onCall,
}: {
  hospital: Hospital;
  index: number;
  active: boolean;
  onTap: () => void;
  onDirections: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onCall?: () => void;
}) {
  const meta = CAPACITY_META[hospital.capacity];
  const er = hospital.realtime?.er ?? null;
  const erTotal = hospital.totals?.er ?? null;
  const erDisplay =
    er === null
      ? "미보고"
      : erTotal && erTotal > 0
        ? `${er}/${erTotal}`
        : String(er);
  const ratio = erTotal && erTotal > 0 && er !== null ? Math.min(1, Math.max(0, er / erTotal)) : 0;
  const showRatio = erTotal !== null && erTotal > 0 && er !== null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.18) }}
    >
      <Card
        onClick={onTap}
        className={cn(
          "cursor-pointer overflow-hidden p-0 transition-all",
          active && "ring-2 ring-primary",
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <div className={cn("relative mt-1 grid size-10 place-items-center rounded-full ring-1", meta.tone, meta.ring)}>
            {hospital.capacity === "available" && (
              <span className={cn("absolute inset-0 animate-ping rounded-full opacity-70", meta.dot)} />
            )}
            <span className={cn("relative size-2 rounded-full", meta.dot)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-semibold text-text">{hospital.name}</h3>
                <p className="mt-0.5 text-[12px] text-text-muted">{hospital.type}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", meta.tone)}>
                {meta.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
              <Stat icon={<Clock className="size-3.5" />} value={`${hospital.etaMin}분`} label="예상 소요" />
              <Stat
                icon={<Navigation className="size-3.5" />}
                value={`${hospital.distanceKm.toFixed(1)}km`}
                label="거리"
              />
              <Stat
                icon={<BedDouble className="size-3.5" />}
                value={erDisplay}
                label={erTotal && erTotal > 0 ? "응급 가용/정원" : "응급실 가용"}
                tone={
                  er === null
                    ? "muted"
                    : er === 0
                      ? "danger"
                      : showRatio
                        ? ratio < 0.2
                          ? "warn"
                          : "ok"
                        : er <= 2
                          ? "warn"
                          : "ok"
                }
              />
            </div>

            {showRatio && (
              <div className="mt-3">
                {/*
                  응급실 가용 병상 비율 시각화. 막대 단독으로는 의미가 모호해
                  바로 위에 "가용 X / 정원 Y · NN%" 라벨을 붙여 수치와 비율을
                  동시에 노출한다. 백분율은 색·길이의 의미를 텍스트로 한 번
                  더 보강해 사용자가 그래프를 한눈에 해석할 수 있게 한다.
                */}
                <div className="mb-1 flex items-baseline justify-between text-[11px]">
                  <span className="font-medium text-text-muted">
                    응급실 가용 병상
                  </span>
                  <span className="font-mono tabular-nums text-text-muted">
                    가용 <span className="font-semibold text-text">{er}</span>
                    <span className="mx-0.5 text-text-subtle">/</span>
                    정원 {erTotal}
                    <span className="mx-1 text-text-subtle">·</span>
                    <span className="font-semibold text-text">
                      {Math.round(ratio * 100)}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(ratio * 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("h-full rounded-full", meta.dot)}
                  />
                </div>
              </div>
            )}

            <BedDetailGrid realtime={hospital.realtime} totals={hospital.totals} />

            {hospital.realtime?.updatedAt && (
              <p className="mt-2.5 flex items-center gap-1 text-[11px] text-text-subtle">
                <Activity className="size-3" />
                실시간 보고 · {formatRelative(hospital.realtime.updatedAt)}
              </p>
            )}

            {hospital.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {hospital.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-surface">
          <a
            href={`tel:${hospital.tel}`}
            onClick={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            className="flex items-center justify-center gap-2 py-3 text-[13.5px] font-medium text-text transition-colors hover:bg-surface-2"
          >
            <Phone className="size-[16px]" />
            전화
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors hover:bg-surface-2",
              isFavorited ? "text-amber-500" : "text-text-muted",
            )}
          >
            {isFavorited ? (
              <StarOff className="size-[15px]" />
            ) : (
              <Star className="size-[15px]" />
            )}
            {isFavorited ? "저장됨" : "저장"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirections();
            }}
            className="flex items-center justify-center gap-2 py-3 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <Navigation className="size-[16px]" />
            길안내
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 지도 뷰 하단에 노출되는 1줄짜리 병원 요약 행.
 * 지도 마커의 번호/색상과 시각적으로 매칭되도록 좌측에 용량색 번호 배지를 두고,
 * 우측에는 소요시간·거리만 노출한다. 전화/길안내 등 본격 액션은 리스트 뷰의
 * HospitalCard 가 담당하도록 역할을 분리.
 */
function MapCompactRow({
  index,
  hospital,
  active,
  onTap,
}: {
  index: number;
  hospital: Hospital;
  active: boolean;
  onTap: () => void;
}) {
  const meta = CAPACITY_META[hospital.capacity];
  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] border px-2.5 py-2 text-left transition-colors",
        active
          ? "border-primary/60 bg-primary-soft"
          : "border-border bg-bg hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ring-1",
          meta.tone,
          meta.ring,
        )}
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-text">
        {hospital.name}
      </span>
      <span className="shrink-0 font-mono text-[12px] tabular-nums text-text-muted">
        {hospital.distanceKm.toFixed(1)}km
        <span className="mx-1 text-text-subtle">·</span>
        {hospital.etaMin}분
      </span>
    </button>
  );
}

function SelectedSummary({
  hospital,
  onDirections,
}: {
  hospital: Hospital | null;
  onDirections: () => void;
}) {
  if (!hospital) return null;
  const meta = CAPACITY_META[hospital.capacity];
  const er = hospital.realtime?.er ?? null;
  const erTotal = hospital.totals?.er ?? null;
  const erText =
    er === null
      ? "응급실 미보고"
      : erTotal && erTotal > 0
        ? `응급 ${er}/${erTotal}`
        : `응급 ${er}`;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex items-center gap-3 p-3.5">
        <div className={cn("grid size-10 place-items-center rounded-full ring-1", meta.tone, meta.ring)}>
          <span className={cn("size-2 rounded-full", meta.dot)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-text">{hospital.name}</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            {hospital.etaMin}분 · {hospital.distanceKm.toFixed(1)}km · {erText}
          </p>
        </div>
        <button
          type="button"
          onClick={onDirections}
          className="rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-fg shadow-[var(--shadow-md)]"
        >
          길안내
        </button>
        <a
          href={`tel:${hospital.tel}`}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-text"
        >
          전화
        </a>
      </Card>
    </motion.div>
  );
}

type StatTone = "default" | "muted" | "ok" | "warn" | "danger";

const STAT_TONE: Record<StatTone, string> = {
  default: "text-text",
  muted: "text-text-subtle",
  ok: "text-status-available",
  warn: "text-status-busy",
  danger: "text-status-full",
};

function Stat({
  icon,
  value,
  label,
  tone = "default",
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-surface-2 px-2.5 py-2">
      <div className={cn("flex items-center gap-1", STAT_TONE[tone])}>
        {icon}
        <span className="font-mono text-[13px] font-semibold tabular-nums">{value}</span>
      </div>
      <p className="mt-0.5 text-[10.5px] text-text-subtle">{label}</p>
    </div>
  );
}

function BedDetailGrid({
  realtime,
  totals,
}: {
  realtime?: Hospital["realtime"];
  totals?: Hospital["totals"];
}) {
  if (!realtime) return null;
  const icuAvail = sumNullable([
    realtime.icuMed,
    realtime.icuSurg,
    realtime.icuNeuro,
    realtime.icuChest,
  ]);
  const items: Array<{
    icon: React.ReactNode;
    label: string;
    avail: number | null;
    total: number | null;
  }> = [
    {
      icon: <BedDouble className="size-3" />,
      label: "일반입원",
      avail: realtime.general,
      total: totals?.general ?? null,
    },
    {
      icon: <Scissors className="size-3" />,
      label: "수술실",
      avail: realtime.surgery,
      total: totals?.surgery ?? null,
    },
    {
      icon: <HeartPulse className="size-3" />,
      label: "중환자실",
      avail: icuAvail,
      total: totals?.icu ?? null,
    },
    {
      icon: <Stethoscope className="size-3" />,
      label: "소아응급",
      avail: realtime.pediatricEr,
      total: null,
    },
    {
      icon: <ShieldAlert className="size-3" />,
      label: "격리",
      avail: realtime.isolation,
      total: null,
    },
  ].filter((it) => it.avail !== null && it.avail !== undefined) as typeof items;

  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <BedChip
          key={it.label}
          icon={it.icon}
          label={it.label}
          value={it.avail as number}
          total={it.total}
        />
      ))}
    </div>
  );
}

function BedChip({
  icon,
  label,
  value,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number | null;
}) {
  const empty = value <= 0;
  const hasTotal = total !== null && total !== undefined && total > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        empty
          ? "bg-status-full-soft text-status-full"
          : "bg-status-available-soft text-status-available",
      )}
    >
      {icon}
      <span className="text-text-muted">{label}</span>
      <span className="font-mono font-semibold tabular-nums">
        {value}
        {hasTotal && <span className="text-text-subtle">/{total}</span>}
      </span>
    </span>
  );
}

function sumNullable(values: Array<number | null>): number | null {
  let any = false;
  let sum = 0;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    any = true;
    sum += v;
  }
  return any ? sum : null;
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "방금";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return "방금 전";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

function fallbackReasonText(reason?: GeoReason): string {
  switch (reason) {
    case "permission_denied":
      return "브라우저에서 위치 권한이 차단되어 있어요.";
    case "insecure_context":
      return "보안 연결(HTTPS)이 아닌 IP 주소로 접속해서 브라우저가 위치 요청을 차단했어요.";
    case "position_unavailable":
      return "기기/네트워크에서 현재 위치를 알 수 없는 상태예요.";
    case "timeout":
      return "위치 측정이 시간 안에 끝나지 않았어요.";
    case "unsupported":
      return "이 브라우저는 위치 정보 API를 지원하지 않아요.";
    default:
      return "현재 위치를 가져오지 못했어요.";
  }
}

function fallbackHowToFix(reason?: GeoReason): string {
  switch (reason) {
    case "permission_denied":
      return "주소창의 자물쇠 아이콘 → ‘위치’를 ‘허용’으로 변경 후 새로고침하세요. Windows의 경우 설정 → 개인정보 보호 → 위치도 함께 켜져 있어야 해요.";
    case "insecure_context":
      return "PC에서는 http://localhost:3000 으로, 모바일 테스트는 HTTPS 로 배포한 도메인을 이용해 주세요.";
    case "position_unavailable":
      return "Wi-Fi 가 켜져 있는지 확인하거나, 모바일 데이터 환경에서 다시 시도해 보세요.";
    case "timeout":
      return "잠시 후 다시 검색을 눌러 주세요. 실외 또는 GPS 가능한 환경에서 더 빠르게 측정됩니다.";
    case "unsupported":
      return "Chrome, Edge, Safari 최신 버전에서 다시 접속해 주세요.";
    default:
      return "다시 한 번 검색을 시도해 주세요.";
  }
}

function EmptyResults({ radiusKm }: { radiusKm: number }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-6 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-status-busy-soft text-status-busy">
        <MapPinOff className="size-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-text">
        반경 {radiusKm}km 내 응급실을 찾지 못했어요
      </h3>
      <p className="text-[12.5px] leading-relaxed text-text-muted">
        위의 슬라이더를 드래그해서 반경을 더 넓혀 보세요.
      </p>
    </Card>
  );
}

function RadiusSlider({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (km: number) => void;
}) {
  // Local "draft" state lets us update the visual track/label continuously
  // while dragging, but only commit (and refetch) once the user releases.
  const [draft, setDraft] = useState(value);

  // Keep draft in sync if the parent value changes (e.g., preset chip click).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const pct = Math.round(
    ((draft - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 100,
  );

  const commit = (next: number) => {
    const clamped = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(next)));
    setDraft(clamped);
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div>
      {/* 1행: 반경 라벨 + 현재값 + 프리셋 칩 (한 줄에 모두) */}
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 text-[11.5px] font-medium text-text-subtle">
          반경
          <span className="ml-1.5 font-mono text-[14px] font-bold tabular-nums text-text">
            {draft}
            <span className="ml-0.5 text-[11px] font-semibold text-text-muted">km</span>
          </span>
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          {RADIUS_PRESETS.map((preset) => {
            const active = preset === value;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => commit(preset)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2 text-text-muted hover:bg-border hover:text-text",
                )}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2행: 슬림한 슬라이더 트랙 */}
      <div className="relative mt-1.5 h-5">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-bg shadow-[var(--shadow-sm)]"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={1}
          value={draft}
          aria-label="검색 반경 (킬로미터)"
          onChange={(e) => setDraft(Number(e.target.value))}
          onMouseUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
          className="absolute inset-0 h-full w-full cursor-grab appearance-none bg-transparent opacity-0 active:cursor-grabbing"
        />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 shrink-0 rounded-full shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded shimmer" />
              <div className="h-3 w-1/3 rounded shimmer" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 rounded-[var(--radius-sm)] shimmer" />
            ))}
          </div>
        </Card>
      ))}
      <div className="mt-2 flex items-center justify-center gap-2 text-[12px] text-text-subtle">
        <Loader2 className="size-3.5 animate-spin" />
        결과를 불러오고 있어요…
      </div>
    </div>
  );
}
