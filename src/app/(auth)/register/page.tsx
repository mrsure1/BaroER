"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Building2, Lock, Mail, User, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { KakaoIcon, GoogleIcon } from "@/components/brand/SocialIcons";
import { cn } from "@/lib/cn";
import type { UserType } from "@/stores/authStore";
import {
  loginWithGoogle,
  loginWithKakao,
  registerWithEmail,
  supabaseConfigured,
} from "@/services/auth";

const userTypes: Array<{
  id: UserType;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    id: "GENERAL",
    label: "일반 사용자",
    description: "가족·지인의 응급 상황에 대응",
    emoji: "🧑",
  },
  {
    id: "PARAMEDIC",
    label: "구급대원",
    description: "출동 기록 자동 저장 · 업무 리포트",
    emoji: "🚑",
  },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/home";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [userType, setUserType] = useState<UserType>("GENERAL");
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * 소셜 가입 — Google/Kakao 모두 첫 OAuth 로그인 시 Supabase 가
   * 자동으로 auth.users 행을 만들고, 우리 trigger(`handle_new_user`) 가
   * profiles 도 함께 만든다. 따라서 별도의 "가입" API 가 필요 없고
   * loginWith{Google,Kakao} 한 번으로 가입과 로그인이 동시에 이루어진다.
   *
   * 다만 OAuth 흐름에서는 폼에서 받은 user_type / org_code 같은 부가정보를
   * provider 를 거쳐 전달할 적절한 채널이 없어, OAuth 가입자는 항상
   * 기본값(GENERAL) 로 만들어진다. 구급대원은 소속기관 코드 인증이
   * 필요하므로, PARAMEDIC 을 선택한 경우엔 OAuth 버튼을 비활성화하고
   * 이메일 가입을 유도한다 (UI 에서 안내 메시지 표시).
   */
  async function handleOAuth(provider: "google" | "kakao") {
    if (!supabaseConfigured()) return;
    setError(null);
    setOauthLoading(provider);
    try {
      if (provider === "google") await loginWithGoogle(next);
      else await loginWithKakao(next);
      // 성공 시 OAuth provider 페이지로 리다이렉트되므로 이 라인은 도달하지 않는다.
    } catch (err) {
      setOauthLoading(null);
      setError(
        err instanceof Error
          ? `${provider === "google" ? "Google" : "Kakao"} 가입 실패: ${err.message}`
          : `${provider === "google" ? "Google" : "Kakao"} 가입에 실패했습니다.`,
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      if (!supabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 500));
        router.push(
          `/verify-email?email=${encodeURIComponent(trimmedEmail)}&next=${encodeURIComponent(next)}`,
        );
        return;
      }
      await registerWithEmail({
        email: trimmedEmail,
        password,
        nickname: nickname.trim(),
        userType,
        orgCode: userType === "PARAMEDIC" ? orgCode.trim() : undefined,
        redirectNext: next,
      });
      // Supabase 가 인증 메일을 보냈다 — 사용자에게 안내 페이지로 이동.
      router.push(
        `/verify-email?email=${encodeURIComponent(trimmedEmail)}&next=${encodeURIComponent(next)}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("user already registered") || msg.includes("already")) {
        setError("이미 가입된 이메일입니다.");
      } else if (msg.includes("password") && msg.includes("short")) {
        setError("비밀번호가 너무 짧아요. 8자 이상으로 입력해 주세요.");
      } else if (msg.includes("rate")) {
        setError("요청이 너무 많아요. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(
          err instanceof Error
            ? `회원가입에 실패했습니다: ${err.message}`
            : "회원가입에 실패했습니다.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pb-8 pt-3">
      <div className="flex items-center gap-1 py-2">
        <IconButton
          aria-label="뒤로 가기"
          onClick={() => router.back()}
          variant="ghost"
        >
          <ArrowLeft />
        </IconButton>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 mt-2"
      >
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text">
          회원가입
        </h1>
        <p className="mt-1.5 text-[14.5px] text-text-muted">
          1분이면 충분해요. 응급 상황을 대비하세요.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          type="email"
          label="이메일"
          placeholder="name@example.com"
          leftIcon={<Mail />}
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="비밀번호"
          placeholder="8자 이상, 영문+숫자"
          leftIcon={<Lock />}
          autoComplete="new-password"
          hint="영문과 숫자를 포함한 8자 이상으로 입력해주세요."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          label="닉네임"
          placeholder="2~20자"
          leftIcon={<User />}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          minLength={2}
          maxLength={20}
        />

        {/* User type segmented selector */}
        <div className="flex flex-col gap-2.5">
          <span className="px-0.5 text-[13px] font-medium text-text-muted">
            사용자 유형
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {userTypes.map((t) => {
              const active = userType === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUserType(t.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all duration-150",
                    active
                      ? "border-primary bg-primary-soft shadow-[var(--shadow-glow)]"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-lg" aria-hidden>
                      {t.emoji}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="userType-check"
                        className="grid size-5 place-items-center rounded-full bg-primary text-primary-fg"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[14.5px] font-semibold",
                      active ? "text-primary" : "text-text",
                    )}
                  >
                    {t.label}
                  </span>
                  <span className="text-[12px] leading-snug text-text-muted">
                    {t.description}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {userType === "PARAMEDIC" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Input
              label="소속기관 코드"
              placeholder="예: 119-GN-001"
              leftIcon={<Building2 />}
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              required
              hint="소속 기관에서 발급받은 인증 코드를 입력하세요."
            />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[var(--radius-sm)] border border-status-full/40 bg-status-full-soft px-3.5 py-2.5 text-[13px] font-medium text-status-full"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          className="mt-2"
        >
          계정 만들기
        </Button>
      </motion.form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="my-6 flex items-center gap-3 text-[12px] font-medium uppercase tracking-wider text-text-subtle"
      >
        <span className="h-px flex-1 bg-border" />
        또는 소셜 계정으로
        <span className="h-px flex-1 bg-border" />
      </motion.div>

      {/* Social signup buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        className="flex flex-col gap-2.5"
      >
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<KakaoIcon className="size-5" />}
          loading={oauthLoading === "kakao"}
          disabled={userType === "PARAMEDIC" || loading}
          onClick={() => handleOAuth("kakao")}
          className="border-transparent bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]"
        >
          카카오로 가입하기
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<GoogleIcon className="size-5" />}
          loading={oauthLoading === "google"}
          disabled={userType === "PARAMEDIC" || loading}
          onClick={() => handleOAuth("google")}
        >
          Google로 가입하기
        </Button>

        {userType === "PARAMEDIC" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 px-1 text-[12px] leading-relaxed text-text-muted"
          >
            🚑 구급대원 계정은 소속기관 코드 인증이 필요해서 이메일로만 가입할 수 있어요.
            소셜 가입을 하시려면 위에서 <span className="font-medium text-text">일반 사용자</span>를 선택해 주세요.
          </motion.p>
        )}
      </motion.div>

      <p className="mt-8 text-center text-[13.5px] text-text-muted">
        이미 계정이 있으신가요?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
