// 바로응급실 디자인 시스템 - 색상, 타이포그래피, 간격 상수
export const Colors = {
  /** Themed.tsx·EditScreenInfo 호환 */
  light: {
    text: '#212121',
    background: '#FFFFFF',
    tint: '#E53935',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#E53935',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FF6F61',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FF6F61',
  },
  // 브랜드 색상
  primary: '#E53935',
  primaryDark: '#B71C1C',
  primaryLight: '#FF6F61',
  secondary: '#1976D2',

  // 수용 상태 색상
  available: '#4CAF50',    // 수용 가능 (녹색)
  busy: '#FF9800',         // 혼잡 (주황)
  full: '#F44336',         // 수용 불가 (빨강)

  // 배경
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  card: '#FFFFFF',

  // 텍스트
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  textWhite: '#FFFFFF',
  white: '#FFFFFF',

  // UI 요소
  border: '#E0E0E0',
  divider: '#F0F0F0',
  inputBg: '#FAFAFA',
  overlay: 'rgba(0,0,0,0.7)',

  // 상태 배지 배경
  badgeGreen: '#E8F5E9',
  badgeOrange: '#FFF3E0',
  badgeRed: '#FFEBEE',
  badgeBlue: '#E3F2FD',
};

export default Colors;

// 간격 시스템
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// 폰트 크기
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
};

// 둥글기
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 30,
  circle: 50,
};
