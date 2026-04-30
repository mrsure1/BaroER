"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Cross,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const href = "/search";
const aria = "증상별 응급조치요령 — 검색 화면으로 이동";

const chips = ["흉통", "호흡", "의식", "출혈"];

type ShellProps = {
  children: ReactNode;
  className?: string;
  cardClassName?: string;
};

function Shell({ children, className, cardClassName }: ShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("h-full min-h-0", className)}
    >
      <Link href={href} aria-label={aria} className="block h-full min-h-0">
        <Card
          className={cn(
            "flex h-full min-h-0 flex-col justify-center gap-1 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:gap-1.5 sm:p-3",
            cardClassName,
          )}
        >
          {children}
        </Card>
      </Link>
    </motion.div>
  );
}

/** 시안 A — 3px 솔리드 primary + 연한 배경 (홈 기본 적용) */
export function FirstAidContextVariantA() {
  return (
    <Shell
      cardClassName={cn(
        "border-[3px] border-primary bg-primary-soft/45 shadow-sm",
        "dark:bg-primary-soft/25",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-sm)]">
          <BookOpen className="size-[18px]" strokeWidth={2.3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            증상별 응급조치요령
          </p>
          <p className="mt-0.5 text-[13.5px] font-bold leading-snug text-text">
            증상을 고르면
            <br />
            맞춤 처치 요약
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-text-muted">
            검색 화면에서 증상·연령 입력 후 안내를 확인하세요.
          </p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-primary" />
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full border border-primary/40 bg-white/80 px-1.5 py-0.5 text-[9.5px] font-semibold text-primary dark:bg-bg/80"
          >
            {c}
          </span>
        ))}
      </div>
    </Shell>
  );
}

/** 시안 B — 4px 앰버 보더 + 경고 톤 */
export function FirstAidContextVariantB() {
  return (
    <Shell
      cardClassName={cn(
        "border-4 border-amber-500 bg-amber-50/90 dark:border-amber-400 dark:bg-amber-950/35",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-md">
          <AlertTriangle className="size-[18px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
            증상별 응급조치요령
          </p>
          <p className="mt-0.5 text-[13.5px] font-bold text-text">
            도착 전 할 일 체크
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            증상 칩을 누르면 응급조치 가이드가 펼쳐집니다.
          </p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
      </div>
    </Shell>
  );
}

/** 시안 C — ring + 오프셋 (이중 테두리 느낌) */
export function FirstAidContextVariantC() {
  return (
    <Shell
      cardClassName={cn(
        "border-2 border-primary bg-surface shadow-md",
        "ring-4 ring-primary/35 ring-offset-2 ring-offset-bg",
      )}
    >
      <div className="flex items-center gap-2">
        <Stethoscope className="size-8 shrink-0 text-primary" strokeWidth={2.4} />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            증상별 응급조치요령
          </p>
          <p className="text-[13px] font-bold text-text">
            KTAS와 함께 안내
          </p>
          <p className="text-[11px] text-text-muted">
            선택 증상에 맞는 응급처치 요약
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-primary" />
      </div>
    </Shell>
  );
}

/** 시안 D — 119와 같은 3D 푸시(.btn-119)·하단 카드 공통 밝은 청록 굵은 보더(.home-cta-teal-tile) */
export function FirstAidContextVariantD() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="h-full min-h-0"
    >
      <Link
        href={href}
        aria-label={aria}
        className={cn(
          "group block h-full min-h-0 select-none transition-transform duration-100 ease-out",
          "active:translate-y-[5px]",
        )}
      >
        <div
          className={cn(
            "btn-119 home-cta-teal-tile",
            "relative flex h-full min-h-0 flex-col justify-between gap-1.5 overflow-hidden rounded-[var(--radius-md)]",
            "bg-white",
            "p-2.5 sm:p-3",
          )}
        >
          <div className="flex items-start gap-2">
            <Cross className="size-7 shrink-0 text-status-full" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-status-full">
                증상별 응급조치요령
              </p>
              <p className="mt-0.5 text-[13.5px] font-bold leading-snug text-text">
                병원 가기 전
                <br />
                지금 할 수 있는 것
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                음성·메모로 상황을 남길 수 있어요.
              </p>
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-text-subtle" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** 시안 E — 점선 굵은 테두리 + “열기” 느낌 */
export function FirstAidContextVariantE() {
  return (
    <Shell
      cardClassName={cn(
        "border-[3px] border-dashed border-primary bg-primary-soft/30",
        "dark:bg-primary-soft/15",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            증상별 응급조치요령
          </p>
          <p className="mt-0.5 text-[13.5px] font-bold text-text">
            탭해서 요령 보기
          </p>
          <p className="text-[11px] text-text-muted">
            일반인·보호자용 응급처치 요약
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-fg">
          열기
        </span>
      </div>
    </Shell>
  );
}

/** 홈 화면 기본 — 시안 D (좌측 굵은 액센트 바) */
export function FirstAidContextCard() {
  return <FirstAidContextVariantD />;
}
