/**
 * KTAS (Korean Triage and Acuity Scale) 보조 로직.
 *
 * KTAS 는 응급실 내원 환자의 중증도를 1~5 단계로 분류하는 국가 표준이다.
 *   Level 1 — 소생(Resuscitation): 즉각적 생명위협
 *   Level 2 — 긴급(Emergent): 잠재적 생명위협, 10 분 내 처치
 *   Level 3 — 응급(Urgent): 잠재적 진행성 중증, 30 분 내 처치
 *   Level 4 — 준응급(Less Urgent): 60 분 내 평가
 *   Level 5 — 비응급(Non-urgent): 2 시간 내 평가
 *
 * 본 유틸은 정식 KTAS 판정을 대체할 수 없다. 검색 단계에서 사용자가 체크한
 * 증상 묶음으로부터 **추정 중증도** 를 도출해, 한국 119 응급처치 지침 /
 * 대한응급의학회 프리호스피탈 가이드 기반의 간결한 응급조치를 제공한다.
 */

import type { SymptomId } from "@/stores/searchStore";

export type KtasLevel = 1 | 2 | 3 | 4 | 5;

export interface KtasInfo {
  level: KtasLevel;
  /** 한글 + 영문 풀 라벨 (예: "소생 (Resuscitation)"). */
  label: string;
  /** 한글 단축 라벨 (예: "소생") — 일반인 가독성용 메인 표기. */
  koLabel: string;
  /** 영문 라벨 (예: "Resuscitation"). */
  enLabel: string;
  /** 화면 뱃지 색 키 — globals.css 의 status tone 을 재활용. */
  tone: "critical" | "urgent" | "warn" | "info" | "ok";
  /** 권장 반응 시간 (사용자에게 노출되는 상한). */
  targetMin: number;
  summary: string;
}

export const KTAS_META: Record<KtasLevel, KtasInfo> = {
  1: {
    level: 1,
    label: "소생 (Resuscitation)",
    koLabel: "소생",
    enLabel: "Resuscitation",
    tone: "critical",
    targetMin: 0,
    summary: "즉각적 생명 위협. 지금 바로 119 에 신고하세요.",
  },
  2: {
    level: 2,
    label: "긴급 (Emergent)",
    koLabel: "긴급",
    enLabel: "Emergent",
    tone: "urgent",
    targetMin: 10,
    summary: "잠재적 생명 위협. 10 분 이내 전문 처치가 필요합니다.",
  },
  3: {
    level: 3,
    label: "응급 (Urgent)",
    koLabel: "응급",
    enLabel: "Urgent",
    tone: "warn",
    targetMin: 30,
    summary: "진행 가능성이 있는 증상. 30 분 이내 응급실 방문을 권장합니다.",
  },
  4: {
    level: 4,
    label: "준응급 (Less Urgent)",
    koLabel: "준응급",
    enLabel: "Less Urgent",
    tone: "info",
    targetMin: 60,
    summary: "지속 관찰이 필요한 증상. 1 시간 이내 평가를 권장합니다.",
  },
  5: {
    level: 5,
    label: "비응급 (Non-urgent)",
    koLabel: "비응급",
    enLabel: "Non-urgent",
    tone: "ok",
    targetMin: 120,
    summary: "즉시 처치 필요는 낮아요. 증상 변화가 있으면 다시 확인하세요.",
  },
};

/**
 * KTAS 1~5 → 한글 단축 라벨 lookup (lib 외부 컴포넌트가 단순히
 * `ktasKoLabel(value)` 만 import 해서 쓸 수 있게 한다).
 */
export function ktasKoLabel(level: KtasLevel | 0 | null | undefined): string | null {
  if (!level) return null;
  return KTAS_META[level as KtasLevel]?.koLabel ?? null;
}

// ========== 증상별 중증도 가중치 ==========
//
// 각 증상이 가지는 추정 중증도 (1=소생 .. 5=비응급).
// 보수적 판단을 위해 복수 증상이 조합되면 "가장 중한 값" 을 채택한다.
const SYMPTOM_SEVERITY: Record<SymptomId, KtasLevel> = {
  unconscious: 1,
  breathing: 2,
  bleeding: 2,
  seizure: 2,
  allergy: 2,
  fracture: 3,
  pain: 3,
  burn: 3,
  headache: 4,
};

