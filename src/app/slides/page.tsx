"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Printer,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { SLIDES } from "./content";

/**
 * /slides — 바로응급실 소개용 프레젠테이션 덱 (18장).
 *
 * 조작
 *   · ← / → 또는 Space : 이전/다음
 *   · Home / End       : 처음 / 마지막
 *   · ESC              : /home 으로 빠져나감
 *   · 상단 dot 클릭    : 해당 장으로 점프
 *   · 모바일 스와이프  : 좌우로 넘김
 *   · `?overview=1`    : 격자 오버뷰 모드 (모든 장을 한눈에)
 *
 * 인쇄
 *   · @media print CSS 가 dot/버튼을 숨기고 각 슬라이드를 page-break 로
 *     나눠, 브라우저 PDF 로 저장하면 한 장짜리 PDF 덱이 그대로 떨어진다.
 */
export default function SlidesPage() {
  const total = SLIDES.length;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [overview, setOverview] = useState(false);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setDir(clamped >= idx ? 1 : -1);
      setIdx(clamped);
    },
    [idx, total],
  );

  const next = useCallback(() => go(idx + 1), [idx, go]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overview) {
        if (e.key === "Escape") setOverview(false);
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(total - 1);
      } else if (e.key === "o" || e.key === "O") {
        setOverview((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, total, overview]);

  const slide = SLIDES[idx];

  const variants = useMemo(
    () => ({
      enter: (d: 1 | -1) => ({ x: d * 60, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: 1 | -1) => ({ x: -d * 60, opacity: 0 }),
    }),
    [],
  );

  if (overview) {
    return <Overview onPick={(i) => { setOverview(false); go(i); }} onClose={() => setOverview(false)} current={idx} />;
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-bg text-text print:min-h-0">
      {/* 진행바 */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-1 bg-border/50 print:hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary-hover"
          initial={false}
          animate={{ width: `${((idx + 1) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>

      {/* 상단 유틸 바 */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-2 bg-bg/85 px-4 py-3 backdrop-blur print:hidden">
        <Link
          href="/home"
          aria-label="앱으로 돌아가기"
          className="grid size-9 place-items-center rounded-full border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <Home className="size-[17px]" />
        </Link>
        <div className="flex-1 px-1">
          <p className="truncate text-[12px] font-semibold text-text-muted">
            <span className="text-primary">바로응급실</span> · Introduction Deck
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOverview(true)}
          title="오버뷰 (O)"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <LayoutGrid className="size-3.5" />
          오버뷰
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          title="인쇄 / PDF 저장"
          className="hidden items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 hover:text-text sm:inline-flex"
        >
          <Printer className="size-3.5" />
          PDF
        </button>
        <Link
          href="/home"
          aria-label="닫기"
          className="grid size-9 place-items-center rounded-full border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <X className="size-[17px]" />
        </Link>
      </header>

      {/* 슬라이드 뷰포트 */}
      <main className="relative pt-14 print:pt-0">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80) next();
              else if (info.offset.x > 80) prev();
            }}
            className="relative"
          >
            {slide.render({ index: idx + 1, total })}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 하단 컨트롤 */}
      <footer className="fixed inset-x-0 bottom-0 z-40 print:hidden">
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors",
              idx === 0
                ? "cursor-not-allowed border-border text-text-subtle opacity-50"
                : "border-border bg-bg/90 text-text-muted shadow-[var(--shadow-sm)] backdrop-blur hover:bg-surface-2 hover:text-text",
            )}
          >
            <ChevronLeft className="size-4" />
            이전
          </button>

          <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                title={`${i + 1}. ${s.title}`}
                aria-label={`${i + 1}. ${s.title}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx
                    ? "w-6 bg-primary"
                    : i < idx
                      ? "w-1.5 bg-primary/50 hover:bg-primary/80"
                      : "w-1.5 bg-border hover:bg-border-strong",
                )}
              />
            ))}
          </div>

          <div className="flex-1 sm:hidden" />

          <span className="mx-2 font-mono text-[12px] tabular-nums text-text-muted">
            {String(idx + 1).padStart(2, "0")}
            <span className="mx-0.5 opacity-40">/</span>
            {String(total).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={next}
            disabled={idx === total - 1}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all",
              idx === total - 1
                ? "cursor-not-allowed bg-surface-2 text-text-subtle"
                : "bg-primary text-primary-fg shadow-[var(--shadow-md)] hover:bg-primary-hover active:translate-y-[1px]",
            )}
          >
            다음
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Overview (격자 TOC)
 * ──────────────────────────────────────────────────────────────────────── */

function Overview({
  onPick,
  onClose,
  current,
}: {
  onPick: (i: number) => void;
  onClose: () => void;
  current: number;
}) {
  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-bg/90 px-5 py-3 backdrop-blur">
        <p className="flex-1 text-[14px] font-semibold">
          <span className="text-primary">바로응급실</span> · 슬라이드 오버뷰
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <X className="size-4" /> 닫기
        </button>
      </header>
      <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-5 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(i)}
            className={cn(
              "group flex items-center gap-4 rounded-[var(--radius-lg)] border bg-surface p-4 text-left transition-all",
              i === current
                ? "border-primary shadow-[var(--shadow-md)]"
                : "border-border hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
            )}
          >
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] font-mono text-[15px] font-bold",
                i === current
                  ? "bg-primary text-primary-fg"
                  : "bg-primary-soft text-primary",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold text-text">
                {s.title}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-text-muted">
                {s.id}
              </p>
            </div>
            <ChevronRight className="ml-auto size-4 text-text-subtle transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
