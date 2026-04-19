"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, KeyRound, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { sendPasswordResetEmail, supabaseConfigured } from "@/services/auth";

/**
 * 비밀번호 찾기(재설정 메일 발송) 페이지.
 *
 * Supabase `resetPasswordForEmail` 를 호출해 사용자의 이메일로 recovery 링크를
 * 발송한다. 사용자가 메일 속 링크를 누르면 `/auth/callback?next=/reset-password`
 * 로 돌아오고, 콜백에서 recovery 세션을 만든 뒤 `/reset-password` 로 리다이렉트.
 *
 * 보안 관점: 계정 존재 여부가 노출되지 않도록, Supabase 가 던지는 에러와
 * 무관하게 UI 는 동일한 "메일을 발송했습니다" 메시지를 돌려준다.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrMsg(null);
    setStatus("sending");
    try {
      if (supabaseConfigured()) {
        await sendPasswordResetEmail(email.trim());
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
      // 보안: 계정 존재 여부를 공개하지 않기 위해 에러여도 성공 UI 를 보여준다.
      setStatus("sent");
    } catch (err) {
      // rate limit 등 사용자가 알아야 할 에러만 선별적으로 노출.
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("rate limit")) {
        setStatus("error");
        setErrMsg("요청이 너무 많아요. 잠시 후 다시 시도해 주세요.");
      } else {
        // 그 외는 여전히 성공 UI — enumeration 방지.
        setStatus("sent");
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pb-8 pt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
          className="mb-5 grid size-16 place-items-center rounded-full bg-primary-soft text-primary shadow-[var(--shadow-glow)]"
        >
          <KeyRound className="size-7" />
        </motion.div>
        <h1 className="text-[22px] font-bold tracking-tight text-text">
          비밀번호를 잊으셨나요?
        </h1>
        <p className="mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-text-muted">
          가입하신 이메일 주소를 입력해 주세요. 비밀번호를 재설정할 수 있는
          링크를 보내드릴게요.
        </p>
      </motion.div>

      {status === "sent" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="p-5 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-status-available-soft text-status-available">
              <Mail className="size-6" />
            </div>
            <p className="text-[15px] font-semibold text-text">메일을 보냈어요</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
              <strong className="text-text">{email}</strong> 로 재설정 링크가
              도착하는 데 보통 1~2 분이 걸려요. 메일함에 없다면 스팸함도 확인해
              주세요.
            </p>
          </Card>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => {
              setStatus("idle");
              setErrMsg(null);
            }}
            leftIcon={<RotateCcw className="size-4" />}
            className="mt-4"
          >
            다른 이메일로 다시 시도
          </Button>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8 flex flex-col gap-3"
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

          {status === "error" && errMsg && (
            <div className="rounded-[var(--radius-sm)] border border-status-full/40 bg-status-full-soft px-3 py-2 text-[12.5px] font-medium text-status-full">
              {errMsg}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={status === "sending"}
            className="mt-1"
          >
            재설정 링크 받기
          </Button>
        </motion.form>
      )}

      <Link
        href="/login"
        className="mt-auto pt-10 text-center text-[13.5px] font-medium text-text-muted hover:text-text"
      >
        <span className="inline-flex items-center gap-1.5">
          <ArrowLeft className="size-3.5" />
          로그인으로 돌아가기
        </span>
      </Link>
    </div>
  );
}
