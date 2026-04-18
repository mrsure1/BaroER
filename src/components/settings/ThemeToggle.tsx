"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useThemePref, type ThemePref } from "@/stores/themeStore";

const options = [
  { value: "light" as const, label: "라이트", icon: <Sun className="size-4" /> },
  { value: "dark" as const, label: "다크", icon: <Moon className="size-4" /> },
  { value: "system" as const, label: "시스템", icon: <Monitor className="size-4" /> },
] satisfies ReadonlyArray<{ value: ThemePref; label: string; icon: React.ReactNode }>;

export function ThemeToggle() {
  const [pref, setPref] = useThemePref();
  return (
    <SegmentedControl
      options={options}
      value={pref}
      onChange={setPref}
      ariaLabel="테마 설정"
      fullWidth
    />
  );
}
