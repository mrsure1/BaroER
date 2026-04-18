"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DEFAULT_PREF: ThemePref = "light";

function readPref(): ThemePref {
  if (typeof window === "undefined") return DEFAULT_PREF;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : DEFAULT_PREF;
}

function resolveDark(pref: ThemePref): boolean {
  if (typeof window === "undefined") return false;
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return pref === "dark";
}

function applyDarkClass(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let _pref: ThemePref = DEFAULT_PREF;
let _initialized = false;

function init() {
  if (_initialized) return;
  _initialized = true;
  _pref = readPref();
  applyDarkClass(resolveDark(_pref));

  // Re-evaluate when system preference changes (only matters in 'system' mode)
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (_pref === "system") {
      applyDarkClass(resolveDark(_pref));
      emit();
    }
  });
}

export function setThemePref(pref: ThemePref) {
  _pref = pref;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, pref);
    applyDarkClass(resolveDark(pref));
  }
  emit();
}

function getSnapshot(): ThemePref {
  return _pref;
}

function getServerSnapshot(): ThemePref {
  return DEFAULT_PREF;
}

export function useThemePref(): [ThemePref, (p: ThemePref) => void] {
  if (typeof window !== "undefined") init();
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [pref, setThemePref];
}

export function useIsDark(): boolean {
  const [pref] = useThemePref();
  if (typeof window === "undefined") return false;
  return resolveDark(pref);
}
