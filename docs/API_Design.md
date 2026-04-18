# 바로응급실 (BaroER) - API 설계서

> 문서 버전: 2.0 (Web App)  
> 최초 작성일: 2026-04-16  
> 개정일: 2026-04-18 — Next.js API Route 기반, 웹 클라이언트용으로 재정의  
> 작성자: MrSure

---

## 1. API 개요

| 항목 | 내용 |
|------|------|
| Base URL (운영) | `https://baroer.vercel.app/api/v1` (또는 커스텀 도메인) |
| Base URL (로컬) | `http://localhost:3000/api/v1` |
| 프로토콜 | HTTPS (TLS 1.3) — Vercel 자동 적용 |
| 구현 | **Next.js App Router API Routes** (`app/api/v1/**/route.ts`) |
| 인증 방식 | Firebase ID Token (HTTP-only 쿠키) — 서버에서 Admin SDK 로 검증 |
| 세션 갱신 | Firebase Auth 의 자동 토큰 갱신, 쿠키는 만료 시 재발급 |
| 응답 형식 | JSON |
| 문자 인코딩 | UTF-8 |
| API 버전 관리 | URL 경로 (`/api/v1/`, `/api/v2/`) |

### 공통 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-16T14:00:00+09:00"
}
```

### 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH-001",
    "message": "이메일 형식이 올바르지 않습니다."
  },
  "timestamp": "2026-04-16T14:00:00+09:00"
}
```

---

## 2. 인증 API (Auth)

> **웹앱 구현 메모** — 로그인/회원가입은 브라우저에서 Firebase Web SDK 로 직접 수행하고, ID Token 을 `/api/v1/auth/session` 에 POST 해 HTTP-only 쿠키로 교환합니다. 아래 엔드포인트 명세는 참고용이며, 실제 클라이언트가 먼저 Firebase 로 인증 후 서버 세션 쿠키를 발급받는 구조입니다.
>
> ```
> [브라우저] Firebase Web SDK → ID Token
>      └→ POST /api/v1/auth/session  (ID Token)
>         └→ [서버] Firebase Admin 으로 검증 → Set-Cookie (HTTP-only)
> ```

### 2.1 회원가입

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /auth/register` |
| 인증 | 불필요 |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✅ | 이메일 |
| password | string | ✅ | 비밀번호 (8자 이상) |
| nickname | string | ✅ | 닉네임 (2~20자) |
| userType | string | ✅ | `GENERAL` / `PARAMEDIC` |
| orgCode | string | 조건부 | 구급대원 시 필수 |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "userId": "uuid-...",
    "email": "user@example.com",
    "nickname": "응급대원김",
    "userType": "PARAMEDIC",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

---

### 2.2 로그인

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /auth/login` |
| 인증 | 불필요 |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✅ | 이메일 |
| password | string | ✅ | 비밀번호 |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "uuid-...",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "userType": "GENERAL",
    "expiresIn": 3600
  }
}
```

---

### 2.3 토큰 갱신

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /auth/refresh` |
| 인증 | 불필요 (refreshToken 사용) |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| refreshToken | string | ✅ | 리프레시 토큰 |

---

### 2.4 로그아웃

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /auth/logout` |
| 인증 | Bearer Token 필수 |

---

## 3. 환자 기록 API (Patient)

### 3.1 환자 상태 저장

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /patient/record` |
| 인증 | Bearer Token 필수 |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| symptomCategories | string[] | ✅ | 증상 카테고리 배열 |
| symptomDetail | string | ❌ | 상세 증상 |
| voiceInputRaw | string | ❌ | 음성 인식 원본 |
| patientGender | string | ✅ | `MALE` / `FEMALE` |
| patientAgeGroup | string | ✅ | `INFANT`/`CHILD`/`ADULT`/`ELDERLY` |
| consciousnessLevel | string | ✅ | `ALERT`/`DROWSY`/`UNRESPONSIVE` |
| searchLat | number | ✅ | 검색 위치 위도 |
| searchLng | number | ✅ | 검색 위치 경도 |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "recordId": "uuid-...",
    "severityScore": 3,
    "symptomCategories": ["CHEST_PAIN", "DYSPNEA"],
    "createdAt": "2026-04-16T14:00:00+09:00"
  }
}
```

---

### 3.2 중증도 분석

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /patient/severity` |
| 인증 | Bearer Token 필수 |

