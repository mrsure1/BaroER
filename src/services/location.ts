// 위치 서비스 - 현재 위치 가져오기 + 주소 역지오코딩
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

// 위치 권한 요청 + 현재 위치 가져오기
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    // 권한 요청
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('위치 권한이 거부되었습니다.');
      return null;
    }

    // 현재 위치 가져오기
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const result: UserLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // 역지오코딩 (좌표 → 주소)
    try {
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (addr) {
        result.address = [addr.region, addr.city, addr.street].filter(Boolean).join(' ');
      }
    } catch {
      // 역지오코딩 실패 시 무시 (좌표만 사용)
    }

    return result;
  } catch (error) {
    console.error('위치 가져오기 실패:', error);
    return null;
  }
}

// 기본 위치 (서울 중심) - 위치 권한 거부 시 폴백
export const DEFAULT_LOCATION: UserLocation = {
  latitude: 37.5665,
  longitude: 126.9780,
  address: '서울특별시 중구',
};
