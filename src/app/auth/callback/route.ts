import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth / 이메일 인증 콜백.
 *
 * - OAuth(Google/Kakao)는 `?code=...` 로 돌아오며, 코드를 세션으로 교환한다.
 * - 이메일 매직링크/인증은 직접 `/auth/v1/verify` 가 처리한 후
 *   `?token_hash=...&type=...` 로 이쪽으로 리다이렉트되기도 한다 — 그 케이스도 처리.
 * - `next` 파라미터로 로그인 후 도착 위치를 받아 안전한 내부 경로만 허용.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const requestedNext = searchParams.get("next") ?? "/home";
  const next = requestedNext.startsWith("/") ? requestedNext : "/home";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "magiclink" | "recovery" | "invite" | "email",
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("auth_callback_missing_code")}`,
  );
}
