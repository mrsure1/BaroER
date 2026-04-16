# 바로응급실 (BaroER) - 데이터베이스 설계서

> 문서 버전: 1.0  
> 작성일: 2026-04-16  
> 작성자: MrSure

---

## 1. ER 다이어그램 (Entity Relationship)

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│    users     │        │  patient_records │        │  hospitals   │
├──────────────┤        ├──────────────────┤        ├──────────────┤
│ PK id (UUID) │◀──┐    │ PK id (UUID)     │    ┌──▶│ PK id (UUID) │
│ email        │   │    │ FK user_id       │────┘   │ name         │
│ password_hash│   ├────│ symptom_cats     │        │ address      │
│ nickname     │   │    │ symptom_detail   │        │ lat / lng    │
│ user_type    │   │    │ patient_gender   │        │ phone        │
│ org_code     │   │    │ patient_age_group│        │ total_beds   │
│ created_at   │   │    │ consciousness    │        │ avail_beds   │
│ last_login_at│   │    │ severity_score   │        │ has_doctor   │
└──────────────┘   │    │ created_at       │        │ status       │
                   │    └──────────────────┘        │ last_updated │
                   │                                └──────┬───────┘
                   │                                       │
                   │    ┌──────────────────┐               │
                   │    │  dispatch_logs   │               │
                   │    ├──────────────────┤               │
                   │    │ PK id (UUID)     │               │
                   ├────│ FK user_id       │               │
                   │    │ dispatch_code    │               │
                   │    │ FK patient_rec_id│───▶patient_records
                   │    │ FK hospital_id   │───────────────┘
                   │    │ dispatch_start_at│
                   │    │ patient_contact  │
                   │    │ hospital_depart  │
                   │    │ hospital_arrive  │
                   │    │ situation_end    │
                   │    │ total_duration   │
                   │    │ memo             │
                   │    │ status           │
                   │    └──────────────────┘
                   │
                   │    ┌──────────────────┐
                   │    │    call_logs     │
                   │    ├──────────────────┤
                   │    │ PK id (UUID)     │
                   └────│ FK user_id       │
                        │ FK hospital_id   │───▶hospitals
                        │ call_status      │
                        │ avail_result     │
                        │ started_at       │
                        │ ended_at         │
                        │ duration_sec     │
                        └──────────────────┘
