import { create } from 'zustand';
import { AgeGroup, ConsciousnessLevel, Gender, Hospital, SymptomCategory } from '../types';
import { searchNearbyHospitals } from '../services/emergencySearch';
import * as Location from 'expo-location';

interface SearchFilters {
  query: string;
  symptoms: SymptomCategory[];
  onlyAvailable: boolean;
  maxDistance: number;
  patientGender: Gender;
  patientAgeGroup: AgeGroup;
  consciousnessLevel: ConsciousnessLevel;
}

interface UserLocationCoords {
  latitude: number;
  longitude: number;
}

interface SearchState {
  hospitals: Hospital[];
  isLoading: boolean;
  searchError: string | null;
  filters: SearchFilters;
  lastUpdated: string | null;
  userLocation: UserLocationCoords | null;

  setFilters: (filters: Partial<SearchFilters>) => void;
  setUserLocation: (loc: UserLocationCoords | null) => void;
  searchHospitals: () => Promise<void>;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  hospitals: [],
  isLoading: false,
  searchError: null,
  filters: {
    query: '',
    symptoms: [],
    onlyAvailable: false,
    maxDistance: 10,
    patientGender: 'MALE',
    patientAgeGroup: 'ADULT',
    consciousnessLevel: 'ALERT',
  },
  lastUpdated: null,
  userLocation: null,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setUserLocation: (loc) => set({ userLocation: loc }),

  searchHospitals: async () => {
    set({ isLoading: true, searchError: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('위치 권한이 거부되었습니다.');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      set({
        userLocation: { latitude, longitude },
      });

      const results = await searchNearbyHospitals(latitude, longitude, 25);

      set({
        hospitals: results,
        isLoading: false,
        lastUpdated: new Date().toLocaleString('ko-KR'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.';
      set({
        isLoading: false,
        searchError: message,
      });
    }
  },

  resetSearch: () =>
    set({
      hospitals: [],
      userLocation: null,
      filters: {
        query: '',
        symptoms: [],
        onlyAvailable: false,
        maxDistance: 10,
        patientGender: 'MALE',
        patientAgeGroup: 'ADULT',
        consciousnessLevel: 'ALERT',
      },
      lastUpdated: null,
    }),
}));
