"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { NAV_APPS, type NavAppId } from "@/lib/navApps";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  /** 현재 기본 내비 (없으면 null) — UI 에 체크 표시. */
  currentId?: NavAppId | null;
  /** 사용자가 앱을 선택했을 때. picker 호출자가 launch + setNav 처리. */
  onSelect: (id: NavAppId) => void;
  onClose: () => void;
  /**
   * 헤더 문구 — 첫 선택 시 "기본 내비로 저장됩니다" 와 같은 안내를 위해
   * 호출 측이 컨텍스트별로 지정할 수 있게 prop 으로 분리.
   */
  title?: string;
  description?: string;
}

/**
 * 내비 앱 선택 바텀시트.
 * - 모바일: 화면 하단에서 슬라이드 업.
 * - 첫 선택 시 호출자가 navPrefStore.setNav() 를 호출해 기본값 저장.
 */
export function NavigatorPickerSheet({
  open,
  currentId,
  onSelect,
  onClose,
  title = "어떤 내비로 안내할까요?",
  description = "처음 선택한 앱이 기본 내비로 저장돼요. 설정에서 언제든 변경할 수 있어요.",
}: Props) {
  // 시트가 열려있는 동안 body 스크롤 잠금.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="nav-picker-backdrop"
            className="fixed inset-0 z-[100] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="nav-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="내비 앱 선택"
            className="fixed inset-x-0 bottom-0 z-[101] mx-auto w-full max-w-[520px] rounded-t-[24px] border border-b-0 border-border bg-surface shadow-[var(--shadow-lg)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />

            <div className="px-5 pb-2 pt-4">
              <h2 className="text-[16px] font-bold text-text">{title}</h2>
              <p className="mt-1 text-[12.5px] text-text-muted">{description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 py-4">
              {NAV_APPS.map((app) => {
                const isCurrent = app.id === currentId;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onSelect(app.id)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      isCurrent
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:bg-surface-2",
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-11 place-items-center rounded-xl text-[18px] font-extrabold",
                        app.bg,
                        app.fg,
                      )}
                    >
                      {app.badge}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-text">
                        {app.label}
                      </p>
                      <p className="truncate text-[11.5px] text-text-muted">
                        {isCurrent ? "기본 내비" : "이 앱으로 안내"}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="grid size-5 place-items-center rounded-full bg-primary text-primary-fg">
                        <Check className="size-3.5" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full border border-border bg-surface py-3 text-[14px] font-semibold text-text-muted transition-colors hover:bg-surface-2"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
