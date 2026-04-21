"use client";

import {
  Activity,
  AlertTriangle,
  Ambulance,
  BarChart3,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  Cloud,
  Code2,
  Compass,
  Database,
  FileCheck2,
  FileText,
  Hospital,
  KeyRound,
  LayoutGrid,
  Lightbulb,
  Map as MapIcon,
  Megaphone,
  MessageCircleHeart,
  MousePointerClick,
  Navigation,
  Phone,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Target,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  MockupAssessment,
  MockupDispatch,
  MockupHome,
  MockupNavigation,
  MockupResultsList,
  MockupResultsMap,
} from "@/components/onboarding/mockups";
import { Logo } from "@/components/ui/Logo";
import {
  Badge,
  FeatureCard,
  SlideShell,
  SlideSubtitle,
  SlideTitle,
  StatBlock,
} from "./parts";
import { cn } from "@/lib/cn";

/**
 * 18장짜리 "바로응급실" 프레젠테이션 덱.
 *
 * 각 슬라이드는 stateless 함수 컴포넌트. 라우터는 `idx` 로 꺼내 렌더하고
 * 좌우 방향키·스와이프·화살표 버튼·진행 dot 으로 네비게이션한다.
 */

export type SlideDef = {
  id: string;
  title: string; // 진행 dot hover 에서 쓰이는 "TOC 타이틀"
  render: (meta: { index: number; total: number }) => React.ReactElement;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Slides
 * ──────────────────────────────────────────────────────────────────────── */

const SLIDE_01_COVER: SlideDef = {
  id: "cover",
  title: "표지",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} accent="none">
      <div className="relative flex min-h-[calc(100dvh-180px)] flex-col justify-between py-6">
        <div className="flex items-center gap-3">
          <Logo height={34} priority />
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            Pitch Deck v1 · 2026
          </span>
        </div>

        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-6 size-80 rounded-full bg-primary/15 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 right-0 size-72 rounded-full bg-accent/15 blur-3xl"
          />
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[12.5px] font-bold uppercase tracking-[0.22em] text-primary">
            <Siren className="size-3.5" /> Emergency · Real-time · Mobile
          </p>
          <h1 className="mt-5 font-bold tracking-tight text-text">
            <span className="block text-[clamp(40px,6.4vw,88px)] leading-[0.95]">
              바로응급실
            </span>
            <span className="mt-2 block text-[clamp(20px,2.6vw,34px)] font-semibold text-text-muted">
              가장 가까운 응급실을{" "}
              <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                지금 바로
              </span>
            </span>
          </h1>
          <p className="mt-5 max-w-[700px] text-[16px] leading-relaxed text-text-muted">
            실시간 병상·길안내·구급 리포트까지. 1초가 생명인 순간,
            가장 단순한 인터페이스로 응급실에 연결합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> 팀 · 5인
          </span>
          <span className="h-3 w-px bg-border-strong" />
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="size-3.5" /> Next.js · Supabase · Naver Maps
          </span>
          <span className="h-3 w-px bg-border-strong" />
          <span className="inline-flex items-center gap-1.5">
            <Database className="size-3.5" /> 공공데이터 · E-Gen
          </span>
        </div>
      </div>
    </SlideShell>
  ),
};