**Request Body:** (환자 상태 저장과 동일 필드)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "severityScore": 3,
    "severityLabel": "긴급",
    "recommendedAction": "즉시 응급실 이송 필요"
  }
}
```

---

## 4. 응급실 검색 API (Hospitals)

### 4.1 응급실 검색 (위치 기반)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /hospitals/search` |
| 인증 | Bearer Token 필수 |

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| lat | number | ✅ | 현재 위도 |
| lng | number | ✅ | 현재 경도 |
| radius | integer | ❌ | 검색 반경 km (기본: 10) |
| severity | integer | ❌ | 중증도 필터 (1~5) |
| sortBy | string | ❌ | 정렬: `DISTANCE`/`ETA`/`BEDS` (기본: DISTANCE) |
| limit | integer | ❌ | 결과 수 (기본: 20, 최대: 50) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalCount": 8,
    "hospitals": [
      {
        "id": "uuid-...",
        "name": "A응급의료센터",
        "address": "서울시 강남구 ...",
        "lat": 37.5012,
        "lng": 127.0396,
        "phone": "02-1234-5678",
        "totalBeds": 10,
        "availableBeds": 3,
        "hasDoctorOnDuty": true,
        "status": "AVAILABLE",
        "distanceKm": 1.2,
        "etaMin": 5,
        "erType": "권역응급의료센터",
        "lastUpdated": "2026-04-16T13:55:00+09:00"
      }
    ]
  }
}
```

---

### 4.2 병원 상세 조회

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /hospitals/{hospitalId}` |
| 인증 | Bearer Token 필수 |

---

### 4.3 병원 실시간 상태 갱신

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /hospitals/{hospitalId}/status` |
| 인증 | Bearer Token 필수 |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "hospitalId": "uuid-...",
    "status": "BUSY",
    "availableBeds": 1,
    "hasDoctorOnDuty": true,
    "lastUpdated": "2026-04-16T14:00:00+09:00"
  }
}
```

---

## 5. 자동 전화 확인 API (Calls)

### 5.1 자동전화 시작

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /calls/auto-check` |
| 인증 | Bearer Token 필수 |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| hospitalIds | string[] | ✅ | 대상 병원 ID (3~5개) |

**Response (202):**

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-...",
    "status": "IN_PROGRESS",
    "targetCount": 4,
    "websocketUrl": "wss://api.baroer.com/ws/calls/uuid-..."
  }
}
```

---

### 5.2 진행 상태 조회 (WebSocket)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `WSS /ws/calls/{sessionId}` |
| 프로토콜 | WebSocket |

**실시간 메시지 형식:**

```json
{
  "type": "CALL_STATUS_UPDATE",
  "data": {
    "hospitalId": "uuid-...",
    "hospitalName": "A응급의료센터",
    "callStatus": "COMPLETED",
    "availability": "AVAILABLE",
    "confirmedAt": "2026-04-16T14:02:30+09:00"
  }
}
```

---

### 5.3 자동전화 중단

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `DELETE /calls/{sessionId}` |
| 인증 | Bearer Token 필수 |

---

## 6. 출동 기록 API (Dispatch) — 구급대원 전용

### 6.1 출동 시작

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /dispatch/start` |
| 인증 | Bearer Token (구급대원만) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "dispatchId": "uuid-...",
    "dispatchCode": "2026-0416-001",
    "dispatchStartAt": "2026-04-16T14:00:00+09:00",
    "status": "IN_PROGRESS"
  }
}
```

---

### 6.2 타임스탬프 기록

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `PATCH /dispatch/{dispatchId}/timestamp` |
| 인증 | Bearer Token (구급대원만) |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| eventType | string | ✅ | `PATIENT_CONTACT`/`HOSPITAL_DEPART`/`HOSPITAL_ARRIVE` |
| patientRecordId | string | 조건부 | 환자 기록 연결 (최초 1회) |
| hospitalId | string | 조건부 | 수용 병원 연결 |

---

### 6.3 상황 종료

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `PATCH /dispatch/{dispatchId}/end` |
| 인증 | Bearer Token (구급대원만) |

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| memo | string | ❌ | 추가 메모 |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "dispatchId": "uuid-...",
    "dispatchCode": "2026-0416-001",
    "totalDurationMin": 35,
    "status": "COMPLETED"
  }
}
```

---

### 6.4 기록 목록 조회

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /dispatch/list` |
| 인증 | Bearer Token (구급대원만) |

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | string | ❌ | 필터: `IN_PROGRESS`/`COMPLETED`/`ALL` |
| page | integer | ❌ | 페이지 (기본: 1) |
| limit | integer | ❌ | 페이지당 수 (기본: 20) |

