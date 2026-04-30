"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ChevronRight,
  FilePlus2,
  HeartPulse,
  Phone,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { DataProviderFooterFixed } from "@/components/home/DataProviderFooter";
import { FirstAidContextCard } from "@/components/home/firstAidContextVariants";
import { HeroVariantB_StepHere } from "@/components/home/heroVariants";
import { TrustStrip } from "@/components/home/TrustStrip";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";

/**
 * 홈 화면 디자인 원칙
 * --------------------------------------------------------------
 * 1) 부모(main 레이아웃)가 남긴 높이(탭바 제외)를 `h-full` 로 꽉 채운다.
 * 2) 빨간 히어로는 뷰포트 기준 약 1/3(`33dvh`) — clamp 로 초소형·대형폰에서도 비율 유지.
 * 3) 히어로 아래(신뢰·컨텍스트·안전)는 `flex-1 min-h-0 overflow-y-auto` 로만 스크롤.
 * 4) 데이터 제공 푸터는 스크롤 영역 밖·탭바 바로 위에 고정 노출(shrink-0).
 */
export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";

  return (
    <>
      <div
        className={cn(
          /*
           * 홈은 "한 화면 앱" 레이아웃. 푸터는 아래의 Footer 컴포넌트가
           * `fixed` 로 탭바 바로 위에 스스로 붙으므로, 본문은 푸터 높이만큼
           * 하단 여백(`pb-[...]`)만 확보해 주면 된다.
           */
          "mx-auto flex w-full max-w-[520px] flex-col overflow-hidden",
          "h-[calc(100dvh-var(--bottom-nav-pad)-env(safe-area-inset-bottom))]",
          "px-4 pt-[calc(env(safe-area-inset-top)+6px)] pb-[var(--home-footer-pad)]",
        )}
      >
        <Header />

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {/* 앱 뷰포트 기준 약 1/3 — dvh 로 주소창 유무와 무관하게 일관 */}
          <div className="w-full shrink-0 basis-auto [height:clamp(184px,33dvh,300px)]">
            <HeroVariantB_StepHere />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain">
            <TrustStrip />
            <ContextCard isParamedic={isParamedic} />
            <SafetyGuide isParamedic={isParamedic} />
          </div>
        </div>
      </div>

      {/* 탭바 바로 위 고정 푸터 */}
      <DataProviderFooterFixed />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Sections                                                                */
/* ---------------------------------------------------------------------- */

function Header() {
  return (
    <header className="mb-1 flex shrink-0 items-center gap-2.5 py-0.5">
      <Logo height={28} priority />
      <h1 className="min-w-0 flex-1 text-[15px] font-bold leading-[1.25] tracking-tight text-text sm:text-[16px]">
        응급실이 필요할 때,{" "}
        <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          바로 연결해 드릴게요.
        </span>
      </h1>
    </header>
  );
}

/**
 * 사용자별 컨텍스트 카드 + 119 콜.
 * 좌측: 구급대원은 새 리포트 작성 / 일반 사용자는 증상별 응급조치요령(검색 연동).
 * 우측 119 긴급 전화. 하단 2열 카드 굵은 보더는 밝은 청록(teal) 톤으로 통일(CSS).
 */
function ContextCard({ isParamedic }: { isParamedic: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="grid min-h-[100px] shrink-0 grid-cols-[1.5fr_1fr] gap-2 sm:min-h-[108px]"
    >
      {isParamedic ? <ParamedicContext /> : <FirstAidContextCard />}

      <Emergency119Button />
    </motion.section>
  );
}

/**
 * 119 긴급 호출 — "3D 푸시 버튼" 인터랙션.
 *
 * 디자인 의도 (가우시안 블러 없이 솔리드 레이어만으로 입체 표현)
 *  ─────────────────────────────────────────────────────────────────
 *  ① **상단 inset highlight** (rgba(255,255,255,.95))
 *     → 카드 위쪽 1.5px 가 하얗게 빛나며 "탑 베벨" (chamfer top)
 *  ② **하단 inset shadow** (rgba(120,20,20,.22))
 *     → 카드 안쪽 바닥에 미세한 어둠 → 표면이 살짝 오목해 보임
 *  ③ **측면 누적 솔리드 edge** (5층, 1px → 5px)
 *     → 위에서 아래로 #c52828 → #b91c1c → #a31616 → #881010 → #6e0c0c
 *       로 점점 짙어져 ambient occlusion 처럼 "두께가 곡선으로 깎인 면"
 *       처럼 보임. 단일 그림자보다 훨씬 입체적.
 *  ─────────────────────────────────────────────────────────────────
 *  · 호버: 상단 highlight 가 더 밝아지며 카드가 "반응" 한다는 신호만
 *    살짝 줌 (위치/크기 변화 없음 — 모바일 친화적, 의도치 않은 들썩임 X)
 *  · 클릭/탭(active): 카드가 5px 내려앉음과 동시에 5층 측면 edge 가
 *    한 번에 사라지고, inset 도 "눌린" 깊은 그림자로 바뀌며 자기
 *    발자국 안으로 푹 가라앉음 → 물리적인 "버튼 눌림" 햅틱
 *  · "119" 텍스트는 소방청 BI 이미지로 교체.
 *
 * 접근성
 *  · `aria-label` 로 의미 명시
 *  · transition duration 100ms — 햅틱한 반응성 확보(<150ms 권장 한계)
 *  · `select-none` 으로 더블탭 시 텍스트 셀렉션 회피
 */
function Emergency119Button() {
  return (
    <Link
      href="tel:119"
      aria-label="119 긴급 전화 걸기"
      className={cn(
        "group block h-full min-h-0 select-none transition-transform duration-100 ease-out",
        "active:translate-y-[5px]",
      )}
    >
      <div
        className={cn(
          "btn-119 home-cta-red-tile",
          "relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[var(--radius-md)]",
          // 솔리드 측면 베벨 + inset 음영 (.btn-119 클래스) 이 담당.
          "bg-white",
          "p-2.5",
        )}
      >
        <div className="relative flex items-center justify-center gap-1.5">
          <span className="grid size-6 place-items-center rounded-full bg-status-full text-white">
            <Phone className="size-[12px]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-status-full sm:text-[10.5px]">
            긴급
          </span>
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* 119 BI — 텍스트 대신 공식 로고 사용 (흰 배경 위에 자연스럽게 안착) */}
          <Image
            src="/logos/119.png"
            alt="119"
            width={202}
            height={88}
            style={{ height: 22, width: "auto" }}
            className="block max-w-none"
            priority={false}
            unoptimized
          />
          <p className="mt-0.5 w-full text-[10.5px] font-medium text-status-full/85 sm:text-[11px]">
            지금 바로 연결
          </p>
        </div>
      </div>
    </Link>
  );
}

