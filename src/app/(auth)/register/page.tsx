"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Building2, Lock, Mail, User, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import type { UserType } from "@/stores/authStore";
import { firebaseConfigured, registerWithEmail } from "@/services/auth";

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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [userType, setUserType] = useState<UserType>("GENERAL");
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!firebaseConfigured()) {
        await new Promise((r) => setTimeout(r, 500));
        router.push("/home");
        return;
      }
      await registerWithEmail(email.trim(), password, nickname.trim());
      // 사용자 유형/소속코드는 다음 단계에서 Firestore users 문서에 기록 예정
      router.push("/home");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code.includes("email-already-in-use")) {
        setError("이미 가입된 이메일입니다.");
      } else if (code.includes("weak-password")) {
        setError("비밀번호가 너무 단순해요. 더 복잡하게 입력해 주세요.");
      } else {
        setError("회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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

      <p className="mt-8 text-center text-[13.5px] text-text-muted">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
