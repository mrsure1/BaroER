"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  Info,
  Mic,
  MicOff,
  Search as SearchIcon,
  Stethoscope,
  Timer,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  AGE_BANDS,
  SYMPTOMS,
  useSearchStore,
  type AgeBand,
  type Gender,
} from "@/stores/searchStore";
import { useAuthStore } from "@/stores/authStore";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getCurrentCoords } from "@/hooks/useGeolocation";
import { estimateKtas, getGuidance, type KtasInfo } from "@/lib/ktasGuide";
import { cn } from "@/lib/cn";

const genderOptions = [
  { value: "M" as const, label: "남성" },
  { value: "F" as const, label: "여성" },
] satisfies ReadonlyArray<{ value: Gender; label: string }>;

/**
 * 응급실 검색 전 환자 상태 입력 화면.
 *
 * 디자인 목표:
 *   1. 의료 앱다운 **정보 밀도** — 증상 3열 그리드를 컴팩트한 타일로 축약,
 *      성별·연령은 한 줄에 배치, 음성 메모는 접혀 있는 상태를 기본으로 둬
 *      **한 화면 안에 모든 입력이 들어오게** 한다 (iPhone SE 기준).
 *   2. 증상이 하나라도 선택되면 하단에 **KTAS 중증도 뱃지 + 응급조치 가이드**
 *      를 즉시 노출 — "단순 119 신고 권장" 문구를 없애고 사용자가 병원 도착
 *      전에 실제로 할 수 있는 행동을 제공한다.
 *   3. 로그인 사용자의 userType 이 PARAMEDIC 이면 구급대원용 프로토콜(KTAS 1~5
 *      이송 중 처치) 을 표시 — 일반인에게는 일반인용 응급처치를 보여준다.
 */
