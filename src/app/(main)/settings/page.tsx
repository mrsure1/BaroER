"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Navigation,
  Palette,
  PlayCircle,
  Shield,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface Row {
  label: string;
  href?: string;
  onClick?: () => void;
  Icon: LucideIcon;
  tone?: "default" | "danger";
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const groups: Array<{ title: string; rows: Row[] }> = [
    {
      title: "계정",
      rows: [
        { label: "프로필 설정", href: "/settings/profile", Icon: UserCircle },
        { label: "알림", href: "/settings/notifications", Icon: Bell },
        { label: "언어", href: "/settings/language", Icon: Globe },
        { label: "기본 내비", href: "/settings/navigator", Icon: Navigation },
      ],
    },
    {
      title: "지원",
      rows: [
        {
          label: "앱 사용 안내 다시 보기",
          Icon: PlayCircle,
          onClick: () => {
            resetOnboarding();
            router.push("/home");
          },
        },
        { label: "개인정보 처리방침", href: "/legal/privacy", Icon: Shield },
        { label: "도움말", href: "/help", Icon: HelpCircle },
      ],
    },
    {
      title: "",
      // 로그아웃은 별도 라우트(/logout)로 GET 호출 — Link 로 처리하면
      // 미들웨어가 쿠키를 정확히 만료시킨 뒤 /login 으로 리다이렉트한다.
      rows: [{ label: "로그아웃", href: "/logout", Icon: LogOut, tone: "danger" }],
    },
  ];

  return (
    <>
      <ScreenHeader title="설정" />
      <div className="mx-auto w-full max-w-[520px] px-5">
        {/* Profile summary — 로그인 상태에 따라 분기 */}
        {user ? (
          <Card className="mb-6 flex items-center gap-3.5 p-4">
            <div className="grid size-14 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <UserCircle className="size-8" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-semibold text-text">
                {user.nickname ?? user.email ?? "사용자"}
              </p>
              <p className="truncate text-[12.5px] text-text-muted">
                {user.email}
                <span className="mx-1.5 text-text-subtle">·</span>
                {user.userType === "PARAMEDIC" ? "🚑 구급대원" : "🧑 일반 사용자"}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="mb-6 flex items-center gap-3.5 p-4">
            <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
              <UserCircle className="size-8" />
            </div>
            <div className="flex-1">
              <p className="text-[15.5px] font-semibold text-text">
                로그인이 필요해요
              </p>
              <p className="text-[12.5px] text-text-muted">
                가입하면 검색 기록과 즐겨찾기를 동기화할 수 있어요.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-primary-fg shadow-[var(--shadow-md)]"
            >
              로그인
            </Link>
          </Card>
        )}

        {/* Theme */}
        <section className="mb-6">
          <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            화면 모드
          </h3>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <Palette className="size-[18px] text-text-muted" />
              <p className="text-[14px] text-text">
                눈이 편한 모드를 선택하세요
              </p>
            </div>
            <ThemeToggle />
          </Card>
        </section>

        {/* Groups — 로그아웃 그룹은 로그인된 사용자에게만 노출 */}
        <div className="flex flex-col gap-6">
          {groups
            .filter((g) => user || !g.rows.some((r) => r.href === "/logout"))
            .map((g, gi) => (
              <section key={gi}>
                {g.title && (
                  <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
                    {g.title}
                  </h3>
                )}
                <Card className="divide-y divide-border p-0">
                  {g.rows.map(({ label, href, onClick, Icon, tone }) => {
                    const content = (
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <Icon
                          className={
                            tone === "danger"
                              ? "size-[19px] text-status-full"
                              : "size-[19px] text-text-muted"
                          }
                        />
                        <span
                          className={
                            tone === "danger"
                              ? "flex-1 text-[14.5px] font-medium text-status-full"
                              : "flex-1 text-[14.5px] text-text"
                          }
                        >
                          {label}
                        </span>
                        <ChevronRight className="size-[18px] text-text-subtle" />
                      </div>
                    );
                    if (href) {
                      return (
                        // /logout 같은 라우트 핸들러는 prefetch 가 의도치 않은
                        // 사이드이펙트(즉시 로그아웃)를 일으킬 수 있어 prefetch={false}.
                        <Link
                          key={label}
                          href={href}
                          prefetch={false}
                          className="block transition-colors hover:bg-surface-2"
                        >
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={onClick}
                        className="block w-full text-left transition-colors hover:bg-surface-2"
                      >
                        {content}
                      </button>
                    );
                  })}
                </Card>
              </section>
            ))}
        </div>

        <p className="mt-8 text-center text-[12px] text-text-subtle">
          BaroER · v0.1.0
        </p>
      </div>
    </>
  );
}
