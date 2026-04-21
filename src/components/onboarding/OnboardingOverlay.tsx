"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Rocket, X } from "lucide-react";
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

interface Slide {
  /** 상단 챕터 라벨 ("1/8 · 메인화면") */
  chapter: string;
  title: string;
  highlight?: string;
  desc: string;
  /** 하단 bullet 설명 — 너무 길면 생략 */
  bullets?: string[];
  /** 빨간 힌트 박스 (선택) */
  tip?: string;
  Mockup: () => React.ReactElement;
}

const SLIDES: Slide[] = [
  {
    chapter: "1/8 · 메인 화면",
    title: "① 아래 큰 시작",
    highlight: "시작하기 버튼",
    desc: "빨간 히어로에서 ① 안내와 HERE 를 따라가면, 아래쪽 큰 ‘시작하기’를 눌러 검색을 시작합니다. 왼쪽 카드는 증상별 응급조치요령으로 검색 화면과 연결됩니다.",
    bullets: [
      "히어로 아래 왼쪽 카드는 증상별 응급조치요령(검색 화면으로 연결)",
      "오른쪽 119 버튼은 언제든 즉시 전화 연결 · 신뢰 strip 은 공공데이터(E-Gen)",
    ],
    tip: "위급 신호(흉통·의식저하·대량출혈)가 보이면 검색 전에 먼저 119 에 전화하세요.",
    Mockup: MockupHome,
  },
  {
    chapter: "2/8 · 상태 평가",
    title: "증상을 고르면",
    highlight: "KTAS 참고 등급과 응급처치 요령",
    desc: "가슴통증·호흡곤란 같은 증상 칩을 하나 이상 선택하면 KTAS(1~5) 참고 등급과 간단한 응급처치 안내가 함께 표시됩니다.",
    bullets: [
      "성별·연령대 선택으로 더 정확한 안내",
      "메모·음성 입력으로 상황을 보강할 수 있어요",
    ],
    tip: "KTAS 등급은 참고용이며, 의료진의 진단을 대체하지 않습니다.",
    Mockup: MockupAssessment,
  },
  {
    chapter: "3/8 · 검색 결과 · 리스트",
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
    chapter: "4/8 · 검색 결과 · 지도",
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
    chapter: "5/8 · 길안내",
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
    chapter: "6/8 · 내 기록",
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
    chapter: "7/8 · 구급대 리포트",
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
    chapter: "8/8 · 설정",
    title: "나에게 맞게",
    highlight: "프로필·알림·언어·테마",
    desc: "프로필 사진과 알림 여부, 표시 언어(한국어·English·日本語·中文), 기본 내비, 화면 모드(라이트·다크·시스템)를 한 곳에서 관리해요.",
    bullets: [
      "개인정보 처리방침 · 도움말 · 로그아웃도 여기에서",
      "언제든 이 안내를 다시 볼 수 있어요 (설정 → 앱 사용 안내)",
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

  // 키보드 내비게이션
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onDone]);

  // 바디 스크롤 잠금
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
      enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: 1 | -1) => ({ x: -d * 40, opacity: 0 }),
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
      {/* 배경 — 어두운 블러 */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[520px] flex-col",
          "bg-bg text-text",
          "sm:my-6 sm:rounded-[var(--radius-xl)] sm:border sm:border-border sm:shadow-[var(--shadow-lg)]",
          "pt-[env(safe-area-inset-top)]",
        )}
      >
        {/* 상단 바 */}
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[10.5px] font-semibold text-primary">
            사용 안내
          </span>
          <span className="flex-1 truncate text-[11px] text-text-muted">
            {slide.chapter}
          </span>
          <button
            type="button"
            aria-label="건너뛰기"
            onClick={onDone}
            className="grid size-8 place-items-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        {/* 진행 바 — 8칸 */}
        <div className="flex gap-1 px-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번 카드로 이동`}
              onClick={() => go(i)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-border"
            >
              <span
                className={cn(
                  "block h-full rounded-full transition-all duration-300",
                  i < idx
                    ? "w-full bg-primary/60"
                    : i === idx
                      ? "w-full bg-primary"
                      : "w-0 bg-primary",
                )}
              />
            </button>
          ))}
        </div>

        {/* 슬라이드 영역 */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
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
              {/* 목업 */}
              <div className="flex w-full justify-center pt-1">
                <Mockup />
              </div>

              {/* 텍스트 */}
              <div className="w-full max-w-[420px] text-center">
                <h2
                  id="onboarding-title"
                  className="text-[20px] font-bold leading-tight tracking-tight text-text"
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
                <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-text-muted">
                  {slide.desc}
                </p>

                {slide.bullets && (
                  <ul className="mx-auto mt-3 max-w-[380px] space-y-1 text-left text-[12.5px] leading-relaxed text-text-muted">
                    {slide.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {slide.tip && (
                  <div className="mx-auto mt-3 max-w-[380px] rounded-[var(--radius-md)] border border-status-full/30 bg-status-full-soft/50 px-3 py-2 text-left text-[12px] leading-relaxed text-status-full">
                    <span className="font-semibold">TIP · </span>
                    {slide.tip}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 컨트롤 */}
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border/70 bg-bg/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors",
              isFirst
                ? "cursor-not-allowed border-border text-text-subtle opacity-60"
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
      </motion.div>
    </div>
  );
}
