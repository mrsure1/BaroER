"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  right,
  className,
}: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "flex items-center gap-2 px-5 pb-2 pt-[calc(env(safe-area-inset-top)+10px)]",
        className,
      )}
    >
      {back && (
        <IconButton
          aria-label="뒤로 가기"
          variant="ghost"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-[20px] font-bold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[12.5px] text-text-muted">{subtitle}</p>
        )}
      </div>
      {right}
    </header>
  );
}

interface ComingSoonProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export function ComingSoon({ title, description, Icon }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
        <div className="relative grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-9" strokeWidth={2} />
        </div>
      </div>
      <div>
        <h2 className="text-[20px] font-bold tracking-tight text-text">{title}</h2>
        <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
