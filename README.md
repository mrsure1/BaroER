# 바로응급실 (BaroER)

> 긴급할 때, 바로 찾는 가장 가까운 응급실 — 모바일 우선 Progressive Web App

실시간 공공데이터와 지도를 연동해, 환자 상태에 맞는 가장 가까운 응급실을 초 단위로 찾아 안내하는 **웹 애플리케이션**입니다. 브라우저에서 바로 접속해 쓸 수 있고, 홈 화면에 "앱"처럼 설치(PWA)할 수도 있습니다.

---

## 핵심 기능

1. **사용자 인증** — 이메일·Google·Kakao OAuth 로그인, 일반/구급대원 프로필
2. **환자 상태 입력** — 증상 체크리스트 + Web Speech API 기반 음성 입력(STT)
3. **KTAS 중증도 자동 판정** — 한국 응급환자 분류기준 기반 클라이언트 계산
4. **응급실 검색** — 현위치(`navigator.geolocation`) 기반 반경 내 응급실 조회
5. **지도/리스트 이중 표시** — 네이버 지도 JavaScript API 마커 + 카드 리스트
6. **길 안내 연동** — 카카오내비·T맵·네이버지도 URL 스킴으로 설치 앱 실행
7. **자동 전화 확인 (MVP 이후)** — 서버에서 Twilio 로 상위 3~5곳 동시 확인
8. **구급대원 출동 로그** — 타임스탬프 자동 기록 + PDF/Excel 다운로드

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | **Next.js 15 (App Router) + React 19** |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS + CSS Modules |
| 상태관리 | Zustand + TanStack Query |
| 인증·DB | Firebase (Auth + Firestore) |
| 지도 | 네이버 지도 JavaScript API v3 |
| 공공데이터 | 공공데이터포털 응급의료 API (서버사이드 프록시) |
| 음성 입력 | Web Speech API (브라우저 내장) |
| 로컬 저장 | IndexedDB (Dexie 또는 idb-keyval) + localStorage |
| 오프라인 | Service Worker (next-pwa) |
| 배포 | Vercel (HTTPS 자동) |

> Android 플레이스토어 배포가 필요해지면 **Bubblewrap** 으로 TWA (Trusted Web Activity) 래핑만 하면 됩니다. 네이티브 리라이트 불필요.

---

## 브라우저 지원

| 환경 | 버전 |
|------|------|
| Chrome / Edge | 110+ |
| Safari (iOS) | 15+ |
| Samsung Internet | 20+ |
| Firefox | 110+ |

모바일 우선(mobile‑first)으로 설계되어 있고, 데스크톱에서는 375px 목업 뷰를 기본으로 반응형 확장합니다.

---

## 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 실제 API 키 입력

# 3. 개발 서버 실행 (http://localhost:3000)
npm run dev

# 4. 프로덕션 빌드
npm run build
npm run start
```

> 위치 권한·마이크 권한·OAuth 리다이렉트는 **HTTPS** 에서만 동작합니다. `localhost` 는 예외적으로 허용되지만, LAN 내 실제 폰에서 테스트하려면 `next dev --experimental-https` 또는 Vercel Preview 배포를 사용하세요.

---

## 프로젝트 구조 (예정)

```
app/                       # Next.js App Router
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/
│   ├── page.tsx           # 메인 대시보드
│   ├── search/            # 환자 입력 + 지도/리스트
│   └── dispatch/          # 구급대원 출동 기록
├── api/                   # 서버사이드 API Route
│   ├── hospitals/         # 공공데이터 프록시 (serviceKey 서버 보호)
│   └── auth/              # NextAuth 또는 Firebase Admin
└── layout.tsx
src/
├── components/            # 재사용 UI 컴포넌트
├── hooks/                 # useGeolocation, useHospitalSearch 등
├── stores/                # Zustand 스토어
├── services/              # Firebase, 네이버지도, 공공데이터 래퍼
├── types/                 # TypeScript 공통 타입
└── utils/
public/
├── favicon.png
├── icon.png
├── logo.png
├── manifest.json          # PWA 매니페스트
└── sw.js                  # 서비스 워커 (next-pwa 생성)
docs/                      # 설계 문서
```

---

## 설계 문서

- [제품 요구사항 정의서 (PRD)](docs/PRD.md)
- [기능 명세서](docs/Feature_Specification.md)
- [화면 설계서](docs/Screen_Design.md)
- [DB 설계서](docs/DB_Design.md)
- [API 설계서](docs/API_Design.md)
- [API Key 만들기 가이드](docs/API_Key_만들기_가이드.md)
- [화면 목업 (HTML)](docs/screen_mockup.html)

---

## 환경 변수 주요 항목

`.env.example` 참고. 핵심만 요약:

| 변수 | 노출 위치 | 설명 |
|------|-----------|------|
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 클라이언트 | 네이버 지도 JS SDK |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 클라이언트 | 카카오 로그인 JS SDK |
| `NEXT_PUBLIC_FIREBASE_*` | 클라이언트 | Firebase Web SDK 설정 |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | 클라이언트 | Google OAuth |
| `DATA_SERVICE_KEY` | **서버 전용** | 공공데이터 API 키 (API Route 에서만 사용) |
| `NAVER_CLIENT_SECRET` | **서버 전용** | 네이버 Directions 5 API 호출용 |
| `KAKAO_REST_API_KEY` | **서버 전용** | OAuth 토큰 교환용 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | **서버 전용** | 서버사이드 Firebase Admin |

> `NEXT_PUBLIC_` 접두사가 붙은 변수만 브라우저에 노출됩니다. 공공데이터 서비스 키와 카카오 REST 키는 반드시 서버(API Route)에서만 사용하세요.

---

## 히스토리

- 2026-04-18 — React Native + Expo 구현을 접고 Next.js 기반 PWA로 전면 전환. 이전 RN 코드는 `archive/rn-expo-last` 브랜치에 보존.
