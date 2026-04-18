import type { ReactNode } from "react";
import { BottomNav } from "@/components/common/BottomNav";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg">
      <div className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
