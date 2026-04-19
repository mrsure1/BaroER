"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Mail, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resendVerificationEmail } from "@/services/auth";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleResend() {
    if (!email) {
      setErrMsg("이메일 주소가 없어요. 회원가입을 다시 시도해 주세요.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrMsg(null);
    try {
      await resendVerificationEmail(email);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setErrMsg(
        e instanceof Error ? e.message : "재발송에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
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
          <Mail className="size-7" />
        </motion.div>
        <h1 className="text-[24px] font-bold tracking-tight text-text">
          이메일을 확인해 주세요
        </h1>
        <p className="mt-2 max-w-[320px] text-[14.5px] leading-relaxed text-text-muted">
          {email ? (
            <>
              <strong className="text-text">{email}</strong> 으로 인증 링크를 보냈어요.
            </>
          ) : (
            "방금 입력한 이메일로 인증 링크를 보냈어요."
          )}{" "}
          링크를 클릭하면 자동으로 로그인됩니다.
        </p>
      </motion.div>

      <Card className="mt-10 p-4 text-[13px] leading-relaxed text-text-muted">
        <p className="font-semibold text-text">메일이 안 보이나요?</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>스팸함 / 광고 메일함을 확인해 주세요.</li>
          <li>회사·학교 메일은 외부 메일이 차단될 수 있어요.</li>
          <li>이메일 주소에 오타는 없었나요?</li>
        </ul>
      </Card>

      <Button
        size="lg"
        fullWidth
        variant="outline"
        onClick={handleResend}
        loading={status === "sending"}
        leftIcon={<RotateCcw className="size-4" />}
        className="mt-6"
      >
        {status === "sent" ? "다시 보냈어요 ✓" : "인증 메일 재발송"}
      </Button>

      {status === "error" && errMsg && (
        <p className="mt-3 text-center text-[12.5px] text-status-full">{errMsg}</p>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
