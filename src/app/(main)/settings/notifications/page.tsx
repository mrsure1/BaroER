"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, Megaphone, Vibrate, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useNotificationPrefs, type NotificationPrefs } from "@/stores/notificationPrefsStore";

type Row = {
  key: keyof NotificationPrefs;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
};

const ALERT_ROWS: Row[] = [
  {
    key: "criticalAlerts",
    title: "긴급 경고",
    desc: "KTAS 1·2 수준 중증 상황 및 병상 소진 임박 경고",
    Icon: AlertTriangle,
    danger: true,
  },
  {
    key: "nearbyCapacityChange",
    title: "주변 병상 변동",
    desc: "검색 반경 내 병상이 변하면 알려줍니다",
    Icon: BellRing,
  },
  {
    key: "dispatchReminders",
    title: "리포트 리마인더",
    desc: "작성 중인 구급 리포트가 있을 때 알려줍니다",
    Icon: BellRing,
  },
  {
    key: "marketing",
    title: "업데이트 소식",
    desc: "새 기능 · 점검 안내 (긴급 사항 아님)",
    Icon: Megaphone,
  },
];

const BEHAVIOR_ROWS: Row[] = [
  { key: "sound", title: "소리", desc: "알림 수신 시 소리 재생", Icon: Volume2 },
  { key: "vibrate", title: "진동", desc: "알림 수신 시 진동", Icon: Vibrate },
];

export default function NotificationsSettingsPage() {
  const prefs = useNotificationPrefs((s) => s.prefs);
  const setPref = useNotificationPrefs((s) => s.set);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (permission === "unsupported") return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* 사용자가 거부하거나 브라우저가 차단 */
    }
  };

  return (
    <>
      <ScreenHeader title="알림" back />
      <div className="mx-auto w-full max-w-[520px] px-5 pb-8">
        {/* 시스템 권한 배너 */}
        <Card className="mb-5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            <p className="text-[13.5px] font-semibold text-text">시스템 알림 권한</p>
          </div>
          {permission === "unsupported" ? (
            <p className="text-[12.5px] text-text-muted">
              이 기기/브라우저는 웹 알림을 지원하지 않아요.
            </p>
          ) : permission === "granted" ? (
            <p className="text-[12.5px] text-status-available">
              ✓ 알림이 허용되어 있어요.
            </p>
          ) : permission === "denied" ? (
            <p className="text-[12.5px] text-status-full">
              브라우저에서 알림이 차단돼 있어요. 주소창 왼쪽 자물쇠 아이콘에서
              허용으로 변경해 주세요.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-text-muted">
                중요한 상황을 놓치지 않으려면 알림을 허용해 주세요.
              </p>
              <Button size="sm" onClick={requestPermission}>
                허용
              </Button>
            </div>
          )}
        </Card>

        <Section title="알림 유형" rows={ALERT_ROWS} prefs={prefs} onChange={setPref} />
        <Section
          title="소리 · 진동"
          rows={BEHAVIOR_ROWS}
          prefs={prefs}
          onChange={setPref}
        />

        <p className="mt-6 text-center text-[11.5px] text-text-subtle">
          앱이 백그라운드/종료 상태일 때의 푸시 수신은 추후 업데이트 예정입니다.
        </p>
      </div>
    </>
  );
}

function Section({
  title,
  rows,
  prefs,
  onChange,
}: {
  title: string;
  rows: Row[];
  prefs: NotificationPrefs;
  onChange: <K extends keyof NotificationPrefs>(key: K, v: NotificationPrefs[K]) => void;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
        {title}
      </h3>
      <Card className="divide-y divide-border p-0">
        {rows.map(({ key, title, desc, Icon, danger }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3.5">
            <Icon
              className={`size-[18px] ${
                danger ? "text-status-full" : "text-text-muted"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-text">{title}</p>
              <p className="text-[12px] text-text-muted">{desc}</p>
            </div>
            <Toggle
              checked={prefs[key] as boolean}
              onChange={(v) => onChange(key, v as NotificationPrefs[typeof key])}
              ariaLabel={title}
            />
          </div>
        ))}
      </Card>
    </section>
  );
}
