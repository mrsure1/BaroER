"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ClipboardList,
  Clock,
  FilePlus2,
  History,
  MapPin,
  Pencil,
  Trash2,
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
  useDispatchReportsStore,
  type DispatchReport,
} from "@/stores/dispatchReportsStore";
import { AGE_BANDS, SYMPTOMS } from "@/stores/searchStore";
import { CAPACITY_META } from "@/lib/mockHospitals";
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
  const reports = useDispatchReportsStore((s) => s.reports);
  const removeReport = useDispatchReportsStore((s) => s.remove);
  const user = useAuthStore((s) => s.user);
  const [confirmingClear, setConfirmingClear] = useState(false);

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
                  reports={reports}
                  onRemove={removeReport}
                  isParamedic={user?.userType === "PARAMEDIC"}
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
  onRemove,
  isParamedic,
}: {
  reports: DispatchReport[];
  onRemove: (id: string) => void;
  isParamedic: boolean;
}) {
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
              구급활동일지 양식 · 현장에서 바로 기록
            </p>
          </div>
          <Activity className="size-[18px] text-primary" />
        </Card>
      </Link>

      {!isParamedic && (
        <Card className="p-3.5">
          <p className="text-[12.5px] leading-relaxed text-text-muted">
            ℹ️ 현재 <b className="text-text">일반 사용자</b> 로 로그인돼 있어요. 구급대원
            전용 기능(소속 인증, 자동 출동 기록 연동)을 쓰려면{" "}
            <Link href="/settings/profile" className="font-semibold text-primary">
              프로필에서 구급대원으로 전환
            </Link>{" "}
            해 주세요.
          </p>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-surface-2 text-text-muted">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="text-[14.5px] font-semibold text-text">
              작성된 리포트가 없어요
            </p>
            <p className="mt-1 text-[12.5px] text-text-muted">
              상단 버튼을 눌러 첫 리포트를 작성해 보세요.
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
          <Link href={`/dispatch/new?id=${report.id}`} prefetch={false}>
            <IconButton size="sm" variant="ghost" aria-label="수정">
              <Pencil className="text-text-subtle" />
            </IconButton>
          </Link>
          <IconButton size="sm" variant="ghost" aria-label="삭제" onClick={onRemove}>
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
            KTAS {ktas.value}
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
