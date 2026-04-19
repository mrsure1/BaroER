import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next dev 서버는 동일 origin 외 요청을 안전상 차단/경고한다.
  // ngrok 터널 + LAN IP 로 모바일/외부 접속 시 Server Actions·HMR·_next 자산
  // 요청이 막혀 버튼이 동작하지 않는 현상이 발생한다. 개발용 origin 화이트리스트.
  allowedDevOrigins: [
    "jonas-unremanded-lanny.ngrok-free.dev",
    // 동일 LAN 의 다른 디바이스에서 PC IP 로 접속할 경우를 위해 사설망 대역 허용.
    "192.168.0.0/16",
    "172.16.0.0/12",
    "10.0.0.0/8",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
