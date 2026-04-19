"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  type AuthUser,
  type UserType,
} from "@/stores/authStore";

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Supabase user → 앱 내부 AuthUser 매핑. user_metadata 우선, 없으면 폴백. */
function toAuthUser(u: User): AuthUser {
  const md = (u.user_metadata ?? {}) as Record<string, unknown>;
  const userType =
    md.user_type === "PARAMEDIC" ? "PARAMEDIC" : ("GENERAL" as UserType);
  return {
    uid: u.id,
    email: u.email ?? null,
    nickname:
      typeof md.nickname === "string"
        ? md.nickname
        : typeof md.full_name === "string"
          ? md.full_name
          : (u.email?.split("@")[0] ?? null),
    userType,
    orgCode: typeof md.org_code === "string" ? md.org_code : undefined,
    photoURL:
      typeof md.avatar_url === "string"
        ? md.avatar_url
        : typeof md.picture === "string"
          ? md.picture
          : null,
  };
}

/**
 * 이메일/비밀번호 로그인.
 * Supabase 프로젝트에서 "Confirm email" 옵션이 켜져 있다면, 이메일 인증을
 * 마치지 않은 계정은 `Email not confirmed` 에러로 거부된다. 호출부에서
 * 메시지를 분기해 "이메일 인증 후 로그인하세요" UI 를 띄우면 된다.
 */
export async function loginWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

interface RegisterArgs {
  email: string;
  password: string;
  nickname: string;
  userType: UserType;
  orgCode?: string;
}

/**
 * 이메일 회원가입. Supabase 가 즉시 인증 메일을 발송한다.
 * 사용자가 메일 안의 링크를 클릭하면 `/auth/callback` 으로 돌아오면서
 * 세션이 생성된다. 세션이 생기기 전까지는 RLS 가 모든 보호 데이터에 대한
 * 접근을 차단한다.
 */
export async function registerWithEmail({
  email,
  password,
  nickname,
  userType,
  orgCode,
}: RegisterArgs) {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/home`
      : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        nickname,
        user_type: userType,
        ...(orgCode ? { org_code: orgCode } : {}),
      },
    },
  });
  if (error) throw error;
  return data.user;
}

/** Google OAuth — 동의 화면을 거쳐 `/auth/callback` 으로 복귀한다. */
export async function loginWithGoogle(next = "/home") {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/** Kakao OAuth. Supabase Auth 의 1급 프로바이더. */
export async function loginWithKakao(next = "/home") {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function resendVerificationEmail(email: string) {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/home`
      : undefined;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

/**
 * 비밀번호 재설정 메일 발송.
 * 메일 링크 클릭 → /auth/callback (type=recovery) → /reset-password 로 리다이렉트.
 * 리셋 페이지에서 `updatePassword()` 를 호출해 새 비밀번호로 교체한다.
 */
export async function sendPasswordResetEmail(email: string) {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/reset-password`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

/** 로그인된(또는 recovery 세션) 사용자의 비밀번호를 교체한다. */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Supabase 인증 상태 → Zustand store 동기화. 앱 루트에서 1회 호출.
 * 반환값은 cleanup 함수.
 */
export function startAuthListener(): () => void {
  if (!supabaseConfigured()) {
    useAuthStore.getState().setLoading(false);
    return () => {};
  }
  const supabase = createClient();

  // 초기 세션을 즉시 채운다 (subscribe 만 하면 INITIAL_SESSION 이벤트가 늦게 와서
  // 첫 페인트에서 깜빡임이 발생할 수 있음)
  supabase.auth.getSession().then(({ data }) => {
    applySession(data.session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });

  return () => subscription.unsubscribe();
}

function applySession(session: Session | null) {
  const store = useAuthStore.getState();
  if (session?.user) store.setUser(toAuthUser(session.user));
  else store.setUser(null);
}
