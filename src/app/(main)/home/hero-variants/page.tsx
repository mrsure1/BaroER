"use client";

import { Logo } from "@/components/ui/Logo";
import { DataProviderFooterInline } from "@/components/home/DataProviderFooter";
import { TrustStrip } from "@/components/home/TrustStrip";
import {
  HeroVariantA_GiantTap,
  HeroVariantB_StepHere,
  HeroVariantC_AmberStrip,
  HeroVariantD_SplitLandmark,
  HeroVariantE_HighContrast,
} from "@/components/home/heroVariants";
import { cn } from "@/lib/cn";

const VARIANTS = [
  {
    id: "A",
    title: "시안 A · 원탭 거대 CTA",
    desc: "버튼을 화면 중앙에서 가장 크게. 포인터 아이콘 + 미세한 스케일 펄스로 ‘여기’를 고정.",
    Hero: HeroVariantA_GiantTap,
  },
  {
    id: "B",
    title: "시안 B · 단계 번호 + HERE",
    desc: "① 배지와 아래쪽 화살표로 시선을 ‘시작하기’로 직접 연결.",
    Hero: HeroVariantB_StepHere,
  },
  {
    id: "C",
    title: "시안 C · 앰버 경고 스트립",
    desc: "상단 노란 띠로 ‘한 번만 탭’을 먼저 읽게 하고, 흰 카드로 필수 행동을 분리.",
    Hero: HeroVariantC_AmberStrip,
  },
  {
    id: "D",
    title: "시안 D · 우측 랜드마크 막대",
    desc: "설명은 왼쪽, 오른쪽 세로 ‘시작’ 막대만 누르면 된다는 공간 단서.",
    Hero: HeroVariantD_SplitLandmark,
  },
  {
    id: "E",
    title: "시안 E · 고대비 블랙 버튼",
    desc: "빨강 배경 위 검은 버튼 + 손 아이콘으로 가장 눈에 띄는 대비.",
    Hero: HeroVariantE_HighContrast,
  },
] as const;

function PreviewHeader() {
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

/** 히어로 아래 영역은 시안 비교용으로 동일한 더미로 유지 */
function MiddlePlaceholder() {
  return (
    <div className="space-y-2 px-0.5">
      <div className="h-14 rounded-[var(--radius-md)] border border-dashed border-border/80 bg-surface/60" />
      <div className="h-20 rounded-[var(--radius-md)] border border-dashed border-border/60 bg-surface/40" />
    </div>
  );
}

export default function HeroVariantsPage() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[520px] px-4 pt-[calc(env(safe-area-inset-top)+8px)]",
        "pb-[calc(var(--bottom-nav-pad)+env(safe-area-inset-bottom)+12px)]",
      )}
    >
      <div className="mb-4 rounded-2xl border border-border/80 bg-surface/50 p-3">
        <p className="text-[12px] font-bold text-text">Hero 시안 5종</p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          빨간 히어로만 다르게 했습니다. 맨 아래「데이터 제공」블록은 홈과 동일한
          컴포넌트입니다.
        </p>
      </div>

      <ul className="flex flex-col gap-8">
        {VARIANTS.map(({ id, title, desc, Hero }) => (
          <li key={id}>
            <p className="mb-1.5 text-[13px] font-extrabold text-text">{title}</p>
            <p className="mb-2 text-[11px] leading-snug text-text-muted">{desc}</p>
            <div
              className={cn(
                "overflow-hidden rounded-[1.75rem] border border-border/90 bg-bg shadow-[var(--shadow-md)]",
              )}
            >
              <div className="px-3 pt-3">
                <PreviewHeader />
              </div>
              <div className="px-3 pb-2 pt-1">
                <div className="w-full [height:clamp(184px,33dvh,300px)]">
                  <Hero />
                </div>
              </div>
              <div className="space-y-2 px-3 pb-3">
                <TrustStrip />
                <MiddlePlaceholder />
              </div>
              <DataProviderFooterInline />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
