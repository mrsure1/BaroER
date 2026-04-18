import Image from "next/image";
import { cn } from "@/lib/cn";

/** Source image is 965×1024 — 아이콘+워드마크 결합 브랜드 로고 */
const ASPECT = 965 / 1024;

interface LogoProps {
  /** Pixel height of the rendered logo */
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ height = 40, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="바로응급실"
      width={Math.round(height * ASPECT)}
      height={height}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}
