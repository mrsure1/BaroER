-- =====================================================================
-- BaroER · 초기 스키마 + RLS
--
-- 적용 방법
--   1) Supabase 대시보드 > SQL Editor > New query 에 통째로 붙여넣고 Run
--   2) 또는 supabase CLI: `supabase db push`
--
-- 핵심 원칙
--   * 사용자는 자기 자신의 행만 읽고 쓸 수 있다 (auth.uid() 매칭)
--   * 이메일 회원가입은 Supabase Auth 설정에서 "Confirm email" 을 켤 것.
--     세션 자체가 인증 완료 후에만 생성되므로, RLS 정책은 별도의
--     이메일 검증 컬럼 없이도 안전하다 (인증되지 않은 계정은 세션이
--     없어 auth.uid() 가 NULL → 모든 정책에서 거부됨).
--   * write 정책에는 추가 안전망으로 `auth.email_confirmed_at IS NOT NULL`
--     을 명시적으로 검사 (OAuth 가입자는 자동으로 confirmed 상태)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles — auth.users 1:1 확장 테이블
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  user_type text not null default 'GENERAL'
    check (user_type in ('GENERAL', 'PARAMEDIC')),
  org_code text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_type_idx
  on public.profiles (user_type);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. search_history — 사용자 검색/결과 스냅샷
-- ---------------------------------------------------------------------
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptoms text[] not null default '{}',
  gender text check (gender in ('M', 'F')),
  age_band text check (age_band in ('infant', 'child', 'adolescent', 'adult', 'elderly')),
  notes text,
  lat double precision not null,
  lng double precision not null,
  fallback boolean not null default false,
  top_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists search_history_user_id_created_at_idx
  on public.search_history (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. dispatch_reports — (구급대원) 출동 리포트, MVP 후속
-- ---------------------------------------------------------------------
create table if not exists public.dispatch_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hospital_id text,
  hospital_name text,
  patient_age_band text,
  patient_gender text,
  symptoms text[] not null default '{}',
  notes text,
  outcome text check (outcome in ('accepted', 'rejected', 'transferred', 'unknown')),
  dispatched_at timestamptz not null default now(),
  arrived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dispatch_reports_user_id_dispatched_at_idx
  on public.dispatch_reports (user_id, dispatched_at desc);

-- ---------------------------------------------------------------------
-- 4. signup → profiles 자동 생성 트리거
--    auth.users 에 새 행이 들어오면 동일 id 로 profiles 를 만들고
--    user_metadata 에서 닉네임/유형/조직코드를 옮긴다.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, user_type, org_code, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'user_type', ''), 'GENERAL'),
    nullif(new.raw_user_meta_data ->> 'org_code', ''),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. RLS — Row Level Security
--    "본인 행만 읽기/쓰기, write 시 이메일 인증 필수"
-- ---------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.search_history  enable row level security;
alter table public.dispatch_reports enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and (auth.jwt() ->> 'email_confirmed_at') is not null
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (auth.jwt() ->> 'email_confirmed_at') is not null
  );

-- ---- search_history ----
drop policy if exists "history_select_own" on public.search_history;
drop policy if exists "history_insert_own" on public.search_history;
drop policy if exists "history_delete_own" on public.search_history;

create policy "history_select_own"
  on public.search_history for select
  using (auth.uid() = user_id);

create policy "history_insert_own"
  on public.search_history for insert
  with check (
    auth.uid() = user_id
    and (auth.jwt() ->> 'email_confirmed_at') is not null
  );

create policy "history_delete_own"
  on public.search_history for delete
  using (auth.uid() = user_id);

-- ---- dispatch_reports ----
drop policy if exists "dispatch_select_own" on public.dispatch_reports;
drop policy if exists "dispatch_insert_own" on public.dispatch_reports;
drop policy if exists "dispatch_update_own" on public.dispatch_reports;

create policy "dispatch_select_own"
  on public.dispatch_reports for select
  using (auth.uid() = user_id);

create policy "dispatch_insert_own"
  on public.dispatch_reports for insert
  with check (
    auth.uid() = user_id
    and (auth.jwt() ->> 'email_confirmed_at') is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'PARAMEDIC'
    )
  );

create policy "dispatch_update_own"
  on public.dispatch_reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- END
-- =====================================================================
