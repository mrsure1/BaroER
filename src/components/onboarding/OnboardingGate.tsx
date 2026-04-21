"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingOverlay } from "./OnboardingOverlay";

/**
 * 로그인 직후 한 번만 카드식 사용 안내를 노출한다.
 *
 * 노출 조건
 *  - 클라이언트에서 hydrate 된 상태 (SSR 깜빡임 방지)
 *  - authStore.loading === false (세션 판단이 끝난 뒤)
 *  - user 존재 (비로그인 상태에서는 스팸성 팝업 X)
 *  - onboardingStore.seen === false
 *  - 현재 경로가 `/home` — 로그인 직후 리다이렉트 타깃이 /home 이므로
 *    다른 내부 경로에서는 띄우지 않는다. (사용자가 직접 /search 에
 *    진입해 온 경우까지 막지는 않지만, 최소 침습으로 홈에서만 노출)
 *
 * "다시 보기" 는 설정 페이지에서 `useOnboardingStore.getState().reset()`
 * 을 호출해 `seen` 을 false 로 되돌린 뒤 /home 으로 이동하면 된다.
 */
export function OnboardingGate() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const seen = useOnboardingStore((s) => s.seen);
  const markSeen = useOnboardingStore((s) => s.markSeen);

  // zustand/persist 의 SSR 깜빡임 방지 — 클라이언트 hydrate 전에는 렌더 X.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (authLoading) return null;
  if (!user) return null;
  if (seen) return null;
  if (pathname !== "/home") return null;

  return <OnboardingOverlay onDone={markSeen} />;
}
