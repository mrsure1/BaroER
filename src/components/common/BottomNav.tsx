"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Map,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const items: NavItem[] = [
  { href: "/home", label: "홈", Icon: Home },
  { href: "/search", label: "검색", Icon: Map },
  { href: "/dispatch", label: "기록", Icon: ClipboardList },
  { href: "/settings", label: "설정", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border",
        "bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70",
      )}
    >
      <ul className="mx-auto flex max-w-[520px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-text-subtle hover:text-text-muted",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-5 top-0 h-[3px] rounded-full bg-primary"
                  />
                )}
                <Icon
                  className={cn(
                    "size-[22px] transition-transform",
                    active && "scale-110",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
