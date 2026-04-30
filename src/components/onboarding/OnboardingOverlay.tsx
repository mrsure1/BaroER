"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Rocket,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MockupAssessment,
  MockupDispatch,
  MockupHistory,
  MockupHome,
  MockupNavigation,
  MockupResultsList,
  MockupResultsMap,
  MockupSettings,
} from "./mockups";

/**
 * 첫 로그인 직후 1회만 노출되는 "사용설명서" 카드 오버레이.
 *
 * 디자인 의도 — "앱 화면으로 착각되지 않도록" 만드는 것이 최우선.
 *   1) 상단에 큰 "📖 사용설명서" 헤더바로 맥락을 명확히 표시
 *   2) 모달 전체 배경은 점묘 패턴(graph-paper) → 앱의 평면과 구분
 *   3) 목업을 "예시 화면 미리보기" 액자(대시 테두리 + 테이프 라벨)로
 *      감싸, 실제 앱 UI 가 아니라 *프리뷰 일러스트* 임을 신호
 *   4) 챕터 북마크 / 진행바 / 페이지 번호로 "책" 메타포 강화
 *   5) 하단에 상시 안내: "설정 > 앱 사용 안내에서 다시 볼 수 있어요"
 *
 * 기존 `onDone` prop 은 그대로 유지 — OnboardingGate, settings 의
 * "다시 보기" 버튼이 영향 받지 않는다.
 */

interface Slide {
  chapterNo: number;
  chapterName: string;
  title: string;
  highlight?: string;
  desc: string;
  bullets?: string[];
  tip?: string;
  Mockup: () => React.ReactElement;
}

const SLIDES: Slide[] = [
  {
    chapterNo: 1,
    chapterName: "메인 화면",
    title: "① 아래 큰",
    highlight: "‘시작하기’ 버튼부터",
    desc: "빨간 히어로의 ① HERE 를 따라 아래쪽 ‘시작하기’를 눌러 검색을 시작합니다. 왼쪽 카드는 증상별 응급조치요령으로, 오른쪽 119 버튼은 즉시 전화 연결입니다.",
    bullets: [
      "히어로 아래 왼쪽 카드는 증상별 응급조치요령(검색 화면으로 연결)",
      "오른쪽 119 버튼은 언제든 즉시 전화 연결 · 신뢰 strip 은 공공데이터(E-Gen)",
    ],
    tip: "위급 신호(흉통·의식저하·대량출혈)가 보이면 검색 전에 먼저 119 에 전화하세요.",
    Mockup: MockupHome,
  },
  {
    chapterNo: 2,
    chapterName: "환자 상태 평가",
    title: "② 주 증상을 고르면",
    highlight: "KTAS 중증도가 바로 반영돼요",
    desc: "검색 탭의 ‘환자 상태 평가’ 화면에서 주 증상을 선택합니다. 복수 선택이 가능하고, 추가 메모·음성으로 상황을 적을 수 있어요. 성별·연령대를 넣으면 안내가 더 정확해집니다.",
    bullets: [
      "위급도 배너(예: 매우위급)와 119 안내를 꼭 확인하세요",
      "하단 ‘가까운 응급실 찾기’로 검색 결과로 이동합니다",
    ],
    tip: "KTAS 중증도·위급도는 참고용이며, 의료진의 진단을 대체하지 않습니다.",
    Mockup: MockupAssessment,
  },
  {
    chapterNo: 3,
    chapterName: "검색 결과 · 리스트",
    title: "가까운 응급실을",
    highlight: "리스트로 한눈에",
    desc: "반경 슬라이더(최대 200km)와 정렬(빠른 순·가까운 순·수용 가능)로 원하는 기준을 바로 설정할 수 있어요.",
    bullets: [
      "실시간 수용 가능 · 붐빔 · 포화 배지 표시",
      "카드에서 바로 전화 또는 길안내 실행",
    ],
    Mockup: MockupResultsList,
  },
  {
    chapterNo: 4,
    chapterName: "검색 결과 · 지도",
    title: "지도로 전환해",
    highlight: "위치와 혼잡도를 함께",
    desc: "병원 핀은 수용 가능·붐빔·포화 3색으로 구분되어 멀리서도 식별하기 쉬워요. 내 위치 기준 최적 동선도 함께 확인합니다.",
    bullets: [
      "핀 탭 → 하단 카드에 요약 정보",
      "카드에서 바로 길안내를 시작할 수 있어요",
    ],
    Mockup: MockupResultsMap,
  },
  {
    chapterNo: 5,
    chapterName: "길안내",
    title: "한 번의 탭으로",
    highlight: "선호 내비 앱 실행",
    desc: "병원 카드의 길안내 버튼은 설정해 둔 기본 내비(네이버·카카오·티맵) 앱을 출발지·도착지가 채워진 상태로 바로 엽니다.",
    bullets: [
      "처음 한 번만 앱을 선택하면 이후 자동",
      "언제든 설정 → 기본 내비에서 변경",
    ],
    Mockup: MockupNavigation,
  },
  {
    chapterNo: 6,
    chapterName: "내 기록",
    title: "방금 전 검색도",
    highlight: "언제든 다시 확인",
    desc: "지난 검색의 증상·시각·추천된 응급실이 타임라인으로 저장됩니다. 같은 증상이 재발할 때 이전 선택을 빠르게 참고하세요.",
    bullets: [
      "기기 내에만 저장되는 안전한 로컬 기록",
      "개별 삭제 · 전체 삭제 모두 가능",
    ],
    Mockup: MockupHistory,
  },
  {
    chapterNo: 7,
    chapterName: "구급대 리포트",
    title: "구급대원이라면",
    highlight: "현장 리포트 작성·검색",
    desc: "출동번호·환자 기본정보·KTAS·처치 내역을 구조화 양식으로 기록하고, 지난 리포트를 이름·번호로 검색할 수 있어요.",
    bullets: [
      "구급대원 인증 시 소속 기관 클라우드와 동기화",
      "PDF 인쇄 · 내부 공유 양식 지원",
    ],
    tip: "일반 사용자에게는 기록 탭의 이 영역이 숨겨지거나 안내 문구로 대체됩니다.",
    Mockup: MockupDispatch,
  },
  {
    chapterNo: 8,
    chapterName: "설정",
    title: "나에게 맞게",
    highlight: "프로필·알림·언어·테마",
    desc: "프로필 사진과 알림 여부, 표시 언어(한국어·English·日本語·中文), 기본 내비, 화면 모드(라이트·다크·시스템)를 한 곳에서 관리해요.",
    bullets: [
      "개인정보 처리방침 · 도움말 · 로그아웃도 여기에서",
      "이 안내도 [설정 → 앱 사용 안내 다시 보기] 에서 언제든 다시 볼 수 있어요",
    ],
    Mockup: MockupSettings,
  },
];

