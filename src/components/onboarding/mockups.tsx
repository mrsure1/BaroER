"use client";

import {
  Activity,
  Ambulance,
  Bell,
  ClipboardList,
  Compass,
  FilePlus2,
  Globe,
  Hospital,
  Map as MapIcon,
  Navigation,
  Palette,
  Phone,
  Search,
  Settings as SettingsIcon,
  Siren,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * 온보딩 8장 카드에 들어갈 "미니 화면 목업" 들.
 *
 * 실제 앱 화면을 픽셀 단위로 캡처하는 대신, 같은 디자인 토큰(primary,
 * status, radius, shadow 등)과 lucide 아이콘으로 ~240×380 크기의
 * "인앱 프리뷰" 를 직접 그린다. 장점:
 *   1) 이미지 asset 이 아니라서 다크/라이트 테마 전환에 자동 대응
 *   2) 번역된 라벨도 컴파일 타임에 번들
 *   3) 실제 앱 변경 시에도 UI 라이브러리 토큰만 바꾸면 자동 싱크
 *
 * 각 목업은 공통 `<PhoneFrame>` 안에 들어가며, 노치·상태바·하단 탭까지
 * 실제 레이아웃을 모사해 사용자가 "내 화면의 어디를 설명하는지" 한눈에
 * 대응시킬 수 있도록 한다.
 */

/* ---------------------------------------------------------------------- */
/* Shared frame                                                            */
/* ---------------------------------------------------------------------- */

function PhoneFrame({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  /** 하단 탭바에서 어떤 항목을 강조할지 */
  activeTab?: "home" | "search" | "dispatch" | "settings" | "none";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[232px] select-none overflow-hidden rounded-[28px]",
        "border border-border-strong/70 bg-bg",
        "shadow-[0_24px_48px_-20px_rgb(16_18_24/0.28),0_2px_6px_-2px_rgb(16_18_24/0.06)]",
        // 내부 콘텐츠의 루트 — flex 열
        "flex h-[388px] flex-col",
      )}
    >
      {/* 상태바 (노치+시계) — 시각적 현실감 */}
      <div className="relative flex shrink-0 items-center justify-between px-5 pb-0.5 pt-2 text-[9px] font-semibold text-text-muted">
        <span>9:41</span>
        <span
          aria-hidden
          className="absolute left-1/2 top-1 h-3 w-12 -translate-x-1/2 rounded-b-[8px] bg-black/75"
        />
        <span className="flex items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
          <span className="h-1.5 w-2 rounded-[1px] border border-text-muted" />
        </span>
      </div>

      {/* 본문 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>

      {/* 하단 탭바 */}
      <MiniBottomNav active={activeTab ?? "home"} />
    </div>
  );
}

function MiniBottomNav({
  active,
}: {
  active: "home" | "search" | "dispatch" | "settings" | "none";
}) {
  const items = [
    { id: "home", label: "홈", Icon: Hospital },
    { id: "search", label: "검색", Icon: MapIcon },
    { id: "dispatch", label: "기록", Icon: ClipboardList },
    { id: "settings", label: "설정", Icon: SettingsIcon },
  ] as const;
  return (
    <nav className="relative flex shrink-0 border-t border-border bg-bg/90 px-1 py-1.5 pb-2 backdrop-blur">
      {items.map(({ id, label, Icon }) => {
        const isOn = active === id;
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5",
              isOn ? "text-primary" : "text-text-subtle",
            )}
          >
            {isOn && (
              <span className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-primary" />
            )}
            <Icon className="size-3.5" strokeWidth={isOn ? 2.4 : 2} />
            <span className="text-[8px] font-medium">{label}</span>
          </div>
        );
      })}
    </nav>
  );
}

