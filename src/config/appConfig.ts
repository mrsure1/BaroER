/**
 * 배포 전: __DEV__·아래 플래그로 테스트용 UI/로그를 끄기 쉽게 유지합니다.
 * 프로덕션 빌드에서는 SHOW_DEV_HUD 등을 false로 두세요.
 */
export const appConfig = {
  /** Metro/개발 빌드 */
  isDev: __DEV__,
  /** 로그인 화면 등에 디버그 힌트(Expo Go 제한 안내 등) */
  showAuthDebugHints: __DEV__,
  /** 병원 목록 상단 등에 표시할 수 있는 개발용 배지(필요 시 true) */
  showDevHud: __DEV__ && false,
} as const;
