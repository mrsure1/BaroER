"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 슬라이드 덱에서 반복 사용되는 "인쇄물 품질" 프리미티브.
 *
 * 디자인 원칙
 *  1) 텍스트 크기 스케일은 clamp() 로 뷰포트 어디서도 자연스럽게 축소.
 *  2) 브랜드 레드(primary) 는 "숫자 · 강조 단어 · 액센트 막대" 에만 씀.
 *  3) 여백은 여백대로 두고, 정보 밀도는 2열 그리드로 해결.
 *  4) 모든 블록은 rounded-[var(--radius-lg)] 로 통일해 일관된 조판.
 */

export function SlideShell({
  index,
  total,
  kicker,
  children,
  accent = "primary",
}: {
  index: number;
  total: number;
  /** 좌상단 "챕터" 텍스트 */
  kicker?: string;
  children: ReactNode;
  /** 좌측 세로 액센트 바 색상 */
  accent?: "primary" | "accent" | "text" | "none";
}) {
  const accentClass =
    accent === "primary"
      ? "bg-gradient-to-b from-primary to-primary-hover"
      : accent === "accent"
        ? "bg-gradient-to-b from-accent to-teal-700"
        : accent === "text"
          ? "bg-gradient-to-b from-text to-text-muted"
          : "hidden";

  return (
    <section
      className={cn(
        "relative mx-auto flex w-full max-w-[1100px] flex-col",
        "min-h-[calc(100dvh-88px)] px-8 py-10 sm:px-12 sm:py-14",
      )}
    >
      <span aria-hidden className={cn("absolute left-0 top-16 h-20 w-1.5 rounded-full", accentClass)} />
      {kicker && (
        <div className="mb-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-text-subtle">
          <span className="inline-block h-px w-8 bg-text-subtle/50" />
          <span>{kicker}</span>
          <span className="ml-auto tabular-nums text-text-subtle/70">
            {String(index).padStart(2, "0")}
            <span className="mx-1 opacity-40">/</span>
            {String(total).padStart(2, "0")}
          </span>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

export function SlideTitle({
  children,
  highlight,
  eyebrow,
  className,
}: {
  children: ReactNode;
  /** 타이틀 뒷부분의 그라데이션 강조 텍스트 */
  highlight?: ReactNode;
  /** 타이틀 위 작은 라벨 ("문제 · PROBLEM" 같은 뱃지) */
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1
        className={cn(
          "font-bold tracking-tight text-text",
          "text-[clamp(30px,4.6vw,56px)] leading-[1.04]",
        )}
      >
        {children}
        {highlight && (
          <>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary-hover bg-clip-text text-transparent">
              {highlight}
            </span>
          </>
        )}
      </h1>
    </div>
  );
}

export function SlideSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 max-w-[780px] text-[clamp(14px,1.4vw,18px)] leading-relaxed text-text-muted">
      {children}
    </p>
  );
}

export function Badge({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "accent" | "neutral" | "success" | "warning" | "danger";
}) {
  const map = {
    primary: "border-primary/25 bg-primary-soft text-primary",
    accent: "border-accent/25 bg-accent-soft text-accent",
    neutral: "border-border bg-surface text-text-muted",
    success: "border-status-available/30 bg-status-available-soft text-status-available",
    warning: "border-status-busy/30 bg-status-busy-soft text-status-busy",
    danger: "border-status-full/30 bg-status-full-soft text-status-full",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatBlock({
  value,
  label,
  suffix,
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <p className="text-[clamp(28px,3.2vw,44px)] font-bold leading-none tracking-tight text-primary">
        {value}
        {suffix && <span className="ml-0.5 text-[0.5em] text-text-muted">{suffix}</span>}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug text-text-muted">{label}</p>
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-all">
      <div className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="text-[16px] font-bold text-text">{title}</p>
      <p className="text-[13px] leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}