// ========== 연령 가중 ==========
//
// 유아/노인은 생리 예비력이 낮아 같은 증상에서도 중증화 속도가 빠르다 →
// critical 영역 있으면 1단계 상향까지 허용.
export function estimateKtas(
  symptoms: SymptomId[],
  ageBand: string | null | undefined,
): KtasInfo {
  if (symptoms.length === 0) return KTAS_META[5];

  let worst: KtasLevel = 5;
  for (const id of symptoms) {
    const s = SYMPTOM_SEVERITY[id];
    if (s && s < worst) worst = s;
  }

  // 다발증상(3개 이상) → 한 단계 상향
  if (symptoms.length >= 3 && worst > 1) {
    worst = (worst - 1) as KtasLevel;
  }
  // 취약 연령 + critical 영역(level 3 이하) → 한 단계 상향
  const vulnerable = ageBand === "infant" || ageBand === "elderly";
  if (vulnerable && worst > 1 && worst <= 3) {
    worst = (worst - 1) as KtasLevel;
  }

  return KTAS_META[worst];
}

// ========== 응급조치 지침 ==========

export type Audience = "general" | "paramedic";

export interface GuidanceBlock {
  /** 한 줄 요약 (카드 헤더용) */
  heading: string;
  /** 체크리스트 항목들 */
  steps: string[];
  /** 절대 하지 말아야 할 행동 */
  donts?: string[];
}

/** 증상 ID → 일반인용 응급조치 */
const GENERAL_GUIDE: Record<SymptomId, GuidanceBlock> = {
  unconscious: {
    heading: "의식이 없는 환자",
    steps: [
      "반응 확인 — 어깨를 두드리며 큰 소리로 부릅니다.",
      "호흡 확인 — 가슴이 오르내리는지 10 초간 관찰.",
      "호흡이 없으면 즉시 가슴압박 (분당 100~120 회, 깊이 5cm).",
      "119 상담원의 안내에 따라 AED(자동심장충격기) 를 가져옵니다.",
    ],
    donts: [
      "의식이 없는 환자의 입에 물·약을 넣지 마세요.",
      "머리·목의 외상이 의심되면 함부로 흔들지 마세요.",
    ],
  },
  breathing: {
    heading: "호흡 곤란",
    steps: [
      "환자를 편한 자세(앉은 자세) 로 기대어 두세요.",
      "조이는 옷·넥타이·벨트를 풀어 줍니다.",
      "기도에 이물이 보이면 기침을 유도하고, 복부 밀어내기(하임리히) 를 시도.",
      "평소 복용하는 흡입기(천식·COPD) 가 있다면 사용합니다.",
    ],
    donts: ["억지로 눕히지 마세요 — 호흡을 더 어렵게 합니다."],
  },
  bleeding: {
    heading: "출혈",
    steps: [
      "깨끗한 천·거즈로 상처를 **강하게 직접 압박**.",
      "상처 부위를 심장보다 **높게** 유지합니다.",
      "피가 스며들면 거즈를 떼지 말고 위에 덧대어 계속 압박.",
      "동맥성 대량 출혈이면 지혈대 사용 가능(팔/다리만).",
    ],
    donts: [
      "배·가슴·목의 깊은 상처에 박힌 물체를 뽑지 마세요 — 그대로 고정.",
    ],
  },
  fracture: {
    heading: "골절 / 삔 곳",
    steps: [
      "환자와 손상 부위를 **움직이지 않게** 합니다.",
      "딱딱한 것(잡지·책) 으로 관절 위·아래를 함께 감싸 부목 고정.",
      "얼음을 천으로 싸서 10 분 간격으로 냉찜질.",
    ],
    donts: ["뼈를 맞추려고 당기지 마세요 — 근육·혈관이 손상됩니다."],
  },
  pain: {
    heading: "심한 통증",
    steps: [
      "통증 부위·시작 시각·양상(찌르는/쥐어짜는/타는)을 기록.",
      "환자가 가장 편한 자세를 그대로 유지하게 합니다.",
      "가슴 중앙의 쥐어짜는 통증·식은땀은 **심근경색 의심** → 즉시 119.",
    ],
    donts: ["처방받지 않은 진통제를 임의로 투여하지 마세요."],
  },
  allergy: {
    heading: "알레르기 반응 / 아나필락시스",
    steps: [
      "원인 물질(음식·벌침·약물) 을 즉시 제거·중단.",
      "호흡이 어렵거나 얼굴이 부어오르면 **에피네프린 자가주사기(에피펜)** 사용.",
      "상체를 세운 자세로 앉히고 기도를 확보합니다.",
    ],
    donts: [
      "괜찮아 보여도 30~60 분 이내 재발(이상성) 가능 — 반드시 병원으로.",
    ],
  },
  seizure: {
    heading: "발작 / 경련",
    steps: [
      "주변의 단단한 물건을 치워 머리 손상을 예방합니다.",
      "환자를 **옆으로 눕혀** 분비물이 기도를 막지 않게 합니다.",
      "경련이 **5 분 이상** 지속되면 즉시 119.",
      "발작 시작 시각과 지속 시간을 기록.",
    ],
    donts: [
      "입에 수저·손가락을 넣지 마세요 — 혀를 깨물 수 있지만 질식이 더 위험.",
      "경련 중인 환자를 억지로 잡거나 누르지 마세요.",
    ],
  },
  burn: {
    heading: "화상",
    steps: [
      "시원한(미지근한) 물로 **10~20 분** 흘려 냉각.",
      "반지·시계 등은 부종이 심해지기 전에 제거합니다.",
      "깨끗한 거즈·랩으로 상처를 느슨하게 덮어 줍니다.",
    ],
    donts: [
      "얼음·치약·된장·기름을 바르지 마세요.",
      "물집을 일부러 터뜨리지 마세요.",
    ],
  },
  headache: {
    heading: "심한 두통",
    steps: [
      "어둡고 조용한 곳에서 안정을 취합니다.",
      "수분을 충분히 섭취하고, 목·어깨 긴장을 풀어 줍니다.",
      "아래 증상이 있으면 즉시 119 — 생애 최악의 두통, 의식 저하, 한쪽 팔·다리 마비, 말 어눌.",
    ],
  },
};

