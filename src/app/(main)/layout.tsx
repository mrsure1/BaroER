import type { ReactNode } from "react";
import { BottomNav } from "@/components/common/BottomNav";

/**
 * 모바일 앱 뷰포트를 "정확히 100dvh" 로 고정한다.
 *
 * - 바깥 컨테이너는 `h-[100dvh] overflow-hidden` 이라 외부 스크롤이 생기지 않는다.
 * - 안쪽 래퍼는 `flex-1 overflow-y-auto` + 탭바 높이만큼 `padding-bottom` 을
 *   주어, 긴 페이지(설정·검색 등)는 내부에서 스크롤되고 짧은 페이지(홈)는
 *   `h-full` / `flex-1` 로 탭바 바로 위까지 꽉 채울 수 있다.
 * - 이렇게 해야 홈 푸터(데이터 제공)와 하단 탭바 사이의 빈 공간이 사라진다.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg">
      {/*
       * 자식(page)에게 높이 강제 원칙을 위임한다.
       * - 홈처럼 한 화면을 꽉 채우는 페이지는 직접 `h-[calc(100dvh-탭바-safe)]`
       *   로 높이를 박아 내부에서 hero/scroll/footer 레이아웃을 분배한다.
       * - 설정·검색·기록 등 긴 페이지는 자연스럽게 흘러가며, 여기서는
       *   탭바가 가릴 영역만큼 `padding-bottom` 만 확보해 마지막 줄이
       *   가려지지 않게 한다.
       * 레이아웃 래퍼 자체에 `flex-1`/`h-full`/`overflow` 를 넣으면, 일부
       * 모바일 브라우저에서 % 높이가 content 로 축소되어 홈 푸터 아래에
       * 빈 공간이 남는 현상이 생긴다. 그래서 여기서는 간결하게 둔다.
       */}
      <div className="flex flex-1 flex-col pb-[calc(var(--bottom-nav-pad)+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
