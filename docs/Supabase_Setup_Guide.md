# Supabase 셋업 가이드 (BaroER)

> Firebase → **Supabase Auth + Postgres** 마이그레이션 후, Supabase 대시보드에서 해야 할 것을 순서대로 정리한 문서입니다.
> 이 문서대로 한 번만 따라가면 이메일/Google/Kakao 로그인 + 이메일 인증 + RLS 가 모두 동작합니다.

---

## 0. 한눈에 보기

| 단계 | 어디서 | 무엇을 |
| --- | --- | --- |
| 1 | supabase.com | 프로젝트 생성 (Seoul region) |
| 2 | Settings → API | URL · anon · service_role 키 복사 → `.env` |
| 3 | SQL Editor | `supabase/migrations/0001_init.sql` 실행 |
| 4 | Authentication → Providers → Email | "Confirm email" 켜기 |
| 5 | Authentication → URL Configuration | Site URL / Redirect URL 등록 (ngrok 포함) |
| 6 | Google Cloud Console + Supabase | OAuth 동의화면 → 클라이언트 → Supabase 입력 |
| 7 | Kakao Developers + Supabase | 앱 → 카카오 로그인 → Supabase 입력 |
| 8 | (선택) Authentication → Email Templates | 한국어 메일 본문 수정 |

### 한 화면 체크리스트 — 어디서 무엇을 복사해서 어디에 붙이나

| # | 출처 (어디서 만들고 복사) | 값 | 도착 (어디에 붙이기) |
| --- | --- | --- | --- |
| 1 | Supabase → Settings → API | Project URL | `.env` `NEXT_PUBLIC_SUPABASE_URL` |
| 2 | Supabase → Settings → API | anon public key | `.env` `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 3 | Supabase → Settings → API | service_role key | `.env` `SUPABASE_SERVICE_ROLE_KEY` (서버 전용) |
| 4 | Supabase → Authentication → Providers → Google (펼치기) | Callback URL (for OAuth) | Google Cloud Console 의 **승인된 리디렉션 URI** |
| 5 | Google Cloud Console → 클라이언트 → OAuth Web | Client ID | Supabase → Providers → Google → **Client ID** |
| 6 | Google Cloud Console → 클라이언트 → OAuth Web | Client Secret | Supabase → Providers → Google → **Client Secret** |
| 7 | Supabase → Authentication → Providers → Kakao (펼치기) | Callback URL (for OAuth) | Kakao Developers → 카카오 로그인 → **Redirect URI** |
| 8 | Kakao Developers → 앱 키 | REST API 키 | Supabase → Providers → Kakao → **Client ID** |
| 9 | Kakao Developers → 보안 | Client Secret | Supabase → Providers → Kakao → **Client Secret** |

---

## 1. 프로젝트 생성

1. <https://supabase.com> 로그인 → **New project**
2. 입력값
   - Name: `baroer` (자유)
   - Database password: 강력한 비밀번호 (별도 보관)
   - Region: **Northeast Asia (Seoul)** ← 한국 사용자 응답속도 최적
   - Pricing plan: Free tier 로 시작 (월 50,000 MAU 까지 무료)
3. 생성 완료까지 1~2분 대기.

---

## 2. API 키를 `.env` 에 입력

좌측 메뉴 **Settings → API**

| 대시보드 표시 | `.env` 키 | 노출 범위 |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 OK |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 OK (RLS 로 보호) |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용**, 절대 커밋 금지 |

`.env` 예시:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
```

> 입력 후 **dev 서버 재기동 필수** (`npm run dev` 재시작).

---

## 3. 스키마 + RLS 적용 (가장 중요)

좌측 메뉴 **SQL Editor → New query**

이 저장소의 `supabase/migrations/0001_init.sql` 파일 내용을 **통째로 복사 → 붙여넣기 → Run** 하면 됩니다.

생성되는 것:

- `profiles` — 사용자 프로필 (auth.users 1:1)
- `search_history` — 검색 기록
- `dispatch_reports` — 구급대원 출동 리포트 (PARAMEDIC 만 작성)
- `handle_new_user` 트리거 — 회원가입 시 profiles 자동 생성
- 모든 테이블에 **RLS 활성화** + `auth.uid()` 기반 정책
- write 정책에는 `email_confirmed_at IS NOT NULL` 가드

성공 메시지: `Success. No rows returned`

확인 방법: **Table Editor** 좌측에서 `profiles` 클릭 → 우측 **RLS** 토글이 초록(Enabled) 인지 확인.

---

## 4. 이메일 인증 켜기 (이메일 회원가입에 필수)

좌측 메뉴 **Authentication → Sign In / Up**

- **Allow new users to sign up** ✅
- **Confirm email** ✅ ← **이걸 반드시 켜세요**
  - 이걸 켜면 이메일/비번으로 가입한 사용자는 인증 메일의 링크를 클릭하기 전까지 세션이 발급되지 않습니다.
  - RLS 정책도 세션이 없으면 자동 거부 → 이메일 검증 안 된 사용자는 모든 데이터 접근 차단.
- **Secure email change** ✅ (권장)
- **Minimum password length** = 8

그리고 **Authentication → Rate Limits** 에서 1시간당 메일 발송 횟수가 무료 계정에서는 4통/시간으로 제한되니 테스트할 때 주의.

---

## 5. URL 화이트리스트 등록

좌측 메뉴 **Authentication → URL Configuration**

| 항목 | 로컬 개발 | ngrok (모바일 테스트) | 운영(예시) |
| --- | --- | --- | --- |
| **Site URL** | `http://localhost:3000` | (변경 불필요, Redirect URLs 만 추가) | `https://baroer.app` |
| **Redirect URLs** (한 줄에 하나씩) | `http://localhost:3000/auth/callback` | `https://<your-subdomain>.ngrok-free.dev/auth/callback` | `https://baroer.app/auth/callback`, `https://*.vercel.app/auth/callback` |

> 본 프로젝트의 ngrok 예약 도메인 예시: `https://jonas-unremanded-lanny.ngrok-free.dev/auth/callback`
> 하나라도 누락되면 OAuth/이메일 인증 후 "redirect URL not allowed" 에러로 떨어집니다.
> 
> **모든 환경의 redirect URL 을 미리 다 등록해 두세요** (로컬 + ngrok + 운영). Supabase 는 화이트리스트 비교만 하므로, 등록만 해 두면 어느 환경에서든 동작합니다.

---

## 6. Google OAuth 연결

### 6-1. (사전) Supabase 의 Callback URL 미리 복사

Google 콘솔에서 입력할 값을 미리 확보합니다.

1. Supabase 대시보드 → **Authentication → Providers → Google** 항목 펼치기
2. **Callback URL (for OAuth)** 표시: `https://<your-project-id>.supabase.co/auth/v1/callback`
3. 메모장에 복사

### 6-2. Google Cloud Console — 프로젝트 + OAuth 동의화면

1. <https://console.cloud.google.com> → 상단 좌측 프로젝트 드롭다운 → **새 프로젝트**
   - 이름: `BaroER` (자유) → **만들기**
2. 좌측 메뉴 → **APIs & Services → OAuth consent screen** (한국어: "OAuth 동의 화면")
3. **User Type 선택**:
   - 일반 Gmail 테스트면 **External (외부)**
   - Google Workspace 사용 중이면 **Internal (내부)**
4. 폼 작성:
   | 필드 | 값 |
   | --- | --- |
   | 앱 이름 | `바로응급실` |
   | 사용자 지원 이메일 | 본인 Gmail |
   | 앱 도메인 → 홈페이지 | ngrok 또는 운영 도메인 |
   | 개발자 연락처 | 본인 이메일 |
5. **Scopes**: 기본값(이메일/프로필) → 저장 후 계속
6. **Test users** (External 인 경우): 로그인 테스트할 본인/팀원 Gmail 등록 (최대 100명)
7. 게시 상태는 **테스트 중** 유지 (운영 시에는 "앱 게시" → Google 검증)

### 6-3. Google Cloud Console — OAuth 클라이언트 발급

1. 좌측 메뉴 → **APIs & Services → 사용자 인증 정보 (Credentials)** (또는 좌측 메뉴 "클라이언트")
2. 상단 **+ 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
3. **애플리케이션 유형: 웹 애플리케이션**
4. 이름: `BaroER Web`
5. **승인된 JavaScript 원본** (선택, 권장):
   ```
   https://<your-subdomain>.ngrok-free.dev
   http://localhost:3000
   ```
6. **승인된 리디렉션 URI** ← **반드시 입력**:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
   (6-1 에서 복사한 값을 그대로 붙여넣기)
7. **만들기** → 모달에 표시된 **클라이언트 ID** 와 **클라이언트 보안 비밀번호** 둘 다 복사

### 6-4. Supabase 대시보드 작업

좌측 **Authentication → Providers → Google**

- **Enable Sign in with Google** ✅
- **Client ID (for OAuth)**: 6-3 에서 복사한 클라이언트 ID
- **Client Secret (for OAuth)**: 6-3 에서 복사한 클라이언트 보안 비밀번호
- **Save**

> 6-1 단계에서 본 Callback URL 과 6-3 단계의 승인된 리디렉션 URI 가 **완전히 동일**해야 합니다 (끝 슬래시·http/https·프로젝트 ID 모두 일치).

---

## 7. Kakao OAuth 연결

### 7-1. (사전) Supabase 의 Callback URL 미리 복사

1. Supabase → **Authentication → Providers → Kakao** 항목 펼치기
2. **Callback URL (for OAuth)** 표시 — 메모장에 복사

### 7-2. Kakao Developers 작업

1. <https://developers.kakao.com> → 내 애플리케이션 → **애플리케이션 추가**
   - 앱 이름: `바로응급실`, 사업자명/카테고리 입력
2. **앱 설정 → 플랫폼 → Web 플랫폼 등록**:
   - 사이트 도메인:
     ```
     https://<your-subdomain>.ngrok-free.dev
     http://localhost:3000
     ```
