"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ClipboardList,
  Clock,
  History,
  MapPin,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useHistoryStore } from "@/stores/historyStore";
import { SYMPTOMS } from "@/stores/searchStore";
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
  const [tab, setTab] = useState<Tab>("history");
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const remove = useHistoryStore((s) => s.remove);
  const [confirmingClear, setConfirmingClear] = useState(false);

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
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <Clock className="size-3.5 text-text-subtle" />
                              <span className="text-[12.5px] text-text-muted">
                                {relativeTime(e.ts)}
                              </span>
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

                          {/* Coords */}
                          {e.coords && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-text-subtle">
                              <MapPin className="size-3" />
                              {e.coords.fallback ? "기본 위치 (서울시청)" : `${e.coords.lat.toFixed(4)}, ${e.coords.lng.toFixed(4)}`}
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
                <ParamedicEmpty />
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

function ParamedicEmpty() {
  return (
    <Card className="flex flex-col items-center gap-3 border-dashed border-border-strong px-6 py-12 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <Activity className="size-7" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-text">구급대 리포트 준비 중</p>
        <p className="mt-1 text-[13px] text-text-muted">
          소속 인증 및 출동 자동 기록 기능은 다음 업데이트에서 활성화됩니다.
        </p>
      </div>
    </Card>
  );
}
