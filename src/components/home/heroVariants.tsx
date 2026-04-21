"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  Crosshair,
  Hand,
  MousePointerClick,
  Siren,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const heroShell = "relative flex h-full min-h-0 flex-col overflow-hidden border-0 p-0 shadow-[var(--shadow-lg)]";

/** 시안 A — 전체가 한 번에: 초대형 흰색 CTA + “탭 한 번” 고정 카피 */
export function HeroVariantA_GiantTap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
      <Link
        href="/search"
        className="group block h-full min-h-0"
        aria-label="가까운 응급실 검색 시작"
      >
        <Card
          className={cn(
            heroShell,
            "bg-gradient-to-br from-primary via-primary to-primary-hover",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-2xl"
          />
          <div className="relative flex h-full min-h-0 flex-col justify-between gap-2 p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                STEP 1
              </span>
              <Siren className="size-5 shrink-0 text-white/90" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 py-1">
              <p className="text-[14px] font-extrabold leading-tight text-white sm:text-[15px]">
                긴급 상황이면
                <br />
                <span className="text-white/95">아래 버튼을 한 번만 누르세요</span>
              </p>
              <p className="mt-1 text-[11px] text-white/85">
                병상 · 길안내까지 이어집니다
              </p>
            </div>
            <motion.div
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-primary shadow-xl"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <MousePointerClick className="size-6 shrink-0" strokeWidth={2.4} />
              <span className="text-[17px] font-extrabold tracking-tight">
                가까운 응급실 찾기
              </span>
            </motion.div>
            <p className="text-center text-[10px] font-medium text-white/75">
              카드 전체를 눌러도 검색이 시작됩니다
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/** 시안 B — 큰 번호 + “여기” 화살표가 버튼을 직접 가리킴 */
export function HeroVariantB_StepHere() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
      <Card
        className={cn(
          heroShell,
          "bg-gradient-to-br from-primary via-primary to-primary-hover",
        )}
      >
        <div className="relative flex h-full min-h-0 flex-col gap-2 p-3 sm:p-3.5">
          <div className="flex items-center gap-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[22px] font-black text-primary shadow-lg">
              1
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-snug text-white">
                먼저 이 화면에서
              </p>
              <p className="text-[11px] text-white/85">아래 빨간 버튼을 누릅니다</p>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 py-1">
            <ChevronDown
              className="size-7 text-amber-200 drop-shadow-[0_0_8px_rgba(253,230,138,0.9)]"
              strokeWidth={2.8}
            />
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-200">
              HERE
            </span>
          </div>
          {/*
            시작 버튼: 원 시안 B(py-3·약 44px 높이) 대비 세로 약 2배 탭 영역
            (min-h ~88px + 큰 글자)
          */}
          <Link
            href="/search"
            aria-label="응급실 검색 시작하기"
            className="flex min-h-[88px] w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-black/25 px-3 py-5 text-[18px] font-extrabold text-white ring-2 ring-white/40 backdrop-blur-sm transition hover:bg-black/35 sm:min-h-[96px] sm:text-[19px]"
          >
            시작하기
            <ChevronRight className="size-5 shrink-0" strokeWidth={2.5} />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

/** 시안 C — 상단 앰버 경고 스트립 + 메인 CTA 분리 */
export function HeroVariantC_AmberStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
      <Card
        className={cn(
          heroShell,
          "bg-gradient-to-br from-primary via-primary to-primary-hover",
        )}
      >
        <div className="relative flex h-full min-h-0 flex-col gap-0 overflow-hidden rounded-[inherit]">
          <div className="shrink-0 bg-amber-300 px-3 py-1.5 text-center text-[10.5px] font-extrabold leading-tight text-amber-950">
            길게 누르지 말고 · 한 번만 탭
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-white" />
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold leading-snug text-white">
                  실시간 응급실 검색
                </p>
                <p className="mt-1 text-[11px] text-white/88">
                  증상·연령 입력 (클릭·음성) 후 가장 가까운 곳을 보여줍니다
                </p>
              </div>
            </div>
            <Link
              href="/search"
              className="flex w-full shrink-0 items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3.5 text-primary shadow-xl transition-transform active:scale-[0.99]"
            >
              <span className="text-[16px] font-extrabold">지금 검색 시작</span>
              <span className="text-[11px] font-bold text-primary/80">필수</span>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/** 시안 D — 좌측 설명 + 우측 세로형 “시작” 랜드마크 */
export function HeroVariantD_SplitLandmark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
      <Link href="/search" className="group block h-full min-h-0">
        <Card
          className={cn(
            heroShell,
            "bg-gradient-to-br from-primary via-primary to-primary-hover",
          )}
        >
          <div className="relative flex h-full min-h-0 flex-row gap-2 p-2.5 sm:p-3">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between py-1 pr-1">
              <div className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">
                응급
              </div>
              <div>
                <p className="text-[14px] font-bold leading-snug text-white">
                  오른쪽 빨간 막대를
                  <br />
                  눌러주세요
                </p>
                <p className="mt-1 text-[10.5px] text-white/85">
                  병상 · 예상시간 · 길안내
                </p>
              </div>
            </div>
            <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white/95 py-2 text-primary shadow-xl ring-2 ring-white/40 transition group-hover:bg-white">
              <Crosshair className="size-6" strokeWidth={2.4} />
              <span className="text-[17px] font-black tracking-tight">시작</span>
              <ChevronRight className="size-3.5 opacity-80" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/** 시안 E — 고대비 블랙 버튼 + 손 아이콘 + “지금” 강조 */
export function HeroVariantE_HighContrast() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
      <Card
        className={cn(
          heroShell,
          "bg-[radial-gradient(120%_120%_at_20%_0%,#ef4444_0%,#b91c1c_45%,#7f1d1d_100%)]",
        )}
      >
        <div className="relative flex h-full min-h-0 flex-col justify-between gap-2 p-3 sm:p-3.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">
              LIVE
            </span>
            <span className="text-[10px] font-semibold text-white/80">
              실시간 응급실 검색
            </span>
          </div>
          <p className="text-[13px] font-bold leading-snug text-white/95">
            지금 당장 눌러야 할 버튼은
            <br />
            <span className="text-lg font-black text-white">아래 검은색입니다</span>
          </p>
          <Link
            href="/search"
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-[16px] font-extrabold text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-2 ring-white/25 transition hover:ring-white/50"
          >
            <Hand className="size-5 shrink-0" />
            응급실 찾기
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
