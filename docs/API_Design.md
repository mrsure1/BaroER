# 바로응급실 (BaroER) - API 설계서

> 문서 버전: 1.0  
> 작성일: 2026-04-16  
> 작성자: MrSure

---

## 1. API 개요

| 항목 | 내용 |
|------|------|
| Base URL | `https://api.baroer.com/api/v1` |
| 프로토콜 | HTTPS (TLS 1.3) |
| 인증 방식 | JWT Bearer Token |
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

| API | 용도 | 인증 |
|-----|------|------|
| 카카오맵 JavaScript SDK | 지도 렌더링, 마커 표시 | REST API Key |
| 카카오 모빌리티 API | 경로 탐색, ETA 계산 | REST API Key |
| (대안) 네이버 지도 API | 지도 렌더링 | Client ID + Secret |

---

### 7.3 음성 인식 API

| API | 용도 | 비고 |
|-----|------|------|
| Google Cloud Speech-to-Text | STT 변환 | 스트리밍 지원, 한국어 최적화 |
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
| 인증 | JWT Bearer Token (만료: 1시간) |
| 리프레시 | Refresh Token (만료: 30일) |
| Rate Limiting | 분당 60회 (인증 API: 분당 10회) |
| CORS | 앱 전용 (웹 접근 제한) |
| 데이터 암호화 | 전송 중: TLS 1.3, 저장 시: AES-256 |
| 입력 검증 | 모든 입력값 서버 측 검증 (SQL Injection, XSS 방지) |
| 감사 로그 | 모든 API 요청 로깅 (IP, 사용자, 시간) |
