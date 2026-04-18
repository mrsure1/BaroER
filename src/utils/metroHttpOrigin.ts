import { NativeModules } from 'react-native';

/**
 * Metro 번들이 로드된 http(s) origin — WebView baseUrl·네이버 Maps 웹 서비스 URL과 맞춰야 인증 실패가 나지 않음.
 * EXPO_PUBLIC_NAVER_MAP_WEB_ORIGIN 이 있으면 최우선.
 */
export function getMetroHttpOrigin(fallback = 'http://localhost:8081'): string {
  const fromEnv = process.env.EXPO_PUBLIC_NAVER_MAP_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv;

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/[^/?]+/);
      if (match) return match[0];
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
