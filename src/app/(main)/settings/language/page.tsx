"use client";

import { Check, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { LOCALES, useLocale, type Locale } from "@/stores/localeStore";
import { cn } from "@/lib/cn";

/**
 * 언어 선택 화면.
 *
 * 사용자는 한국어(기본) 외에 영어 · 일본어 · 중국어(간체) 중 하나를 고를 수
 * 있다. 주 UI 텍스트는 현재 한국어로 작성돼 있어 선택 시 즉시 전 화면이
 * 번역되지는 않으며, 언어를 선택하면 `<html lang>` 이 바뀌고 도움말 ·
 * 개인정보 처리방침 등 장문 콘텐츠에서 해당 언어 버전이 노출된다.
 *
 * 이 방식이 선택된 이유: 응급 앱에서 사용자가 혼란을 겪지 않도록 "UI 는
 * 일관된 한국어, 설명 · 약관은 모국어" 를 원칙으로 하기 때문.
 */
const DESC: Record<Locale, string> = {
  ko: "설정을 한국어로 표시합니다.",
  en: "Long-form content (Help, Privacy) will be shown in English. Core UI remains in Korean.",
  ja: "長文コンテンツ(ヘルプ・個人情報処理方針)は日本語で表示されます。主な UI は韓国語のままです。",
  zh: "帮助与隐私政策等长篇内容将以中文显示。主界面仍保持韩语。",
};

export default function LanguageSettingsPage() {
  const [current, setCurrent] = useLocale();

  return (
    <>
      <ScreenHeader title="언어" subtitle="Language / 言語 / 语言" back />
      <div className="mx-auto w-full max-w-[520px] px-5 pb-8">
        <Card className="mb-4 flex items-start gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Globe className="size-5" />
          </div>
          <p className="text-[13px] leading-relaxed text-text-muted">
            응급 안내 UI 는 명확성을 위해 한국어로 고정됩니다. 아래에서 선택한
            언어로 도움말 · 약관 등 설명 문서가 표시됩니다.
          </p>
        </Card>

        <Card className="divide-y divide-border p-0">
          {LOCALES.map((l) => {
            const active = l.value === current;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setCurrent(l.value)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  active ? "bg-primary-soft/60" : "hover:bg-surface-2",
                )}
              >
                <span className="text-[22px] leading-none" aria-hidden>
                  {l.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-text">
                    {l.nativeLabel}
                  </p>
                  <p className="text-[12px] text-text-muted">{l.label}</p>
                </div>
                {active && <Check className="size-[18px] shrink-0 text-primary" />}
              </button>
            );
          })}
        </Card>

        <p className="mt-5 rounded-[var(--radius-md)] bg-surface-2 p-4 text-[12.5px] leading-relaxed text-text-muted">
          {DESC[current]}
        </p>
      </div>
    </>
  );
}
