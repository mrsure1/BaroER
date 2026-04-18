"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "ghost" | "solid" | "surface";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
  children: ReactNode;
}

const sizeClasses = {
  sm: "size-8 [&_svg]:size-[18px]",
  md: "size-10 [&_svg]:size-[20px]",
  lg: "size-12 [&_svg]:size-[22px]",
};

const variantClasses = {
  ghost: "bg-transparent text-text hover:bg-surface-2",
  surface: "bg-surface-2 text-text hover:bg-surface border border-border",
  solid: "bg-primary text-primary-fg shadow-[var(--shadow-md)] hover:bg-primary-hover",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = "ghost", size = "md", className, type = "button", children, ...props },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
