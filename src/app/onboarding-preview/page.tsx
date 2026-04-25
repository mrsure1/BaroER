"use client";

import { useRouter } from "next/navigation";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";

/**
 * 디자인 프리뷰 전용 라우트 — /onboarding-preview
 *
 * (main) 그룹 바깥이라 auth 게이트 없이 오버레이만 확인 가능.
 * 퍼블리시 전 제거하거나, 디자인 QA 용도로 유지해도 무방.
 */
export default function OnboardingPreviewPage() {
  const router = useRouter();
  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <OnboardingOverlay onDone={() => router.push("/home")} />
    </div>
  );
}
