/**
 * 외부 내비 / 지도 앱 통합 launcher.
 *
 * 웹앱은 기기에 어떤 내비 앱이 설치되어 있는지 직접 조회할 수 없으므로
 * 한국에서 실제로 가장 많이 쓰이는 4종(네이버 지도 / 카카오맵 / T map / 구글 지도)
 * 을 모두 노출하고, 사용자가 한 번 고른 앱을 기기 로컬(localStorage)에 저장해
 * 다음 길안내부터 그 앱으로 바로 진입한다. 설정에서 언제든 초기화·변경 가능.
 *
 * 각 앱 deep link 명세 출처:
 *  - 네이버: https://guide.ncloud-docs.com/docs/maps-url-scheme
 *  - 카카오맵: https://apis.map.kakao.com/web/guide/#bigmapsubject_url
 *  - 티맵:    https://tmapmobility.com/api/api_url_v2.html
 *  - 구글:    https://developers.google.com/maps/documentation/urls/get-started
 */
export type NavAppId = "naver" | "kakao" | "tmap" | "google";

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

export interface NavAppDef {
  id: NavAppId;
  label: string;
  /** 모달 타일에 들어갈 짧은 식별 문자열 (이모지 사용 X — 한두 글자) */
  badge: string;
  /** 타일 배경 / 글자색 (Tailwind 클래스) — 각 브랜드 색을 차분히 표현 */
  bg: string;
  fg: string;
  /** 앱 deep link. 미지원/미구현 앱이면 null 반환. */
  appUrl: (origin: RoutePoint, dest: RoutePoint) => string | null;
  /** 데스크탑 또는 앱 미설치 폴백 웹 URL. */
  webUrl: (origin: RoutePoint, dest: RoutePoint) => string;
  /** 앱이 끝내 안 열렸을 때 안내할 스토어 URL (선택). */
  storeUrl?: { ios: string; android: string };
}

const APP_NAME = "app.baroer";

function buildNaverApp(o: RoutePoint, d: RoutePoint): string {
  const params = new URLSearchParams({
    slat: String(o.lat),
    slng: String(o.lng),
    sname: o.name,
    dlat: String(d.lat),
    dlng: String(d.lng),
    dname: d.name,
    appname: APP_NAME,
  });
  return `nmap://route/car?${params.toString()}`;
}

function buildNaverWeb(o: RoutePoint, d: RoutePoint): string {
  const os = `${o.lng},${o.lat},${encodeURIComponent(o.name)},,`;
  const ds = `${d.lng},${d.lat},${encodeURIComponent(d.name)},,`;
  return `https://map.naver.com/p/directions/${os}/${ds}/-/car`;
}

function buildKakaoApp(o: RoutePoint, d: RoutePoint): string {
  // sp/ep 모두 "lat,lng" 순서. by=CAR (자동차).
  return `kakaomap://route?sp=${o.lat},${o.lng}&ep=${d.lat},${d.lng}&by=CAR`;
}

function buildKakaoWeb(_o: RoutePoint, d: RoutePoint): string {
  // 카카오맵 웹은 도착지 기준 길찾기 링크가 가장 안정적.
  return `https://map.kakao.com/link/to/${encodeURIComponent(d.name)},${d.lat},${d.lng}`;
}

function buildTmapApp(_o: RoutePoint, d: RoutePoint): string {
  // T map 은 출발지를 별도로 지정하지 않으면 현재 위치를 자동 사용.
  const params = new URLSearchParams({
    goalname: d.name,
    goalx: String(d.lng),
    goaly: String(d.lat),
  });
  return `tmap://route?${params.toString()}`;
}

function buildTmapWeb(_o: RoutePoint, d: RoutePoint): string {
  // T map 은 별도 웹 길안내가 없어 카카오맵 웹으로 폴백 (좌표 기반 도착지 표시).
  return `https://map.kakao.com/link/to/${encodeURIComponent(d.name)},${d.lat},${d.lng}`;
}

function buildGoogleApp(_o: RoutePoint, d: RoutePoint): string | null {
  // iOS 전용 deep link. Android 는 universal web URL 만으로 앱이 자동 열리므로 null.
  if (typeof navigator === "undefined") return null;
  if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) return null;
  return `comgooglemaps://?daddr=${d.lat},${d.lng}&directionsmode=driving`;
}

function buildGoogleWeb(_o: RoutePoint, d: RoutePoint): string {
  // universal directions URL — 모바일에서 구글지도 앱 설치 시 자동으로 앱으로 진입.
  return `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving`;
}

export const NAV_APPS: NavAppDef[] = [
  {
    id: "naver",
    label: "네이버 지도",
    badge: "N",
    bg: "bg-[#03C75A]",
    fg: "text-white",
    appUrl: buildNaverApp,
    webUrl: buildNaverWeb,
    storeUrl: {
      ios: "https://apps.apple.com/kr/app/id311867728",
      android: "https://play.google.com/store/apps/details?id=com.nhn.android.nmap",
    },
  },
  {
    id: "kakao",
    label: "카카오맵",
    badge: "K",
    bg: "bg-[#FFE812]",
    fg: "text-[#3C1E1E]",
    appUrl: buildKakaoApp,
    webUrl: buildKakaoWeb,
    storeUrl: {
      ios: "https://apps.apple.com/kr/app/id304608425",
      android: "https://play.google.com/store/apps/details?id=net.daum.android.map",
    },
  },
  {
    id: "tmap",
    label: "T map",
    badge: "T",
    bg: "bg-[#0064FF]",
    fg: "text-white",
    appUrl: buildTmapApp,
    webUrl: buildTmapWeb,
    storeUrl: {
      ios: "https://apps.apple.com/kr/app/id431589174",
      android: "https://play.google.com/store/apps/details?id=com.skt.tmap.ku",
    },
  },
  {
    id: "google",
    label: "구글 지도",
    badge: "G",
    bg: "bg-white ring-1 ring-border",
    fg: "text-[#4285F4]",
    appUrl: buildGoogleApp,
    webUrl: buildGoogleWeb,
  },
];

export function getNavApp(id: NavAppId | null | undefined): NavAppDef | undefined {
  if (!id) return undefined;
  return NAV_APPS.find((a) => a.id === id);
}

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 선택된 내비 앱으로 길안내를 시도한다.
 *  - 데스크탑: 웹 URL 을 새 탭으로 연다.
 *  - 모바일: deep link → 1.2 초 내 페이지가 background 로 안 가면 = 앱 미설치
 *           → 웹 URL (universal link) 로 폴백.
 *  - 구글지도(Android) 처럼 deep link 가 없는 경우는 웹 URL 만 사용.
 */
export function launchNavigation(
  app: NavAppDef,
  origin: RoutePoint,
  dest: RoutePoint,
): void {
  const webUrl = app.webUrl(origin, dest);

  if (!isMobileUA()) {
    window.open(webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const appUrl = app.appUrl(origin, dest);

  if (!appUrl) {
    // deep link 가 없는 케이스 — universal web URL 만으로 진입 (구글지도 Android 등)
    window.location.href = webUrl;
    return;
  }

  let switched = false;
  const onHide = () => {
    if (document.visibilityState === "hidden") switched = true;
  };
  document.addEventListener("visibilitychange", onHide);

  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (switched) return;
    // 앱 진입 실패: 웹 URL 로 폴백 (있으면 universal, 없으면 스토어).
    if (webUrl) {
      window.location.href = webUrl;
    } else if (app.storeUrl) {
      window.location.href = isIOS() ? app.storeUrl.ios : app.storeUrl.android;
    }
  }, 1200);
}
