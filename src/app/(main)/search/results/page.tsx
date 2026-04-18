"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpDown,
  Clock,
  List,
  Loader2,
  Map as MapIcon,
  Navigation,
  Phone,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { NaverMap } from "@/components/maps/NaverMap";
import { CAPACITY_META } from "@/lib/mockHospitals";
import { fetchNearbyHospitals } from "@/services/hospitals";
import { useSearchStore } from "@/stores/searchStore";
import { useHistoryStore } from "@/stores/historyStore";
import type { Hospital } from "@/types/hospital";
import { cn } from "@/lib/cn";

type View = "list" | "map";
type Sort = "eta" | "distance" | "capacity";

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
  const age = useSearchStore((s) => s.age);
  const notes = useSearchStore((s) => s.notes);
  const addHistory = useHistoryStore((s) => s.add);

  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<Sort>("eta");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enabled = Boolean(coords);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hospitals", coords?.lat, coords?.lng],
    queryFn: ({ signal }) =>
      fetchNearbyHospitals(
        { lat: coords!.lat, lng: coords!.lng, radiusKm: 15, limit: 20 },
        signal,
      ),
    enabled,
    staleTime: 15_000,
  });

  const hospitals = useMemo(() => {
    const list = [...(data?.hospitals ?? [])];
    if (sort === "eta") list.sort((a, b) => a.etaMin - b.etaMin);
    if (sort === "distance") list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "capacity") {
      const score = { available: 0, busy: 1, full: 2, unknown: 3 } as const;
      list.sort((a, b) => score[a.capacity] - score[b.capacity]);
    }
    return list;
  }, [data, sort]);

  const availableCount = hospitals.filter((h) => h.capacity === "available").length;

  // Save the search outcome to local history exactly once when results arrive.
  const [savedKey, setSavedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!coords || !data || data.hospitals.length === 0) return;
    const key = `${coords.lat},${coords.lng}|${data.generatedAt}`;
    if (key === savedKey) return;
    addHistory({
      symptoms,
      gender,
      age,
      notes,
      coords,
      topResults: data.hospitals.slice(0, 3).map((h) => ({
        id: h.id,
        name: h.name,
        etaMin: h.etaMin,
        distanceKm: h.distanceKm,
        capacity: h.capacity,
      })),
    });
    setSavedKey(key);
  }, [coords, data, symptoms, gender, age, notes, addHistory, savedKey]);

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
            ? "응급실을 찾는 중…"
            : `근처 ${hospitals.length}개 · 수용 가능 ${availableCount}곳`
        }
        back
        right={<SortMenu sort={sort} onChange={setSort} />}
      />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-6">
        {coords?.fallback && (
          <Card className="mb-3 flex items-start gap-2.5 border-status-busy/40 bg-status-busy-soft p-3">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-status-busy" />
            <p className="text-[12.5px] text-text">
              위치 권한이 거부되어 <strong>서울시청</strong> 좌표 기준으로 표시됩니다.
              브라우저 설정에서 위치 허용을 켜시면 더 정확한 결과를 볼 수 있어요.
            </p>
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
            <AnimatePresence mode="wait">
              {view === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2.5"
                >
                  {hospitals.length === 0 ? (
                    <Card className="p-6 text-center text-[13.5px] text-text-muted">
                      반경 내 응급실을 찾지 못했어요. 정렬·반경을 바꿔 다시 시도해 주세요.
                    </Card>
                  ) : (
                    hospitals.map((h, i) => (
                      <HospitalCard
                        key={h.id}
                        hospital={h}
                        index={i}
                        active={selectedId === h.id}
                        onTap={() => setSelectedId(h.id)}
                      />
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-3"
                >
                  <NaverMap
                    center={coords!}
                    hospitals={hospitals}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                  />
                  {selectedId && (
                    <SelectedSummary
                      hospital={hospitals.find((h) => h.id === selectedId) ?? null}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
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
}: {
  hospital: Hospital;
  index: number;
  active: boolean;
  onTap: () => void;
}) {
  const meta = CAPACITY_META[hospital.capacity === "unknown" ? "busy" : hospital.capacity];
  const ratio = hospital.bedsTotal === 0 ? 0 : hospital.bedsAvailable / hospital.bedsTotal;
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
              <Stat value={`${hospital.bedsAvailable}/${hospital.bedsTotal}`} label="병상" />
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn("h-full rounded-full", meta.dot)}
              />
            </div>

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

        <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-surface">
          <a
            href={`tel:${hospital.tel}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 py-3 text-[13.5px] font-medium text-text transition-colors hover:bg-surface-2"
          >
            <Phone className="size-[16px]" />
            전화
          </a>
          <a
            href={`https://map.naver.com/p/directions/-/-/${hospital.lng},${hospital.lat},${encodeURIComponent(hospital.name)}/-/walk?c=15.00,0,0,0,dh`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 py-3 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <Navigation className="size-[16px]" />
            길안내
          </a>
        </div>
      </Card>
    </motion.div>
  );
}

function SelectedSummary({ hospital }: { hospital: Hospital | null }) {
  if (!hospital) return null;
  const meta = CAPACITY_META[hospital.capacity === "unknown" ? "busy" : hospital.capacity];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex items-center gap-3 p-3.5">
        <div className={cn("grid size-10 place-items-center rounded-full ring-1", meta.tone, meta.ring)}>
          <span className={cn("size-2 rounded-full", meta.dot)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-text">{hospital.name}</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            {hospital.etaMin}분 · {hospital.distanceKm.toFixed(1)}km · 병상 {hospital.bedsAvailable}/{hospital.bedsTotal}
          </p>
        </div>
        <a
          href={`tel:${hospital.tel}`}
          className="rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-fg shadow-[var(--shadow-md)]"
        >
          전화
        </a>
      </Card>
    </motion.div>
  );
}

function Stat({ icon, value, label }: { icon?: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-surface-2 px-2.5 py-2">
      <div className="flex items-center gap-1 text-text">
        {icon}
        <span className="font-mono text-[13px] font-semibold tabular-nums">{value}</span>
      </div>
      <p className="mt-0.5 text-[10.5px] text-text-subtle">{label}</p>
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
