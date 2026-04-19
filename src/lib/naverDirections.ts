/**
 * 네이버 지도 길안내 URL 빌더.
 *
 * - 모바일(iOS/Android) 에서는 네이버 지도 앱 URL Scheme `nmap://route/{mode}`
 *   을 사용해 출발지/도착지 좌표·이름을 모두 자동 입력한 상태로 앱 진입.
 *   앱이 설치되지 않은 경우를 대비해 호출부에서 `setTimeout` 으로 store URL 로
 *   폴백할 수 있도록 두 URL 모두 반환한다.
 * - 데스크탑(브라우저) 에서는 `https://map.naver.com/p/directions/...` 웹 URL
 *   로 새 탭을 연다.
 *
 * 응급실 안내 특성상 기본 `mode = "car"` (자동차).
 *
 * 참고: https://guide.ncloud-docs.com/docs/maps-url-scheme
 */
export type NaverRouteMode = "car" | "public" | "walk" | "bicycle";

export interface RoutePoint {
  lat: number;
  lng: number;
  /** 사용자 화면에 표시될 이름 (도착지 칸에 자동 입력됨) */
  name: string;
}

const APP_NAME = "app.baroer";

/** iOS/Android 여부 (브라우저 환경에서만 호출). SSR 시 false. */
export function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 데스크탑 / 모바일 웹 모두 동작하는 네이버 지도 웹 길안내 URL.
 *
 * 출발지/도착지 슬러그 형식: `{lng},{lat},{name},{place_id_or_dash},{place_type}`
 * place_id 와 type 을 모르므로 빈 값. 좌표만으로도 정상 동작.
 */
export function buildNaverDirectionsWebUrl(
  origin: RoutePoint,
  dest: RoutePoint,
  mode: NaverRouteMode = "car",
): string {
  const o = `${origin.lng},${origin.lat},${encodeURIComponent(origin.name)},,`;
  const d = `${dest.lng},${dest.lat},${encodeURIComponent(dest.name)},,`;
  return `https://map.naver.com/p/directions/${o}/${d}/-/${mode}`;
}

/**
 * 네이버 지도 앱 URL Scheme. 앱이 설치되어 있으면 즉시 앱으로 진입하면서
 * 출발지/도착지 좌표 + 이름이 미리 입력된 상태가 된다.
 */
export function buildNaverDirectionsAppUrl(
  origin: RoutePoint,
  dest: RoutePoint,
  mode: NaverRouteMode = "car",
): string {
  const params = new URLSearchParams({
    slat: String(origin.lat),
    slng: String(origin.lng),
    sname: origin.name,
    dlat: String(dest.lat),
    dlng: String(dest.lng),
    dname: dest.name,
    appname: APP_NAME,
  });
  return `nmap://route/${mode}?${params.toString()}`;
}

/**
 * 길안내 실행. 모바일이면 앱 우선, 미설치 시 웹으로 폴백.
 *  - 모바일: location.href = nmap:// → 앱 미설치면 visibility 전환이 일어나지 않음
 *    → 1.2 초 후 웹 URL 로 강제 이동.
 *  - 데스크탑: 새 탭으로 웹 URL.
 */
export function openNaverDirections(
  origin: RoutePoint,
  dest: RoutePoint,
  mode: NaverRouteMode = "car",
): void {
  const webUrl = buildNaverDirectionsWebUrl(origin, dest, mode);

  if (!isMobileUA()) {
    window.open(webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const appUrl = buildNaverDirectionsAppUrl(origin, dest, mode);

  // 앱이 설치되어 있으면 nmap:// 호출 직후 페이지가 background 로 전환된다.
  // 일정 시간 내 visibility 가 hidden 으로 바뀌지 않으면 = 앱 미설치 → 웹으로.
  let switched = false;
  const onHide = () => {
    if (document.visibilityState === "hidden") switched = true;
  };
  document.addEventListener("visibilitychange", onHide);

  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (!switched) {
      // 앱 진입 실패 → 웹 길안내로 이동 (같은 탭).
      window.location.href = webUrl;
    }
  }, 1200);
}
