import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 인증이 필요 없는 경로. 로그인/회원가입 같은 인증 페이지와
 * OAuth 콜백, 메일 인증 안내 페이지가 여기에 해당.
 *
 * 정확한 경로 매칭(=) 과 prefix 매칭(/) 을 분리해서, 의도치 않은
 * 와일드카드 통과를 막는다.
 */
const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/help",
]);
// /auth/callback, /legal/privacy 등 접근 제한이 필요 없는 prefix.
// 법률·도움말은 비로그인 상태의 사용자도 열람 가능해야 함.
const PUBLIC_PREFIXES = ["/auth/", "/legal/"];

/**
 * 인증된 사용자도 통과시켜야 하는 경로.
 * `/logout` 은 로그인된 사용자만이 호출할 의미가 있는데, public path 로 두면
 * "이미 로그인됨 → /home 강제 리다이렉트" 가드에 걸려 영영 로그아웃이 안 된다.
 * 따라서 PUBLIC_PATHS 가 아닌 별도 화이트리스트로 분리해 가드를 모두 우회.
 */
// /reset-password 는 recovery 세션(=로그인 세션) 상태로 접근해야 하므로,
// PUBLIC 경로로 두면 "이미 로그인 → /home 리다이렉트" 에 막힌다. 반대로 보호
// 경로로 두면 비로그인 상태에서도 접근 가능해야 하는 forgot-password 플로우와
// 충돌. 결국 '가드 전면 우회' 가 정답 — recovery 세션 유무는 페이지 내부에서
// supabase.auth.getUser() 로 직접 검증한다.
const ALWAYS_ALLOW = new Set<string>(["/logout", "/reset-password"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * 모든 요청에서 Supabase 세션 토큰을 자동 갱신하고
 * 만료된 access token 을 silent 하게 새로 발급받는다.
 * 동시에 인증 가드도 수행: 세션이 없으면 보호 경로 → /login 리다이렉트,
 * 세션이 있으면 인증 페이지 → /home 리다이렉트.
 *
 * @supabase/ssr 권장 패턴: middleware.ts 에서 매 요청마다 호출.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase 환경변수 미설정 시(로컬 스캐폴딩 단계) 가드 자체를 건너뛴다.
  // 그렇지 않으면 무한 리다이렉트가 발생.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // 호출하는 것만으로 토큰 silent refresh 가 트리거된다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  // /logout 같은 항상-허용 경로는 어떤 가드도 걸지 않고 바로 통과.
  if (ALWAYS_ALLOW.has(pathname)) return response;
  const publicPath = isPublic(pathname);

  // 1) 인증 안 됨 + 보호 경로 → /login?next=<원래경로>
  if (!user && !publicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  // 2) 인증됨 + 인증 페이지(/login, /register, /verify-email) → /home
  //    (단 /auth/callback 같은 OAuth 처리 라우트는 통과시켜야 함)
  if (user && PUBLIC_PATHS.has(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