function ScreenBar({ title }: { title: string }) {
  return (
    <div className="relative flex items-center gap-1 border-b border-border/60 bg-gradient-to-r from-primary-soft/55 via-bg to-bg px-3 py-2">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary to-primary-hover" />
      <p className="text-[11px] font-bold tracking-tight text-text">{title}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 1. 메인 (히어로 강조)                                                    */
/* ---------------------------------------------------------------------- */

export function MockupHome() {
  return (
    <PhoneFrame activeTab="home">
      {/* 헤더 */}
      <div className="flex shrink-0 items-center gap-1.5 px-3 pb-1 pt-2">
        <div className="grid size-4 place-items-center rounded-[4px] bg-primary text-[7px] font-bold text-white">
          B
        </div>
        <p className="flex-1 text-[9px] font-bold leading-tight text-text">
          응급실이 필요할 때,{" "}
          <span className="text-primary">바로 연결해 드릴게요.</span>
        </p>
      </div>

      {/* 히어로 — 시안 B(①·HERE) + 세로 2배 시작 버튼 · 점선 강조 */}
      <div className="relative mx-3 mt-1">
        <div className="relative flex flex-col gap-0.5 overflow-hidden rounded-[12px] bg-gradient-to-br from-primary via-primary to-primary-hover p-2 shadow-[0_6px_14px_-4px_rgb(229_57_53/0.45)]">
          <span
            aria-hidden
            className="absolute -right-4 -top-4 size-16 rounded-full bg-white/15 blur-xl"
          />
          <div className="relative flex items-center gap-1">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[12px] font-black text-primary shadow">
              1
            </span>
            <p className="min-w-0 text-[7.5px] font-bold leading-tight text-white">
              먼저 이 화면에서
              <br />
              <span className="text-white/85">아래 버튼을 누릅니다</span>
            </p>
          </div>
          <div className="flex flex-col items-center py-0.5">
            <span className="text-[7px] font-bold uppercase tracking-wider text-amber-200">
              HERE
            </span>
          </div>
          <div className="relative flex min-h-[28px] items-center justify-center rounded-[10px] bg-black/25 py-1.5 text-[8.5px] font-extrabold text-white ring-1 ring-white/35">
            시작하기 ›
          </div>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[3px] left-[5px] right-[5px] rounded-[10px] border-[2px] border-dashed border-amber-400 shadow-[0_0_0_2px_rgba(252,211,77,0.2)]"
          style={{ height: "34px" }}
        />
        <span
          aria-hidden
          className="absolute -right-0.5 bottom-5 rounded-full border border-amber-300 bg-amber-400 px-1 py-0.5 text-[6.5px] font-bold text-amber-950 shadow-md"
        >
          시작 →
        </span>
      </div>

      {/* 신뢰 strip */}
      <div className="mx-3 mt-2 grid grid-cols-3 divide-x divide-border rounded-[10px] border border-border bg-surface">
        {[
          { big: "411+", label: "응급기관" },
          { big: "실시간", label: "E-Gen" },
          { big: "24h", label: "야간·주말" },
        ].map((s) => (
          <div key={s.label} className="py-1 text-center">
            <p className="text-[9px] font-bold leading-none text-text">
              {s.big}
            </p>
            <p className="mt-0.5 text-[7px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 컨텍스트 + 119 — 일반: 시안 D(좌측 굵은 바) */}
      <div className="mx-3 mt-1.5 grid grid-cols-[1.4fr_1fr] gap-1.5">
        <div className="rounded-[10px] border-y-2 border-r-2 border-l-[5px] border-primary bg-gradient-to-r from-primary-soft/60 to-surface p-1.5 pl-1">
          <p className="text-[7px] font-semibold uppercase tracking-wider text-primary">
            증상별 응급조치요령
          </p>
          <p className="mt-0.5 text-[8px] font-bold leading-snug text-text">
            병원 가기 전
            <br />
            지금 할 수 있는 것
          </p>
          <p className="mt-0.5 text-[6.5px] leading-tight text-text-muted">
            검색 화면에서 안내
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-status-full/40 bg-white py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_0_#b91c1c]">
          <div className="grid size-3.5 place-items-center rounded-full bg-status-full text-white">
            <Phone className="size-2" />
          </div>
          <p className="mt-0.5 text-[9px] font-black leading-none text-status-full">
            119
          </p>
          <p className="text-[6.5px] text-status-full/80">즉시 연결</p>
        </div>
      </div>

      <div className="mx-3 mt-1.5 shrink-0 rounded-[10px] border border-border bg-surface p-1.5">
        <p className="text-[7px] font-semibold uppercase tracking-wider text-status-full">
          즉시 119가 필요한 신호
        </p>
        <div className="mt-0.5 grid grid-cols-3 gap-1 text-[7px] leading-tight text-status-full">
          <div className="rounded bg-status-full-soft/80 py-0.5 text-center">
            심한 흉통
          </div>
          <div className="rounded bg-status-full-soft/80 py-0.5 text-center">
            의식 저하
          </div>
          <div className="rounded bg-status-full-soft/80 py-0.5 text-center">
            대량 출혈
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------------------------------------------------------- */
/* 2. 환자 상태 평가 · KTAS · 응급처치                                      */
/* ---------------------------------------------------------------------- */

export function MockupAssessment() {
  const ktas = [
    { n: "1", color: "bg-[#0067B3]", label: "소생" },
    { n: "2", color: "bg-[#E53935]", label: "긴급" },
    { n: "3", color: "bg-[#F59E0B]", label: "응급" },
    { n: "4", color: "bg-[#22C55E]", label: "준응급" },
    { n: "5", color: "bg-[#A1A1AA]", label: "비응급" },
  ];
  return (
    <PhoneFrame activeTab="search">
      <ScreenBar title="검색" />
      <div className="flex-1 overflow-hidden px-3 pb-1 pt-2">
        {/* KTAS 안내 */}
        <div className="rounded-[10px] border border-border bg-surface p-1.5">
          <div className="mb-1 flex items-center gap-1">
            <Activity className="size-2.5 text-accent" />
            <p className="text-[7px] font-semibold uppercase tracking-wider text-accent">
              KTAS 참고 등급
            </p>
          </div>
          <div className="flex items-stretch gap-0.5">
            {ktas.map((k) => (
              <div
                key={k.n}
                className="flex flex-1 flex-col items-center gap-0.5"
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded text-[8px] font-bold text-white",
                    k.color,
                  )}
                >
                  {k.n}
                </span>
                <span className="text-[6.5px] text-text-muted">{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 성별 · 연령 */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div className="rounded-[8px] border border-border bg-surface p-1.5">
            <p className="text-[7px] font-semibold text-text-muted">성별</p>
            <div className="mt-0.5 flex gap-0.5">
              <span className="flex-1 rounded bg-primary px-1 py-0.5 text-center text-[7px] font-semibold text-white">
                남
              </span>
              <span className="flex-1 rounded border border-border px-1 py-0.5 text-center text-[7px] text-text-muted">
                여
              </span>
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-surface p-1.5">
            <p className="text-[7px] font-semibold text-text-muted">연령대</p>
            <p className="mt-0.5 text-[8px] font-bold text-text">30–40대</p>
          </div>
        </div>

        {/* 증상 선택 — 칩 */}
        <p className="mt-2 text-[7px] font-semibold text-text-muted">
          증상 선택
          <span className="ml-1 text-status-full">*</span>
        </p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {[
            { l: "가슴통증", on: true },
            { l: "호흡곤란", on: true },
            { l: "의식저하", on: false },
            { l: "복통", on: false },
            { l: "출혈", on: false },
            { l: "발열", on: false },
          ].map((c) => (
            <span
              key={c.l}
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[7px] font-medium",
                c.on
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-muted",
              )}
            >
              {c.l}
            </span>
          ))}
        </div>

        {/* 응급처치 요령 */}
        <div className="mt-2 rounded-[10px] border border-status-full/30 bg-status-full-soft/60 p-1.5">
          <div className="flex items-center gap-1">
            <Siren className="size-2.5 text-status-full" />
            <p className="text-[7px] font-bold text-status-full">
              응급처치 요령
            </p>
          </div>
          <ul className="mt-0.5 space-y-0.5 text-[7px] leading-snug text-status-full/90">
            <li>• 편한 자세 · 호흡 안정</li>
            <li>• 반응 없으면 119 즉시</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-2 rounded-full bg-primary py-1 text-center text-[9px] font-bold text-white shadow-[0_3px_8px_-2px_rgb(229_57_53/0.5)]">
          근처 응급실 찾기
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------------------------------------------------------- */
/* 3. 검색결과 — 리스트                                                     */
/* ---------------------------------------------------------------------- */

export function MockupResultsList() {
  const items = [
    { name: "서울대병원 응급의료센터", eta: 7, km: 2.1, cap: "available" },
    { name: "세브란스 응급실", eta: 12, km: 3.6, cap: "busy" },
    { name: "삼성서울병원 ER", eta: 18, km: 5.2, cap: "full" },
  ] as const;
  const capTone = {
    available: "bg-status-available-soft text-status-available",
    busy: "bg-status-busy-soft text-status-busy",
    full: "bg-status-full-soft text-status-full",
  } as const;
  const capLabel = { available: "수용 가능", busy: "붐빔", full: "포화" };

  return (
    <PhoneFrame activeTab="search">
      <ScreenBar title="검색 결과" />
      <div className="flex-1 overflow-hidden px-3 pt-1.5">
        {/* 반경 슬라이더 */}
        <div className="rounded-[8px] border border-border bg-surface px-2 py-1.5">
          <div className="flex items-center justify-between text-[7px] text-text-muted">
            <span>반경</span>
            <span className="font-bold text-text">10km</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-border">
            <div className="h-full w-[22%] rounded-full bg-primary" />
          </div>
        </div>

        {/* 정렬 칩 */}
        <div className="mt-1.5 flex gap-1">
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-semibold text-white">
            빠른 순
          </span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[7px] text-text-muted">
            가까운 순
          </span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[7px] text-text-muted">
            수용 가능
          </span>
          <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[7px] text-text-muted">
            지도
          </span>
        </div>

        {/* 병원 카드 */}
        <div className="mt-1.5 space-y-1.5">
          {items.map((h) => (
            <div
              key={h.name}
              className="rounded-[10px] border border-border bg-surface p-1.5"
            >
              <div className="flex items-center gap-1">
                <Hospital className="size-3 text-primary" />
                <p className="flex-1 truncate text-[8px] font-semibold text-text">
                  {h.name}
                </p>
                <span
                  className={cn(
                    "rounded-full px-1 py-[1px] text-[6.5px] font-semibold",
                    capTone[h.cap],
                  )}
                >
                  {capLabel[h.cap]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[7px] text-text-muted">
                <span className="rounded bg-primary-soft px-1 py-[1px] font-semibold text-primary">
                  {h.eta}분
                </span>
                <span>{h.km.toFixed(1)}km</span>
                <span className="ml-auto flex items-center gap-0.5 text-accent">
                  <Phone className="size-2" /> 전화
                </span>
                <span className="flex items-center gap-0.5 text-primary">
                  <Navigation className="size-2" /> 길안내
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------------------------------------------------------- */
/* 4. 검색결과 — 지도                                                       */
/* ---------------------------------------------------------------------- */

export function MockupResultsMap() {
  return (
    <PhoneFrame activeTab="search">
      <ScreenBar title="지도 보기" />
      <div className="relative flex-1 overflow-hidden">
        {/* 지도 배경 — 가상의 블록 */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgb(var(--color-accent-soft)) 0%, rgb(var(--color-surface-2)) 60%, rgb(var(--color-surface)) 100%)",
          }}
        />
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full text-border-strong/50"
          viewBox="0 0 240 340"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        >
          <path d="M0 60 L240 80" />
          <path d="M0 140 L240 160" />
          <path d="M0 220 L240 200" />
          <path d="M60 0 L80 340" />
          <path d="M160 0 L170 340" />
          <path d="M0 300 L240 290" />
        </svg>

        {/* 핀들 */}
        <Pin className="left-[22%] top-[18%]" tone="available" label="수용" />
        <Pin className="left-[42%] top-[36%]" tone="busy" label="붐빔" />
        <Pin
          className="left-[58%] top-[54%]"
          tone="full"
          label="포화"
          dim
        />
        <Pin
          className="left-[32%] top-[68%]"
          tone="available"
          label="수용"
        />

        {/* 내 위치 */}
        <div className="absolute left-[48%] top-[44%] -translate-x-1/2 -translate-y-1/2">
          <span className="absolute -inset-2 rounded-full bg-primary/20" />
          <span className="relative block size-2.5 rounded-full border-2 border-white bg-primary shadow-md" />
        </div>

        {/* 하단 하이라이트 카드 */}
        <div className="absolute inset-x-2 bottom-2 rounded-[10px] border border-border bg-bg/95 p-1.5 shadow-md backdrop-blur">
          <div className="flex items-center gap-1">
            <Hospital className="size-3 text-primary" />
            <p className="flex-1 truncate text-[8px] font-semibold text-text">
              서울대병원 응급의료센터
            </p>
            <span className="rounded-full bg-status-available-soft px-1 py-[1px] text-[6.5px] font-semibold text-status-available">
              수용 가능
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[7px] text-text-muted">
            <span className="rounded bg-primary-soft px-1 font-semibold text-primary">
              7분
            </span>
            <span>2.1km</span>
            <span className="ml-auto rounded-full bg-primary px-1.5 py-[2px] text-[7px] font-bold text-white">
              길안내
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Pin({
  className,
  tone,
  label,
  dim,
}: {
  className?: string;
  tone: "available" | "busy" | "full";
  label: string;
  dim?: boolean;
}) {
  const toneMap = {
    available: "bg-status-available",
    busy: "bg-status-busy",
    full: "bg-status-full",
  } as const;
  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-full",
        dim && "opacity-70",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-5 place-items-center rounded-full text-white shadow-md ring-2 ring-white",
          toneMap[tone],
        )}
      >
        <Hospital className="size-2.5" />
      </div>
      <span
        className={cn(
          "mx-auto mt-0.5 block w-fit rounded-full px-1 py-[1px] text-[6px] font-semibold text-white",
          toneMap[tone],
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 5. 길안내                                                                */
/* ---------------------------------------------------------------------- */

export function MockupNavigation() {
  return (
    <PhoneFrame activeTab="search">
      <ScreenBar title="길안내 시작" />
      <div className="relative flex-1 overflow-hidden">
        {/* 길안내 전용 지도(루트 라인) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgb(var(--color-accent-soft)) 0%, rgb(var(--color-surface-2)) 100%)",
          }}
        />
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 240 340"
          fill="none"
        >
          <path
            d="M40 300 Q 80 220 120 200 T 200 80"
            stroke="rgb(var(--color-primary))"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 4"
          />
        </svg>
        {/* 출발/도착 마커 */}
        <div className="absolute left-[14%] top-[84%] -translate-x-1/2 -translate-y-1/2">
          <span className="block size-3 rounded-full border-2 border-white bg-primary shadow" />
          <span className="mt-0.5 block rounded bg-white/90 px-1 text-[6.5px] font-semibold text-text">
            출발
          </span>
        </div>
        <div className="absolute left-[82%] top-[22%] -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="grid size-5 place-items-center rounded-full bg-status-available text-white shadow ring-2 ring-white">
            <Hospital className="size-2.5" />
          </span>
          <span className="mt-0.5 block rounded bg-white/90 px-1 text-[6.5px] font-semibold text-text">
            응급실
          </span>
        </div>

        {/* 턴바이턴 카드 */}
        <div className="absolute inset-x-2 top-2 rounded-[10px] border border-border bg-bg/95 p-1.5 shadow-md backdrop-blur">
          <div className="flex items-center gap-1.5">
            <div className="grid size-5 place-items-center rounded-full bg-primary text-white">
              <Navigation className="size-2.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-bold text-text">320m 앞 우회전</p>
              <p className="text-[6.5px] text-text-muted">
                대학로 → 창경궁로
              </p>
            </div>
            <span className="rounded bg-primary-soft px-1 py-[1px] text-[7px] font-bold text-primary">
              7분
            </span>
          </div>
        </div>

        {/* 앱 선택 바텀시트 */}
        <div className="absolute inset-x-2 bottom-2 rounded-[10px] border border-border bg-bg p-1.5 shadow-lg">
          <p className="text-[7px] font-semibold uppercase tracking-wider text-text-subtle">
            내비 앱으로 열기
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1">
            <NavAppChip label="네이버" color="bg-[#03c75a]" />
            <NavAppChip label="카카오" color="bg-[#ffde00]" text="text-black" />
            <NavAppChip label="티맵" color="bg-[#ed174b]" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function NavAppChip({
  label,
  color,
  text = "text-white",
}: {
  label: string;
  color: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={cn(
          "grid size-6 place-items-center rounded-[8px] shadow-sm",
          color,
          text,
        )}
      >
        <Compass className="size-3" />
      </div>
      <span className="text-[7px] font-medium text-text-muted">{label}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 6. 내 기록                                                               */
/* ---------------------------------------------------------------------- */

export function MockupHistory() {
  const rows = [
    {
      when: "오늘 14:22",
      sym: "가슴통증 · 호흡곤란",
      top: "서울대병원 · 7분 · 2.1km",
    },
    {
      when: "어제 09:10",
      sym: "복통 · 발열",
      top: "세브란스 · 12분 · 3.6km",
    },
    {
      when: "10.14 21:40",
      sym: "의식저하",
      top: "서울아산병원 · 15분 · 4.2km",
    },
  ];
  return (
    <PhoneFrame activeTab="dispatch">
      <ScreenBar title="내 기록" />
      <div className="flex-1 overflow-hidden px-3 pt-2">
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-semibold text-white">
            검색 기록
          </span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[7px] text-text-muted">
            리포트
          </span>
          <span className="ml-auto rounded-full border border-border px-1 py-0.5 text-[6.5px] text-text-muted">
            최근순
          </span>
        </div>

        <div className="mt-1.5 space-y-1.5">
          {rows.map((r, i) => (
            <div
              key={i}
              className="rounded-[10px] border border-border bg-surface p-1.5"
            >
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-primary" />
                <p className="flex-1 text-[7px] font-semibold text-text-muted">
                  {r.when}
                </p>
                <span className="text-[6.5px] text-text-subtle">›</span>
              </div>
              <p className="mt-0.5 text-[8.5px] font-bold text-text">
                {r.sym}
              </p>
              <p className="mt-0.5 flex items-center gap-0.5 text-[7px] text-text-muted">
                <Hospital className="size-2 text-primary" />
                {r.top}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-[7px] text-text-subtle">
          이 기기에만 저장 · 언제든 삭제 가능
        </p>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------------------------------------------------------- */
/* 7. 구급대 리포트 (작성 · 검색)                                           */
/* ---------------------------------------------------------------------- */

export function MockupDispatch() {
  return (
    <PhoneFrame activeTab="dispatch">
      <ScreenBar title="구급 리포트" />
      <div className="flex-1 overflow-hidden px-3 pt-2">
        {/* 탭 */}
        <div className="flex gap-1">
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-semibold text-white">
            리포트
          </span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[7px] text-text-muted">
            검색 기록
          </span>
        </div>

        {/* 검색바 */}
        <div className="mt-1.5 flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
          <Search className="size-2.5 text-text-subtle" />
          <span className="text-[7px] text-text-subtle">
            환자명 · 출동번호 검색
          </span>
        </div>

        {/* 리포트 리스트 */}
        <div className="mt-1.5 space-y-1">
          {[
            {
              id: "D-2041",
              who: "김**, 남 58",
              ktas: "2",
              tone: "bg-primary text-white",
              meta: "급성 흉통 · 세브란스",
            },
            {
              id: "D-2040",
              who: "이**, 여 41",
              ktas: "3",
              tone: "bg-status-busy text-white",
              meta: "복통 · 서울대병원",
            },
            {
              id: "D-2039",
              who: "박**, 남 72",
              ktas: "1",
              tone: "bg-[#0067B3] text-white",
              meta: "심정지 · 삼성서울",
            },
          ].map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface p-1.5"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded text-[8px] font-bold",
                  r.tone,
                )}
              >
                {r.ktas}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[8px] font-semibold text-text">
                  {r.who}{" "}
                  <span className="text-text-subtle">· {r.id}</span>
                </p>
                <p className="truncate text-[7px] text-text-muted">{r.meta}</p>
              </div>
              <FilePlus2 className="size-2.5 text-text-subtle" />
            </div>
          ))}
        </div>

        {/* 신규 작성 FAB */}
        <div className="mt-2 flex items-center justify-center gap-1 rounded-full bg-primary py-1 text-[8.5px] font-bold text-white shadow-[0_3px_8px_-2px_rgb(229_57_53/0.5)]">
          <FilePlus2 className="size-3" /> 새 리포트 작성
        </div>

        <div className="mt-1 flex items-center justify-center gap-1 text-[7px] text-text-subtle">
          <Ambulance className="size-2.5" /> 구급대원 인증 시 클라우드 동기화
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------------------------------------------------------- */
/* 8. 설정                                                                  */
/* ---------------------------------------------------------------------- */

export function MockupSettings() {
  const rows: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; hint?: string }> = [
    { icon: UserCircle, label: "프로필 설정" },
    { icon: Bell, label: "알림", hint: "켜짐" },
    { icon: Globe, label: "언어", hint: "한국어" },
    { icon: Navigation, label: "기본 내비", hint: "네이버" },
  ];
  return (
    <PhoneFrame activeTab="settings">
      <ScreenBar title="설정" />
      <div className="flex-1 overflow-hidden px-3 pt-2">
        {/* 프로필 카드 */}
        <div className="flex items-center gap-1.5 rounded-[10px] border border-border bg-surface p-1.5">
          <div className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
            <UserCircle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[8.5px] font-semibold text-text">
              홍길동
            </p>
            <p className="flex items-center gap-0.5 truncate text-[7px] text-text-muted">
              <Users className="size-2" /> 일반 사용자
            </p>
          </div>
        </div>

        {/* 테마 */}
        <p className="mt-1.5 px-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-text-subtle">
          화면 모드
        </p>
        <div className="mt-0.5 rounded-[10px] border border-border bg-surface p-1.5">
          <div className="flex items-center gap-1">
            <Palette className="size-2.5 text-text-muted" />
            <p className="text-[8px] text-text">눈이 편한 모드</p>
          </div>
          <div className="mt-1 flex gap-0.5 rounded-full bg-surface-2 p-0.5">
            <span className="flex-1 rounded-full bg-bg py-0.5 text-center text-[7px] font-semibold text-text shadow-sm">
              라이트
            </span>
            <span className="flex-1 py-0.5 text-center text-[7px] text-text-subtle">
              다크
            </span>
            <span className="flex-1 py-0.5 text-center text-[7px] text-text-subtle">
              시스템
            </span>
          </div>
        </div>

        {/* 계정 그룹 */}
        <p className="mt-1.5 px-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-text-subtle">
          계정
        </p>
        <div className="mt-0.5 divide-y divide-border rounded-[10px] border border-border bg-surface">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-1.5 px-1.5 py-1.5"
            >
              <r.icon className="size-2.5 text-text-muted" />
              <span className="flex-1 text-[8px] text-text">{r.label}</span>
              {r.hint && (
                <span className="text-[7px] text-text-subtle">{r.hint}</span>
              )}
              <span className="text-[8px] text-text-subtle">›</span>
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-[7px] text-text-subtle">
          BaroER · v0.1.0
        </p>
      </div>
    </PhoneFrame>
  );
}