/** 증상 ID → 구급대원용 이송 중 처치 프로토콜 */
const PARAMEDIC_GUIDE: Record<SymptomId, GuidanceBlock> = {
  unconscious: {
    heading: "의식 저하 — 이송 중 처치",
    steps: [
      "AVPU 평가 및 GCS 기록.",
      "기도 확보: head-tilt / jaw-thrust, OPA/NPA 고려.",
      "SpO₂ < 94% 시 고유량 산소(NRB 15 L/min).",
      "무맥/무호흡 확인 시 즉시 CPR + AED 패드 부착.",
      "혈당 측정 — 저혈당이면 50% 포도당 25g IV 준비.",
      "아편 중독 의심 시 Naloxone 0.4mg IV/IM.",
    ],
  },
  breathing: {
    heading: "호흡 곤란",
    steps: [
      "좌위(Fowler’s) 또는 반좌위 유지.",
      "SpO₂ 목표 94~98% (COPD 환자는 88~92%).",
      "천명음 — Salbutamol 5mg Neb.",
      "폐부종 의심(양측 crackle, 다리 부종) — NTG 설하, CPAP 고려.",
      "12-lead ECG — MI 동반 여부 평가.",
    ],
  },
  bleeding: {
    heading: "출혈 / 저혈량 쇼크",
    steps: [
      "직접 압박 → 안 되면 지혈대(사지) 시행 후 시각 기록.",
      "Large-bore IV 2 개(18G 이상), NS 볼러스 250~500ml.",
      "저혈압·빈맥·창백은 쇼크 지표 — permissive hypotension 고려.",
      "보온 유지(hypothermia 가 응고장애 악화).",
    ],
  },
  fracture: {
    heading: "골절 / 외상",
    steps: [
      "SAM splint · 교정 전후 CSM(순환·감각·운동) 확인.",
      "개방 골절은 멸균 드레싱 후 고정.",
      "대퇴 골절 — 견인 부목 고려.",
      "통증 평가 후 IV analgesia (프로토콜 내) 투여.",
    ],
  },
  pain: {
    heading: "심한 통증",
    steps: [
      "OPQRST 기반 병력 청취.",
      "가슴통증 — 12-lead ECG, 아스피린 300mg 저작, NTG 설하(저혈압 제외).",
      "복통 — 체위 조정, 구토 대비 흡인 준비.",
      "통증 점수 기록 후 analgesia 투여.",
    ],
  },
  allergy: {
    heading: "아나필락시스",
    steps: [
      "Epinephrine 0.3~0.5mg IM(대퇴 외측) — 5~15 분 간격 반복 가능.",
      "기도 부종 모니터링, SpO₂ 유지.",
      "IV 라인 + NS 볼러스 500~1000ml (저혈압 시).",
      "이차 약물 — 항히스타민, 스테로이드.",
    ],
  },
  seizure: {
    heading: "경련",
    steps: [
      "측위 + 기도 보호, SpO₂ 모니터.",
      "5 분 이상 지속(Status) — Midazolam 10mg IM / 5mg IV.",
      "혈당 측정, 체온·외상 여부 확인.",
      "경련 시작 시각·지속시간·양상(국소/전신) 기록.",
    ],
  },
  burn: {
    heading: "화상",
    steps: [
      "Rule of 9 로 TBSA 추정 — 20% 이상은 화상센터 이송.",
      "20 분 이상 냉각은 저체온 위험 — 15~20℃ 생리식염수 드레싱.",
      "흡입화상 의심(얼굴 그을음·목쉰소리) — 조기 기도 확보.",
      "Parkland: TBSA × kg × 4ml LR (반은 8 시간 내).",
    ],
  },
  headache: {
    heading: "심한 두통",
    steps: [
      "Thunderclap / 자세성 / 편측 마비 — SAH·뇌졸중 의심.",
      "BP 측정, 혈당, SpO₂ 확인.",
      "FAST 평가 — 의심 시 stroke center 이송.",
      "두부 외상 병력 여부 확인.",
    ],
  },
};

