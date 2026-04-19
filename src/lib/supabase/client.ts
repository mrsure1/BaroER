"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저 측 Supabase 클라이언트.
 * - localStorage 가 아닌 쿠키에 세션을 저장하므로
 *   서버 컴포넌트/Route Handler 와 일관된 세션 공유가 가능하다.
 * - 호출부마다 새 인스턴스를 만들어도 내부에서 동일 GoTrue 인스턴스를 공유한다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