export default function SearchPage() {
  const router = useRouter();
  const symptoms = useSearchStore((s) => s.symptoms);
  const toggleSymptom = useSearchStore((s) => s.toggleSymptom);
  const gender = useSearchStore((s) => s.gender);
  const setGender = useSearchStore((s) => s.setGender);
  const ageBand = useSearchStore((s) => s.ageBand);
  const setAgeBand = useSearchStore((s) => s.setAgeBand);
  const notes = useSearchStore((s) => s.notes);
  const setNotes = useSearchStore((s) => s.setNotes);
  const setCoords = useSearchStore((s) => s.setCoords);
  const user = useAuthStore((s) => s.user);

  const [submitting, setSubmitting] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(true);

  // 음성 입력 시 기존 메모 baseline 을 보존해, listening 중 transcript 와
  // 종료 시 finalText 가 **이중으로 누적되는 현상** 을 막는다.
  // - 시작 직전 notes 를 baseline 에 캡처
  // - listening 중: textarea = baseline + " " + transcript (interim 미리보기)
  // - 종료 시 onFinalResult(finalText) 로 동일하게 baseline + " " + finalText
  //   를 한 번만 set → 결과가 겹치지 않는다.
  const baselineNotesRef = useRef("");

  const {
    supported: voiceSupported,
    listening,
    transcript,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
  } = useSpeechRecognition({
    lang: "ko-KR",
    onFinalResult: (text) => {
      const base = baselineNotesRef.current;
      setNotes(base ? `${base} ${text}`.trim() : text);
    },
  });

  // listening 중 interim 결과를 baseline 에 덧대어 실시간 미리보기.
  // (transcript 가 비어 있는 잠깐의 침묵 구간엔 baseline 만 보존)
  useEffect(() => {
    if (!listening) return;
    const base = baselineNotesRef.current;
    setNotes(
      base
        ? transcript
          ? `${base} ${transcript}`
          : base
        : transcript,
    );
  }, [listening, transcript, setNotes]);

  const audience = user?.userType === "PARAMEDIC" ? "paramedic" : "general";
  const ktas: KtasInfo = useMemo(
    () => estimateKtas(symptoms, ageBand),
    [symptoms, ageBand],
  );
  const guidance = useMemo(
    () => (symptoms.length > 0 ? getGuidance(symptoms, ktas.level, audience) : []),
    [symptoms, ktas.level, audience],
  );

  const canSubmit = symptoms.length > 0;

  function handleVoice() {
    if (listening) {
      stopVoice();
    } else {
      // 음성 시작 직전의 notes 를 기억해두고, transcript 는 그 뒤에만 덧붙인다.
      baselineNotesRef.current = notes;
      startVoice();
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const coords = await getCurrentCoords();
      setCoords({
        lat: coords.lat,
        lng: coords.lng,
        fallback: coords.fallback,
        reason: coords.reason,
      });
      router.push("/search/results");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScreenHeader title="환자 상태 평가" subtitle="증상을 선택하면 KTAS 중증도가 즉시 계산됩니다" back />

      {/*
        하단 floating 검색 버튼 영역(buttom 약 64px + 도움말 + 안전영역 + 하단탭바)
        만큼 콘텐츠에 padding-bottom 을 줘 KTAS 카드가 버튼 뒤로 가려지지 않게 함.
      */}
      <div
        className="mx-auto w-full max-w-[520px] px-5"
        style={{
          paddingBottom:
            "calc(72px + env(safe-area-inset-bottom) + 92px)",
        }}
      >
        {/* ===== 1) 증상 선택 ===== */}
        <section className="mb-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]">
          <SectionTitle icon={<Stethoscope className="size-3.5" />} label="주 증상" hint="복수 선택 가능" />
          <div className="grid grid-cols-3 gap-1.5">
            {SYMPTOMS.map((s) => {
              const active = symptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSymptom(s.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] border px-1.5 py-2 transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? s.critical
                        ? "border-status-full bg-status-full-soft text-status-full shadow-[var(--shadow-sm)]"
                        : "border-primary bg-primary-soft text-primary shadow-[var(--shadow-sm)]"
                      : "border-border bg-surface text-text hover:border-border-strong",
                  )}
                >
                  {s.critical && !active && (
                    <span className="absolute right-1 top-1 size-1.5 rounded-full bg-status-full" />
                  )}
                  <span className="text-[18px] leading-none" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="truncate text-[11.5px] font-medium leading-tight">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== 2) 추가 메모 + 음성 (주증상 바로 아래) ===== */}
        <section className="mb-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]">
          <SectionTitle icon={<Info className="size-3.5" />} label="추가 메모" hint="선택 · 특이사항" />
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 30분 전부터 가슴이 답답, 식은땀 · 기저질환 고혈압"
              rows={2}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 pr-12 text-[14px] leading-relaxed text-text placeholder:text-text-subtle focus:border-primary focus:shadow-[var(--shadow-glow)] focus:outline-none"
            />
            <motion.button
              type="button"
              onClick={handleVoice}
              whileTap={{ scale: 0.92 }}
              disabled={!voiceSupported}
              aria-label={listening ? "음성 입력 중지" : "음성으로 입력"}
              aria-pressed={listening}
              title={voiceSupported ? undefined : "이 브라우저는 음성 인식을 지원하지 않습니다"}
              className={cn(
                "absolute bottom-2 right-2 grid size-9 place-items-center rounded-full transition-colors",
                listening
                  ? "bg-primary text-primary-fg shadow-[var(--shadow-md)]"
                  : "bg-surface-2 text-text-muted ring-1 ring-border hover:text-text disabled:opacity-40",
              )}
            >
              {listening && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              )}
              <span className="relative">
                {listening ? <MicOff className="size-[16px]" /> : <Mic className="size-[16px]" />}
              </span>
            </motion.button>
          </div>
          {(voiceError || listening) && (
            <p className="mt-1 px-0.5 text-[11.5px] text-text-subtle">
              {voiceError
                ? `음성 인식 오류: ${voiceError}`
                : "듣고 있어요… 길게 말해도 끊기지 않아요. 다시 누르면 멈춰요."}
            </p>
          )}
        </section>

        {/* ===== 3) 환자 기본 정보 — 성별 · 연령 한 줄 ===== */}
        <section className="mb-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]">
          <SectionTitle icon={<UserRound className="size-3.5" />} label="환자 정보" />
          <div className="grid grid-cols-[1fr_1.2fr] gap-2">
            <SegmentedControl
              options={genderOptions}
              value={gender}
              onChange={setGender}
              ariaLabel="성별"
              tone="primary"
              fullWidth
            />
            <AgeBandSelect value={ageBand} onChange={setAgeBand} />
          </div>
        </section>

        {/* ===== 4) KTAS 중증도 + 응급조치 (제출 버튼 위) =====
            증상이 선택되는 즉시 KTAS 뱃지와 응급조치 가이드를 환자 정보 아래에
            바로 노출. 화면 하단의 floating 검색 버튼은 별도 컨테이너로 분리되어
            언제든 thumb-zone 에서 호출 가능. */}
        <AnimatePresence initial={false}>
          {symptoms.length > 0 && (
            <motion.section
              key="ktas-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 overflow-hidden"
            >
              <KtasCard
                ktas={ktas}
                audience={audience}
                open={guidanceOpen}
                onToggle={() => setGuidanceOpen((v) => !v)}
                guidance={guidance}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ===== 5) 제출 버튼 — 화면 맨 아래 floating =====
          사용자가 KTAS 가이드를 길게 스크롤해 보더라도 검색 액션은 항상
          thumb-zone 안쪽에 머물도록 화면에 고정한다. 하단 탭바(72px) 위 영역에
          배치하고, 컨텐츠 가독성을 위해 반투명 배경 + blur 처리를 둔다. */}
      <div
        className="fixed inset-x-0 z-30 border-t border-border/60 bg-bg/85 backdrop-blur-md"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-[520px] px-5 py-3">
          <Button
            size="xl"
            fullWidth
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
            leftIcon={<SearchIcon className="size-5" />}
            rightIcon={<ArrowRight className="size-4" />}
          >
            가까운 응급실 찾기
          </Button>
          {!canSubmit && (
            <p className="mt-1.5 text-center text-[12px] text-text-subtle">
              증상을 1개 이상 선택하면 검색할 수 있어요
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// 하위 컴포넌트
// =============================================================================

function SectionTitle({
  icon,
  label,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <header className="mb-2 flex items-center justify-between">
      <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold tracking-wide text-text">
        {icon && (
          <span className="grid size-5 place-items-center rounded-md bg-primary/12 text-primary">
            {icon}
          </span>
        )}
        {label}
      </h2>
      {hint && <span className="text-[11.5px] text-text-subtle">{hint}</span>}
    </header>
  );
}

function KtasCard({
  ktas,
  audience,
  open,
  onToggle,
  guidance,
}: {
  ktas: KtasInfo;
  audience: "general" | "paramedic";
  open: boolean;
  onToggle: () => void;
  guidance: ReturnType<typeof getGuidance>;
}) {
  const toneClasses: Record<KtasInfo["tone"], { bg: string; fg: string; ring: string; dot: string }> = {
    critical: {
      bg: "bg-status-full-soft",
      fg: "text-status-full",
      ring: "ring-status-full/30",
      dot: "bg-status-full",
    },
    urgent: {
      bg: "bg-status-full-soft",
      fg: "text-status-full",
      ring: "ring-status-full/30",
      dot: "bg-status-full",
    },
    warn: {
      bg: "bg-status-busy-soft",
      fg: "text-status-busy",
      ring: "ring-status-busy/30",
      dot: "bg-status-busy",
    },
    info: {
      bg: "bg-primary-soft",
      fg: "text-primary",
      ring: "ring-primary/30",
      dot: "bg-primary",
    },
    ok: {
      bg: "bg-status-available-soft",
      fg: "text-status-available",
      ring: "ring-status-available/30",
      dot: "bg-status-available",
    },
  };
  const t = toneClasses[ktas.tone];
  const Icon = ktas.tone === "critical" || ktas.tone === "urgent" ? AlertTriangle : Info;

  return (
    <Card className={cn("overflow-hidden border p-0 ring-1", t.ring)}>
      {/* 헤더: KTAS 한글 중증도 + 레벨 + 반응 시간 */}
      <div className={cn("flex items-center gap-3 px-4 py-3", t.bg)}>
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full bg-bg shadow-[var(--shadow-sm)]",
            t.fg,
          )}
        >
          <span className="text-[18px] font-extrabold leading-none">
            {ktas.level}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-70">
            단계
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className={cn("text-[15px] font-extrabold leading-none", t.fg)}>
              {ktas.koLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                "bg-bg/70",
                t.fg,
              )}
            >
              <Icon className="size-3" /> KTAS {ktas.level}단계
            </span>
            <span className="text-[10.5px] text-text-subtle">
              {ktas.enLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-[12.5px] text-text">{ktas.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted">
            <Timer className="size-3" />
            {ktas.targetMin === 0 ? "즉시" : `≤ ${ktas.targetMin}분`}
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "응급조치 닫기" : "응급조치 펼치기"}
            className="mt-1 text-[11px] font-medium text-text-muted hover:text-text"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* 본문: 응급조치 리스트 */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border">
              {guidance.map((block, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-text">
                    {audience === "paramedic" ? (
                      <Stethoscope className="size-3.5 text-primary" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-status-available" />
                    )}
                    {block.heading}
                  </p>
                  <ol className="space-y-1.5">
                    {block.steps.map((s, j) => (
                      <li key={j} className="flex gap-2 text-[12.5px] leading-relaxed text-text-muted">
                        <span className={cn("mt-[6px] size-1.5 shrink-0 rounded-full", t.dot)} />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  {block.donts && block.donts.length > 0 && (
                    <div className="mt-2 rounded-[var(--radius-sm)] bg-surface-2 p-2">
                      <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-status-full">
                        <Ban className="size-3" /> 피해야 할 행동
                      </p>
                      <ul className="space-y-0.5">
                        {block.donts.map((d, k) => (
                          <li
                            key={k}
                            className="text-[11.5px] leading-relaxed text-text-muted"
                          >
                            · {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              <p className="bg-surface-2 px-4 py-2 text-[10.5px] leading-relaxed text-text-subtle">
                ※ 본 안내는 KTAS 및 대한응급의학회 프리호스피탈 지침을 참고한 일반적
                응급처치 가이드이며, 실제 진료를 대체하지 않습니다. 생명이 위급한
                상황에선 **즉시 119** 에 신고하세요.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function AgeBandSelect({
  value,
  onChange,
}: {
  value: AgeBand | null;
  onChange: (v: AgeBand | null) => void;
}) {
  const selected = value ? AGE_BANDS.find((b) => b.value === value) ?? null : null;
  return (
    <div className="relative">
      {/* SegmentedControl 과 정확히 같은 외곽 구조로 세로 정렬을 맞춘다. */}
      <div
        className={
          "flex w-full items-center rounded-full border border-border bg-surface-2 p-1 transition-colors focus-within:border-primary focus-within:shadow-[var(--shadow-glow)]"
        }
      >
        <div className="flex h-11 w-full items-center gap-2 rounded-full bg-bg px-3.5 text-[14px] text-text shadow-[var(--shadow-sm)]">
          <span className="flex-1 truncate">
            {selected ? (
              <span className="font-medium">{selected.label}</span>
            ) : (
              <span className="text-text-subtle">연령대 선택</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
        </div>
      </div>
      <select
        aria-label="연령대 선택"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : (v as AgeBand));
        }}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none border-0 bg-transparent opacity-0 focus:outline-none"
      >
        <option value="">선택</option>
        {AGE_BANDS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label} · {b.range}
          </option>
        ))}
      </select>
    </div>
  );
}
