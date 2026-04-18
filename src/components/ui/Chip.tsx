"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface ChipProps extends Omit<HTMLMotionProps<"button">, "children"> {
  active?: boolean;
  children: ReactNode;
  showCheckOnActive?: boolean;
}

export function Chip({
  active = false,
  children,
  className,
  showCheckOnActive = false,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "inline-flex h-10 select-none items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        active
          ? "border-primary bg-primary-soft text-primary shadow-[var(--shadow-glow)]"
          : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
        className,
      )}
      {...props}
    >
      {showCheckOnActive && active && (
        <Check className="size-3.5" strokeWidth={3} />
      )}
      {children}
    </motion.button>
  );
}
