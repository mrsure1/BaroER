import axios from 'axios';

/**
 * 네이버 지도 API 서비스 (Directions 5 — trafast: 실시간 교통 반영)
 */
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET;

export type NaverDrivingRoute = {
  distanceKm: number;
  /** 차량 이동 예상 시간(분), 교통 반영 */
  etaMin: number;
  durationMs: number;
};

/**
 * 두 지점 간 자동차 경로 (교통 반영). 키 미설정 시 null.
 */
export const getNaverDrivingRoute = async (
  startLat: number,
  startLng: number,
  goalLat: number,
  goalLng: number
): Promise<NaverDrivingRoute | null> => {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return null;
  }
  try {
    const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving', {
      params: {
        start: `${startLng},${startLat}`,
        goal: `${goalLng},${goalLat}`,
        option: 'trafast',
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
      },
      timeout: 12000,
    });

    if (response.data?.code !== 0 || !response.data?.route?.trafast?.[0]) {
      return null;
    }
    const route = response.data.route.trafast[0];
    const distanceM = route.summary?.distance ?? 0;
    const durationMs = route.summary?.duration ?? 0;
    return {
      distanceKm: distanceM / 1000,
      etaMin: Math.max(1, Math.round(durationMs / 60000)),
      durationMs,
    };
  } catch (error) {
    if (__DEV__) console.warn('[getNaverDrivingRoute]', error);
    return null;
  }
};

/** @deprecated getNaverDrivingRoute 사용 */
export const getNaverRoute = getNaverDrivingRoute;

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 */
export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc', {
      params: {
        coords: `${lng},${lat}`,
        output: 'json',
        orders: 'addr,admcode,roadaddr',
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
      },
    });

    const results = response.data.results;
    if (results && results.length > 0) {
      const addr = results[0].region;
      return `${addr.area1.name} ${addr.area2.name} ${addr.area3.name}`;
    }
    return '위치 정보 없음';
  } catch (error) {
    console.error('[reverseGeocode Error]:', error);
    return '위치 정보 오류';
  }
};
