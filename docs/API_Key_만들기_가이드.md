# API Key 만들기 가이드 (BaroER · Web App)

> 최초 작성: 2026-04-16  
> 개정: 2026-04-18 — **웹앱(Next.js PWA) 기준**으로 전면 갱신

이 문서는 **바로응급실(BaroER)** 웹앱 개발을 위해 필요한 외부 API 키의 발급 방법과 **웹 플랫폼 등록** 절차를 정리한 가이드입니다.

운영 환경에서는 반드시 HTTPS 도메인(예: `https://baroer.vercel.app`) 과 로컬 개발용 `http://localhost:3000` 을 각 콘솔에 **모두** 등록해야 합니다.

---

## 1. 공공데이터포털 (응급의료 실시간 데이터)

가장 핵심적인 데이터 소스입니다. **서비스 키는 브라우저에 절대 노출하지 말고**, Next.js API Route 에서만 사용합니다.

- URL: https://www.data.go.kr
- 신청 서비스: `국립중앙의료원_전국 응급의료기관 정보 조회 서비스`
- 활용 신청 후: 마이페이지 → 개발계정 → `일반 인증서(Encoding/Decoding)` 키 확인
- `.env.local` 설정:
  - `DATA_SERVICE_KEY` (서버 전용, `NEXT_PUBLIC_` 접두사 금지)
  - `DATA_ER_BASE_URL=http://apis.data.go.kr/B552657/ErmctInfoInqireService`
  - `DATA_ER_OPERATION=getEmrrmRltmUsefulSckbdInfoInqire`

구현 위치: `app/api/v1/hospitals/search/route.ts` 등에서 `process.env.DATA_SERVICE_KEY` 로 호출.

> 공공데이터포털은 별도의 "도메인 등록" 단계는 없지만, 일부 서비스는 `http` 엔드포인트입니다. Next.js 서버 측 fetch 는 제한이 없으나, 브라우저에서 직접 호출 시 Mixed Content 로 차단됩니다. 반드시 API Route 프록시를 거치세요.

---

## 2. 네이버 클라우드 플랫폼 (Maps / Directions)

웹앱의 기본 지도로 사용합니다. Maps JavaScript API v3 + Directions 5.

- URL: https://www.ncloud.com → Console → Services → **AI·NAVER API → Maps**
- 애플리케이션 등록 시 **"Web 서비스 URL"** 에 아래 도메인을 모두 추가:
  - `http://localhost:3000`
  - `https://baroer.vercel.app` (또는 운영 도메인)
  - Vercel Preview 배포 도메인 패턴(`https://*.vercel.app`) — 필요 시
- 서비스 이용 신청 항목:
  - Web Dynamic Map (JavaScript) — 필수
  - Directions 5 — 경로/ETA
  - Geocoding / Reverse Geocoding — 필요 시
- `.env.local` 설정:
  - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (JS SDK 로드용, 클라이언트 노출)
  - `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET` (서버 전용 — Directions/Geocoding 호출)

> Maps JS SDK 는 `<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=..."></script>` 로 로드됩니다. "Web 서비스 URL" 에 등록되지 않은 도메인에서 로드하면 "인증 실패" 오버레이가 표시되므로 가장 흔한 실수 지점입니다.

---

## 3. Kakao Developers (카카오 로그인)

웹앱에서는 카카오 **로그인만** 기본으로 사용합니다. 지도는 네이버를 우선 사용하되, 필요 시 카카오맵 JS SDK 도 병행 가능.

- URL: https://developers.kakao.com → 내 애플리케이션 → 새 앱 등록
- 플랫폼 설정:
  - **Web 플랫폼** 추가 → 사이트 도메인에 아래 모두 등록
    - `http://localhost:3000`
    - `https://baroer.vercel.app`
- 카카오 로그인 활성화:
  - 활성화 설정 → **사용** ON
  - OpenID Connect 사용 → 필요 시 ON
  - Redirect URI:
    - `http://localhost:3000/api/v1/auth/kakao/callback`
    - `https://baroer.vercel.app/api/v1/auth/kakao/callback`
  - 동의 항목: 프로필 정보(필수), 카카오계정(이메일) — 필요 범위만
- `.env.local` 설정:
  - `NEXT_PUBLIC_KAKAO_JS_KEY` (클라이언트 — Kakao JS SDK 초기화)
  - `KAKAO_REST_API_KEY` (**서버 전용** — OAuth 토큰 교환)
  - `KAKAO_CLIENT_SECRET` (**서버 전용** — 콘솔에서 Client Secret 활성화 후 발급)

