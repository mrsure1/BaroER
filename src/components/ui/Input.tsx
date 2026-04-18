"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, className, id, onFocus, onBlur, ...props },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="px-0.5 text-[13px] font-medium text-text-muted"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "group relative flex h-12 items-center rounded-[var(--radius-md)] border bg-surface transition-all duration-150",
          focused
            ? "border-primary shadow-[var(--shadow-glow)]"
            : "border-border hover:border-border-strong",
          error && "border-status-full",
        )}
      >
        {leftIcon && (
          <span className="pl-3.5 text-text-subtle [&_svg]:size-[18px]">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "peer h-full flex-1 bg-transparent px-3.5 text-[15px] text-text placeholder:text-text-subtle focus:outline-none",
            leftIcon && "pl-2.5",
            rightSlot && "pr-2",
            className,
          )}
          {...props}
        />
        {rightSlot && <span className="pr-2">{rightSlot}</span>}
      </div>
      {error ? (
        <p className="px-0.5 text-[12.5px] font-medium text-status-full">{error}</p>
      ) : hint ? (
        <p className="px-0.5 text-[12.5px] text-text-subtle">{hint}</p>
      ) : null}
    </div>
  );
});
