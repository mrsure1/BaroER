"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Clock,
  Eye,
  FilePlus2,
  History,
  Loader2,
  MapPin,
  Pencil,
  Search as SearchIcon,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useHistoryStore } from "@/stores/historyStore";
import { useAuthStore } from "@/stores/authStore";
import {
  KTAS_OPTIONS,
  type DispatchReport,
} from "@/stores/dispatchReportsStore";
import { listReports, deleteReport } from "@/services/dispatchReports";
import { AGE_BANDS, SYMPTOMS } from "@/stores/searchStore";
import { CAPACITY_META } from "@/lib/mockHospitals";
import { ktasKoLabel } from "@/lib/ktasGuide";
import { cn } from "@/lib/cn";

type Tab = "history" | "dispatch";

const tabOptions = [
  { value: "history" as const, label: "내 기록", icon: <History className="size-4" /> },
  {
    value: "dispatch" as const,
    label: "구급대 리포트",
    icon: <Activity className="size-4" />,
  },
];

const symptomLabel = new Map(SYMPTOMS.map((s) => [s.id, s] as const));
const ageBandLabel = new Map(AGE_BANDS.map((b) => [b.value, b] as const));

/**
 * 최근 기록 카드에 노출하는 환자 요약.
 * 연령대·성별·증상의 critical 여부로 짧은 한 줄을 만들어 준다.
 */
function patientSummary(
  gender: "M" | "F" | null,
  ageBand: string | null,
): string | null {
  const parts: string[] = [];
  if (ageBand) {
    const band = ageBandLabel.get(ageBand as never);
    if (band) parts.push(`${band.label}(${band.range})`);
  }
  if (gender) parts.push(gender === "M" ? "남성" : "여성");
  return parts.length > 0 ? parts.join(" · ") : null;
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR");
}

export default function DispatchPage() {
  return (
    <Suspense fallback={null}>
      <DispatchContent />
    </Suspense>
  );
}