> 카카오맵을 꼭 써야 한다면: 내 애플리케이션 → 제품 설정 → 카카오맵 → **사용 ON**. 비즈니스 정보 심사가 필요할 수 있으며, 영업일 3~5일 소요됩니다. 웹앱은 네이버 지도가 기본이므로 MVP 에서는 이 단계를 건너뛰어도 됩니다.

---

## 4. Google Cloud / Firebase (Google 로그인 + Auth + Firestore)

### 4.1 Firebase 프로젝트

- URL: https://console.firebase.google.com
- 프로젝트: 기존 `baroer-2da46` 사용
- **웹 앱 등록 필수** — 프로젝트 설정 → 내 앱 → `</>` 웹 아이콘 → 앱 등록 (Hosting 은 선택)
  - 등록 후 표시되는 `firebaseConfig` 값을 `.env.local` 의 `NEXT_PUBLIC_FIREBASE_*` 에 복사
- 사용 서비스:
  - **Authentication** → 로그인 방법
    - 이메일/비밀번호 ✅
    - Google ✅
    - (Kakao 는 Firebase 에서 직접 제공되지 않아, 커스텀 토큰 흐름으로 우회 구현)
  - **Cloud Firestore** → `users`, `patient_records`, `hospitals`, `dispatch_logs`, `call_logs`, `auth_sessions`
  - **Firebase Admin SDK** (서버) → 서비스 계정 키 발급 → `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_CLIENT_EMAIL` 등

### 4.2 Google OAuth (웹 클라이언트 ID)

- URL: https://console.cloud.google.com → APIs & Services → Credentials
- **"승인된 자바스크립트 원본"** 에 등록:
  - `http://localhost:3000`
  - `https://baroer.vercel.app`
- **"승인된 리디렉션 URI"** 에 등록:
  - `http://localhost:3000/__/auth/handler` (Firebase 기본 핸들러)
  - `https://baroer-2da46.firebaseapp.com/__/auth/handler`
- `.env.local`:
  - `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` (클라이언트)

> 웹앱은 Firebase `signInWithPopup(GoogleAuthProvider)` 또는 `signInWithRedirect` 로 처리됩니다. 모바일 웹에서는 팝업 차단 대응을 위해 `signInWithRedirect` 권장.

### 4.3 (삭제 대상) Android/iOS 클라이언트 ID

이전 네이티브 빌드용 Android/iOS OAuth 클라이언트 ID 및 SHA-1 지문은 **웹앱 전환 후 불필요**합니다. 추후 Bubblewrap 으로 TWA 패키징할 때 다시 필요해질 수 있으니, 콘솔에 남겨두되 `.env.local` 에서는 제거하거나 주석 처리합니다.

---

## 5. (선택) Twilio — 자동 전화 확인 기능

- URL: https://www.twilio.com/console
- 필요: Account SID, Auth Token, 한국 발신 번호(또는 Programmable Voice Trial)
- `.env.local`:
  - `TWILIO_ACCOUNT_SID` (서버 전용)
  - `TWILIO_AUTH_TOKEN` (서버 전용)
  - `TWILIO_FROM_NUMBER` (서버 전용)
- 구현: `app/api/v1/calls/auto-check/route.ts` 에서 `twilio` SDK 호출

> 자동 전화 확인은 MVP 이후 기능이므로, 초기 개발 단계에서는 등록을 미뤄도 됩니다.

---

## 6. 변수명 규칙 요약

| 접두사 | 노출 범위 | 예시 |
|--------|-----------|------|
| `NEXT_PUBLIC_*` | **브라우저에 노출됨** — JS SDK 로드, 공개 설정값에만 사용 | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` |
| (접두사 없음) | **서버 전용** — API Route, Server Action 에서만 접근 가능 | `DATA_SERVICE_KEY`, `NAVER_CLIENT_SECRET`, `KAKAO_REST_API_KEY`, `FIREBASE_ADMIN_PRIVATE_KEY` |

**원칙:** 서비스 시크릿/REST 키/Admin 키는 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 한 번 커밋하면 Git 히스토리에 영구히 노출됩니다.

---

## 7. 배포 환경 (Vercel) 에 환경 변수 등록

1. Vercel 프로젝트 대시보드 → **Settings → Environment Variables**
2. `.env.local` 의 모든 키를 같은 이름으로 등록
3. 각 변수의 적용 환경 선택: `Production` / `Preview` / `Development`
4. Preview 배포마다 다른 도메인이 발급되므로, Maps·OAuth 콘솔의 도메인 등록에 와일드카드 또는 `*.vercel.app` 을 포함

---

> `.env.local` 은 `.gitignore` 에 포함되어 커밋되지 않습니다. 팀원과 공유할 때는 1Password / Bitwarden 등 비밀 관리 도구를 사용하세요.
