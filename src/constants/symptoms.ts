// 증상 카테고리 상수 정의
import { SymptomCategory } from '@/src/types';

export interface SymptomOption {
  key: SymptomCategory;
  label: string;
  emoji: string;
}

// 증상 선택 목록
export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { key: 'HEADACHE', label: '두통', emoji: '🤕' },
  { key: 'CHEST_PAIN', label: '흉통', emoji: '💔' },
  { key: 'TRAUMA', label: '외상', emoji: '🩹' },
  { key: 'DYSPNEA', label: '호흡곤란', emoji: '😮‍💨' },
  { key: 'ABDOMINAL', label: '복통', emoji: '🤢' },
  { key: 'OTHER', label: '기타', emoji: '🔧' },
];

// 연령대 레이블
export const AGE_GROUP_LABELS = {
  INFANT: '영유아 (0~5세)',
  CHILD: '소아 (6~17세)',
  ADULT: '성인 (18~64세)',
  ELDERLY: '고령 (65세+)',
} as const;

// 의식 수준 레이블
export const CONSCIOUSNESS_LABELS = {
  ALERT: '명료',
  DROWSY: '혼미',
  UNRESPONSIVE: '무반응',
} as const;

// 검색 반경 설정
export const RADIUS_CONFIG = {
  MIN: 5,
  MAX: 100,
  STEP: 5,
  DEFAULT: 10,
};

// 검색 반경 프리셋 (리스트 화면용)
export const RADIUS_OPTIONS = [5, 10, 20, 50, 100];