/** KTAS 레벨별 범용 가이드 (선택 증상이 특정되지 않을 때 폴백) */
const KTAS_LEVEL_GENERAL: Record<KtasLevel, GuidanceBlock> = {
  1: {
    heading: "즉각 조치가 필요해요",
    steps: [
      "지금 119 에 신고하세요.",
      "환자 주변의 위험 요인(불·차량·전기) 을 제거.",
      "심정지가 의심되면 가슴압박을 시작하세요.",
    ],
  },
  2: {
    heading: "잠재적 생명 위협",
    steps: [
      "119 신고 후 상담원의 지시를 따르세요.",
      "환자가 가장 편한 자세를 유지하도록 합니다.",
      "새 증상(호흡, 의식, 출혈) 이 생기면 즉시 공유.",
    ],
  },
  3: {
    heading: "응급실 방문을 권장합니다",
    steps: [
      "가까운 응급실까지 **30 분 이내** 도착을 목표로 합니다.",
      "약 복용 기록·알레르기·최근 수술 이력을 미리 정리하세요.",
      "증상이 급격히 악화되면 119 로 전환.",
    ],
  },
  4: {
    heading: "가까운 응급실·병원 평가",
    steps: [
      "1 시간 이내 평가를 권장합니다.",
      "통증·부종·열 등 변화 양상을 기록해 두세요.",
    ],
  },
  5: {
    heading: "즉각적 위험은 낮아요",
    steps: [
      "휴식 · 수분 · 체온 유지를 먼저 시도합니다.",
      "증상이 지속되거나 악화되면 다시 앱을 열어 재평가하세요.",
    ],
  },
};

const KTAS_LEVEL_PARAMEDIC: Record<KtasLevel, GuidanceBlock> = {
  1: {
    heading: "Resuscitation — 즉시 처치",
    steps: [
      "ABC 평가 + 즉각 중재(기도·환기·순환).",
      "모니터링: ECG, SpO₂, ETCO₂, BP.",
      "수용 병원 사전 통보(ETA, 주 증상, 연령).",
    ],
  },
  2: {
    heading: "Emergent — 이송 중 모니터링",
    steps: [
      "10 분 이내 처치 가능 병원 선정.",
      "활력 징후 5 분 간격 재측정.",
      "초기 IV 라인 확보 + 체위 유지.",
    ],
  },
  3: {
    heading: "Urgent — 지속 평가",
    steps: [
      "30 분 내 처치 가능 병원 선정.",
      "OPQRST + SAMPLE 병력 완비.",
      "통증·활력 변화 추세 기록.",
    ],
  },
  4: {
    heading: "Less Urgent",
    steps: [
      "안정 상태에서 이송 — 활력 안정 여부 확인.",
      "환자 편의 위주 체위 유지.",
    ],
  },
  5: {
    heading: "Non-urgent",
    steps: [
      "외래 수준 평가 가능 병원으로 이송 고려.",
      "환자·보호자에게 대기 시간 안내.",
    ],
  },
};

/**
 * 선택된 증상 묶음에 대한 응급조치 카드들을 반환.
 * 증상 매칭이 하나도 없으면 레벨 기반 폴백 한 장만 반환.
 */
export function getGuidance(
  symptoms: SymptomId[],
  level: KtasLevel,
  audience: Audience,
): GuidanceBlock[] {
  const dict = audience === "paramedic" ? PARAMEDIC_GUIDE : GENERAL_GUIDE;
  const fallback =
    audience === "paramedic" ? KTAS_LEVEL_PARAMEDIC : KTAS_LEVEL_GENERAL;

  const blocks: GuidanceBlock[] = [];
  const seen = new Set<string>();
  for (const id of symptoms) {
    const g = dict[id];
    if (g && !seen.has(g.heading)) {
      blocks.push(g);
      seen.add(g.heading);
    }
  }
  if (blocks.length === 0) blocks.push(fallback[level]);
  return blocks;
}
