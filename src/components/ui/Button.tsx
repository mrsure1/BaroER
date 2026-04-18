"use client";

import { forwardRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-fg shadow-[var(--shadow-md)] hover:bg-primary-hover active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-text border border-border hover:bg-surface hover:border-border-strong active:scale-[0.98]",
  ghost:
    "bg-transparent text-text hover:bg-surface-2 active:scale-[0.98]",
  outline:
    "bg-transparent text-text border border-border-strong hover:bg-surface-2 active:scale-[0.98]",
  danger:
    "bg-status-full text-white shadow-[var(--shadow-md)] hover:brightness-110 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-11 px-4 text-[15px] gap-2 rounded-[var(--radius-md)]",
  lg: "h-13 px-5 text-base gap-2 rounded-[var(--radius-md)]",
  xl: "h-16 px-6 text-lg gap-2.5 rounded-[var(--radius-lg)] font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className={cn(loading && "opacity-70")}>{children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
});
