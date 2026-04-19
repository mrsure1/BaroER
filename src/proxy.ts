// Next.js 16 부터 "middleware" 컨벤션은 "proxy" 로 대체되었다.
// (동일한 Edge 런타임에서 매 요청마다 실행되는 함수)

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 정적 자산·이미지·sw.js·매니페스트 등은 인증과 무관하므로 매처에서 제외.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons|.*\\.(?:png|svg|jpg|jpeg|webp|avif|ico|woff|woff2)$).*)",
  ],
};
