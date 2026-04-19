"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/services/auth";

/**
 * 비밀번호 재설정 화면.
 *
 * 메일 링크를 통해 도착하면 Supabase 가 recovery 세션을 발급한 상태로 진입.
 * 이 화면에서 `updateUser({ password })` 를 호출해 새 비밀번호로 교체한다.
 *
 * 직접 URL 로 접근한 경우(recovery 세션 없음)에는 재설정 플로우가 성립하지
 * 않으므로 안내 후 /forgot-password 로 돌려보낸다.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      setSessionChecked(true);
      if (!error && data.user) setHasRecovery(true);
    });
  }, []);

  const passwordIssue =
    password.length > 0 && password.length < 8
      ? "8자 이상 입력해 주세요"
      : confirm.length > 0 && confirm !== password
        ? "비밀번호가 일치하지 않아요"
        : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordIssue || password.length < 8 || password !== confirm) return;
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.push("/home"), 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "비밀번호 변경에 실패했어요. 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[480px] opacity-60 blur-3xl"
      >
        <div className="absolute left-1/2 top-0 aspect-square w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col safe-top safe-bottom safe-x">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pb-8 pt-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-5 grid size-16 place-items-center rounded-full bg-primary-soft text-primary shadow-[var(--shadow-glow)]">
              {done ? <CheckCircle2 className="size-7" /> : <KeyRound className="size-7" />}
            </div>
            <h1 className="text-[22px] font-bold tracking-tight text-text">
              {done ? "변경 완료" : "새 비밀번호 설정"}
            </h1>
            <p className="mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-text-muted">
              {done
                ? "새 비밀번호로 로그인이 완료됐어요. 잠시 후 홈으로 이동합니다."
                : "다른 사람이 추측하기 어려운 비밀번호를 사용하세요."}
            </p>
          </motion.div>

          {!done && sessionChecked && !hasRecovery && (
            <Card className="mt-6 border-status-busy/40 bg-status-busy-soft p-4 text-[13px] leading-relaxed text-text">
              <p className="font-semibold">재설정 링크가 만료됐거나 유효하지 않아요.</p>
              <p className="mt-1 text-text-muted">
                이 화면에 직접 접근했거나, 링크를 두 번 이상 열었을 수 있어요.
              </p>
              <Link href="/forgot-password" className="mt-3 inline-block">
                <Button size="sm">재설정 링크 다시 받기</Button>
              </Link>
            </Card>
          )}

          {!done && sessionChecked && hasRecovery && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mt-8 flex flex-col gap-3"
            >
              <Input
                type={showPw ? "text" : "password"}
                label="새 비밀번호"
                placeholder="8자 이상"
                autoComplete="new-password"
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
                minLength={8}
              />
              <Input
                type={showPw ? "text" : "password"}
                label="새 비밀번호 확인"
                placeholder="다시 한 번 입력"
                autoComplete="new-password"
                leftIcon={<Lock />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />

              {passwordIssue && (
                <p className="px-1 text-[12.5px] text-status-full">{passwordIssue}</p>
              )}

              {error && (
                <div className="rounded-[var(--radius-sm)] border border-status-full/40 bg-status-full-soft px-3 py-2 text-[12.5px] text-status-full">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                disabled={
                  password.length < 8 ||
                  password !== confirm ||
                  Boolean(passwordIssue)
                }
                className="mt-1"
              >
                비밀번호 변경
              </Button>
            </motion.form>
          )}
        </div>
      </div>
    </main>
  );
}