export function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const total = SLIDES.length;
  const isLast = idx === total - 1;
  const isFirst = idx === 0;

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setDir(next > idx ? 1 : -1);
      setIdx(next);
    },
    [idx, total],
  );

  const next = useCallback(() => {
    if (isLast) {
      onDone();
      return;
    }
    go(idx + 1);
  }, [idx, isLast, go, onDone]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onDone]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const slide = SLIDES[idx];
  const Mockup = slide.Mockup;

  const slideVariants = useMemo(
    () => ({
      enter: (d: 1 | -1) => ({ x: d * 32, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: 1 | -1) => ({ x: -d * 32, opacity: 0 }),
    }),
    [],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[1000] flex items-stretch justify-center"
    >
      {/* Backdrop — 더 짙게 + 블러 강화해 "앱이 아니라 설명서가 열림"을 강조 */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[520px] flex-col",
          "bg-bg text-text",
          // 점묘 패턴 — "노트/매뉴얼 종이" 느낌. 앱의 평면 surface 와 구분됨.
          "bg-[radial-gradient(circle,rgb(var(--color-border))_1px,transparent_1.2px)] [background-size:22px_22px]",
          "sm:my-6 sm:rounded-[var(--radius-xl)] sm:border-2 sm:border-border-strong sm:shadow-[var(--shadow-lg)]",
          "overflow-hidden pt-[env(safe-area-inset-top)]",
        )}
      >
        {/* =============================================================
            Header — "📖 사용설명서" — 이 화면의 정체를 가장 먼저 알림
           ============================================================= */}
        <header className="relative shrink-0 bg-gradient-to-br from-primary/8 via-bg to-bg px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-fg shadow-[var(--shadow-md)]">
              <BookOpen className="size-[22px]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-extrabold tracking-tight text-text">
                  바로응급실 사용설명서
                </span>
                <span className="inline-flex items-center rounded-full bg-primary-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                  Guide
                </span>
              </div>
              <p className="truncate text-[11.5px] text-text-muted">
                처음 접속이시죠? 60초면 모두 둘러봐요.
              </p>
            </div>
            <button
              type="button"
              aria-label="건너뛰기"
              onClick={onDone}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          {/* Dashed separator — 노트처럼 "구분선" 느낌 */}
          <div
            aria-hidden
            className="mt-3 h-px w-full border-t border-dashed border-border-strong/80"
          />

          {/* Progress — 8칸 세그먼트 */}
          <div className="mt-3 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번 카드로 이동`}
                onClick={() => go(i)}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
              >
                <span
                  className={cn(
                    "block h-full rounded-full transition-all duration-300",
                    i < idx
                      ? "w-full bg-primary/55"
                      : i === idx
                        ? "w-full bg-primary"
                        : "w-0 bg-primary",
                  )}
                />
              </button>
            ))}
          </div>

          {/* Chapter bookmark — 책처럼 "챕터 N / 8" 을 제시 */}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
              <Sparkles className="size-3" />
              챕터 {slide.chapterNo} / {total} · {slide.chapterName}
            </div>
            <span className="text-[11px] font-medium tabular-nums text-text-subtle">
              {idx + 1} / {total}
            </span>
          </div>
        </header>

        {/* =============================================================
            Slide body — 카드 한 장 내용
           ============================================================= */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -60) next();
                else if (info.offset.x > 60) prev();
              }}
              className="flex flex-col items-center gap-4"
            >
              {/* Title — 목업보다 먼저 읽히게 */}
              <div className="w-full max-w-[420px] text-center">
                <h2
                  id="onboarding-title"
                  className="text-[20px] font-extrabold leading-tight tracking-tight text-text"
                >
                  {slide.title}
                  {slide.highlight && (
                    <>
                      <br />
                      <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                        {slide.highlight}
                      </span>
                    </>
                  )}
                </h2>
              </div>

              {/* ====== "예시 미리보기 액자" — 이 영역이 실제 앱이 아님을 신호 ====== */}
              <div className="relative w-fit">
                {/* 테이프 스티커 라벨 */}
                <div
                  aria-hidden
                  className={cn(
                    "absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rotate-[-2.5deg]",
                    "rounded-sm px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em]",
                    "bg-amber-200/95 text-amber-900 shadow-[0_2px_4px_-1px_rgb(0_0_0/0.18)]",
                    "dark:bg-amber-300/90 dark:text-amber-950",
                  )}
                >
                  예시 화면 미리보기
                </div>

                {/* 대시 테두리 액자 — "실제 UI 가 아니라 일러스트/프리뷰" 임을 강조 */}
                <div className="rounded-[32px] border-2 border-dashed border-border-strong/85 bg-surface/55 p-2.5 shadow-[var(--shadow-sm)] backdrop-blur-sm">
                  <Mockup />
                </div>

                {/* 우하단 배지 */}
                <div
                  aria-hidden
                  className="absolute -bottom-2 right-1 inline-flex items-center gap-1 rounded-full border border-border-strong/80 bg-bg px-2 py-0.5 text-[9.5px] font-semibold tracking-wide text-text-subtle shadow-[var(--shadow-sm)]"
                >
                  <span className="size-1 rounded-full bg-primary" />
                  PREVIEW · 실제 앱 아님
                </div>
              </div>

              {/* ====== 설명 카드 — "안내/노트" 느낌 ====== */}
              <div className="w-full max-w-[440px] rounded-[var(--radius-lg)] border border-border bg-bg/85 p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                <div className="mb-2 flex items-center gap-1.5">
                  <Lightbulb className="size-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    이렇게 쓰세요
                  </span>
                </div>

                <p className="text-[13.5px] leading-relaxed text-text">
                  {slide.desc}
                </p>

                {slide.bullets && (
                  <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-text-muted">
                    {slide.bullets.map((b, i) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {slide.tip && (
                  <div className="mt-3 rounded-[var(--radius-md)] border border-status-full/30 bg-status-full-soft/60 px-3 py-2 text-[12px] leading-relaxed text-status-full">
                    <span className="font-extrabold">⚠ TIP · </span>
                    {slide.tip}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* =============================================================
            Footer — 상시 안내 + 이전/다음 컨트롤
           ============================================================= */}
        <footer className="sticky bottom-0 shrink-0 border-t border-dashed border-border-strong/70 bg-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2.5 backdrop-blur">
          {/* 상시 안내: "설정에서 언제든 다시 볼 수 있어요" */}
          <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] text-text-subtle">
            <SettingsIcon className="size-3" />
            <span>
              언제든 <b className="font-semibold text-text-muted">설정 · 앱 사용 안내 다시 보기</b>에서 다시 볼 수 있어요
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors",
                isFirst
                  ? "cursor-not-allowed border-border text-text-subtle opacity-55"
                  : "border-border text-text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <ChevronLeft className="size-4" />
              이전
            </button>

            {!isLast && (
              <button
                type="button"
                onClick={onDone}
                className="hidden text-[12.5px] font-medium text-text-subtle hover:text-text-muted sm:inline"
              >
                건너뛰기
              </button>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={next}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all",
                "bg-primary text-primary-fg shadow-[var(--shadow-md)] hover:bg-primary-hover active:translate-y-[1px]",
              )}
            >
              {isLast ? (
                <>
                  <Rocket className="size-4" />
                  시작하기
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
