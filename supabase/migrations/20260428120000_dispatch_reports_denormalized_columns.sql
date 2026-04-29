-- 구급 리포트 저장 (`src/services/dispatchReports.ts`) 이 기대하는 컬럼을 DB에 맞춘다.
-- Supabase Dashboard → SQL Editor 에서 전체 실행.
--
-- 예: Could not find the 'chief_complaint' column of 'dispatch_reports' in the schema cache

begin;

create table if not exists public.dispatch_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  chief_complaint text,
  patient_name text,
  patient_age integer,
  patient_gender text,
  destination_hospital text,
  hospital_name text,
  ktas integer,
  dispatch_no text,
  dispatched_at timestamptz not null default now(),
  arrived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dispatch_reports add column if not exists chief_complaint text;
alter table public.dispatch_reports add column if not exists payload jsonb;
alter table public.dispatch_reports add column if not exists patient_name text;
alter table public.dispatch_reports add column if not exists patient_age integer;
alter table public.dispatch_reports add column if not exists patient_gender text;
alter table public.dispatch_reports add column if not exists destination_hospital text;
alter table public.dispatch_reports add column if not exists hospital_name text;
alter table public.dispatch_reports add column if not exists ktas integer;
alter table public.dispatch_reports add column if not exists dispatch_no text;
alter table public.dispatch_reports add column if not exists dispatched_at timestamptz;
alter table public.dispatch_reports add column if not exists arrived_at timestamptz;
alter table public.dispatch_reports add column if not exists created_at timestamptz;
alter table public.dispatch_reports add column if not exists updated_at timestamptz;

commit;
