/**
 * 💡 KTAS (Korean Triage and Acuity Scale) 응급환자 중증도 분류 기준
 * 
 * Level 1: 소생 (Immediate) - 생명이 직접적으로 위협받는 상태 (의식없음, 심정지 등)
 * Level 2: 긴급 (Emergent) - 곧 생명이나 사지가 위협받을 가능성이 있는 상태 (흉통, 의식혼미 등)
 * Level 3: 응급 (Urgent) - 진행되면 위급해질 수 있는 상태 (중등도 호흡곤란, 복통 등)
 * Level 4: 준응급 (Less Urgent) - 치료가 1~2시간 지연되어도 큰 문제가 없는 상태 (가벼운 외상, 두통 등)
 * Level 5: 비응급 (Non-urgent) - 급하지 않은 단순 진료가 필요한 상태 (단순 감기, 발열 등)
 */

import { SymptomCategory, ConsciousnessLevel, AgeGroup } from '../types';

/**
 * 증상과 의식 수준을 바탕으로 KTAS 중증도 점수(1~5)를 계산합니다.
 * 점수가 낮을수록 더 위급한 상태입니다.
 */
export function calculateKTAS(
  symptoms: SymptomCategory[],
  consciousness: ConsciousnessLevel,
  ageGroup: AgeGroup
): number {
  // 1순위: 의식 수준 판정
  if (consciousness === 'UNRESPONSIVE') return 1; // 무조건 Level 1
  if (consciousness === 'DROWSY') return 2;      // 무조건 Level 2 이상

  // 2순위: 주요 고위험 증상 판정
  if (symptoms.includes('CHEST_PAIN')) return 2;   // 흉통은 기본 Level 2
  if (symptoms.includes('DYSPNEA')) return 3;      // 호흡곤란은 기본 Level 3
  if (symptoms.includes('ABDOMINAL')) return 3;    // 복통은 기본 Level 3 (진도에 따라 2~3)
  
  // 3순위: 기타 증상 및 연령 보정
  if (symptoms.includes('TRAUMA') || symptoms.includes('HEADACHE')) {
    // 고령자나 영유아의 경우 증상이 가벼워 보여도 한 단계 긴급하게 분류
    if (ageGroup === 'ELDERLY' || ageGroup === 'INFANT') return 3;
    return 4;
  }

  // 기본값 (비응급)
  return 5;
}

/**
 * KTAS 단계에 따른 가이드 메시지를 반환합니다.
 */
export function getKTASMessage(level: number): string {
  switch (level) {
    case 1: return '즉각적인 응급 처치가 필요한 소생 단계입니다.';
    case 2: return '매우 긴급한 상태입니다. 대형 권역응급센터를 권장합니다.';
    case 3: return '응급 치료가 필요한 상태입니다.';
    case 4: return '준응급 상태입니다. 일반 응급실 이용이 가능합니다.';
    case 5: return '비응급 상태입니다. 가까운 내과/외과 방문을 권장합니다.';
    default: return '증상을 다시 확인해주세요.';
  }
}
