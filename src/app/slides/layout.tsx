import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./slides.css";

export const metadata: Metadata = {
  title: "소개 · 슬라이드",
  description: "바로응급실 · 프로젝트 소개 프레젠테이션 덱",
};

/**
 * /slides 루트는 (main) 그룹 바깥이라 BottomNav 와 메인 pb 를 받지 않는다.
 * 추가로 덱 전용 인쇄/확대 대비 CSS 만 주입한다.
 */
export default function SlidesLayout({ children }: { children: ReactNode }) {
  return children;
}
