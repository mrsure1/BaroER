// 검색 상태 관리 스토어 (Zustand) — Phase 3: API 연동 추가
import { create } from 'zustand';
import { SymptomCategory, Gender, AgeGroup, ConsciousnessLevel, Hospital } from '@/src/types';
import { fetchEmergencyBeds } from '@/src/services/emergency';
import { getCurrentLocation, DEFAULT_LOCATION, UserLocation } from '@/src/services/location';
import { calculateKTAS } from '@/src/services/triage';

interface SearchState {
  // 환자 입력 상태
  selectedSymptoms: SymptomCategory[];
  symptomDetail: string;
  patientGender: Gender | null;
  patientAgeGroup: AgeGroup | null;
  consciousnessLevel: ConsciousnessLevel | null;

  // 위치
  userLocation: UserLocation | null;
  locationLoading: boolean;

  // 검색 결과
  hospitals: Hospital[];
  searchRadius: number;
  isSearching: boolean;
  searchError: string | null;
  severityScore: number | null; // 중증도 점수 추가

  // 자동전화 확인
  autoCallEnabled: boolean;

  // 환자 입력 액션
  toggleSymptom: (symptom: SymptomCategory) => void;
  setSymptomDetail: (detail: string) => void;
  setPatientGender: (gender: Gender) => void;
  setPatientAgeGroup: (ageGroup: AgeGroup) => void;
  setConsciousnessLevel: (level: ConsciousnessLevel) => void;

  // 위치 액션
  fetchLocation: () => Promise<void>;

  // 검색 액션
  searchHospitals: () => Promise<void>;
  setSearchRadius: (radius: number) => void;
  setAutoCallEnabled: (enabled: boolean) => void;

  // 초기화
  resetInput: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // 초기 상태
  selectedSymptoms: [],
  symptomDetail: '',
  patientGender: null,
  patientAgeGroup: null,
  consciousnessLevel: null,
  userLocation: null,
  locationLoading: false,
  hospitals: [],
  searchRadius: 10,
  isSearching: false,
  searchError: null,
  severityScore: null,
  autoCallEnabled: false,

  // 증상 토글 (선택/해제)
  toggleSymptom: (symptom: SymptomCategory) => {
    const current = get().selectedSymptoms;
    const exists = current.includes(symptom);
    set({
      selectedSymptoms: exists
        ? current.filter((s) => s !== symptom)
        : [...current, symptom],
    });
  },

  setSymptomDetail: (detail) => set({ symptomDetail: detail }),
  setPatientGender: (gender) => set({ patientGender: gender }),
  setPatientAgeGroup: (ageGroup) => set({ patientAgeGroup: ageGroup }),
  setConsciousnessLevel: (level) => set({ consciousnessLevel: level }),

  // 현재 위치 가져오기
  fetchLocation: async () => {
    set({ locationLoading: true });
    const location = await getCurrentLocation();
    set({
      userLocation: location || DEFAULT_LOCATION,
      locationLoading: false,
    });
  },

  // 응급실 검색 실행
  searchHospitals: async () => {
    const { userLocation, selectedSymptoms, consciousnessLevel, patientAgeGroup } = get();
    const loc = userLocation || DEFAULT_LOCATION;

    // 1. 중증도 우선 계산
    if (selectedSymptoms.length > 0 && consciousnessLevel && patientAgeGroup) {
      const score = calculateKTAS(selectedSymptoms, consciousnessLevel, patientAgeGroup);
      set({ severityScore: score });
    }

    set({ isSearching: true, searchError: null });

    try {
      const results = await fetchEmergencyBeds(loc.latitude, loc.longitude);

      // 검색 반경 필터링
      const radius = get().searchRadius;
      const filtered = results.filter(
        (h) => (h.distanceKm ?? 999) <= radius
      );

      set({ hospitals: filtered, isSearching: false });
    } catch (error) {
      console.error('검색 실패:', error);
      set({
        isSearching: false,
        searchError: '응급실 정보를 불러오지 못했습니다. 다시 시도해주세요.',
      });
    }
  },

  setSearchRadius: (radius) => set({ searchRadius: radius }),
  setAutoCallEnabled: (enabled) => set({ autoCallEnabled: enabled }),

  // 입력 초기화
  resetInput: () =>
    set({
      selectedSymptoms: [],
      symptomDetail: '',
      patientGender: null,
      patientAgeGroup: null,
      consciousnessLevel: null,
    }),
}));