```

---

## 2. 테이블 상세 정의

### 2.1 users (사용자)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 사용자 고유 식별자 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | — | 로그인 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | — | bcrypt 해시된 비밀번호 |
| nickname | VARCHAR(50) | NOT NULL | — | 사용자 닉네임 |
| user_type | ENUM('GENERAL','PARAMEDIC') | NOT NULL | 'GENERAL' | 사용자 유형 |
| org_code | VARCHAR(20) | NULL | NULL | 구급대원 소속기관 코드 |
| profile_image_url | VARCHAR(500) | NULL | NULL | 프로필 이미지 URL |
| push_token | VARCHAR(255) | NULL | NULL | 푸시 알림 토큰 |
| is_active | BOOLEAN | NOT NULL | TRUE | 계정 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 수정일시 |
| last_login_at | TIMESTAMP | NULL | NULL | 최종 로그인 일시 |

**인덱스:**
- `idx_users_email` — email (UNIQUE)
- `idx_users_user_type` — user_type
- `idx_users_org_code` — org_code

---

### 2.2 hospitals (응급실/병원)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 병원 고유 식별자 |
| hpid | VARCHAR(20) | UNIQUE | — | 공공데이터 병원 코드 |
| name | VARCHAR(200) | NOT NULL | — | 병원명 |
| address | VARCHAR(500) | NOT NULL | — | 주소 |
| lat | DOUBLE PRECISION | NOT NULL | — | 위도 |
| lng | DOUBLE PRECISION | NOT NULL | — | 경도 |
| phone | VARCHAR(20) | NULL | — | 응급실 전화번호 |
| total_beds | INTEGER | NOT NULL | 0 | 총 응급 병상 수 |
| available_beds | INTEGER | NOT NULL | 0 | 현재 가용 병상 수 |
| has_doctor_on_duty | BOOLEAN | NOT NULL | FALSE | 당직 의사 유무 |
| status | ENUM('AVAILABLE','BUSY','FULL') | NOT NULL | 'AVAILABLE' | 수용 상태 |
| er_type | VARCHAR(50) | NULL | — | 응급실 유형 (권역/지역/지역응급의료기관) |
| specialties | JSON | NULL | — | 진료 가능 분야 |
| last_updated | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 마지막 정보 갱신 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 최초 등록일 |

**인덱스:**
- `idx_hospitals_hpid` — hpid (UNIQUE)
- `idx_hospitals_location` — (lat, lng) — 공간 인덱스
- `idx_hospitals_status` — status
- `idx_hospitals_last_updated` — last_updated

---

### 2.3 patient_records (환자 기록)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 기록 고유 ID |
| user_id | UUID | FK → users.id, NOT NULL | — | 입력 사용자 |
| symptom_categories | JSON | NOT NULL | — | 증상 카테고리 배열 |
| symptom_detail | TEXT | NULL | — | 상세 증상 텍스트 |
| voice_input_raw | TEXT | NULL | — | 음성 인식 원본 |
| patient_gender | ENUM('MALE','FEMALE') | NOT NULL | — | 환자 성별 |
| patient_age_group | ENUM('INFANT','CHILD','ADULT','ELDERLY') | NOT NULL | — | 연령대 |
| consciousness_level | ENUM('ALERT','DROWSY','UNRESPONSIVE') | NOT NULL | — | 의식 수준 |
| severity_score | INTEGER | NOT NULL | — | 중증도 점수 (1~5) |
| search_lat | DOUBLE PRECISION | NOT NULL | — | 검색 시 사용자 위도 |
| search_lng | DOUBLE PRECISION | NOT NULL | — | 검색 시 사용자 경도 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 입력 시각 |

**인덱스:**
- `idx_patient_records_user_id` — user_id
- `idx_patient_records_created_at` — created_at

---

### 2.4 dispatch_logs (출동 기록) — 구급대원 전용

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 출동 기록 ID |
| user_id | UUID | FK → users.id, NOT NULL | — | 구급대원 ID |
| dispatch_code | VARCHAR(20) | UNIQUE, NOT NULL | — | 출동 번호 (YYYY-MMDD-NNN) |
| patient_record_id | UUID | FK → patient_records.id | — | 환자 기록 참조 |
| hospital_id | UUID | FK → hospitals.id, NULL | — | 수용 병원 참조 |
| dispatch_start_at | TIMESTAMP | NOT NULL | — | 출동 시작 시각 |
| patient_contact_at | TIMESTAMP | NULL | — | 환자 접촉 시각 |
| hospital_depart_at | TIMESTAMP | NULL | — | 병원 출발 시각 |
| hospital_arrive_at | TIMESTAMP | NULL | — | 병원 도착 시각 |
| situation_end_at | TIMESTAMP | NULL | — | 상황 종료 시각 |
| total_duration_min | INTEGER | NULL | — | 총 소요시간 (분) |
| memo | TEXT | NULL | — | 추가 메모 |
| status | ENUM('IN_PROGRESS','COMPLETED','CANCELLED') | NOT NULL | 'IN_PROGRESS' | 상태 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 기록 생성일 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 수정일 |

**인덱스:**
- `idx_dispatch_user_id` — user_id
- `idx_dispatch_code` — dispatch_code (UNIQUE)
- `idx_dispatch_status` — status
- `idx_dispatch_created_at` — created_at

---

### 2.5 call_logs (자동 전화 기록)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 통화 기록 ID |
| user_id | UUID | FK → users.id, NOT NULL | — | 요청 사용자 |
| hospital_id | UUID | FK → hospitals.id, NOT NULL | — | 대상 병원 |
| session_id | UUID | NOT NULL | — | 자동전화 세션 ID |
| call_status | ENUM('PENDING','CALLING','COMPLETED','FAILED') | NOT NULL | 'PENDING' | 전화 상태 |
| availability_result | ENUM('AVAILABLE','BUSY','FULL','UNKNOWN') | NULL | — | 수용 여부 결과 |
| started_at | TIMESTAMP | NULL | — | 전화 시작 시각 |
| ended_at | TIMESTAMP | NULL | — | 전화 종료 시각 |
| duration_sec | INTEGER | NULL | — | 통화 시간 (초) |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 기록 생성일 |

**인덱스:**
- `idx_call_logs_session_id` — session_id
- `idx_call_logs_user_id` — user_id
- `idx_call_logs_hospital_id` — hospital_id

---

### 2.6 auth_tokens (인증 토큰)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | auto-gen | 토큰 ID |
| user_id | UUID | FK → users.id, NOT NULL | — | 사용자 |
| access_token | VARCHAR(500) | NOT NULL | — | JWT 액세스 토큰 |
| refresh_token | VARCHAR(500) | UNIQUE, NOT NULL | — | 리프레시 토큰 |
| device_info | VARCHAR(255) | NULL | — | 디바이스 정보 |
| expires_at | TIMESTAMP | NOT NULL | — | 토큰 만료 시각 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 발급 시각 |
| is_revoked | BOOLEAN | NOT NULL | FALSE | 폐기 여부 |

**인덱스:**
- `idx_auth_tokens_user_id` — user_id
- `idx_auth_tokens_refresh_token` — refresh_token (UNIQUE)

---

## 3. 데이터 관계 요약

| 관계 | 설명 |
|------|------|
| users → patient_records | 1:N (한 사용자가 여러 환자 기록 생성) |
| users → dispatch_logs | 1:N (한 구급대원이 여러 출동 기록 보유) |
| users → call_logs | 1:N (한 사용자가 여러 자동전화 요청) |
| users → auth_tokens | 1:N (한 사용자가 여러 기기 토큰 보유) |
| hospitals → call_logs | 1:N (한 병원에 여러 자동전화 기록) |
| hospitals → dispatch_logs | 1:N (한 병원이 여러 출동 수용) |
| patient_records → dispatch_logs | 1:1 (한 환자 기록에 한 출동 기록) |

---

## 4. 데이터 보존 정책

| 테이블 | 보존 기간 | 비고 |
|--------|-----------|------|
| users | 탈퇴 후 30일 | 개인정보 삭제 처리 |
| patient_records | 90일 | 개인정보 포함, 자동 삭제 |
| dispatch_logs | 5년 | 구급대원 업무 기록 보존 의무 |
| call_logs | 30일 | 통화 기록 단기 보존 |
| auth_tokens | 만료 후 7일 | 만료/폐기 토큰 정리 |
| hospitals | 영구 | 공공데이터 기반 |
