"use client";

import { Logo } from "@/components/ui/Logo";
import { DataProviderFooterInline } from "@/components/home/DataProviderFooter";
import {
  FirstAidContextVariantA,
  FirstAidContextVariantB,
  FirstAidContextVariantC,
  FirstAidContextVariantD,
  FirstAidContextVariantE,
} from "@/components/home/firstAidContextVariants";
import { HeroVariantB_StepHere } from "@/components/home/heroVariants";
import { TrustStrip } from "@/components/home/TrustStrip";
import { cn } from "@/lib/cn";

const VARIANTS = [
  {
    id: "A",
    title: "시안 A · 3px primary 솔리드",
    desc: "굵은 빨강 테두리 + 연한 primary 배경 + 증상 칩.",
    Card: FirstAidContextVariantA,
  },
  {
    id: "B",
    title: "시안 B · 4px 앰버",
    desc: "주의를 끌 색 대비(앰버)로 테두리를 두껍게.",
    Card: FirstAidContextVariantB,
  },
  {
    id: "C",
    title: "시안 C · 링 + 오프셋",
    desc: "이중 테두리 느낌의 ring + ring-offset.",
    Card: FirstAidContextVariantC,
  },
  {
    id: "D",
    title: "시안 D · 좌측 굵은 바",
    desc: "왼쪽 8px 액센트로 시선을 카드 안으로. 홈 화면 기본값과 동일.",
    Card: FirstAidContextVariantD,
  },
  {
    id: "E",
    title: "시안 E · 점선 + 열기 버튼",
    desc: "점선 테두리로 ‘펼쳐 볼 것’ 힌트를 주고 우측에 열기 배지.",
    Card: FirstAidContextVariantE,
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

/** 119 카드는 시안 비교와 무관 — 고정 더미 */
function Placeholder119() {
  return (
    <div className="flex min-h-0 flex-col justify-between rounded-[var(--radius-md)] border border-status-full/35 bg-white p-2.5">
      <div className="text-center text-[10px] font-semibold text-status-full">긴급</div>
      <div className="text-center text-[22px] font-black text-status-full">119</div>
      <div className="text-center text-[10px] text-status-full/80">지금 바로 연결</div>
    </div>
  );
}

export default function FirstAidVariantsPage() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[520px] px-4 pt-[calc(env(safe-area-inset-top)+8px)]",
        "pb-[calc(var(--bottom-nav-pad)+env(safe-area-inset-bottom)+12px)]",
      )}
    >
      <div className="mb-4 rounded-2xl border border-border/80 bg-surface/50 p-3">
        <p className="text-[12px] font-bold text-text">증상별 응급조치요령 카드 시안</p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          일반 사용자 홈 좌측 카드에 쓸 5종입니다. 탭 시 `/search` 로 이동합니다.
          맨 아래「데이터 제공」은 홈과 동일한 컴포넌트입니다.
        </p>
      </div>

      <ul className="flex flex-col gap-8">
        {VARIANTS.map(({ id, title, desc, Card }) => (
          <li key={id}>
            <p className="mb-1.5 text-[13px] font-extrabold text-text">{title}</p>
            <p className="mb-2 text-[11px] leading-snug text-text-muted">{desc}</p>
            <div className="overflow-hidden rounded-[1.75rem] border border-border/90 bg-bg shadow-[var(--shadow-md)]">
              <div className="px-3 pt-3">
                <PreviewHeader />
              </div>
              <div className="px-3 pb-2 pt-1">
                <div className="w-full [height:clamp(184px,33dvh,300px)]">
                  <HeroVariantB_StepHere />
                </div>
              </div>
              <div className="space-y-2 px-3 pb-3">
                <TrustStrip />
                <div className="grid min-h-[100px] shrink-0 grid-cols-[1.5fr_1fr] gap-2 sm:min-h-[108px]">
                  <Card />
                  <Placeholder119 />
                </div>
              </div>
              <DataProviderFooterInline />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
