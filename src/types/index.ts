// 바로응급실 TypeScript 타입 정의

// 사용자 유형
export type UserType = 'GENERAL' | 'PARAMEDIC';

// 사용자 프로필
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  userType: UserType;
  orgCode?: string;  // 구급대원 소속기관 코드
  isAdmin?: boolean; // 관리자 권한 여부
  createdAt: string;
}

// 환자 성별
export type Gender = 'MALE' | 'FEMALE';

// 환자 연령대
export type AgeGroup = 'INFANT' | 'CHILD' | 'ADULT' | 'ELDERLY';

// 의식 수준
export type ConsciousnessLevel = 'ALERT' | 'DROWSY' | 'UNRESPONSIVE';

// 증상 카테고리
export type SymptomCategory =
  | 'HEADACHE'
  | 'CHEST_PAIN'
  | 'TRAUMA'
  | 'DYSPNEA'
  | 'ABDOMINAL'
  | 'OTHER';

// 환자 상태 입력 데이터
export interface PatientRecord {
  id?: string;
  symptomCategories: SymptomCategory[];
  symptomDetail?: string;
  voiceInputRaw?: string;
  patientGender: Gender;
  patientAgeGroup: AgeGroup;
  consciousnessLevel: ConsciousnessLevel;
  severityScore?: number;
  searchLat?: number;
  searchLng?: number;
  createdAt?: string;
}

// 응급실 수용 상태
export type HospitalStatus = 'AVAILABLE' | 'BUSY' | 'FULL';

// 응급실 정보
export interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  totalBeds: number;
  availableBeds: number;
  hasDoctorOnDuty: boolean;
  status: HospitalStatus;
  distanceKm?: number;
  etaMin?: number;
  lastUpdated: string;
}

// 출동 기록 상태
export type DispatchStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// 출동 기록 (구급대원 전용)
export interface DispatchLog {
  id: string;
  userId: string;
  dispatchCode: string;
  patientRecord?: PatientRecord;
  hospital?: Hospital;
  dispatchStartAt: string;
  patientContactAt?: string;
  hospitalDepartAt?: string;
  hospitalArriveAt?: string;
  situationEndAt?: string;
  totalDurationMin?: number;
  memo?: string;
  status: DispatchStatus;
}