function ParamedicContext() {
  return (
    <Link href="/dispatch/new" className="block h-full min-h-0">
      <Card
        className={cn(
          "flex h-full min-h-0 items-center gap-2.5 p-2.5 sm:p-3",
          "border-0", /* 플랫 카드 — 청록 보더는 .home-grid-teal-flat */
          "home-grid-teal-flat",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-sm)]">
          <FilePlus2 className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-accent">
            구급대원
          </p>
          <p className="mt-0.5 truncate text-[14px] font-bold text-text">
            새 리포트 작성
          </p>
          <p className="mt-0.5 truncate text-[11px] text-text-muted">
            구급활동일지 · 클라우드 보관
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-text-subtle" />
      </Card>
    </Link>
  );
}

/**
 * KTAS·119 즉시 호출 기준의 응급 신호를 압축한 안내. 일반 사용자에게는
 * "이 신호가 보이면 망설이지 말고 119" 의 조기 인식 메시지를, 구급대원에게는
 * 현장 평가 약어(AVPU/SAMPLE/OPQRST) 빠른 참조를 제공한다.
 */
function SafetyGuide({ isParamedic }: { isParamedic: boolean }) {
  if (isParamedic) {
    const refs = [
      { code: "AVPU", desc: "Alert · Verbal · Pain · Unresp" },
      { code: "SAMPLE", desc: "Sx · Allergy · Med · PMHx · Last meal · Event" },
      { code: "OPQRST", desc: "Onset · Provoke · Quality · Region · Severity · Time" },
    ];
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.16 }}
      >
        <Card className="shrink-0 p-2.5 sm:p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Activity className="size-3.5 text-accent" />
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-accent sm:text-[11px]">
              현장 평가 빠른 참조
            </p>
          </div>
          <ul className="space-y-1">
            {refs.map((r) => (
              <li
                key={r.code}
                className="flex items-baseline gap-2 border-b border-border/60 pb-1 last:border-b-0 last:pb-0"
              >
                <span className="w-[56px] shrink-0 font-mono text-[11.5px] font-bold text-text sm:w-[58px] sm:text-[12px]">
                  {r.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-text-muted sm:text-[11.5px]">
                  {r.desc}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.section>
    );
  }

  const signs = [
    { Icon: HeartPulse, label: "심한 흉통·호흡곤란" },
    { Icon: ShieldCheck, label: "의식 저하·반응 없음" },
    { Icon: Siren, label: "대량 출혈·심한 화상" },
  ];
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.16 }}
    >
      <Card className="shrink-0 p-2.5 sm:p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Siren className="size-3.5 text-status-full" />
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-status-full sm:text-[11px]">
            즉시 119가 필요한 신호
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-1.5">
          {signs.map(({ Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-sm)] bg-status-full-soft/60 px-1.5 py-1.5 text-center"
            >
              <Icon className="size-4 text-status-full" strokeWidth={2.2} />
              <span className="text-[10.5px] font-medium leading-tight text-status-full sm:text-[11px]">
                {label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11px] leading-snug text-text-muted">
          위 신호가 보이면 검색 전 먼저 <b className="text-status-full">119</b> 에
          전화하세요.
        </p>
      </Card>
    </motion.section>
  );
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */
