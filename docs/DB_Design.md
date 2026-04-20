# 바로응급실 (BaroER) - 데이터베이스 설계서 (Supabase)

> 문서 버전: 3.0 (Supabase / PostgreSQL)  
> 최초 작성일: 2026-04-16  
> 개정일: 2026-04-20 — Firebase·Firestore 기준 제거, **Supabase(Postgres + Auth)** 기준으로 정리  
> 작성자: MrSure

## 0. 스토리지·백엔드 구현 가이드 (Supabase)

운영 백엔드는 **Supabase** 를 사용한다.

| 구분 | Supabase 구성 요소 | BaroER에서의 역할 |
|------|-------------------|-------------------|
| 인증 | **Auth** (`auth.users`, JWT/Refresh) | 이메일·비밀번호, Google/Kakao OAuth, 이메일 인증·비밀번호 재설정 |
| 앱 DB | **PostgreSQL** (`public` 등) | 사용자 프로필, 환자·출동·통화 기록 등 도메인 데이터 |
| 접근 제어 | **RLS (Row Level Security)** | `anon`/`authenticated` 역할별로 행 단위 접근 통제 |
| 파일 | **Storage** (선택) | 프로필 이미지, 음성·첨부 등 바이너리 |
| 배치·웹훅 | **Edge Functions** / **pg_cron** (선택) | 보존 정책 TTL, 알림, 외부 연동 |

### 0.1 앱 코드와의 연결 (현재)

- **클라이언트**: `@supabase/ssr` 의 `createBrowserClient` — 세션을 **쿠키**에 저장해 서버와 공유 (`src/lib/supabase/client.ts`).
- **서버**: `createServerClient` + Next.js `cookies()` — Route Handler·Server Component 에서 동일 세션 (`src/lib/supabase/server.ts`).
- **관리용**: `SUPABASE_SERVICE_ROLE_KEY` 로 `createAdminClient` — **신뢰할 수 있는 서버 코드에서만** 사용, RLS 우회.
- **프로필 필드**: 회원가입 시 `user_metadata` (`nickname`, `user_type`, `org_code` 등)에 저장·로그인 후 매핑 (`src/services/auth.ts`).  
  장기적으로는 아래 **`public.profiles`** 테이블로 정규화하는 것을 권장한다.

### 0.2 스키마 옮길 때 규칙 (관계형 명세 → Postgres)

- **UUID PK** → `uuid` + `gen_random_uuid()` (또는 `extensions.uuid_generate_v4()`).
- **FK** → `REFERENCES parent(id) ON DELETE …`.
- **ENUM** → Postgres `CREATE TYPE … AS ENUM (...)` 또는 `text` + `CHECK` (마이그레이션 유연성).
- **JSON** → `jsonb` 권장 (인덱싱·연산자 지원).
- **인덱스** → `CREATE INDEX …` / PostGIS 사용 시 지리 인덱스 검토.
- **보존 기간** → `pg_cron` + `DELETE`, 또는 Edge Function 스케줄, 또는 컬럼 `expires_at` + 주기 정리.

### 0.3 인증 모델 (Firebase 대비)

| 기존 문서(개념) | Supabase |
|-----------------|----------|
| 앱이 직접 보관하는 `password_hash` | **없음** — 비밀번호는 **`auth.users`** 에서만 관리 (직접 컬럼 조회 불가, Auth API 사용) |
| 커스텀 `users` 단일 테이블 | **`auth.users`**(계정) + **`public.profiles`**(표시명·역할·소속 등 권장) |
| 세션 쿠키 해시 테이블 | **선택** — Supabase가 Refresh Token·JWT를 관리. 감사·강제 로그아웃만 필요하면 별도 `session_audit` 등 |

---

## 1. ER 다이어그램 (Entity Relationship)

```
┌────────────────┐        ┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│  auth.users    │        │   profiles   │        │ patient_records  │        │  hospitals   │
│  (Supabase)    │        │  (public)    │        ├──────────────────┤        ├──────────────┤
├────────────────┤        ├──────────────┤        │ PK id (UUID)     │    ┌──▶│ PK id (UUID) │
│ PK id (UUID)   │───1:1─▶│ PK id = FK   │◀──┐    │ FK user_id       │────┘   │ name         │
│ email, …       │        │ nickname     │   │    │ symptom_cats     │        │ address      │
│ (비밀번호 등)  │        │ user_type    │   │    │ symptom_detail   │        │ lat / lng    │
└────────────────┘        │ org_code     │   │    │ patient_gender   │        │ phone        │
                          │ avatar_url   │   │    │ patient_age_group│        │ total_beds   │
                          │ …            │   │    │ consciousness    │        │ avail_beds   │
                          └──────────────┘   │    │ severity_score   │        │ has_doctor   │
                                             │    │ created_at       │        │ status       │
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
                                             │    │ …                │
                                             │    └──────────────────┘
                                             │
                                             │    ┌──────────────────┐
                                             │    │    call_logs     │
                                             │    ├──────────────────┤
                                             └────│ FK user_id       │
                                                  │ FK hospital_id   │───▶hospitals
                                                  │ call_status      │
                                                  │ …                │
                                                  └──────────────────┘
```

> **참고**: 검색 히스토리 일부는 현재 **브라우저 `localStorage`** (`historyStore`) 에만 저장될 수 있다. 서버 동기화 시 `patient_records` 또는 별도 `search_sessions` 로 옮기는 것을 검토한다.

---

## 2. 테이블 상세 정의

### 2.1 `auth.users` (Supabase Auth · 시스템 관리)

Supabase 대시보드의 **Authentication** 과 Auth API 로만 다룬다. 앱에서 직접 `INSERT` 하지 않는다.

| 항목 | 설명 |
|------|------|
| `id` | `uuid`, 사용자 고유 ID — **`public` 테이블 FK의 기준** |
| `email` | 로그인 이메일 (설정에 따라 nullable 인 OAuth 전용 계정 등) |
| 기타 | 암호 해시, 이메일 확인 시각 등 — **스키마는 Supabase 버전에 따름** |

앱에서 필요한 **닉네임·역할·소속** 등은 `raw_user_meta_data` / `user_metadata` 또는 다음 **`profiles`** 에 둔다.

---

### 2.2 `profiles` (public · 앱 사용자 프로필) — 권장

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | — | Auth 사용자와 1:1 |
| nickname | VARCHAR(50) | NOT NULL | — | 표시명 |
| user_type | `GENERAL` \| `PARAMEDIC` (ENUM 또는 text+CHECK) | NOT NULL | `GENERAL` | 사용자 유형 |
| org_code | VARCHAR(20) | NULL | NULL | 구급대원 소속기관 코드 |
| avatar_url | TEXT | NULL | NULL | 프로필 이미지 (Storage public URL 등) |
| web_push_subscription | JSONB | NULL | NULL | Web Push 구독 객체 (`endpoint`, `keys` 등) |
| is_active | BOOLEAN | NOT NULL | TRUE | 계정 비활성 플래그(앱 레벨) |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | 생성 |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | 수정 |
| last_login_at | TIMESTAMPTZ | NULL | NULL | 최종 로그인(선택, 트리거로 동기화 가능) |

**RLS 예시 (개념)**

- `SELECT`/`UPDATE`: `auth.uid() = id` 인 행만 본인 허용.
- `INSERT`: `auth.uid() = id` 인 행만 (회원가입 직후 트리거 또는 서버에서 service role 로 1회 생성).

**인덱스**

- `profiles_user_type_idx` — `user_type`
- `profiles_org_code_idx` — `org_code` (NULL 제외 부분 인덱스 가능)

---

### 2.3 `hospitals` (응급실/병원)

실시간 병상은 **공공 API** 가 주력일 수 있으며, 이 테이블은 **캐시·스냅샷·추가 메타** 용도로 선택적으로 둔다.

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | gen_random_uuid() | 내부 ID |
| hpid | VARCHAR(20) | UNIQUE | — | 공공데이터 병원 코드 |
| name | VARCHAR(200) | NOT NULL | — | 병원명 |
| address | VARCHAR(500) | NOT NULL | — | 주소 |
| lat | DOUBLE PRECISION | NOT NULL | — | 위도 |
| lng | DOUBLE PRECISION | NOT NULL | — | 경도 |
| phone | VARCHAR(20) | NULL | — | 응급실 전화 |
| total_beds | INTEGER | NOT NULL | 0 | 총 응급 병상 수 |
| available_beds | INTEGER | NOT NULL | 0 | 가용 병상 |
| has_doctor_on_duty | BOOLEAN | NOT NULL | FALSE | 당직 의사 유무 |
| status | VARCHAR 또는 ENUM | NOT NULL | `AVAILABLE` | 수용 상태 |
| er_type | VARCHAR(50) | NULL | — | 응급실 유형 |
| specialties | JSONB | NULL | — | 진료 분야 |
| last_updated | TIMESTAMPTZ | NOT NULL | `now()` | 갱신 시각 |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | 등록 시각 |

**인덱스**

- UNIQUE(`hpid`)
- (`lat`, `lng`) — 필요 시 **PostGIS** `geography` + GiST 권장
- `status`, `last_updated`

**RLS**: 대부분 **전역 읽기**(`SELECT` for all) + 쓰기는 `service_role` 또는 관리자만.

---

### 2.4 `patient_records` (환자 기록)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | PK | gen_random_uuid() | 기록 ID |
| user_id | UUID | FK → `profiles(id)` 또는 `auth.users`, NOT NULL | — | 입력 사용자 |
| symptom_categories | JSONB | NOT NULL | — | 증상 카테고리 배열 |
| symptom_detail | TEXT | NULL | — | 상세 증상 |
| voice_input_raw | TEXT | NULL | — | 음성 인식 원본 |
| patient_gender | VARCHAR 또는 ENUM | NOT NULL | — | 환자 성별 |
| patient_age_group | VARCHAR 또는 ENUM | NOT NULL | — | 연령대 |
| consciousness_level | VARCHAR 또는 ENUM | NOT NULL | — | 의식 수준 |
| severity_score | INTEGER | NOT NULL | — | 중증도 1~5 |
| search_lat | DOUBLE PRECISION | NOT NULL | — | 검색 시 위도 |
| search_lng | DOUBLE PRECISION | NOT NULL | — | 검색 시 경도 |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | 입력 시각 |

**RLS**: `user_id = auth.uid()` 인 행만 본인 CRUD (정책은 제품 요구에 맞게 조정).

**인덱스**: `user_id`, `created_at DESC`

---

### 2.5 `dispatch_logs` (출동 기록) — 구급대원 전용

(컬럼 정의는 v2.0 설계와 동일. 타입만 Postgres 관례에 맞춤.)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 출동 기록 ID |
| user_id | UUID | FK → 프로필/사용자, NOT NULL | 구급대원 |
| dispatch_code | VARCHAR(20) | UNIQUE, NOT NULL | 출동 번호 |
| patient_record_id | UUID | FK → patient_records | 환자 기록 |
| hospital_id | UUID | FK → hospitals, NULL 허용 | 수용 병원 |
| dispatch_start_at | TIMESTAMPTZ | NOT NULL | 출동 시작 |
| patient_contact_at | TIMESTAMPTZ | NULL | 환자 접촉 |
| hospital_depart_at | TIMESTAMPTZ | NULL | 병원 출발 |
| hospital_arrive_at | TIMESTAMPTZ | NULL | 병원 도착 |
| situation_end_at | TIMESTAMPTZ | NULL | 상황 종료 |
| total_duration_min | INTEGER | NULL | 총 소요(분) |
| memo | TEXT | NULL | 메모 |
| status | VARCHAR 또는 ENUM | NOT NULL | 진행/완료/취소 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정 |

**RLS**: 구급대원 계정만 본인 `user_id` 행 접근 등.

---

### 2.6 `call_logs` (자동 전화 기록)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 통화 기록 ID |
| user_id | UUID | FK, NOT NULL | 요청 사용자 |
| hospital_id | UUID | FK, NOT NULL | 대상 병원 |
| session_id | UUID | NOT NULL | 세션 ID |
| call_status | VARCHAR 또는 ENUM | NOT NULL | 대기/통화중/완료/실패 |
| availability_result | VARCHAR 또는 ENUM | NULL | 수용 결과 |
| started_at | TIMESTAMPTZ | NULL | 시작 |
| ended_at | TIMESTAMPTZ | NULL | 종료 |
| duration_sec | INTEGER | NULL | 통화 시간(초) |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 |

---

### 2.7 세션·감사 (선택) — `auth_sessions` 대체

Supabase **Auth** 가 리프레시 토큰·JWT 갱신을 처리하므로, 별도 `auth_sessions` 테이블은 **필수 아님**.

강제 로그아웃·디바이스 목록·감사가 필요할 때만 예를 들어 다음을 둔다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK |
| session_id | TEXT | Supabase 세션 식별자 또는 해시 |
| user_agent | TEXT | UA |
| ip_address | INET 또는 TEXT | 접속 IP |
| expires_at | TIMESTAMPTZ | 만료 |
| last_seen_at | TIMESTAMPTZ | 최종 활동 |
| is_revoked | BOOLEAN | 폐기 여부 |

정리 배치는 **pg_cron** 또는 Supabase **Scheduled Edge Functions** 로 만료·폐기 행 삭제.

---

## 3. 데이터 관계 요약

| 관계 | 설명 |
|------|------|
| `auth.users` → `profiles` | 1:1 (권장) |
| `profiles` → `patient_records` | 1:N |
| `profiles` → `dispatch_logs` | 1:N |
| `profiles` → `call_logs` | 1:N |
| `hospitals` → `call_logs` | 1:N |
| `hospitals` → `dispatch_logs` | 1:N |
| `patient_records` → `dispatch_logs` | 1:1 또는 N:1 (정책에 따름) |

---

## 4. 데이터 보존 정책

| 대상 | 보존 기간 | 비고 |
|------|-----------|------|
| `profiles` / Auth 사용자 | 탈퇴 후 정책 일수 | Supabase Auth 사용자 삭제 + `profiles` CASCADE 등 |
| `patient_records` | 예: 90일 | 개인정보 최소화, RLS + 배치 삭제 |
| `dispatch_logs` | 예: 5년 | 업무 기록 보존 |
| `call_logs` | 예: 30일 | 단기 보존 |
| 감사용 세션 테이블 | 만료 후 예: 7일 | 스케줄 삭제 |
| `hospitals` | 영구 또는 스냅샷 주기 덮어쓰기 | 공공데이터 기반 |

---

## 5. 환경 변수 (참고)

`.env.example` 기준:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 클라이언트·서버 SSR (RLS 적용).
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용 관리 작업 (키 노출 금지).

마이그레이션은 Supabase CLI `supabase/migrations` 또는 대시보드 SQL 로 버전 관리하는 것을 권장한다.
