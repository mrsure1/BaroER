"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 구급대원 출동 리포트 로컬 저장소.
 *
 * 대한민국 119/민간 이송업 구급대원이 현장에서 작성하는 "구급활동일지"
 * 서식을 최소 공통 분모 수준으로 디지털화한다. 필드 설계 기준:
 *   - 소방청 구급활동일지 표준 서식 (2023 개정)
 *   - 대한응급의학회 병원전 구급기록 지침
 *   - KTAS (Korean Triage and Acuity Scale) 1~5 분류
 *
 * 본 MVP 는 백엔드 전송 전 단계 — 모든 데이터는 디바이스 localStorage 에만
 * 저장된다. RLS 보호된 Supabase 테이블로의 upsync 는 후속 작업.
 */

// ===== 상수 =====

export type Consciousness = "A" | "V" | "P" | "U";
export const CONSCIOUSNESS_OPTIONS: Array<{ value: Consciousness; label: string; desc: string }> = [
  { value: "A", label: "Alert", desc: "명료 — 시간/장소/사람 지남력 있음" },
  { value: "V", label: "Verbal", desc: "언어자극에 반응" },
  { value: "P", label: "Pain", desc: "통증자극에만 반응" },
  { value: "U", label: "Unresponsive", desc: "무반응" },
];

export type KTAS = 1 | 2 | 3 | 4 | 5;
export const KTAS_OPTIONS: Array<{ value: KTAS; label: string; tone: "critical" | "warn" | "info" | "ok" }> = [
  { value: 1, label: "소생 (Resuscitation)", tone: "critical" },
  { value: 2, label: "긴급 (Emergent)", tone: "critical" },
  { value: 3, label: "응급 (Urgent)", tone: "warn" },
  { value: 4, label: "준응급 (Less Urgent)", tone: "info" },
  { value: 5, label: "비응급 (Non Urgent)", tone: "ok" },
];

export const TREATMENT_OPTIONS = [
  { id: "airway", label: "기도확보" },
  { id: "oxygen", label: "산소공급" },
  { id: "suction", label: "흡인" },
  { id: "cpr", label: "심폐소생술" },
  { id: "aed", label: "자동제세동(AED)" },
  { id: "bleeding", label: "지혈" },
  { id: "splint", label: "부목고정" },
  { id: "cspine", label: "경추고정" },
  { id: "iv", label: "정맥로 확보" },
  { id: "ecg", label: "심전도 모니터링" },
  { id: "spO2", label: "SpO₂ 측정" },
  { id: "glucose", label: "혈당 측정" },
  { id: "warm", label: "보온" },
  { id: "drug", label: "약물 투여" },
] as const;

export type TreatmentId = (typeof TREATMENT_OPTIONS)[number]["id"];

export const DISPATCH_REASONS = [
  "질병",
  "교통사고",
  "추락/낙상",
  "중독",
  "화상",
  "폭행/자해",
  "임산부",
  "기타",
] as const;
export type DispatchReason = (typeof DISPATCH_REASONS)[number];

// ===== 엔티티 =====

export interface VitalSigns {
  bpSystolic: string; // 수축기 (mmHg)
  bpDiastolic: string; // 이완기 (mmHg)
  pulse: string; // 분당 맥박
  resp: string; // 분당 호흡수
  spo2: string; // %
  temp: string; // ℃
  glucose: string; // mg/dL
}

export interface DispatchReport {
  id: string;
  createdAt: number;
  updatedAt: number;

  // 출동 정보
  dispatchNo: string;
  unitCode: string; // 소속 (예: 강남119안전센터)
  vehicleNo: string; // 차량번호
  crewName: string; // 작성자 이름
  dispatchedAt: string; // ISO (현장 출동 시각)
  arrivedSceneAt: string;
  departSceneAt: string;
  arrivedHospitalAt: string;
  sceneAddress: string;

  // 환자 정보
  patientName: string;
  patientGender: "M" | "F" | "";
  patientAge: string; // 나이 (추정 허용 — 문자열)
  patientContact: string;
  patientAddress: string;

  // 주 증상 & 활력 징후
  chiefComplaint: string;
  reason: DispatchReason | "";
  consciousness: Consciousness | "";
  ktas: KTAS | 0;
  vitals: VitalSigns;

  // 처치 내역
  treatments: TreatmentId[];
  treatmentMemo: string;

  // 이송 정보
  destinationHospital: string;
  transportMemo: string;

  // 특이사항
  remarks: string;
}

export function createEmptyReport(): Omit<DispatchReport, "id" | "createdAt" | "updatedAt"> {
  return {
    dispatchNo: "",
    unitCode: "",
    vehicleNo: "",
    crewName: "",
    dispatchedAt: "",
    arrivedSceneAt: "",
    departSceneAt: "",
    arrivedHospitalAt: "",
    sceneAddress: "",

    patientName: "",
    patientGender: "",
    patientAge: "",
    patientContact: "",
    patientAddress: "",

    chiefComplaint: "",
    reason: "",
    consciousness: "",
    ktas: 0,
    vitals: {
      bpSystolic: "",
      bpDiastolic: "",
      pulse: "",
      resp: "",
      spo2: "",
      temp: "",
      glucose: "",
    },
    treatments: [],
    treatmentMemo: "",

    destinationHospital: "",
    transportMemo: "",

    remarks: "",
  };
}

interface ReportsState {
  reports: DispatchReport[];
  upsert: (
    report: Omit<DispatchReport, "id" | "createdAt" | "updatedAt">,
    id?: string,
  ) => string;
  remove: (id: string) => void;
  clear: () => void;
  get: (id: string) => DispatchReport | undefined;
}

const MAX_REPORTS = 100;

export const useDispatchReportsStore = create<ReportsState>()(
  persist(
    (set, getState) => ({
      reports: [],
      upsert: (data, id) => {
        const now = Date.now();
        if (id) {
          set((s) => ({
            reports: s.reports.map((r) =>
              r.id === id ? { ...r, ...data, updatedAt: now } : r,
            ),
          }));
          return id;
        }
        const newId = `rpt-${now}-${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({
          reports: [
            { ...data, id: newId, createdAt: now, updatedAt: now },
            ...s.reports,
          ].slice(0, MAX_REPORTS),
        }));
        return newId;
      },
      remove: (id) =>
        set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),
      clear: () => set({ reports: [] }),
      get: (id) => getState().reports.find((r) => r.id === id),
    }),
    {
      name: "baroer-dispatch-reports",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
