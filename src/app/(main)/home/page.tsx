"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  Building2,
  ChevronRight,
  Clock,
  Database,
  FilePlus2,
  Flame,
  HeartPulse,
  History,
  Hospital,
  Phone,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Wifi,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/authStore";
import { useHistoryStore } from "@/stores/historyStore";
import { SYMPTOMS } from "@/stores/searchStore";
import { cn } from "@/lib/cn";

const symptomMap = new Map(SYMPTOMS.map((s) => [s.id, s] as const));

/**
 * 홈 화면 디자인 원칙
 * --------------------------------------------------------------
 * 1) 컨테이너를 `min-h-[100dvh - 탭바 - 안전영역]` 으로 확보해
 *    하단까지 활용한다. 섹션 사이 gap-3 + 마지막 푸터 `mt-auto`
 *    로 자연스럽게 분산되어 빈 여백이 사라지고 무게감이 생긴다.
 * 2) Hero CTA → 신뢰 strip(전국 응급의료기관 411+/실시간 E-Gen/24h)
 *    → 사용자별 컨텍스트 카드(최근 활동/리포트 작성) → 응급 안전
 *    퀵 가이드 → 푸터(데이터 출처) 5단 구성으로 정보 밀도와
 *    가독성을 동시에 확보.
 * 3) 일반/구급대원 분기는 컨텍스트 섹션과 안전 가이드 두 곳에서만
 *    이뤄지고, 나머지 정보는 공용으로 두어 전환 시 레이아웃이
 *    크게 흔들리지 않게 한다.
 */
export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";
  const recent = useHistoryStore((s) => s.entries[0]);

  // 컨테이너를 화면 높이에 정확히 맞춰 둠으로써 페이지 자체 스크롤을 차단.
  // 5단 + 푸터를 모두 fold 안에 가두는 게 디자인 의도이며, 일부 미세 over 는
  // 자식 단위 패딩 압축(아래 각 섹션) 으로 흡수한다. 매우 작은 화면(예: 320px
  // 미만 wearable) 에선 overflow-hidden 으로 잘리는 게 무한 스크롤보다 UX 가
  // 명확.
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[520px] flex-col gap-2.5 px-5 pb-2",
        "pt-[calc(env(safe-area-inset-top)+4px)]",
        "h-[calc(100dvh-72px-env(safe-area-inset-bottom)-env(safe-area-inset-top))]",
        "overflow-hidden",
      )}
    >
      <Header />

      <HeroCard />

      <TrustStrip />

      <ContextCard isParamedic={isParamedic} recent={recent} />

      <SafetyGuide isParamedic={isParamedic} />

      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Sections                                                                */
/* ---------------------------------------------------------------------- */

function Header() {
  return (
    <header className="flex items-center gap-2.5 py-0.5">
      <Logo height={28} priority />
      <h1 className="min-w-0 flex-1 text-[16.5px] font-bold leading-[1.2] tracking-tight text-text">
        응급실이 필요할 때,{" "}
        <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          바로 연결해 드릴게요.
        </span>
      </h1>
    </header>
  );
}

function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
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

          <div className="relative flex flex-col gap-2 p-3.5">
            <div className="flex items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <Sparkles className="size-3" />
              실시간 응급실 검색
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16.5px] font-bold leading-[1.2] text-white">
                  환자 상태를 입력하고
                  <br />
                  가장 가까운 응급실 찾기
                </h2>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/85">
                  병상 · 예상 소요 시간 · 길안내까지 한 번에
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0.9 }}
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/95 text-primary shadow-xl"
              >
                <Siren className="size-[20px]" strokeWidth={2.4} />
              </motion.div>
            </div>

            <div className="flex items-center gap-1.5 self-start rounded-full bg-black/20 px-2.5 py-0.5 text-[11.5px] font-medium text-white group-hover:bg-black/30">
              시작하기
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * 전국 응급의료기관 신뢰 strip.
 * 수치 411 은 보건복지부 응급의료기관 지정 현황(권역+지역응급의료센터+
 * 지역응급의료기관) 공식 통계의 안전한 라운딩 표기. 이 앱이 가벼운 토이가
 * 아니라 공공 데이터에 기반한 도구임을 한 줄로 전달한다.
 */
