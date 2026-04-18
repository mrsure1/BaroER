import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/Providers";
import { ThemeScript } from "@/components/providers/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "바로응급실 — 가장 가까운 응급실을 즉시",
    template: "%s · 바로응급실",
  },
  description: "긴급할 때, 바로 찾는 가장 가까운 응급실. 실시간 수용 가능 병상과 길안내까지.",
  applicationName: "바로응급실",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "바로응급실",
  },
  manifest: "/manifest.json",
  formatDetection: { telephone: true },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "바로응급실",
    description: "긴급할 때, 바로 찾는 가장 가까운 응급실",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
