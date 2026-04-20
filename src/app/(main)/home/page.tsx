"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ChevronRight,
  Clock,
  FilePlus2,
  HeartPulse,
  History,
  Hospital,
  Phone,
  ShieldCheck,
  Siren,
  Sparkles,
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
 * 1) 부모(main 레이아웃)가 남긴 높이(탭바 제외)를 `h-full` 로 꽉 채운다.
 * 2) 빨간 히어로는 뷰포트 기준 약 1/3(`33dvh`) — clamp 로 초소형·대형폰에서도 비율 유지.
 * 3) 히어로 아래(신뢰·컨텍스트·안전)는 `flex-1 min-h-0 overflow-y-auto` 로만 스크롤.
 * 4) 데이터 제공 푸터는 스크롤 영역 밖·탭바 바로 위에 고정 노출(shrink-0).
 */
export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";
  const recent = useHistoryStore((s) => s.entries[0]);

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
            <HeroCard />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain">
            <TrustStrip />
            <ContextCard isParamedic={isParamedic} recent={recent} />
            <SafetyGuide isParamedic={isParamedic} />
          </div>
        </div>
      </div>

      {/* 탭바 바로 위 고정 푸터 */}
      <Footer />
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

function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full min-h-0"
    >
      <Link href="/search" className="group block h-full min-h-0">
        <Card className="relative flex h-full min-h-0 flex-col overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary-hover p-0 shadow-[var(--shadow-lg)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-6 size-64 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative flex h-full min-h-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm sm:text-[11px]">
              <Sparkles className="size-3 shrink-0" />
              실시간 응급실 검색
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0 py-0.5">
                <h2 className="text-[16px] font-bold leading-[1.2] text-white sm:text-[17px]">
                  환자 상태를 입력하고
                  <br />
                  가장 가까운 응급실 찾기
                </h2>
                <p className="mt-1 text-[11.5px] leading-snug text-white/90 sm:text-[12px]">
                  병상 · 예상 소요 시간 · 길안내까지 한 번에
                </p>
              </div>
              {/* ============================================================
                  ★ HeroCard 강조 아이콘 — 현재: "경광등 깜빡임" 디자인
                  ------------------------------------------------------------
                  · 외곽 ring 이 1초 주기로 빨간 glow 와 함께 깜빡 (응급차
                    경광등처럼 ON/OFF 점멸)
                  · 가운데 흰 원판 + Siren 아이콘은 정지 (시각적 안정)
                  · 우상단/좌하단 sparkle dot 도 동일한 1초 템포로 동기화
                    (경광등이 "ON" 되는 순간 함께 반짝)
                  마음에 안 들면 ⬇ 이 블록을 주석 처리하고 아래에 보존된
                  "회전 + 반짝" 또는 "박동(pulse)" 블록 중 원하는 디자인의
                  주석을 풀어서 사용하세요.
              ============================================================ */}
              <div className="relative size-11 shrink-0 sm:size-12">
                {/* 외곽 경광등 글로우 — 1s 주기로 ON/OFF */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-white"
                  animate={{
                    opacity: [0.35, 1, 0.35],
                    boxShadow: [
                      "0 0 0px 0px rgba(239,68,68,0)",
                      "0 0 14px 5px rgba(239,68,68,0.9)",
                      "0 0 0px 0px rgba(239,68,68,0)",
                    ],
                  }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* 가운데 아이콘 — 정지 */}
                <div className="absolute inset-[3px] grid place-items-center rounded-full bg-white text-primary shadow-xl sm:inset-[3px]">
                  <Siren className="size-[17px] sm:size-[18px]" strokeWidth={2.4} />
                </div>
                {/* sparkle: 우상단 — 같은 1s 템포, 경광등 ON 순간에 함께 반짝 */}
                <motion.span
                  aria-hidden
                  className="absolute -right-1 -top-1 grid size-3 place-items-center"
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 0.6] }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="size-3 text-amber-300 drop-shadow-[0_0_4px_rgba(252,211,77,0.95)]" />
                </motion.span>
                {/* sparkle: 좌하단 — 같은 1s 템포 (동기화) */}
                <motion.span
                  aria-hidden
                  className="absolute -bottom-0.5 -left-0.5 size-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(253,230,138,0.95)]"
                  animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              {/* ============================================================
                  ▽ 대안 디자인 — 복원하려면 위 블록을 주석 처리하고
                     아래에서 원하는 블록의 주석을 풀어 사용하세요.
              ============================================================ */}
              {/* 대안 1: 회전 + 반짝 (conic-gradient ring 회전)
              <div className="relative size-11 shrink-0">
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(255,255,255,1), rgba(255,255,255,0.45), rgba(255,255,255,1))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-[3px] grid place-items-center rounded-full bg-white text-primary shadow-xl">
                  <Siren className="size-[18px]" strokeWidth={2.4} />
                </div>
              </div>
              */}
              {/* 대안 2: 박동(pulse) — 가장 초기 디자인
              <motion.div
                initial={{ scale: 0.95, opacity: 0.9 }}
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/95 text-primary shadow-xl"
              >
                <Siren className="size-[20px]" strokeWidth={2.4} />
              </motion.div>
              */}
            </div>

            <div className="flex items-center gap-1.5 self-start rounded-full bg-black/20 px-3 py-1 text-[12px] font-semibold text-white group-hover:bg-black/30">
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
      <Card className="grid shrink-0 grid-cols-3 divide-x divide-border p-0">
      {stats.map(({ Icon, big, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-2 py-2 text-center"
        >
          <Icon className="size-3.5 text-primary" strokeWidth={2.2} />
          <p className="text-[14px] font-bold leading-none text-text sm:text-[14.5px]">{big}</p>
          <p className="text-[10.5px] leading-tight text-text-muted sm:text-[11px]">{label}</p>
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
      className="grid min-h-[100px] shrink-0 grid-cols-[1.5fr_1fr] gap-2 sm:min-h-[108px]"
    >
      {isParamedic ? (
        <ParamedicContext />
      ) : recent ? (
        <RecentContext recent={recent} />
      ) : (
        <EmptyContext />
      )}

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
          "btn-119",
          "relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[var(--radius-md)]",
          "border border-status-full/35",
          // 119 PNG 자체가 흰 배경 + 빨간 글자라, 카드 내부도 흰색으로
          // 통일해 로고가 자연스럽게 녹아들게 한다. 입체감은 하단의 5층
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
      <Card className="flex h-full min-h-0 items-center gap-2.5 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-3">
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
        <ChevronRight className="size-4 shrink-0 text-text-subtle" />
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
    <Link href="/dispatch?tab=history" className="block h-full min-h-0">
      <Card className="flex h-full min-h-0 flex-col gap-1.5 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-3">
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
    <Link href="/search" className="block h-full min-h-0">
      <Card className="flex h-full min-h-0 flex-col justify-center gap-1 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            시작하기
          </span>
        </div>
        <p className="text-[13.5px] font-semibold text-text">
          첫 검색을 시작해 보세요
        </p>
        <p className="text-[11px] leading-snug text-text-muted">
          증상·연령만 입력하면 가까운 응급실을 찾아드려요.
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
 * - 각 출처에는 실제 기관 BI/CI(공공데이터포털·E-Gen·보건복지부·KTAS)
 *   를 사용한다. 119 는 데이터 호출이 없는 단순 다이얼링 대상이라
 *   출처 라벨에서는 제외했다 (정직한 attribution 원칙). 공공데이터포털
 *   은 원본 와이드 배너 BI 가 다른 로고들의 미니멀 톤과 안 어울려
 *   동일 시각 언어로 재구성한 SVG 사본을 사용한다. 4개 로고는 원본
 *   종횡비가 모두 다르므로
 *   "동일한 시각적 크기"는 **높이를 고정**하고 너비를 종횡비에 맞춰
 *   자동 조절하여 달성한다. (Image.style 의 height + width:auto + 원본
 *   intrinsic width/height 가 함께 작동해 layout shift 없이 비율 유지)
 * - E-Gen 로고는 흰색 텍스트 + 투명 배경이라 일반 칩에서는 안 보이므로
 *   E-Gen 칩만 어두운 배경(slate-700)으로 두어 가시성을 확보한다.
 * - "지도" 라인은 NaverMap SDK 가 지도 위에 © NAVER 워터마크를 자동 표시
 *   하므로 약관상 별도 텍스트 attribution 없이도 무방.
 */
const LOGO_HEIGHT = 15;

const SOURCES = [
  {
    href: "https://www.data.go.kr",
    label: "공공데이터포털 (data.go.kr)",
    // 원본 공식 BI 는 6:1 와이드 파란 배너라 다른 로고들의 미니멀 톤과
    // 안 맞아, 동일 시각 언어(투명 배경 워드마크, ~2.5:1)로 재구성한
    // SVG 사본을 사용한다. 색은 시그니처 블루(#1c6cb5).
    src: "/logos/data-go-kr.svg",
    width: 240,
    height: 96,
    dark: false,
  },
  {
    href: "https://www.e-gen.or.kr",
    label: "중앙응급의료센터 E-Gen",
    src: "/logos/egen.png",
    width: 160,
    height: 60,
    dark: true,
  },
  {
    href: "https://www.mohw.go.kr",
    label: "보건복지부",
    src: "/logos/mohw.png",
    width: 491,
    height: 135,
    dark: false,
  },
  {
    href: "https://www.ktas.org",
    label: "대한응급의학회 KTAS",
    src: "/logos/ktas.png",
    width: 179,
    height: 54,
    dark: false,
    // KTAS 는 두꺼운 산세리프라 같은 픽셀 높이에서도 다른 로고보다
    // 시각적 무게가 커 보임. 0.78x 로 다운스케일해 광학적 정렬을 맞춘다.
    scale: 0.78,
  },
] as const;

function Footer() {
  return (
    <footer
      className={cn(
        /*
         * 탭바(BottomNav) 바로 위에 고정.
         * - `fixed` + `bottom = 탭바높이 + safe-area` 로 위치를 박아,
         *   홈 본문의 flex 체인이 꼬여도 푸터는 항상 탭 위에 붙는다.
         * - 좌우는 max-w-[520px] 로 중앙 정렬, 배경은 tabbar 와 톤 맞춤.
         */
        "fixed inset-x-0 z-30",
        "bottom-[calc(var(--bottom-nav-pad)+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[520px] px-4 pb-1.5 pt-2 text-center",
          "border-t border-border/60 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/75",
        )}
      >
        <div className="space-y-1 text-[10.5px] leading-tight text-text-subtle sm:text-[11px]">
        <p className="font-semibold text-text-muted">데이터 제공</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          {SOURCES.map((s) => {
            const h = LOGO_HEIGHT * (("scale" in s && s.scale) || 1);
            return (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} 새 창에서 열기`}
                  title={s.label}
                  className={cn(
                    "inline-flex h-[26px] items-center justify-center rounded-[var(--radius-sm)] border px-1.5 transition-colors",
                    s.dark
                      ? "border-slate-700 bg-slate-700 hover:bg-slate-800"
                      : "border-border bg-white hover:bg-surface",
                  )}
                >
                  <Image
                    src={s.src}
                    alt={s.label}
                    width={s.width}
                    height={s.height}
                    style={{ height: h, width: "auto" }}
                    className="block max-w-none object-contain"
                    unoptimized
                  />
                </a>
              </li>
            );
          })}
        </ul>
          <p className="text-text-subtle/80">
            본 앱은 의료 행위를 대체하지 않습니다 ·{" "}
            <span className="text-status-full/80">위급 시 즉시 119</span>
          </p>
        </div>
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
