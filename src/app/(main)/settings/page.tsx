"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Palette,
  Shield,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

interface Row {
  label: string;
  href?: string;
  Icon: LucideIcon;
  tone?: "default" | "danger";
}

const groups: Array<{ title: string; rows: Row[] }> = [
  {
    title: "계정",
    rows: [
      { label: "프로필 설정", href: "/settings/profile", Icon: UserCircle },
      { label: "알림", href: "/settings/notifications", Icon: Bell },
      { label: "언어", href: "/settings/language", Icon: Globe },
    ],
  },
  {
    title: "지원",
    rows: [
      { label: "개인정보 처리방침", href: "/legal/privacy", Icon: Shield },
      { label: "도움말", href: "/help", Icon: HelpCircle },
    ],
  },
  {
    title: "",
    rows: [{ label: "로그아웃", Icon: LogOut, tone: "danger" }],
  },
];

export default function SettingsPage() {
  return (
    <>
      <ScreenHeader title="설정" />
      <div className="mx-auto w-full max-w-[520px] px-5">
        {/* Profile summary */}
        <Card className="mb-6 flex items-center gap-3.5 p-4">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
            <UserCircle className="size-8" />
          </div>
          <div className="flex-1">
            <p className="text-[15.5px] font-semibold text-text">로그인이 필요해요</p>
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

        {/* Groups */}
        <div className="flex flex-col gap-6">
          {groups.map((g, gi) => (
            <section key={gi}>
              {g.title && (
                <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
                  {g.title}
                </h3>
              )}
              <Card className="divide-y divide-border p-0">
                {g.rows.map(({ label, href, Icon, tone }) => {
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
                      {href && <ChevronRight className="size-[18px] text-text-subtle" />}
                    </div>
                  );
                  return href ? (
                    <Link key={label} href={href} className="block transition-colors hover:bg-surface-2">
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      type="button"
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
