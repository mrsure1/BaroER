"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, UserCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";

/**
 * 프로필 설정 — 닉네임, 소속코드(구급대원), 사용자 유형 토글.
 * 값은 Supabase `auth.users.user_metadata` 에 merge 저장되고,
 * 동일 스토어의 `user` 가 즉시 갱신돼 전 화면에 반영된다.
 *
 * 이메일은 인증 주체이므로 여기서 변경할 수 없다 (별도 플로우 필요).
 */
export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [userType, setUserType] = useState<"GENERAL" | "PARAMEDIC">(
    user?.userType ?? "GENERAL",
  );
  const [orgCode, setOrgCode] = useState(user?.orgCode ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNickname(user?.nickname ?? "");
    setUserType(user?.userType ?? "GENERAL");
    setOrgCode(user?.orgCode ?? "");
  }, [user?.nickname, user?.userType, user?.orgCode]);

  if (!user) {
    return (
      <>
        <ScreenHeader title="프로필 설정" back />
        <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <UserCircle className="size-10 text-text-subtle" />
            <p className="text-[14px] text-text-muted">
              로그인 후 프로필을 설정할 수 있어요.
            </p>
            <Link href="/login">
              <Button size="md">로그인</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  const onSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          nickname: nickname.trim(),
          user_type: userType,
          ...(userType === "PARAMEDIC" ? { org_code: orgCode.trim() } : {}),
        },
      });
      if (updateError) throw updateError;
      setUser({
        ...user,
        nickname: nickname.trim() || null,
        userType,
        orgCode: userType === "PARAMEDIC" ? orgCode.trim() : undefined,
      });
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenHeader title="프로필 설정" back />
      <div className="mx-auto w-full max-w-[520px] px-5 pb-8">
        <Card className="flex items-center gap-3 p-4">
          <div className="grid size-14 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-hover text-white">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="size-full object-cover" />
            ) : (
              <UserCircle className="size-8" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-text-muted">이메일</p>
            <p className="truncate text-[14px] font-medium text-text">
              {user.email ?? "—"}
            </p>
          </div>
        </Card>

        <section className="mt-5">
          <label className="mb-1.5 block px-1 text-[12.5px] font-semibold text-text-muted">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="앱에서 표시될 이름"
            maxLength={20}
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-bg px-4 text-[15px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </section>

        <section className="mt-5">
          <p className="mb-1.5 px-1 text-[12.5px] font-semibold text-text-muted">
            사용자 유형
          </p>
          <Card className="grid grid-cols-2 gap-1 p-1">
            {(["GENERAL", "PARAMEDIC"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setUserType(t)}
                className={`rounded-[calc(var(--radius-md)-4px)] px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                  userType === t
                    ? "bg-primary text-primary-fg shadow-[var(--shadow-sm)]"
                    : "text-text-muted"
                }`}
              >
                {t === "GENERAL" ? "🧑 일반 사용자" : "🚑 구급대원"}
              </button>
            ))}
          </Card>
          <p className="mt-2 px-1 text-[11.5px] text-text-subtle">
            구급대원으로 전환하면 디스패치 리포트와 현장 기록 기능이 활성화됩니다.
          </p>
        </section>

        {userType === "PARAMEDIC" && (
          <section className="mt-5">
            <label className="mb-1.5 block px-1 text-[12.5px] font-semibold text-text-muted">
              소속 코드
            </label>
            <input
              type="text"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              placeholder="예: 강남119안전센터"
              maxLength={40}
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-bg px-4 text-[15px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-[var(--radius-md)] bg-status-full-soft px-3 py-2 text-[12.5px] text-status-full">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[12px] text-text-subtle">
            {savedAt
              ? `${new Date(savedAt).toLocaleTimeString("ko-KR")} 저장됨`
              : "\u00A0"}
          </p>
          <Button
            onClick={onSave}
            loading={saving}
            leftIcon={<Save className="size-4" />}
            size="md"
          >
            저장
          </Button>
        </div>
      </div>
    </>
  );
}
