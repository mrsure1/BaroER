// 내비게이션 연동 서비스 - 외부 내비 앱으로 딥링크
import { Linking, Platform, Alert } from 'react-native';

// 지원 내비 앱 목록
export interface NaviApp {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const NAVI_APPS: NaviApp[] = [
  { id: 'kakao', name: '카카오내비', icon: '🗺️', color: '#FEE500' },
  { id: 'tmap', name: 'T맵', icon: '🚗', color: '#E53935' },
  { id: 'naver', name: '네이버지도', icon: '📍', color: '#1EC800' },
];

// 내비 앱 실행 (딥링크)
export async function openNavigation(
  naviId: string,
  destName: string,
  destLat: number,
  destLng: number,
  destAddress?: string,
): Promise<void> {
  let url: string;

  switch (naviId) {
    case 'kakao':
      // 좌표가 없으면 주소 검색으로 실행
      if (!destLat || !destLng) {
        const query = destAddress || destName;
        url = `kakaomap://search?q=${encodeURIComponent(query)}`;
      } else {
        // 카카오맵 길안내
        url = Platform.select({
          ios: `kakaomap://route?ep=${destLat},${destLng}&by=CAR`,
          android: `kakaomap://route?ep=${destLat},${destLng}&by=CAR`,
          default: `https://map.kakao.com/link/to/${encodeURIComponent(destName)},${destLat},${destLng}`,
        }) || '';
      }
      break;

    case 'tmap':
      // T맵 길안내
      url = `tmap://route?goalname=${encodeURIComponent(destName)}&goalx=${destLng}&goaly=${destLat}`;
      break;

    case 'naver':
      // 좌표 부재 시 네이버 검색 앱호출 (선택사항, 카카오와 유사하게 처리)
      if (!destLat || !destLng) {
        url = `nmap://search?query=${encodeURIComponent(destAddress || destName)}&appname=com.baroer`;
      } else {
        // 네이버지도 길안내
        url = Platform.select({
          ios: `nmap://route/car?dlat=${destLat}&dlng=${destLng}&dname=${encodeURIComponent(destName)}&appname=com.baroer`,
          android: `nmap://route/car?dlat=${destLat}&dlng=${destLng}&dname=${encodeURIComponent(destName)}&appname=com.baroer`,
          default: `https://map.naver.com/v5/directions/-/-/-/car?c=${destLng},${destLat},15,0,0,0,dh`,
        }) || '';
      }
      break;

    default:
      Alert.alert('오류', '지원하지 않는 내비 앱입니다.');
      return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // 앱 미설치 시 웹 버전으로 폴백
      const webUrl = getWebFallback(naviId, destName, destLat, destLng);
      if (webUrl) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert('앱 없음', '해당 내비 앱이 설치되어 있지 않습니다.');
      }
    }
  } catch (error) {
    console.error('내비 앱 실행 실패:', error);
    Alert.alert('오류', '길안내를 실행할 수 없습니다.');
  }
}

// 웹 폴백 URL
function getWebFallback(naviId: string, name: string, lat: number, lng: number): string | null {
  switch (naviId) {
    case 'kakao':
      return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    case 'naver':
      return `https://map.naver.com/v5/directions/-/-/-/car?c=${lng},${lat},15,0,0,0,dh`;
    case 'tmap':
      return `https://tmap.life/route?goalx=${lng}&goaly=${lat}&goalname=${encodeURIComponent(name)}`;
    default:
      return null;
  }
}
