import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 로그아웃 라우트 — `/logout` 으로 GET 또는 POST 요청 시
 * Supabase 세션 쿠키를 정리하고 `/login` 으로 보낸다.
 *
 * - GET 도 허용한 이유: 폰에서 주소창에 직접 쳐서 빠르게 로그아웃하거나,
 *   링크/리스트의 `<a>` 로 호출할 수 있게 하기 위함.
 * - 다른 도메인으로 보내는 redirect 가 아니므로 CSRF 위험은 사실상 없음.
 *
 * 미들웨어가 `/logout` 을 만나면 인증 가드 대상에서 제외하기 위해
 * `ALWAYS_ALLOW` 에 `/logout` 을 추가해 두었다.
 *
 * 쿠키 정리는 미들웨어와 동일한 패턴 — `createServerClient` 의 `setAll` 이
 * 응답 객체에 직접 쿠키를 set 하도록 연결한다. `next/headers` 의 cookieStore
 * 와 별도의 `NextResponse.redirect()` 객체를 섞으면 만료 쿠키가 응답에
 * attach 되지 않아 로그아웃이 보이지 않게 실패하는 케이스가 있어 이 방식이
 * 안전하다.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";

  let response = NextResponse.redirect(target);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase 미설정 환경에서는 그냥 리다이렉트만.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 응답을 새로 만들 필요는 없다 — 동일 redirect 응답에 쿠키만 덧붙임.
        // (NextResponse.redirect 는 set-cookie 헤더를 정상적으로 누적 지원)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // signOut 호출이 내부적으로 만료된 sb-* 쿠키들을 setAll 로 흘려보낸다.
  // 그 결과 위의 setAll 에서 응답 쿠키로 attach.
  await supabase.auth.signOut();

  return response;
}