---

### 6.5 기록 상세 조회

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /dispatch/{dispatchId}` |
| 인증 | Bearer Token (구급대원만) |

---

### 6.6 PDF 다운로드

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /dispatch/{dispatchId}/export/pdf` |
| 인증 | Bearer Token (구급대원만) |
| 응답 형식 | `application/pdf` |

---

### 6.7 Excel 다운로드

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `GET /dispatch/{dispatchId}/export/excel` |
| 인증 | Bearer Token (구급대원만) |
| 응답 형식 | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

---

## 7. 외부 API 연동

### 7.1 공공데이터 연동 — 국립중앙의료원 응급의료정보

| 항목 | 내용 |
|------|------|
| API명 | 국립중앙의료원 중앙응급의료센터 API |
| 제공처 | 공공데이터포털 (data.go.kr) |
| Base URL | `http://apis.data.go.kr/B552657/ErmctInfoInqireService` |
| 인증 | 서비스 키 (ServiceKey) |

**주요 엔드포인트:**

| API | 엔드포인트 | 설명 |
|-----|-----------|------|
| 응급실 목록 | `getEgytListInfoInqire` | 응급실 기본 정보 조회 |
| 실시간 가용 병상 | `getEmrrmRltmUsfulBdInfoInqire` | 실시간 병상/장비 가동 현황 |
| 중증 수용 가능 | `getSrsillDissAceptncPosblInfoInqire` | 중증질환 수용 가능 정보 |

---

### 7.2 지도 API

웹앱 전환 후 **네이버 지도 JavaScript API** 를 기본으로 채택합니다. 이미 `.env` 에 NCP Maps 키가 발급되어 있고, 응급실 좌표가 WGS84 기반이라 바로 마커 렌더링이 가능합니다.

| API | 용도 | 인증 | 사용 위치 |
|-----|------|------|----------|
| **네이버 지도 JavaScript API v3** | 지도 렌더링, 마커, 인포윈도우 | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (JS 전용) | 클라이언트 |
| **네이버 Directions 5 API** | 경로 탐색, ETA 계산 | `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET` | **서버 API Route** |
| (대안) 카카오맵 JavaScript SDK | 지도 렌더링 | `NEXT_PUBLIC_KAKAO_JS_KEY` | 클라이언트 |
| (대안) 카카오 모빌리티 Directions | 경로 탐색 | `KAKAO_REST_API_KEY` | 서버 API Route |

> NCP 콘솔의 **"Web 서비스 URL"** 에 운영 도메인(예: `https://baroer.vercel.app`) 과 `http://localhost:3000` 을 반드시 등록해야 JS SDK 인증이 통과합니다.

---

### 7.3 음성 인식 API

웹앱은 **브라우저 내장 Web Speech API** 를 먼저 사용합니다. 추가 비용·서버 트래픽 없이 한국어 인식 가능하며, Chrome/Edge/Safari 15+ 에서 동작합니다.

| API | 용도 | 비고 |
|-----|------|------|
| **Web Speech API (`SpeechRecognition`)** | STT 변환 | 기본 엔진, 클라이언트 전용, 추가 키 불필요 |
| Google Cloud Speech-to-Text | STT 변환 (서버 옵션) | 긴 녹음·고정밀 인식 필요 시 |
| (대안) 네이버 CLOVA Speech | STT 변환 | 의료 용어 커스텀 사전 가능 |
| (대안) 카카오 음성 API | STT 변환 | 국내 서비스 |

---

### 7.4 자동 전화 API

| API | 용도 | 비고 |
|-----|------|------|
| Twilio Voice API | 자동 음성 전화 발신 | 동시 통화 지원, 한국 전화번호 연동 |
| (대안) NHN Cloud Call API | 자동 전화 | 국내 서비스 |

---

## 8. API 보안 정책

