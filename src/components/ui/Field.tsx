"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 긴 폼에서 반복되는 "라벨 + 입력" 조합을 한 번에 내보낸다.
 * 디자인 통일 + 동일한 포커스 링 + 우측 단위 표기(suffix) 지원.
 */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  suffix?: ReactNode;
}

export function Field({ label, hint, suffix, className, ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
        {label}
      </span>
      <span className="relative flex items-center">
        <input
          {...rest}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 text-[14.5px] text-text placeholder:text-text-subtle",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
            suffix && "pr-12",
            className,
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-[12px] text-text-subtle">
            {suffix}
          </span>
        )}
      </span>
      {hint && (
        <span className="mt-1 block px-0.5 text-[11px] text-text-subtle">
          {hint}
        </span>
      )}
    </label>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextareaField({
  label,
  hint,
  className,
  rows = 3,
  ...rest
}: TextareaFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
        {label}
      </span>
      <textarea
        {...rest}
        rows={rows}
        className={cn(
          "w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 text-[14.5px] leading-relaxed text-text placeholder:text-text-subtle",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
          className,
        )}
      />
      {hint && (
        <span className="mt-1 block px-0.5 text-[11px] text-text-subtle">
          {hint}
        </span>
      )}
    </label>
  );
}