function TrustStrip() {
  const stats = [
    { Icon: Hospital, big: "411+", label: "전국 응급의료기관" },
    { Icon: Wifi, big: "실시간", label: "E-Gen 데이터 연동" },
    { Icon: Clock, big: "24h", label: "야간·주말 운영 표시" },
  ];
  return (
      <Card className="grid grid-cols-3 divide-x divide-border p-0">
      {stats.map(({ Icon, big, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-2 py-2 text-center"
        >
          <Icon className="size-3.5 text-primary" strokeWidth={2.2} />
          <p className="text-[14.5px] font-bold leading-none text-text">{big}</p>
          <p className="text-[10.5px] leading-tight text-text-muted">{label}</p>
        </div>
      ))}
    </Card>
  );
}

/**
 * 사용자별 컨텍스트 카드 + 119 콜.
 * 좌측 큰 액션(구급대원: 새 리포트 작성 / 일반: 가장 최근 검색 요약 또는
 * 빈 상태 안내), 우측 119 긴급 전화 카드를 6:4 비율로 배치.
 */
function ContextCard({
  isParamedic,
  recent,
}: {
  isParamedic: boolean;
  recent?: ReturnType<typeof useHistoryStore.getState>["entries"][number];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="grid grid-cols-[1.3fr_1fr] gap-2.5"
    >
      {isParamedic ? (
        <ParamedicContext />
      ) : recent ? (
        <RecentContext recent={recent} />
      ) : (
        <EmptyContext />
      )}

      <Link href="tel:119">
        <Card className="flex h-full flex-col justify-between border-status-full/30 bg-status-full-soft p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-1.5">
            <span className="grid size-7 place-items-center rounded-full bg-status-full text-white">
              <Phone className="size-[14px]" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-status-full">
              긴급
            </span>
          </div>
          <div>
            <p className="text-[22px] font-extrabold leading-none text-status-full">
              119
            </p>
            <p className="mt-0.5 text-[11px] text-status-full/80">
              지금 바로 연결
            </p>
          </div>
        </Card>
      </Link>
    </motion.section>
  );
}

function ParamedicContext() {
  return (
    <Link href="/dispatch/new" className="block">
      <Card className="flex h-full items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-sm)]">
          <FilePlus2 className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            구급대원
          </p>
          <p className="mt-0.5 truncate text-[14px] font-bold text-text">
            새 리포트 작성
          </p>
          <p className="mt-0.5 truncate text-[11px] text-text-muted">
            구급활동일지 · 클라우드 보관
          </p>
        </div>
        <ChevronRight className="size-4 text-text-subtle" />
      </Card>
    </Link>
  );
}

function RecentContext({
  recent,
}: {
  recent: ReturnType<typeof useHistoryStore.getState>["entries"][number];
}) {
  const top = recent.topResults[0];
  const symLabels = recent.symptoms
    .slice(0, 2)
    .map((id) => symptomMap.get(id)?.label ?? id)
    .filter(Boolean);
  return (
    <Link href="/dispatch?tab=history" className="block">
      <Card className="flex h-full flex-col gap-1.5 p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-1.5">
          <History className="size-3.5 text-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            최근 활동
          </span>
          <span className="ml-auto text-[10.5px] text-text-subtle">
            {relativeTime(recent.ts)}
          </span>
        </div>
        <p className="line-clamp-1 text-[13.5px] font-semibold text-text">
          {symLabels.length > 0 ? symLabels.join(" · ") : "응급실 검색"}
        </p>
        {top && (
          <p className="line-clamp-1 text-[11.5px] text-text-muted">
            🏥 {top.name} · {top.etaMin}분 · {top.distanceKm.toFixed(1)}km
          </p>
        )}
      </Card>
    </Link>
  );
}

function EmptyContext() {
  return (
    <Link href="/search" className="block">
      <Card className="flex h-full flex-col justify-center gap-1 p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            시작하기
          </span>
        </div>
        <p className="text-[13px] font-semibold text-text">
          첫 검색을 시작해 보세요
        </p>
        <p className="text-[11px] leading-snug text-text-muted">
          증상·연령만 입력하면 가장 가까운 응급실을 찾아드려요.
        </p>
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
        <Card className="p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Activity className="size-3.5 text-accent" />
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-accent">
              현장 평가 빠른 참조
            </p>
          </div>
          <ul className="space-y-1">
            {refs.map((r) => (
              <li
                key={r.code}
                className="flex items-baseline gap-2 border-b border-border/60 pb-1 last:border-b-0 last:pb-0"
              >
                <span className="w-[58px] shrink-0 font-mono text-[12px] font-bold text-text">
                  {r.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-text-muted">
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
      <Card className="p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Siren className="size-3.5 text-status-full" />
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-status-full">
            즉시 119가 필요한 신호
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-1.5">
          {signs.map(({ Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-sm)] bg-status-full-soft/60 px-2 py-1.5 text-center"
            >
              <Icon className="size-4 text-status-full" strokeWidth={2.2} />
              <span className="text-[10.5px] font-medium leading-tight text-status-full">
                {label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[10.5px] leading-snug text-text-muted">
          위 신호가 보이면 검색 전 먼저 <b className="text-status-full">119</b> 에
          전화하세요.
        </p>
      </Card>
    </motion.section>
  );
}

/**
 * 데이터 출처 + 의료 면책 푸터.
 *
 * 공공데이터/공식 사이트로의 외부 링크 패턴(텍스트 attribution + 새 창 이동)
 * 은 한국 저작권법 §24의2(공공저작물 자유이용) + §28(인용) 범위 안에서
 * 안전하며, Google Play / App Store 의 의료 카테고리 심사에서도 출처 명시는
 * 가산 요소다. "공식·인증·협력" 같은 사칭 단어는 의도적으로 피하고
 * "데이터 제공 / 참조 / 지도" 라는 중립적 라벨만 사용한다.
 */
/**
 * 한 화면(fold) 안에 들어가도록 압축한 데이터 출처 + 의료 면책 푸터.
 *
 * - 각 출처에는 디자인 시스템과 일관된 모노크롬(흑백) 카테고리 아이콘만
 *   부착한다. 실제 기관 BI/CI(공공데이터포털·E-Gen·보건복지부·KTAS·소방청)
 *   는 별도 사용 신청 + 색상·여백·크기 가이드 준수가 필요해, 단순 출처
 *   표기 목적의 본 화면에서는 lucide 모노크롬 심볼로 대체한다 (저작권 안전).
 * - "지도" 라인은 NaverMap SDK 가 지도 위에 © NAVER 워터마크를 자동 표시
 *   하므로 약관상 별도 텍스트 attribution 없이도 무방.
 */
const SOURCES = [
  {
    href: "https://www.data.go.kr",
    label: "공공데이터포털",
    short: "공공데이터포털",
    Icon: Database,
  },
  {
    href: "https://www.e-gen.or.kr",
    label: "중앙응급의료센터 E-Gen",
    short: "E-Gen",
    Icon: Activity,
  },
  {
    href: "https://www.mohw.go.kr",
    label: "보건복지부",
    short: "보건복지부",
    Icon: Building2,
  },
  {
    href: "https://www.ktas.org",
    label: "대한응급의학회 KTAS",
    short: "KTAS",
    Icon: Stethoscope,
  },
  {
    href: "https://www.nfa.go.kr",
    label: "소방청 119",
    short: "119",
    Icon: Flame,
  },
] as const;

function Footer() {
  return (
    <footer className="mt-auto pt-0.5 text-center">
      <div className="space-y-0.5 text-[10px] leading-tight text-text-subtle">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold text-text-muted">데이터 제공</span>
          {SOURCES.map(({ href, label, short, Icon }) => (
            <span key={href} className="inline-flex items-center gap-1">
              <span className="text-text-subtle/60">·</span>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} 새 창에서 열기`}
                className="inline-flex items-center gap-1 underline-offset-2 transition-colors hover:text-text hover:underline"
              >
                <Icon
                  className="size-3 text-text-muted"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{short}</span>
              </a>
            </span>
          ))}
        </p>
        <p className="text-text-subtle/80">
          본 앱은 의료 행위를 대체하지 않습니다 ·{" "}
          <span className="text-status-full/80">위급 시 즉시 119</span>
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}
