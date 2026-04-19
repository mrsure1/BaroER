"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ChevronRight,
  FilePlus2,
  History,
  Phone,
  Siren,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/authStore";

// 홈 화면 컴팩션 원칙 — iPhone SE(667pt) 기준 한 뷰포트에 Header · Greeting ·
// Hero CTA · Quick actions · Tip 카드까지 모두 들어오도록 각 섹션의 margin/
// padding, 폰트 크기, 히어로 내부 gap 을 단계적으로 축소. "시작하기" 등
// 핵심 인터랙션이 fold 아래로 내려가지 않는 것이 목표.
export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";

  // 퀵 액션 슬롯 — 구급대원은 "리포트 작성" 을, 일반 사용자는 "최근 기록" 을.
  const quickActions = isParamedic
    ? [
        {
          href: "tel:119",
          label: "119",
          sub: "긴급 전화",
          Icon: Phone,
          tone: "danger" as const,
        },
        {
          href: "/dispatch/new",
          label: "리포트 작성",
          sub: "구급활동일지",
          Icon: FilePlus2,
          tone: "neutral" as const,
        },
      ]
    : [
        {
          href: "tel:119",
          label: "119",
          sub: "긴급 전화",
          Icon: Phone,
          tone: "danger" as const,
        },
        {
          href: "/dispatch",
          label: "최근 기록",
          sub: "내 검색 이력",
          Icon: History,
          tone: "neutral" as const,
        },
      ];

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+6px)]">
      {/* Header — 의미 없는 알림 버튼 제거. 브랜드 로고만 유지. */}
      <header className="flex items-center py-1.5">
        <Logo height={32} priority />
      </header>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-3"
      >
        <p className="text-[12px] font-medium text-text-muted">좋은 하루입니다 👋</p>
        <h1 className="mt-0.5 text-[20px] font-bold leading-[1.2] tracking-tight text-text">
          응급실이 필요할 때,{" "}
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
        className="mt-3"
      >
        <Link href="/search" className="group block">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary-hover p-0 shadow-[var(--shadow-lg)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-6 size-64 rounded-full bg-white/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-3 p-4">
              <div className="flex items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <Sparkles className="size-3" />
                실시간 응급실 검색
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-bold leading-[1.2] text-white">
                    환자 상태를 입력하고
                    <br />
                    가장 가까운 응급실 찾기
                  </h2>
                  <p className="mt-1 text-[12px] leading-snug text-white/85">
                    병상 · 예상 소요 시간 · 길안내까지 한 번에
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0.9 }}
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-white/95 text-primary shadow-xl"
                >
                  <Siren className="size-[22px]" strokeWidth={2.4} />
                </motion.div>
              </div>

              <div className="flex items-center gap-1.5 self-start rounded-full bg-black/20 px-2.5 py-1 text-[12px] font-medium text-white group-hover:bg-black/30">
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
        className="mt-3 grid grid-cols-2 gap-2.5"
      >
        {quickActions.map(({ href, label, sub, Icon, tone }) => (
          <Link key={href} href={href}>
            <Card className="flex h-full items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <span
                className={
                  tone === "danger"
                    ? "grid size-9 shrink-0 place-items-center rounded-full bg-status-full-soft text-status-full"
                    : "grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-text"
                }
              >
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-text">{label}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-text-muted">{sub}</p>
              </div>
            </Card>
          </Link>
        ))}
      </motion.section>

      {/* Tip card */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.26 }}
        className="mt-3"
      >
        <Card className="border-dashed border-border-strong bg-surface p-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-accent">
            Tip
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-text">
            홈 화면에 추가하면 오프라인에서도 119·최근 검색 결과를 바로 불러올 수 있어요.
          </p>
        </Card>
      </motion.section>
    </div>
  );
}