3. **앱 키** 탭에서 **REST API 키** 복사 (= Supabase 의 Client ID 값으로 사용)
4. **제품 설정 → 카카오 로그인** 메뉴
   - 활성화 설정: ON
   - **Redirect URI** 추가: 7-1 에서 복사한 Supabase Callback URL
5. **카카오 로그인 → 보안** 에서 **Client Secret 코드 생성** → 활성화 상태 **사용함** → 코드 복사
6. **카카오 로그인 → 동의항목** 에서:
   - **카카오계정(이메일)**: 필수 동의 (Supabase 가 이메일로 사용자 식별)
   - **닉네임**: 선택 동의

### 7-3. Supabase 대시보드 작업

좌측 **Authentication → Providers → Kakao**

- **Enable Sign in with Kakao** ✅
- **Client ID**: 7-2 의 **REST API 키**
- **Client Secret**: 7-2 의 **Client Secret 코드**
- **Save**

---

## 8. (선택) 한국어 이메일 템플릿

좌측 **Authentication → Email Templates**

기본 영문 템플릿을 한국어로 바꾸면 사용자 경험이 크게 좋아집니다.

예: **Confirm signup** 템플릿

```
제목: [BaroER] 이메일 주소를 확인해 주세요

안녕하세요!
바로응급실(BaroER) 가입을 환영합니다.

아래 링크를 클릭해 이메일 주소를 확인하시면 바로 사용을 시작할 수 있습니다.

{{ .ConfirmationURL }}

본인이 가입한 게 아니라면 이 메일은 무시하셔도 됩니다.
```

> Free tier 는 Supabase 의 공용 SMTP 를 사용 (시간당 발송량 제한 있음).
> 운영 단계에서는 **SMTP** 메뉴에서 SendGrid / AWS SES / Resend 등으로 교체 권장.

---

## 9. 로컬에서 동작 확인

```powershell
npm run dev
```

1. <http://localhost:3000/register> 진입
2. 이메일/비번/닉네임 입력 → "계정 만들기"
3. → `/verify-email?email=...` 화면 (인증 안내)
4. 입력한 이메일함에서 메일 확인 → 링크 클릭
5. → `/auth/callback` 으로 리다이렉트 → 자동으로 `/home` 진입
6. **Supabase Table Editor → profiles** 에서 본인 행이 자동 생성됐는지 확인

OAuth 테스트는 **카카오/Google 버튼 클릭 → 동의 화면 → /home 도착** 흐름 확인.

---

## 10. 문제가 생기면

| 증상 | 원인/해결 |
| --- | --- |
| `redirect URL not allowed` | **5번** Redirect URLs 에 현재 origin 미등록 |
| `Email not confirmed` 로 로그인 거부 | 정상 동작 — 받은 메일의 링크를 먼저 클릭해야 함 |
| 메일이 안 옴 | 스팸함 확인 / Free tier rate limit (4통/시간) 대기 |
| `new row violates row-level security policy` | RLS 정책에서 거부됨 — 보통 `auth.uid()` 가 `user_id` 와 다른 케이스 |
| Google/Kakao 로그인 후 빈 닉네임 | OAuth 가입자는 user_metadata 에 `full_name` 만 있을 수 있음 → trigger 가 자동 채움. 그래도 비어 있다면 **profiles** 에서 직접 입력 |
| Google `redirect_uri_mismatch` 400 | 6-1 의 Supabase Callback URL 과 6-3 의 승인된 리디렉션 URI 가 정확히 일치하지 않음. 끝 슬래시(`/`)·프로젝트 ID·http/https 모두 검사 |
| Google `Access blocked: This app's request is invalid` | OAuth 동의화면 미설정 또는 External + Testing 모드인데 Test users 에 로그인 계정 미등록 |
| Google `unauthorized_client` | Supabase 에 Client ID/Secret 잘못 입력 |
| Kakao `KOE006` (등록되지 않은 도메인) | 7-2 의 **Web 플랫폼 사이트 도메인** 에 현재 origin 미등록 |
| Kakao `KOE320` (Redirect URI 불일치) | 7-2 의 **Redirect URI** 와 Supabase Callback URL 이 정확히 일치하지 않음 |
| 무한 리다이렉트 (`/login` ↔ `/home`) | `.env` 의 `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` 미설정 또는 잘못 입력 — `npm run dev` 재시작 후 확인 |

---

## 부록: 데이터 보안 요약

- **anon key 가 노출돼도 안전한 이유**: 모든 테이블에 RLS 가 켜져 있고, 정책은 `auth.uid()` (= 인증된 사용자 본인) 만 통과시킵니다. 인증 안 된 anon 키 단독으로는 **읽기/쓰기 모두 거부**됩니다.
- **service_role 키는 절대 클라이언트에 노출 금지**: RLS 를 우회하므로 서버(Route Handler / Server Action) 전용. 코드에서는 `src/lib/supabase/server.ts` 의 `createAdminClient()` 만 사용.
- **이메일 검증 안 된 사용자**: "Confirm email" 옵션 + write 정책의 `email_confirmed_at IS NOT NULL` 가드 — 이중 안전망으로 차단.
