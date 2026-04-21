import Image from "next/image";
import { cn } from "@/lib/cn";

export const LOGO_HEIGHT = 15;

export const SOURCES = [
  {
    href: "https://www.data.go.kr",
    label: "공공데이터포털 (data.go.kr)",
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
    scale: 0.78,
  },
] as const;

function DataProviderFooterInner() {
  return (
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
  );
}

/** 시안 카드 하단 등 — fixed 없이 동일 내용만 삽입 */
export function DataProviderFooterInline({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-t border-border/60 bg-bg/85 px-4 pb-1.5 pt-2 text-center backdrop-blur supports-[backdrop-filter]:bg-bg/75",
        className,
      )}
    >
      <DataProviderFooterInner />
    </div>
  );
}

/** 탭바 바로 위 고정 — 홈 `/home` 전용 */
export function DataProviderFooterFixed() {
  return (
    <footer
      className={cn(
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
        <DataProviderFooterInner />
      </div>
    </footer>
  );
}
