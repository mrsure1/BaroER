"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

type Tone = "surface" | "primary";

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<Option<T>>;
  /** `null` 이면 아무 것도 선택되지 않은 상태 (사용자에게 명시적 선택을 요구). */
  value: T | null;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  tone?: Tone;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = false,
  tone = "surface",
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const layoutId = useId();
  const heightClass = size === "sm" ? "h-9 text-[13px]" : "h-11 text-[14px]";

  const thumbClass =
    tone === "primary"
      ? "absolute inset-0 rounded-full bg-primary shadow-[var(--shadow-md)]"
      : "absolute inset-0 rounded-full bg-bg shadow-[var(--shadow-sm)] ring-1 ring-border";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-2 p-1",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const activeText = tone === "primary" ? "text-primary-fg" : "text-text";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 font-medium transition-colors duration-150",
              heightClass,
              active ? activeText : "text-text-muted hover:text-text",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={thumbClass}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