const SLIDE_02_WHY: SlideDef = {
  id: "why",
  title: "문제",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Why · 개발 동기">
      <SlideTitle
        eyebrow={
          <>
            <AlertTriangle className="size-3.5" /> Problem
          </>
        }
        highlight="골든타임이 움직이기 시작합니다"
      >
        응급 상황이 시작된 순간,
      </SlideTitle>
      <SlideSubtitle>
        전국에 411개 이상의 응급의료기관이 있지만, 정작 환자·보호자가
        &ldquo;지금 갈 수 있는 곳이 어디인지&rdquo; 를 알아내기는 쉽지 않습니다.
      </SlideSubtitle>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBlock value="411" suffix="+" label="전국 응급의료기관" />
        <StatBlock value="4" suffix="분" label="심정지 후 뇌손상 시작" />
        <StatBlock value="70" suffix="%" label="스마트폰으로 검색 시도" />
        <StatBlock value="3" suffix="개" label="동시 참고하는 앱/사이트" />
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {[
          {
            Icon: Search,
            title: "검색이 복잡",
            body: "병원 홈페이지·전화·지도앱을 오가며 병상 유무를 직접 확인",
          },
          {
            Icon: Timer,
            title: "정보 시차",
            body: "만성적으로 업데이트가 늦어 &lsquo;헛발걸음&rsquo; 이 발생",
          },
          {
            Icon: Ambulance,
            title: "현장의 비정형 기록",
            body: "구급대원은 수기·텍스트 메모로 환자 정보를 정리",
          },
        ].map((p) => (
          <div
            key={p.title}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <p.Icon className="size-5 text-status-full" />
            <p className="mt-3 text-[15px] font-bold text-text">{p.title}</p>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted"
              dangerouslySetInnerHTML={{ __html: p.body }}
            />
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_03_SOLUTION: SlideDef = {
  id: "solution",
  title: "솔루션",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Solution · 우리의 답">
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <SlideTitle
            eyebrow={
              <>
                <Sparkles className="size-3.5" /> BaroER
              </>
            }
            highlight="앱 하나로 끝내는 응급실 검색"
          >
            번거로운 단계 없이,
          </SlideTitle>
          <SlideSubtitle>
            한 번의 탭으로 검색이 시작되고, 실시간 병상 · 예상 시간 · 길안내 ·
            구급 리포트까지 하나의 플로우로 이어집니다.
          </SlideSubtitle>

          <ul className="mt-7 space-y-3 text-[14px] leading-relaxed text-text">
            {[
              "빨간 Hero 한 번 탭 → 즉시 검색 시작",
              "칩·음성만으로 증상·연령 입력 (키보드 거의 불필요)",
              "핀 3색(수용·붐빔·포화) 으로 혼잡도 즉시 식별",
              "네이버·카카오·티맵으로 원탭 길안내",
              "구급대원용 리포트 작성/검색 내장",
            ].map((l) => (
              <li key={l} className="flex items-start gap-2.5">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center md:justify-end">
          <MockupHome />
        </div>
      </div>
    </SlideShell>
  ),
};

const SLIDE_04_FEATURES: SlideDef = {
  id: "features",
  title: "핵심 기능",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Core Features">
      <SlideTitle highlight="네 가지 핵심 흐름">한 앱, </SlideTitle>
      <SlideSubtitle>
        홈에서 길안내까지 평균 4탭 이내. 사용자는 텍스트를 거의 입력하지
        않습니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          icon={<Zap className="size-5" />}
          title="실시간 검색"
          body="공공데이터 API 에서 병상/운영 상태를 불러와 위치 기준 정렬"
        />
        <FeatureCard
          icon={<Activity className="size-5" />}
          title="KTAS 참고 등급"
          body="증상·연령 입력으로 1~5단계 중증도 힌트와 응급처치 요령 제공"
        />
        <FeatureCard
          icon={<Navigation className="size-5" />}
          title="원탭 길안내"
          body="네이버 · 카카오 · 티맵 연동. 처음 한 번만 선택하면 이후 자동"
        />
        <FeatureCard
          icon={<ClipboardList className="size-5" />}
          title="구급 리포트"
          body="구급대원 모드에서 환자정보·KTAS·처치내역을 양식화해 기록/검색"
        />
      </div>

      <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-primary/30 bg-primary-soft/50 p-5">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-primary">
          <Target className="size-4" /> 설계 원칙
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-text">
          &ldquo;가장 스트레스가 큰 순간의 UI&rdquo; — 3초 안에 이해, 한
          손으로 조작, 글자보다 색상·아이콘 우선.
        </p>
      </div>
    </SlideShell>
  ),
};

const SLIDE_05_TEAM: SlideDef = {
  id: "team",
  title: "팀 구성",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Team · 역할 분담">
      <SlideTitle highlight="각자의 자리에서 빛난 5인">우리는 </SlideTitle>
      <SlideSubtitle>
        기술 · 기획 · 이해 · 문서 · 구현의 다섯 축이 분리되어, 한 사람이 여러
        역할을 겸하지 않아도 되는 구조를 유지했습니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          {
            name: "정호식",
            role: "API · 기술 분석",
            Icon: Database,
            tone: "primary",
            body: "공공데이터·E-Gen API 발굴, 키 발급·등록, 기술 스펙 검토",
          },
          {
            name: "박선희",
            role: "Tech Spec · UX",
            Icon: LayoutGrid,
            tone: "accent",
            body: "기술 스펙 정리, UI/UX 흐름과 카드 구조 검토",
          },
          {
            name: "엄경옥",
            role: "Concept · Research",
            Icon: BookOpen,
            tone: "neutral",
            body: "웹앱/PWA 의 정의와 개념을 팀 전체에 매핑",
          },
          {
            name: "이정운",
            role: "Docs · 발표",
            Icon: FileText,
            tone: "success",
            body: "개발 진행 자료 정리, 발표 덱과 자료 시각화",
          },
          {
            name: "이진영",
            role: "Engineering",
            Icon: Code2,
            tone: "warning",
            body: "Next.js/React 구현, Supabase 연동, 지도·리포트 기능",
          },
        ].map((m) => (
          <div
            key={m.name}
            className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
                <m.Icon className="size-5" />
              </span>
              <Badge
                tone={
                  m.tone as
                    | "primary"
                    | "accent"
                    | "neutral"
                    | "success"
                    | "warning"
                }
              >
                {m.role}
              </Badge>
            </div>
            <p className="mt-3 text-[18px] font-bold tracking-tight text-text">
              {m.name}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              {m.body}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_06_PROCESS: SlideDef = {
  id: "process",
  title: "개발 과정",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Process · 개발 여정">
      <SlideTitle highlight="6주간의 빠른 이터레이션">
        리서치에서 배포까지,
      </SlideTitle>
      <SlideSubtitle>
        매주 금요일 데모와 회고를 고정. &ldquo;다음 주에 무엇을 검증할 것인가&rdquo;
        만 남기고 나머지는 과감히 버렸습니다.
      </SlideSubtitle>

      <div className="mt-10 relative">
        <div aria-hidden className="absolute left-0 right-0 top-[26px] h-px bg-border-strong/60" />
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {[
            { w: "W1", t: "개념·리서치", Icon: Lightbulb, d: "문제정의, 유사앱 분석" },
            { w: "W2", t: "스펙·정보구조", Icon: LayoutGrid, d: "IA, 핵심 사용자 시나리오" },
            { w: "W3", t: "데이터·API", Icon: Database, d: "공공데이터 키 발급, 구조 학습" },
            { w: "W4", t: "UI/UX 구현", Icon: Code2, d: "홈·검색·결과 흐름 제작" },
            { w: "W5", t: "리포트·지도", Icon: MapIcon, d: "구급 리포트, 지도 핀" },
            { w: "W6", t: "QA·배포", Icon: Rocket, d: "테스트, 스토어 자산 준비" },
          ].map((s) => (
            <div key={s.w} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 grid size-[52px] place-items-center rounded-full border-2 border-border-strong bg-bg shadow-sm">
                <s.Icon className="size-5 text-primary" />
              </span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-text-subtle">
                {s.w}
              </p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-text">{s.t}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { k: "주간 데모 금요일", v: "이해관계자에게 시연 · 회고" },
          { k: "기능 동결 D-3", v: "배포 3일 전부터 버그만 수정" },
          { k: "사용자 인터뷰", v: "가족·지인 대상 5회 관찰 테스트" },
        ].map((c) => (
          <div
            key={c.k}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
              {c.k}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-text">{c.v}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_07_STACK: SlideDef = {
  id: "stack",
  title: "기술 스택",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Tech Stack">
      <SlideTitle highlight="웹에서 바로 쓰는 설치형 앱 (PWA)">
        한 코드베이스,
      </SlideTitle>
      <SlideSubtitle>
        앱스토어 게이트 없이 배포·업데이트가 가능한 PWA. 네이티브 경험을 위해
        설치·알림·지도 권한까지 모두 연결했습니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Frontend",
            items: ["Next.js 16 (App Router)", "React 19", "TailwindCSS v4", "Motion (Framer)", "Zustand"],
            Icon: Boxes,
            tone: "primary",
          },
          {
            title: "Backend & Auth",
            items: ["Supabase (Postgres, RLS)", "Email + Google + Kakao OAuth", "Row Level Security"],
            Icon: ShieldCheck,
            tone: "accent",
          },
          {
            title: "Data Sources",
            items: [
              "공공데이터포털 — 응급의료정보 API",
              "중앙응급의료센터 E-Gen",
              "Naver Maps SDK / Directions",
            ],
            Icon: Database,
            tone: "neutral",
          },
          {
            title: "Ops",
            items: ["Vercel 배포", "PWA 설치 · 오프라인 쉘", "Type-safe (TypeScript strict)"],
            Icon: Cloud,
            tone: "success",
          },
        ].map((g) => (
          <div
            key={g.title}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <g.Icon className="size-5" />
              </span>
              <p className="text-[16px] font-bold text-text">{g.title}</p>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[13px] text-text-muted sm:grid-cols-2">
              {g.items.map((i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_08_DATA: SlideDef = {
  id: "data",
  title: "데이터 출처",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Data Sources · 데이터 출처">
      <SlideTitle highlight="공공 데이터 위에서 움직입니다">
        바로응급실은
      </SlideTitle>
      <SlideSubtitle>
        자체 수집이 아닌 국가 공식 API 를 실시간으로 참조합니다. 출처 표기와
        지도 워터마크는 서비스 화면에 투명하게 노출됩니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            name: "공공데이터포털",
            desc: "data.go.kr — 응급의료정보 API (병상 · 운영시간)",
            tag: "OpenAPI",
          },
          {
            name: "E-Gen",
            desc: "중앙응급의료센터 — 실시간 응급실 상태",
            tag: "Real-time",
          },
          {
            name: "보건복지부",
            desc: "응급의료기관 지정 · 분류 체계",
            tag: "Reference",
          },
          {
            name: "대한응급의학회 KTAS",
            desc: "Korean Triage and Acuity Scale (1~5단계)",
            tag: "Guideline",
          },
        ].map((s) => (
          <div
            key={s.name}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
                <Database className="size-5" />
              </span>
              <Badge tone="accent">{s.tag}</Badge>
            </div>
            <p className="text-[15.5px] font-bold text-text">{s.name}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface-2 p-5 text-[12.5px] leading-relaxed text-text-muted">
        <p>
          <span className="font-semibold text-text">법적 근거 </span>·{" "}
          공공저작물 자유이용(저작권법 §24의2) 및 인용(§28) 범위 내에서 사용합니다.
          모든 출처는 앱 홈 하단에 BI 와 외부 링크로 명시되며, 지도 서비스는
          SDK 정책을 그대로 따릅니다.
        </p>
      </div>
    </SlideShell>
  ),
};

const SLIDE_09_CHALLENGES: SlideDef = {
  id: "challenges",
  title: "어려웠던 점",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Challenges · 어려웠던 점" accent="accent">
      <SlideTitle
        eyebrow={
          <>
            <AlertTriangle className="size-3.5" /> Reality Check
          </>
        }
        highlight="문서가 지금 이 순간 유효하지 않을 수 있다"
      >
        가장 큰 복병은 코드가 아니라
      </SlideTitle>
      <SlideSubtitle>
        공공·민간 개발자 콘솔의 UI 가 수시로 개편되어, 공식 가이드 · 블로그 ·
        AI 답변 어느 것도 &ldquo;지금 화면&rdquo; 과 일치하지 않는 경우가 많았습니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          {
            Icon: KeyRound,
            title: "API Key 발급 메뉴의 이동",
            body: "공공데이터포털의 &lsquo;활용신청&rsquo; 위치가 상단/좌측/마이페이지 사이에서 개편 때마다 이동. 스크린샷 가이드가 곧바로 노후됨.",
          },
          {
            Icon: ShieldCheck,
            title: "OAuth 리다이렉트 등록 폼",
            body: "카카오·네이버 개발자 센터의 앱 등록/키 노출 경로가 바뀌어, 같은 팀원 간에도 본 메뉴가 서로 다른 경우 발생.",
          },
          {
            Icon: MessageCircleHeart,
            title: "AI 도우미의 시차",
            body: "학습 시점 이후의 콘솔 개편은 ChatGPT·Claude 도 알지 못함. 첨부 스크린샷이 거의 필수.",
          },
          {
            Icon: Timer,
            title: "응급 UX 의 엄격함",
            body: "일반 웹앱에서 &lsquo;예쁘게 보이면&rsquo; 되는 상호작용이, 응급 UX에서는 &lsquo;3초 안에 작동&rsquo; 이라는 절대 기준을 통과해야 함.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <c.Icon className="size-5 text-status-full" />
            <p className="mt-3 text-[15.5px] font-bold text-text">{c.title}</p>
            <p
              className="mt-1.5 text-[13px] leading-relaxed text-text-muted"
              dangerouslySetInnerHTML={{ __html: c.body }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[var(--radius-lg)] border border-primary/30 bg-primary-soft/60 p-5">
        <p className="text-[13px] font-semibold text-primary">우리가 세운 팀 규칙</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-text">
          콘솔 세팅 변경은 반드시 <b>&ldquo;현재 화면 스크린샷 + 소요시간&rdquo;</b>
          과 함께 팀 노션에 기록 → 다음 사람이 같은 막다른 길에 빠지지 않도록.
        </p>
      </div>
    </SlideShell>
  ),
};

const SLIDE_10_COMPARE: SlideDef = {
  id: "compare",
  title: "경쟁 비교",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Competitive Landscape">
      <SlideTitle highlight="같은 문제, 다른 출발선">
        이미 시장에는 좋은 앱들이 있습니다.
      </SlideTitle>
      <SlideSubtitle>
        그러나 &ldquo;가장 급한 순간의 사용자&rdquo; 에 집중된 UI는 여전히
        부족합니다.
      </SlideSubtitle>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">항목</th>
              <th className="px-4 py-3 font-semibold text-primary">바로응급실</th>
              <th className="px-4 py-3 font-semibold">응급똑똑 (보건복지부)</th>
              <th className="px-4 py-3 font-semibold">E-GEN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {[
              ["포커스", "응급실 검색 중심", "종합 의료 정보", "기관·통계 중심"],
              ["UI 복잡도", "매우 단순 (1~2탭 시작)", "중간", "높음"],
              ["입력 방식", "클릭 칩 + 음성", "텍스트·폼 위주", "검색·필터"],
              ["KTAS 가이드", "참고 표시 + 응급처치 요령", "부분", "—"],
              ["길안내 연동", "원탭 (네이버·카카오·티맵)", "기본 지도", "지도 있음"],
              ["구급대원 모드", "내장 (리포트 작성·검색)", "—", "별도 도구"],
              ["타깃", "일반 + 구급대원 겸용", "일반인", "전문가·통계"],
            ].map(([k, a, b, c]) => (
              <tr key={k}>
                <td className="px-4 py-3 font-semibold text-text">{k}</td>
                <td className="px-4 py-3 text-primary font-semibold">{a}</td>
                <td className="px-4 py-3 text-text-muted">{b}</td>
                <td className="px-4 py-3 text-text-muted">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideShell>
  ),
};

const SLIDE_11_DIFFERENTIATORS: SlideDef = {
  id: "diff",
  title: "차별성",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Differentiators">
      <SlideTitle highlight="4가지 결정적 차이">우리가 다른 이유, </SlideTitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          {
            Icon: MousePointerClick,
            title: "거의 텍스트 입력이 없다",
            body: "응급 상황에서 키보드는 장벽. 증상/연령은 클릭 칩, 상황 설명은 음성으로 입력.",
          },
          {
            Icon: Siren,
            title: "응급실에 집중된 UI",
            body: "병원·치과·약국을 섞어 보여주지 않음. 첫 화면부터 &lsquo;ER 한 가지&rsquo; 에 맞춰 정보량 최소화.",
          },
          {
            Icon: Ambulance,
            title: "구급대원까지 한 앱에서",
            body: "현장 구급대원은 동일 앱에서 리포트 작성·저장·검색이 가능. 별도 도구 전환 없음.",
          },
          {
            Icon: Navigation,
            title: "원탭 길안내",
            body: "네이버/카카오/티맵 중 내 기본 앱으로 곧장 시작. 처음 선택 후 재선택 불필요.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-fg shadow-[var(--shadow-md)]">
              <c.Icon className="size-5" />
            </span>
            <div>
              <p className="text-[16px] font-bold text-text">{c.title}</p>
              <p
                className="mt-1.5 text-[13px] leading-relaxed text-text-muted"
                dangerouslySetInnerHTML={{ __html: c.body }}
              />
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_12_PARAMEDIC: SlideDef = {
  id: "paramedic",
  title: "구급대원 모드",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Paramedic Mode">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        <div className="flex justify-center">
          <MockupDispatch />
        </div>
        <div>
          <SlideTitle
            eyebrow={
              <>
                <Ambulance className="size-3.5" /> For First Responders
              </>
            }
            highlight="수기 노트에서 구조화된 기록으로"
          >
            구급대원의 손끝에서 바뀌는 흐름,
          </SlideTitle>
          <SlideSubtitle>
            이송 중 입력은 최소, 도착 직후 확정. 이후에는 이름·출동번호로 즉시
            검색 가능합니다.
          </SlideSubtitle>

          <ul className="mt-6 space-y-2.5 text-[13.5px] text-text">
            {[
              "환자 기본정보 · KTAS · 증상 · 처치 · 이송병원",
              "리포트 ID 자동 채번, 이름·번호 풀텍스트 검색",
              "소속 인증 시 기관 클라우드로 안전 동기화",
              "PDF 출력 · 내부 공유 양식 지원",
            ].map((l) => (
              <li key={l} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 size-4 text-primary" />
                <span>{l}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-accent/40 bg-accent-soft/60 p-4 text-[12.5px] text-text">
            <span className="font-semibold text-accent">NOTE · </span>
            일반 사용자에게는 이 기능이 숨겨지거나 안내 문구로 대체됩니다.
          </div>
        </div>
      </div>
    </SlideShell>
  ),
};

const SLIDE_13_SCREENS: SlideDef = {
  id: "screens",
  title: "주요 화면",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Product · 주요 화면">
      <SlideTitle highlight="직접 보여드리는 흐름">설명보다, </SlideTitle>

      <div className="mt-10 grid gap-8 md:grid-cols-4">
        {[
          { Mockup: MockupAssessment, title: "증상 평가", sub: "KTAS · 응급처치" },
          { Mockup: MockupResultsList, title: "결과 · 리스트", sub: "정렬 · 반경" },
          { Mockup: MockupResultsMap, title: "결과 · 지도", sub: "3색 핀" },
          { Mockup: MockupNavigation, title: "길안내", sub: "원탭 · 내비 연동" },
        ].map((s) => (
          <div key={s.title} className="flex flex-col items-center gap-3">
            <s.Mockup />
            <div className="text-center">
              <p className="text-[14px] font-bold text-text">{s.title}</p>
              <p className="text-[11.5px] text-text-muted">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_14_PLAY_RELEASE: SlideDef = {
  id: "playstore",
  title: "구글 플레이 출시",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Release · Google Play">
      <SlideTitle
        eyebrow={
          <>
            <Store className="size-3.5" /> Play Console
          </>
        }
        highlight="심사를 한 번에 통과하는 체크리스트"
      >
        구글 스토어 등록,
      </SlideTitle>
      <SlideSubtitle>
        의료 카테고리 앱은 일반 앱보다 심사 기준이 엄격합니다. 아래 8개 항목을
        제출 전 사전 점검합니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          { k: "01", t: "개발자 계정", d: "1회 $25 · 조직 계정 추천", Icon: ShieldCheck },
          { k: "02", t: "앱 번들(AAB) 빌드", d: "PWA → TWA 또는 Capacitor 래핑", Icon: Boxes },
          { k: "03", t: "개인정보처리방침 URL", d: "위치·건강 데이터 수집 항목 명시 필수", Icon: FileCheck2 },
          { k: "04", t: "Data Safety 섹션", d: "의료 정보 민감 카테고리 체크", Icon: ClipboardList },
          { k: "05", t: "Content Rating", d: "의료 정보 · 실생활 위치 카테고리", Icon: Star },
          { k: "06", t: "그래픽 자산", d: "아이콘 512px · 피처그래픽 1024×500 · 스샷 4~8장", Icon: LayoutGrid },
          { k: "07", t: "스토어 등록정보", d: "제목 30자 / 짧은 설명 80자 / 긴 설명 4000자", Icon: FileText },
          { k: "08", t: "단계적 출시", d: "Internal → Closed(Alpha) → Open(Beta) → Production", Icon: TrendingUp },
        ].map((s) => (
          <div
            key={s.k}
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-soft text-primary font-mono text-[13px] font-bold">
              {s.k}
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-text">
                <s.Icon className="size-4 text-primary" /> {s.t}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                {s.d}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_15_ASO: SlideDef = {
  id: "aso",
  title: "ASO · 후킹",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="ASO · Store Optimization">
      <SlideTitle highlight="3초 안에 &lsquo;바로 다운&rsquo; 을 만드는 카피">
        스토어에서 클릭을 받는 건 결국,
      </SlideTitle>
      <SlideSubtitle>
        스토어 첫 화면 3초 안에 &ldquo;무엇을 해 주는 앱인지&rdquo; 가 이해되면
        다운로드 전환율이 크게 올라갑니다.
      </SlideSubtitle>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            제목 (30자)
          </p>
          <p className="mt-2 text-[18px] font-bold text-text">
            바로응급실 — 실시간 가까운 응급실 찾기
          </p>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            짧은 설명 (80자)
          </p>
          <p className="mt-2 rounded-[var(--radius-md)] bg-surface-2 p-3 text-[14px] font-medium text-text">
            &ldquo;골든타임을 지키는 가장 빠른 응급실 안내. 실시간 병상 · 원탭 길안내까지.&rdquo;
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            핵심 키워드
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "응급실",
              "119",
              "병상",
              "실시간",
              "길안내",
              "응급처치",
              "KTAS",
              "구급",
              "의료",
              "응급의료",
              "가까운 응급실",
              "골든타임",
            ].map((k) => (
              <Badge key={k} tone="primary">
                {k}
              </Badge>
            ))}
          </div>

          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            후킹 카피 (A/B 후보)
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-text">
            <li>· &ldquo;그 순간, 1초가 생명이 됩니다&rdquo;</li>
            <li>· &ldquo;눌러서 시작. 근처 응급실 바로 연결&rdquo;</li>
            <li>· &ldquo;구급대원도, 가족도 함께 쓰는 응급실 앱&rdquo;</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          {
            t: "첫 스크린샷 전략",
            d: "빨간 Hero + &lsquo;시작하기&rsquo; CTA 화면을 1번 자리에 배치 — 3초 내 이해",
          },
          {
            t: "아이콘 A/B",
            d: "단색 Siren 실루엣 vs 적십자 원형 — 스토어 주변 아이콘 대비 식별성 테스트",
          },
          {
            t: "리뷰 유도 타이밍",
            d: "검색 성공 5회 이후 · 긍정 플로우 종료 직후 조심스러운 프롬프트",
          },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-[var(--radius-lg)] border border-dashed border-primary/35 bg-primary-soft/40 p-4"
          >
            <p className="text-[13px] font-bold text-primary">{c.t}</p>
            <p
              className="mt-1 text-[12.5px] leading-relaxed text-text-muted"
              dangerouslySetInnerHTML={{ __html: c.d }}
            />
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_16_MARKETING: SlideDef = {
  id: "marketing",
  title: "마케팅",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Go-to-Market">
      <SlideTitle highlight="&lsquo;일반&rsquo; 과 &lsquo;전문&rsquo; 두 채널을 동시에">
        단일 채널이 아니라,
      </SlideTitle>
      <SlideSubtitle>
        일반 사용자는 숏폼·검색광고, 전문가는 협회·기관 제휴로 접근합니다. 같은
        앱을 두 각도에서 노출.
      </SlideSubtitle>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
            <Users className="size-4" /> 일반 사용자 채널
          </p>
          <ul className="mt-3 space-y-2.5 text-[13px] text-text">
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
                <Megaphone className="size-3" />
              </span>
              <span>
                <b>네이버/구글 검색광고</b> — &ldquo;응급실&rdquo; · &ldquo;가까운 응급실&rdquo; 지역 키워드 매칭
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
                <Smartphone className="size-3" />
              </span>
              <span>
                <b>숏폼(쇼츠/릴스)</b> — &ldquo;이런 증상이면 즉시 119&rdquo; · 30초 응급처치 팁
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
                <BarChart3 className="size-3" />
              </span>
              <span>
                <b>언론 PR</b> — &ldquo;응급실 뺑뺑이&rdquo; 이슈에 맞춰 솔루션 기사 피치
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-accent">
            <Hospital className="size-4" /> 전문가 · 기관 채널
          </p>
          <ul className="mt-3 space-y-2.5 text-[13px] text-text">
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                <Ambulance className="size-3" />
              </span>
              <span>
                <b>지역 소방서 · 119 안전센터 제휴</b> — QR 포스터 · 구급대원 리포트 기능 설명회
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                <BookOpen className="size-3" />
              </span>
              <span>
                <b>의과대 · 간호학과 · 응급구조학과</b> — 수업 자료·실습용 레퍼런스 제공
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                <Star className="size-3" />
              </span>
              <span>
                <b>대한응급의학회 협력</b> — KTAS 가이드 표시 정합성 공동 검토
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Day-1 설치 목표" value="5,000" suffix="건" />
        <MetricTile label="리텐션(W1)" value="35" suffix="%" tone="accent" />
        <MetricTile label="스토어 평점 목표" value="4.7" suffix="/ 5" tone="warning" />
      </div>
    </SlideShell>
  ),
};

function MetricTile({
  label,
  value,
  suffix,
  tone = "primary",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "primary" | "accent" | "warning";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : "text-status-busy";
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-text-subtle">
        {label}
      </p>
      <p className={cn("mt-2 text-[clamp(28px,3vw,42px)] font-bold leading-none tracking-tight", toneClass)}>
        {value}
        {suffix && <span className="ml-0.5 text-[0.45em] text-text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

const SLIDE_17_ROADMAP: SlideDef = {
  id: "roadmap",
  title: "로드맵",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} kicker="Roadmap">
      <SlideTitle highlight="MVP 이후, 진짜 여정이 시작됩니다">
        오늘이 끝이 아니라,
      </SlideTitle>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          {
            ver: "v1.0 · Now",
            tone: "primary",
            title: "MVP",
            items: ["응급실 검색·지도", "KTAS 참고", "길안내", "구급 리포트 로컬 저장"],
          },
          {
            ver: "v1.5 · Q+1",
            tone: "accent",
            title: "Voice & i18n",
            items: ["한국어 음성 인식 고도화", "영·일·중 완전 지원", "접근성(VoiceOver) 강화"],
          },
          {
            ver: "v2.0 · Q+2",
            tone: "warning",
            title: "Org Sync",
            items: ["소속 기관 SSO", "클라우드 리포트 동기화", "관리자 대시보드"],
          },
          {
            ver: "v3.0 · Future",
            tone: "success",
            title: "AI Triage",
            items: ["증상 → KTAS 추정 모델", "이송 경로 예측", "응급실 혼잡도 예측"],
          },
        ].map((p) => (
          <div
            key={p.ver}
            className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <Badge
              tone={
                p.tone as
                  | "primary"
                  | "accent"
                  | "neutral"
                  | "success"
                  | "warning"
              }
            >
              {p.ver}
            </Badge>
            <p className="mt-3 text-[18px] font-bold tracking-tight text-text">
              {p.title}
            </p>
            <ul className="mt-3 space-y-1.5 text-[12.5px] text-text-muted">
              {p.items.map((i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};

const SLIDE_18_CLOSE: SlideDef = {
  id: "close",
  title: "감사합니다",
  render: ({ index, total }) => (
    <SlideShell index={index} total={total} accent="none">
      <div className="relative flex min-h-[calc(100dvh-180px)] flex-col justify-between py-6">
        <div className="flex items-center gap-3">
          <Logo height={30} />
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-text-subtle">
            End of deck · {String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </div>

        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 size-72 rounded-full bg-primary/15 blur-3xl"
          />
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[12.5px] font-bold uppercase tracking-[0.22em] text-primary">
            <Phone className="size-3.5" /> Let&apos;s connect
          </p>
          <h1 className="mt-5 font-bold tracking-tight text-text">
            <span className="block text-[clamp(36px,5.6vw,78px)] leading-[0.95]">
              응급실이 필요할 때,
            </span>
            <span className="mt-2 block text-[clamp(36px,5.6vw,78px)] leading-[0.95] bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              바로 연결해 드릴게요.
            </span>
          </h1>
          <p className="mt-6 max-w-[680px] text-[16px] leading-relaxed text-text-muted">
            피드백·협업·파트너십 제안은 언제든 환영합니다. 이 덱은 앱 안{" "}
            <b>설정 → 앱 소개 슬라이드</b> 에서도 다시 열 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:support@baroer.app"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-fg shadow-[var(--shadow-md)] hover:bg-primary-hover"
          >
            <MessageCircleHeart className="size-4" /> support@baroer.app
          </a>
          <a
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-[14px] font-medium text-text hover:bg-surface-2"
          >
            <Compass className="size-4" /> 앱으로 돌아가기
          </a>
          <a
            href="/help"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-[14px] font-medium text-text hover:bg-surface-2"
          >
            <Settings className="size-4" /> 도움말 · FAQ
          </a>
        </div>
      </div>
    </SlideShell>
  ),
};

/* ─────────────────────────────────────────────────────────────────────────
 * Export
 * ──────────────────────────────────────────────────────────────────────── */

export const SLIDES: SlideDef[] = [
  SLIDE_01_COVER,
  SLIDE_02_WHY,
  SLIDE_03_SOLUTION,
  SLIDE_04_FEATURES,
  SLIDE_05_TEAM,
  SLIDE_06_PROCESS,
  SLIDE_07_STACK,
  SLIDE_08_DATA,
  SLIDE_09_CHALLENGES,
  SLIDE_10_COMPARE,
  SLIDE_11_DIFFERENTIATORS,
  SLIDE_12_PARAMEDIC,
  SLIDE_13_SCREENS,
  SLIDE_14_PLAY_RELEASE,
  SLIDE_15_ASO,
  SLIDE_16_MARKETING,
  SLIDE_17_ROADMAP,
  SLIDE_18_CLOSE,
];
