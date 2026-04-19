"use client";

import { Check, Navigation, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { NAV_APPS, type NavAppId } from "@/lib/navApps";
import { useNavPrefStore } from "@/stores/navPrefStore";
import { cn } from "@/lib/cn";

/**
 * 길안내에 사용할 기본 내비 앱을 선택/초기화한다.
 *
 * - 처음 길안내를 누를 때는 search/results 화면의 NavigatorPickerSheet 가 떠서
 *   사용자가 한 번 고르면 자동으로 여기에 저장된다.
 * - 이 화면에서는 그 기본값을 변경하거나 "다음에 다시 묻기"(초기화) 할 수 있다.
 */
export default function NavigatorSettingsPage() {
  const navId = useNavPrefStore((s) => s.navId);
  const setNav = useNavPrefStore((s) => s.setNav);
  const clear = useNavPrefStore((s) => s.clear);

  const select = (id: NavAppId) => setNav(id);

  return (
    <>
      <ScreenHeader title="기본 내비" />
      <div className="mx-auto w-full max-w-[520px] px-5">
        <Card className="mb-4 flex items-start gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Navigation className="size-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-semibold text-text">
              길안내에 사용할 앱
            </p>
            <p className="mt-1 text-[12.5px] text-text-muted">
              병원 카드의 <strong className="text-text">길안내</strong> 버튼을
              누르면 선택한 앱으로 바로 진입해요. 앱이 설치되어 있지 않으면
              자동으로 웹 길찾기로 폴백됩니다.
            </p>
          </div>
        </Card>

        <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
          내비 앱 선택
        </h3>
        <Card className="divide-y divide-border p-0">
          {NAV_APPS.map((app) => {
            const active = app.id === navId;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => select(app.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  active ? "bg-primary-soft" : "hover:bg-surface-2",
                )}
              >
                <div
                  className={cn(
                    "grid size-10 place-items-center rounded-xl text-[16px] font-extrabold",
                    app.bg,
                    app.fg,
                  )}
                >
                  {app.badge}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-text">
                    {app.label}
                  </p>
                  <p className="truncate text-[12px] text-text-muted">
                    {active ? "현재 기본 내비" : "이 앱을 기본으로 사용"}
                  </p>
                </div>
                {active && (
                  <div className="grid size-5 place-items-center rounded-full bg-primary text-primary-fg">
                    <Check className="size-3.5" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </Card>

        <div className="mt-6">
          <button
            type="button"
            onClick={clear}
            disabled={!navId}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-[14px] font-semibold transition-colors",
              navId
                ? "text-text hover:bg-surface-2"
                : "cursor-not-allowed text-text-subtle opacity-60",
            )}
          >
            <RotateCcw className="size-[16px]" />
            기본 내비 초기화 (다음에 다시 묻기)
          </button>
          <p className="mt-2 px-1 text-center text-[11.5px] text-text-subtle">
            초기화하면 다음 길안내에서 앱 선택 화면이 다시 나타나요.
          </p>
        </div>
      </div>
    </>
  );
}