| 정책 | 내용 |
|------|------|
| 인증 | Firebase ID Token (HTTP-only, Secure, SameSite=Lax 쿠키) |
| 세션 갱신 | Firebase Auth 자동 갱신 + 쿠키 재발급 |
| Rate Limiting | 분당 60회 (인증 API: 분당 10회) — Vercel Edge Middleware 또는 Upstash Rate Limit |
| CORS | **허용 도메인 화이트리스트**: `https://baroer.vercel.app`, `https://baroer.com`, `http://localhost:3000` (개발) |
| CSRF | SameSite=Lax 쿠키 + Origin 헤더 검증 (Next.js Server Actions 기본 보호) |
| 데이터 암호화 | 전송 중: TLS 1.3, 저장 시: Firestore 기본 암호화 |
| 서버 전용 키 보호 | 공공데이터 서비스키·네이버 Directions 시크릿·카카오 REST 키는 **API Route 에서만 사용**, 브라우저 노출 금지 (`NEXT_PUBLIC_` 접두사 금지) |
| 입력 검증 | 모든 입력값 서버 측 검증 (Zod 스키마 + Firestore Rules) |
| XSS 방지 | React 기본 이스케이핑 + DOMPurify (필요 시) |
| 감사 로그 | 모든 API 요청 로깅 (IP, 사용자 UID, 시간) — Vercel Logs + Firestore `audit_logs` 컬렉션 |

---

## 9. 공공데이터 수집 필드 상세 명세

국립중앙의료원(중앙응급의료센터) API로부터 수집하는 주요 데이터 항목 리스트입니다.

### 9.1 실시간 가용 자원 정보 (Beds & Equipment)
실시간으로 업데이트되는 응급실의 가동 현황 데이터입니다.

| 필드명 | 항목명 | 설명 |
|--------|--------|------|
| **hvec** | 응급실 가용 병상 | 현재 즉시 사용 가능한 응급실 일반 침상 수 |
| **hvicu** | 응급 중환자실 | 응급실 내 중환자실 가용 병상 수 |
| **hvgc** | 일반 중환자실 | 병원 내 일반 중환자실 가용 병상 수 |
| **hvamn** | 가용 구급차 | 현재 출동 가능한 구급차 대수 |
| **hvctayn** | CT 가동 여부 | CT 장비 사용 가능 여부 (Y/N) |
| **hvmriayn** | MRI 가동 여부 | MRI 장비 사용 가능 여부 (Y/N) |
| **hvangioayn** | 혈관조영기 | 혈관조영 촬영 장비 사용 가능 여부 (Y/N) |
| **hv2** | 내과 중환자실 | 내과계 중환자실 가용 병상 수 |
| **hv3** | 외과 중환자실 | 외과계 중환자실 가용 병상 수 |

### 9.2 중증응급질환 수용 가능 정보 (Serious Disease)
특정 중증 질환에 대해 병원이 현재 진료/수술이 가능한지 여부입니다.

| 필드명 | 항목명 | 설명 |
|--------|--------|------|
| **hv1** | 심근경색 | 급성심근경색증 환자 수용 및 처치 가능 여부 |
| **hv2** | 뇌출혈 | 뇌출혈(개두술) 환자 수용 및 수술 가능 여부 |
| **hv3** | 뇌경색 | 뇌경색(혈전용해) 환자 수용 및 처치 가능 여부 |
| **hv10** | 중증화상 | 전문적인 화상 치료 및 수용 가능 여부 |
| **hv11** | 다발성외상 | 중증다발성외상 환자 수용 가능 여부 |
| **hv12** | **아나필락시스** | **급성 알레르기 쇼크 환자 처치 및 수용 가능 여부** |
| **msg** | **실시간 특이사항** | **"전문의 부재", "장비 고장", "공사중" 등 병원이 입력한 긴급 메시지** |

### 9.3 병원 기본 및 위치 정보 (Static Data)
병원의 고유 식별 정보 및 위치 데이터입니다.

| 필드명 | 항목명 | 설명 |
|--------|--------|------|
| **dutyName** | 병원명 | 의료기관의 공식 명칭 |
| **hpid** | 기관코드 | 시스템 내 병원 식별을 위한 고유 ID |
| **dutyAddr** | 주소 | 병원의 전체 도로명 주소 |
| **dutyTel1** | 대표전화 | 병원 공식 대표 전화번호 |
| **dutyTel3** | 응급실전화 | 응급실 직통 전화번호 |
| **wgs84Lat** | 위도 | 병원의 정확한 위치 좌표 (Latitude) |
| **wgs84Lon** | 경도 | 병원의 정확한 위치 좌표 (Longitude) |

