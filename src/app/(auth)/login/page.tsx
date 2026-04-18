"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { KakaoIcon, GoogleIcon } from "@/components/brand/SocialIcons";
import { firebaseConfigured, loginWithEmail } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!firebaseConfigured()) {
        // Dev fallback: skip auth when env not configured.
        await new Promise((r) => setTimeout(r, 400));
        router.push("/home");
        return;
      }
      await loginWithEmail(email.trim(), password);
      router.push("/home");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code.includes("invalid-credential") || code.includes("wrong-password")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (code.includes("user-not-found")) {
        setError("등록되지 않은 계정입니다.");
      } else if (code.includes("too-many-requests")) {
        setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.");
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pb-8 pt-14">
      {/* Brand block */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex flex-col items-start gap-5"
      >
        <Logo height={88} priority />
        <div>
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-tight text-text">
            긴급할 때, 바로.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-text-muted">
            가장 가까운 응급실을 실시간으로 찾아 안내합니다.
          </p>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4"
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

        <div className="flex items-center justify-between pt-1">
          <label className="flex select-none items-center gap-2 text-[13.5px] text-text-muted">
            <input
              type="checkbox"
              className="size-[18px] rounded-md border-border-strong accent-primary"
              defaultChecked
            />
            자동 로그인 유지
          </label>
          <Link
            href="/forgot-password"
            className="text-[13.5px] font-medium text-text-muted hover:text-text"
          >
            비밀번호 찾기
          </Link>
        </div>

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
          rightIcon={<ArrowRight className="size-4" />}
          className="mt-2"
        >
          로그인
        </Button>
      </motion.form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="my-7 flex items-center gap-3 text-[12px] font-medium uppercase tracking-wider text-text-subtle"
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
        className="flex flex-col gap-2.5"
      >
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<KakaoIcon className="size-5" />}
          className="border-transparent bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]"
        >
          카카오로 3초 만에 시작하기
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<GoogleIcon className="size-5" />}
        >
          Google로 계속하기
        </Button>
      </motion.div>

      {/* Footer link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-auto pt-10 text-center text-[13.5px] text-text-muted"
      >
        아직 계정이 없으신가요?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          회원가입
        </Link>
      </motion.p>
    </div>
  );
}
