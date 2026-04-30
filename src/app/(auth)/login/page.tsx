"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { KakaoIcon, GoogleIcon } from "@/components/brand/SocialIcons";
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithKakao,
  supabaseConfigured,
} from "@/services/auth";

export default function LoginPage() {
  // useSearchParams() 는 정적 prerender 단계에서 평가될 수 없어 Suspense 경계가 필수.
  // 빈 fallback 으로 충분 — 실제 콘텐츠는 클라이언트에서 즉시 hydration 된다.
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 인증 가드가 보낸 ?next=... 가 있다면 로그인 후 원래 가려던 경로로,
  // 없으면 기본 /home 으로 이동. open-redirect 방지를 위해 내부 경로만 허용.
  const rawNext = searchParams.get("next") ?? "/home";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!supabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 400));
        router.push(next);
        return;
      }
      await loginWithEmail(email.trim(), password);
      router.push(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("email not confirmed")) {
        setError("이메일 인증을 완료해 주세요. 받은 메일의 링크를 확인하세요.");
      } else if (msg.includes("invalid login credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("rate limit")) {
        setError("로그인 시도가 너무 많아요. 잠시 후 다시 시도하세요.");
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "kakao") {
    if (!supabaseConfigured()) return;
    setError(null);
    setOauthLoading(provider);
    try {
      if (provider === "google") await loginWithGoogle(next);
      else await loginWithKakao(next);
      // 성공 시 리다이렉트 — 이 라인은 도달하지 않는다.
    } catch (err) {
      setOauthLoading(null);
      setError(
        err instanceof Error
          ? `${provider} 로그인 실패: ${err.message}`
          : `${provider} 로그인에 실패했습니다.`,
      );
    }
  }

  return (
    // 모바일 한 화면 안에 모든 인터랙션이 들어오도록 헤더를 가로 레이아웃으로
    // 압축하고, 폼/디바이더/푸터의 세로 여백을 일관되게 축소했다.
    // pt-6 / pb-6 / mb-5 / gap-3.5 정도가 iPhone SE(667pt) 기준에서도
    // 스크롤 없이 카카오·구글 버튼과 회원가입 링크까지 보이는 안전선.
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pb-6 pt-6">
      {/* Brand block — 로고와 헤드라인을 가로로 배치해 세로 공간 절약 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 flex items-center gap-3.5"
      >
        <Logo height={56} priority />
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold leading-[1.15] tracking-tight text-text">
            긴급할 때, 바로.
          </h1>
          <p className="mt-1 text-[12.5px] leading-snug text-text-muted">
            가장 가까운 응급실을 실시간으로 안내합니다.
          </p>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3"
      >
        <Input
          type="email"
          label="이메일"
          placeholder="name@example.com"
          autoComplete="email"
          inputMode="email"
          leftIcon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type={showPw ? "text" : "password"}
          label="비밀번호"
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock />}
          rightSlot={
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff /> : <Eye />}
            </IconButton>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between pt-0.5">
          <label className="flex select-none items-center gap-1.5 text-[12.5px] text-text-muted">
            <input
              type="checkbox"
              className="size-[16px] rounded-md border-border-strong accent-primary"
              defaultChecked
            />
            자동 로그인
          </label>
          <Link
            href="/forgot-password"
            className="text-[12.5px] font-medium text-text-muted hover:text-text"
          >
            비밀번호 찾기
          </Link>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[var(--radius-sm)] border border-status-full/40 bg-status-full-soft px-3 py-2 text-[12.5px] font-medium text-status-full"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={<ArrowRight className="size-4" />}
          className="mt-1"
        >
          로그인
        </Button>
      </motion.form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="my-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-text-subtle"
      >
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </motion.div>

      {/* Social buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        className="flex flex-col gap-2"
      >
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<KakaoIcon className="size-5" />}
          loading={oauthLoading === "kakao"}
          onClick={() => handleOAuth("kakao")}
          className="border-transparent bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]"
        >
          카카오로 3초 만에 시작하기
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<GoogleIcon className="size-5" />}
          loading={oauthLoading === "google"}
          onClick={() => handleOAuth("google")}
        >
          Google로 계속하기
        </Button>
      </motion.div>

      {/* Footer link — 한 화면 안에 들어오도록 mt-auto/pt-10 대신 컴팩트한 여백 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-5 text-center text-[13px] text-text-muted"
      >
        아직 계정이 없으신가요?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          회원가입
        </Link>
      </motion.p>
    </div>
  );
}
