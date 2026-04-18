"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ChevronRight,
  Clock,
  History,
  Phone,
  Siren,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";

const quickActions = [
  { href: "tel:119", label: "119", sub: "긴급 전화", Icon: Phone, tone: "danger" as const },
  { href: "/dispatch", label: "최근 기록", sub: "내 검색 이력", Icon: History, tone: "neutral" as const },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+8px)]">
      {/* Header */}
      <header className="flex items-center justify-between py-2.5">
        <Logo height={36} priority />
        <IconButton variant="surface" aria-label="알림" size="md">
          <Activity />
        </IconButton>
      </header>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-5"
      >
        <p className="text-[13px] font-medium text-text-muted">좋은 하루입니다 👋</p>
        <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight text-text">
          응급실이 필요할 때,
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            바로 연결해 드릴게요.
          </span>
        </h1>
      </motion.div>

      {/* Hero CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="mt-6"
      >
        <Link href="/search" className="group block">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary-hover p-0 shadow-[var(--shadow-lg)]">
            {/* Decorative blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-6 size-64 rounded-full bg-white/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-5 p-6">
              <div className="flex items-center gap-2 self-start rounded-full bg-white/20 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                실시간 응급실 검색
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-bold leading-[1.2] text-white">
                    환자 상태를 입력하고
                    <br />
                    가장 가까운 응급실 찾기
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">
                    수용 가능한 병상 · 예상 소요 시간 · 길안내까지 한 번에
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0.9 }}
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-primary shadow-xl"
                >
                  <Siren className="size-7" strokeWidth={2.4} />
                </motion.div>
              </div>

              <div className="mt-1 flex items-center gap-1.5 self-start rounded-full bg-black/20 px-3 py-1.5 text-[12.5px] font-medium text-white group-hover:bg-black/30">
                시작하기
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Quick actions */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        className="mt-5 grid grid-cols-2 gap-3"
      >
        {quickActions.map(({ href, label, sub, Icon, tone }) => (
          <Link key={href} href={href}>
            <Card className="flex h-full flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <span
                className={
                  tone === "danger"
                    ? "grid size-10 place-items-center rounded-full bg-status-full-soft text-status-full"
                    : "grid size-10 place-items-center rounded-full bg-surface-2 text-text"
                }
              >
                <Icon className="size-[20px]" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-text">{label}</p>
                <p className="mt-0.5 text-[12.5px] text-text-muted">{sub}</p>
              </div>
            </Card>
          </Link>
        ))}
      </motion.section>

      {/* Live status strip */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.26 }}
        className="mt-5"
      >
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="relative grid size-10 place-items-center rounded-full bg-status-available-soft text-status-available">
              <span className="absolute inset-0 animate-ping rounded-full bg-status-available/30" />
              <Clock className="relative size-[18px]" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-text-muted">실시간 공공데이터</p>
              <p className="text-[14.5px] font-semibold text-text">방금 업데이트됨</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-text-subtle" />
        </Card>
      </motion.section>

      {/* Tip card */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.34 }}
        className="mt-4"
      >
        <Card className="border-dashed border-border-strong bg-surface p-4">
          <p className="text-[12.5px] font-semibold uppercase tracking-wider text-accent">
            Tip
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-text">
            홈 화면에 추가하면 오프라인에서도 119·최근 검색 결과를 바로 불러올 수 있어요.
          </p>
        </Card>
      </motion.section>
    </div>
  );
}
