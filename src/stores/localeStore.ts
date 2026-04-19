"use client";

import { useSyncExternalStore } from "react";

/**
 * 앱 UI 기본 언어는 한국어. 사용자는 보조 언어로 영어 / 일본어 / 중국어(간체)
 * 를 선택할 수 있다. 선택된 로케일은 localStorage 에 저장되고, 일부 화면
 * (도움말·개인정보 처리방침·언어 설정 미리보기) 에서 번역본을 제공한다.
 *
 * 본 스토어는 themeStore 와 동일한 경량 external-store 패턴을 따른다 —
 * SSR 안전, hydration 경계 없음, 최소 API.
 */

export type Locale = "ko" | "en" | "ja" | "zh";

const STORAGE_KEY = "baroer-locale";
const DEFAULT_LOCALE: Locale = "ko";

export const LOCALES: Array<{
  value: Locale;
  label: string;
  nativeLabel: string;
  flag: string;
}> = [
  { value: "ko", label: "한국어", nativeLabel: "한국어", flag: "🇰🇷" },
  { value: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { value: "ja", label: "日本語", nativeLabel: "日本語", flag: "🇯🇵" },
  { value: "zh", label: "中文(简体)", nativeLabel: "中文", flag: "🇨🇳" },
];

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "ko" || v === "en" || v === "ja" || v === "zh") return v;
  return DEFAULT_LOCALE;
}

const listeners = new Set<() => void>();
let _locale: Locale = DEFAULT_LOCALE;
let _initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function init() {
  if (_initialized) return;
  _initialized = true;
  _locale = readLocale();
}

export function setLocale(locale: Locale) {
  _locale = locale;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.setAttribute("lang", locale);
  }
  emit();
}

function getSnapshot(): Locale {
  return _locale;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function useLocale(): [Locale, (l: Locale) => void] {
  if (typeof window !== "undefined") init();
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [locale, setLocale];
}
