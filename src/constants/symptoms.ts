// 증상 카테고리 상수 정의
import { SymptomCategory } from '@/src/types';

export interface SymptomOption {
  key: SymptomCategory;
  label: string;
  emoji: string;
  iconName: any; // Ionicons name
  seriousDiseaseCodes?: string[]; // API 매핑 코드 (HV1, HV12 등)
}

// 증상 선택 목록
export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { key: 'ANAPHYLAXIS', label: '아나필락시스', emoji: '⚠️', iconName: 'alert-circle-outline', seriousDiseaseCodes: ['HV12'] }, // 급성 알레르기
  { key: 'CHEST_PAIN', label: '흉통', emoji: '💔', iconName: 'heart-outline', seriousDiseaseCodes: ['HV1'] }, // 심근경색
  { key: 'HEADACHE', label: '두통', emoji: '🤕', iconName: 'flash-outline', seriousDiseaseCodes: ['HV2', 'HV3'] }, // 뇌출혈, 뇌경색
  { key: 'DYSPNEA', label: '호흡곤란', emoji: '😮‍💨', iconName: 'fitness-outline', seriousDiseaseCodes: ['HV1'] }, // 심장질환 등
  { key: 'TRAUMA', label: '외상', emoji: '🩹', iconName: 'medkit-outline', seriousDiseaseCodes: ['HV11'] }, // 다발성외상
  { key: 'ABDOMINAL', label: '복통', emoji: '🤢', iconName: 'bandage-outline', seriousDiseaseCodes: ['HV5', 'HV6'] }, // 복부아올타, 담낭 등
  { key: 'OTHER', label: '기타', emoji: '🔧', iconName: 'help-circle-outline' },
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