function DispatchContent() {
  const sp = useSearchParams();
  const initialTab: Tab =
    sp.get("tab") === "dispatch" ? "dispatch" : "history";
  const [tab, setTab] = useState<Tab>(initialTab);
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const remove = useHistoryStore((s) => s.remove);
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";
  const [confirmingClear, setConfirmingClear] = useState(false);

  // 구급 리포트 목록 — supabase 에서 fetch.
  // 구급대원이 아니거나 미로그인이면 fetch 시도하지 않는다 (RLS 로 어차피 빈 결과).
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ["dispatch-reports", { from, to, q }],
    queryFn: () => listReports({ from: from || undefined, to: to || undefined, q: q || undefined }),
    enabled: !!user && isParamedic,
    staleTime: 30_000,
  });

  const removeReport = async (id: string) => {
    await deleteReport(id);
    queryClient.invalidateQueries({ queryKey: ["dispatch-reports"] });
  };

  // URL query 가 변경되면 tab 도 동기화 (구급대원 홈의 "리포트 작성" 진입 등)
  useEffect(() => {
    const t = sp.get("tab");
    if (t === "dispatch") setTab("dispatch");
    else if (t === "history") setTab("history");
  }, [sp]);

  return (
    <>
      <ScreenHeader
        title="검색·출동 기록"
        subtitle={`총 ${entries.length}건의 검색 기록`}
        right={
          tab === "history" && entries.length > 0 ? (
            <IconButton
              variant="ghost"
              aria-label="전체 삭제"
              onClick={() => setConfirmingClear(true)}
            >
              <Trash2 className="text-status-full" />
            </IconButton>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-6">
        <SegmentedControl
          options={tabOptions}
          value={tab}
          onChange={setTab}
          fullWidth
          ariaLabel="기록 종류"
        />

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {tab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {entries.length === 0 ? <EmptyHistory /> : (
                  <ul className="flex flex-col gap-2.5">
                    {entries.map((e, i) => (
                      <motion.li
                        key={e.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.15) }}
                      >
                        <Card className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="inline-flex items-center gap-1 text-[12.5px] text-text-muted">
                                <Clock className="size-3.5 text-text-subtle" />
                                {relativeTime(e.ts)}
                              </span>
                              {patientSummary(e.gender, e.ageBand) && (
                                <>
                                  <span className="text-text-subtle">·</span>
                                  <span className="text-[12.5px] font-medium text-text">
                                    {patientSummary(e.gender, e.ageBand)}
                                  </span>
                                </>
                              )}
                            </div>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              aria-label="삭제"
                              onClick={() => remove(e.id)}
                            >
                              <Trash2 className="text-text-subtle" />
                            </IconButton>
                          </div>

                          {/* Symptom chips */}
                          {e.symptoms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {e.symptoms.map((id) => {
                                const meta = symptomLabel.get(id);
                                return (
                                  <span
                                    key={id}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
                                      meta?.critical
                                        ? "bg-status-full-soft text-status-full"
                                        : "bg-surface-2 text-text-muted",
                                    )}
                                  >
                                    {meta?.emoji} {meta?.label ?? id}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Notes */}
                          {e.notes && (
                            <p className="mt-2 line-clamp-2 text-[13px] text-text">
                              {e.notes}
                            </p>
                          )}

                          {/* Top results */}
                          {e.topResults.length > 0 && (
                            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-[var(--radius-md)] border border-border">
                              {e.topResults.map((r) => {
                                const meta = CAPACITY_META[r.capacity === "unknown" ? "busy" : r.capacity];
                                return (
                                  <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                                    <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
                                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">
                                      {r.name}
                                    </span>
                                    <span className="font-mono text-[12px] tabular-nums text-text-muted">
                                      {r.etaMin}분 · {r.distanceKm.toFixed(1)}km
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* 출발지 (역지오코딩된 한글 주소 > 좌표 폴백) */}
                          {e.coords && (
                            <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-text-subtle">
                              <MapPin className="mt-[1px] size-3 shrink-0" />
                              <span className="min-w-0">
                                <span className="font-semibold text-text-muted">
                                  출발지
                                </span>{" "}
                                ·{" "}
                                {e.coords.fallback
                                  ? "기본 위치 (서울시청)"
                                  : e.address
                                    ? e.address
                                    : `위도 ${e.coords.lat.toFixed(4)}, 경도 ${e.coords.lng.toFixed(4)}`}
                              </span>
                            </div>
                          )}
                        </Card>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dispatch"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <DispatchReportsList
                  reports={reportsQuery.data ?? []}
                  loading={reportsQuery.isLoading}
                  errorMessage={
                    reportsQuery.error instanceof Error
                      ? reportsQuery.error.message
                      : null
                  }
                  onRemove={removeReport}
                  isParamedic={isParamedic}
                  filter={{ from, to, q }}
                  onFilterChange={(next) => {
                    if (next.from !== undefined) setFrom(next.from);
                    if (next.to !== undefined) setTo(next.to);
                    if (next.q !== undefined) setQ(next.q);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm clear modal */}
      <AnimatePresence>
        {confirmingClear && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmingClear(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-50 mx-auto max-w-[420px]"
            >
              <Card className="p-5 shadow-[var(--shadow-lg)]">
                <h3 className="text-[16px] font-bold text-text">검색 기록을 모두 삭제할까요?</h3>
                <p className="mt-1 text-[13px] text-text-muted">
                  이 작업은 되돌릴 수 없어요. 기기에 저장된 모든 검색 기록이 삭제됩니다.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" fullWidth onClick={() => setConfirmingClear(false)}>
                    취소
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => {
                      clear();
                      setConfirmingClear(false);
                    }}
                  >
                    전체 삭제
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyHistory() {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-surface-2 text-text-muted">
        <ClipboardList className="size-7" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-text">검색 기록이 없어요</p>
        <p className="mt-1 text-[13px] text-text-muted">
          검색한 내용은 자동으로 이 곳에 저장돼요.
        </p>
      </div>
    </Card>
  );
}

function DispatchReportsList({
  reports,
  loading,
  errorMessage,
  onRemove,
  isParamedic,
  filter,
  onFilterChange,
}: {
  reports: DispatchReport[];
  loading: boolean;
  errorMessage: string | null;
  onRemove: (id: string) => void;
  isParamedic: boolean;
  filter: { from: string; to: string; q: string };
  onFilterChange: (next: Partial<{ from: string; to: string; q: string }>) => void;
}) {
  // 비-구급대원에게는 작성 진입조차 허용하지 않고 안내 카드만 노출.
  // 안내문과 링크를 분리해, "프로필 → 구급대원 전환" 링크 한 단어/한 줄을
  // 보장한다. 카드 좌우 패딩을 px-4 로 축소해 360px 모바일에서도 한국어
  // 폰트 기준으로 nowrap 가 깨지지 않게 폭을 확보한다.
  if (!isParamedic) {
    return (
      <Card className="px-4 py-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-2 text-text-muted">
          <ClipboardList className="size-6" />
        </div>
        <p className="mt-3 text-[14.5px] font-semibold text-text">
          구급대원 전용 기능이에요
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
          구급활동일지 작성·열람은 구급대원 계정에서만 가능해요.
        </p>
        <Link
          href="/settings/profile"
          className="mt-3 inline-block whitespace-nowrap text-[12.5px] font-semibold text-primary"
        >
          프로필 → 구급대원 전환
        </Link>
      </Card>
    );
  }

  const hasFilter = !!(filter.from || filter.to || filter.q);

  return (
    <div className="flex flex-col gap-3">
      {/* 새 리포트 작성 CTA — 항상 최상단에 고정 */}
      <Link href="/dispatch/new" prefetch={false}>
        <Card className="flex items-center gap-3 border-dashed border-primary/40 bg-primary-soft/40 p-4 transition-colors hover:bg-primary-soft">
          <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-fg">
            <FilePlus2 className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14.5px] font-semibold text-text">
              새 구급 리포트 작성
            </p>
            <p className="text-[12px] text-text-muted">
              구급활동일지 양식 · 작성하면 안전하게 클라우드에 보관
            </p>
          </div>
          <Activity className="size-[18px] text-primary" />
        </Card>
      </Link>

      {/* 검색 · 날짜 필터 */}
      <Card className="space-y-2 p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <input
            type="search"
            value={filter.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
            placeholder="주증상 · 환자명 · 이송 병원 검색"
            className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-bg pl-9 pr-3 text-[13.5px] text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <DateField
            label="시작"
            value={filter.from}
            onChange={(v) => onFilterChange({ from: v })}
          />
          <span className="text-text-subtle">~</span>
          <DateField
            label="종료"
            value={filter.to}
            onChange={(v) => onFilterChange({ to: v })}
          />
          {hasFilter ? (
            <button
              type="button"
              onClick={() => onFilterChange({ from: "", to: "", q: "" })}
              className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11.5px] font-medium text-text-muted hover:bg-surface-2"
              aria-label="필터 초기화"
            >
              <X className="size-3" />
              초기화
            </button>
          ) : (
            <CalendarDays className="size-4 text-text-subtle" />
          )}
        </div>
      </Card>

      {errorMessage && (
        <Card className="border-status-full/40 bg-status-full-soft p-3 text-[12.5px] text-status-full">
          {errorMessage}
        </Card>
      )}

      {loading ? (
        <Card className="flex items-center justify-center gap-2 px-6 py-10 text-[13px] text-text-muted">
          <Loader2 className="size-4 animate-spin" />
          불러오는 중…
        </Card>
      ) : reports.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-surface-2 text-text-muted">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="text-[14.5px] font-semibold text-text">
              {hasFilter
                ? "조건에 맞는 리포트가 없어요"
                : "작성된 리포트가 없어요"}
            </p>
            <p className="mt-1 text-[12.5px] text-text-muted">
              {hasFilter
                ? "날짜 범위나 검색어를 조정해 보세요."
                : "상단 버튼을 눌러 첫 리포트를 작성해 보세요."}
            </p>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id}>
              <DispatchReportRow report={r} onRemove={() => onRemove(r.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-2 text-[12.5px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
    />
  );
}

function DispatchReportRow({
  report,
  onRemove,
}: {
  report: DispatchReport;
  onRemove: () => void;
}) {
  const ktas = KTAS_OPTIONS.find((k) => k.value === report.ktas);
  const patientLine = [
    report.patientName || "신원 미상",
    report.patientGender === "M"
      ? "남"
      : report.patientGender === "F"
        ? "여"
        : null,
    report.patientAge ? `${report.patientAge}세` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Clock className="size-3.5 text-text-subtle" />
          <span className="text-[12px] text-text-muted">
            {new Date(report.updatedAt).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {report.dispatchNo && (
            <>
              <span className="text-text-subtle">·</span>
              <span className="truncate font-mono text-[11.5px] text-text-muted">
                {report.dispatchNo}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/dispatch/${report.id}`} prefetch={false}>
            <IconButton size="sm" variant="ghost" aria-label="문서 보기">
              <Eye className="text-text-subtle" />
            </IconButton>
          </Link>
          <Link href={`/dispatch/new?id=${report.id}`} prefetch={false}>
            <IconButton size="sm" variant="ghost" aria-label="수정">
              <Pencil className="text-text-subtle" />
            </IconButton>
          </Link>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="삭제"
            onClick={() => {
              if (confirm("이 리포트를 삭제할까요? 되돌릴 수 없어요.")) onRemove();
            }}
          >
            <Trash2 className="text-text-subtle" />
          </IconButton>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-[14px] font-medium text-text">
        {report.chiefComplaint || "(주 증상 미입력)"}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
        {ktas && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-white",
              ktas.tone === "critical" && "bg-status-full",
              ktas.tone === "warn" && "bg-status-busy",
              ktas.tone === "info" && "bg-primary",
              ktas.tone === "ok" && "bg-status-available",
            )}
          >
            KTAS {ktas.value} · {ktasKoLabel(ktas.value)}
          </span>
        )}
        {report.reason && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-text-muted">
            {report.reason}
          </span>
        )}
        {report.consciousness && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-text-muted">
            AVPU {report.consciousness}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-text-muted">
        {patientLine && <span>👤 {patientLine}</span>}
        {report.destinationHospital && (
          <span>🏥 {report.destinationHospital}</span>
        )}
      </div>
    </Card>
  );
}
