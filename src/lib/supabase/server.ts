import "server-only";

import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * 서버 컴포넌트 / Route Handler 용 Supabase 클라이언트.
 * Next.js 의 cookies() 와 동기화되어 자동 세션 갱신을 수행한다.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component 에서 호출되는 경우 set 이 막혀 있다 — 무시.
            // 미들웨어에서 세션을 갱신하므로 이 경로는 안전하다.
          }
        },
      },
    },
  );
}

/**
 * service_role 키로 동작하는 어드민 클라이언트.
 * RLS 를 우회할 수 있으므로 신뢰할 수 있는 서버 코드에서만 사용.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return createSSRClient(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  });
}
