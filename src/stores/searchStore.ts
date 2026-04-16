// 검색 상태 관리 스토어 (Zustand) — Phase 3: API 연동 추가
import { create } from 'zustand';
import { SymptomCategory, Gender, AgeGroup, ConsciousnessLevel, Hospital } from '@/src/types';
import { fetchEmergencyBeds, STAGE1_CODES, fetchSeriousDiseaseStatus } from '@/src/services/emergency';
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
      // 주소에서 시/도(STAGE1), 시/군/구(STAGE2) 추출 시도
      let stage1, stage2;
      if (loc.address) {
        const parts = loc.address.split(' ');
        if (parts.length >= 1) {
          const rawStage1 = parts[0];
          // "서울" -> "서울특별시" 등으로 변환 시도
          stage1 = STAGE1_CODES[rawStage1] || rawStage1;
        }
        // 반경이 15km를 초과하면 stage2(구 단위) 필터를 제거하여 검색 범위를 넓힘
        const radius = get().searchRadius;
        if (parts.length >= 2 && radius <= 15) {
          stage2 = parts[1];
        }
        
        console.log(`[Search Metadata] Radius: ${radius}km, Region Filter: ${stage1} ${stage2 || '(All districts)'}`);
      }

      // 병상 정보와 중증 질환 정보 병렬 호출
      const [bedsResults, seriousResults] = await Promise.all([
        fetchEmergencyBeds(loc.latitude, loc.longitude, stage1, stage2),
        fetchSeriousDiseaseStatus(stage1, stage2)
      ]);

      // 데이터 병합 (hpid 기준)
      const mergedResults = bedsResults.map(hospital => {
        const seriousInfo = seriousResults.find(s => s.hpid === hospital.id);
        if (seriousInfo) {
          // 중증 질환 필드(HV1~HV12)만 추출하여 맵 생성
          const seriousStatus: Record<string, 'Y' | 'N'> = {};
          Object.entries(seriousInfo).forEach(([key, value]) => {
            if (key.startsWith('hv') && (value === 'Y' || value === 'N')) {
              seriousStatus[key] = value as 'Y' | 'N';
            }
          });

          return {
            ...hospital,
            seriousStatus,
            realtimeMsg: seriousInfo.msg || undefined,
          };
        }
        return hospital;
      });

      // 검색 반경 필터링
      const radius = get().searchRadius;
      const filtered = mergedResults.filter(
        (h) => h.distanceKm === undefined || h.distanceKm <= radius
      );

      console.log(`[Search Result] Found ${results.length} hospitals, Filtered (radius ${radius}km): ${filtered.length}`);
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
