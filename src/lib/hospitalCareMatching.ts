import type { RealtimeBeds, SpecialtyFit } from "@/types/hospital";
import type { AgeBand, Gender, SymptomId } from "@/stores/searchStore";

/** UI·정렬용 — 환자 입력에서 도출되는 전문 치료 니즈 */
export type CareNeed = "burn" | "obstetric" | "pediatric_er";

const BURN_NAME_MARKERS = [
  "화상",
  "burn",
  "한국화상",
  "화상재활",
] as const;

const OB_NAME_MARKERS = [
  "산부인과",
  "여성암",
  "분만",
  "산모",
  "조산",
  "산욕",
  "임산",
  "perinatal",
] as const;

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

/**
 * 공공데이터 응급 API에는 ‘화상전문’·‘산부인과 응급’ 플래그가 없어,
 * 기관명·응급기관 구분·실시간 소아 병상 보고 여부로 **참고용** 힌트만 만든다.
 */
export function computeSpecialtyFit(
  name: string,
  erTypeLabel: string,
  realtime: RealtimeBeds | undefined,
): SpecialtyFit {
  const n = normalizeName(name);
  const burnNameHint = BURN_NAME_MARKERS.some((m) => n.includes(m.toLowerCase()));
  const obstetricNameHint = OB_NAME_MARKERS.some((m) =>
    /[a-z]/i.test(m) ? n.includes(m.toLowerCase()) : name.includes(m),
  );
  const pediatricErBedsReported = realtime?.pediatricEr != null;
  const regionalEr =
    erTypeLabel.includes("권역") ||
    erTypeLabel.includes("지역응급의료센터") ||
    erTypeLabel.includes("지역응급의료기관");

  return {
    burnNameHint,
    obstetricNameHint,
    pediatricErBedsReported,
    regionalEr,
  };
}

export function deriveCareNeeds(
  symptoms: SymptomId[],
  ageBand: AgeBand | null,
  _gender: Gender | null,
): CareNeed[] {
  const needs: CareNeed[] = [];
  if (symptoms.includes("burn")) needs.push("burn");
  if (symptoms.includes("pregnancy")) needs.push("obstetric");
  if (ageBand === "infant" || ageBand === "child") needs.push("pediatric_er");
  return needs;
}

/** 증상 맞춤 정렬 점수 (높을수록 리스트 상단에 두기 좋음) */
export function specialtyMatchScore(needs: CareNeed[], fit: SpecialtyFit | undefined): number {
  if (!needs.length || !fit) return 0;
  let s = 0;
  if (needs.includes("burn")) {
    if (fit.burnNameHint) s += 200;
    else if (fit.regionalEr) s += 70;
  }
  if (needs.includes("obstetric")) {
    if (fit.obstetricNameHint) s += 200;
    else if (fit.regionalEr) s += 50;
  }
  if (needs.includes("pediatric_er")) {
    if (fit.pediatricErBedsReported) s += 150;
    else if (fit.regionalEr) s += 40;
  }
  return s;
}

export function matchedCareLabels(needs: CareNeed[], fit: SpecialtyFit | undefined): string[] {
  if (!needs.length || !fit) return [];
  const out: string[] = [];
  if (needs.includes("burn")) {
    if (fit.burnNameHint) out.push("화상 진료 유리(이름 기준)");
    else if (fit.regionalEr) out.push("중증·전문 이송에 유리할 수 있음(권역)");
  }
  if (needs.includes("obstetric")) {
    if (fit.obstetricNameHint) out.push("산부인과·분만 연관 추정");
    else if (fit.regionalEr) out.push("분만·산과 응급 시 권역 협의 가능성");
  }
  if (needs.includes("pediatric_er")) {
    if (fit.pediatricErBedsReported) out.push("소아응급 병상 보고됨");
    else if (fit.regionalEr) out.push("소아 중증 시 권역 이송 검토");
  }
  return out;
}
