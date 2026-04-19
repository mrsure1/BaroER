-- =====================================================================
-- BaroER · 0002 : dispatch_reports 풀 스키마 + 검색 인덱스 + 정책 재조정
--
-- 0001 의 dispatch_reports 는 컬럼 단위로 정형화되어 있었으나,
-- 실 구급활동일지는 활력징후/처치 항목/시각 4종 등 필드가 매우 많고
-- 양식 변경 가능성도 높아, "검색·정렬에 자주 쓰는 핵심 컬럼"만 별도로
-- 두고 나머지는 `payload jsonb` 에 통째로 저장한다.
--
-- 적용 방법
--   Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run
-- =====================================================================

alter table public.dispatch_reports
  add column if not exists payload          jsonb not null default '{}'::jsonb,
  add column if not exists dispatch_no      text,
  add column if not exists patient_name     text,
  add column if not exists patient_age      int,
  add column if not exists chief_complaint  text,
  add column if not exists destination_hospital text,
  add column if not exists ktas             smallint
    check (ktas is null or ktas between 1 and 5),
  add column if not exists updated_at       timestamptz not null default now();

-- updated_at 자동 갱신 (0001 에서 정의된 set_updated_at 함수 재사용)
drop trigger if exists dispatch_reports_set_updated_at on public.dispatch_reports;
create trigger dispatch_reports_set_updated_at
  before update on public.dispatch_reports
  for each row
  execute function public.set_updated_at();

-- 검색 인덱스 — 날짜는 dispatched_at desc 가 0001 에서 이미 있음.
-- chief_complaint / patient_name / destination_hospital 부분 검색은
-- pg_trgm 의 gin_trgm_ops 가 가장 효율적이지만 trgm extension 이 켜진
-- 프로젝트가 적어, 우선 일반 btree 만 둔다 (small list, ilike 클라이언트 필터).
create index if not exists dispatch_reports_user_id_updated_at_idx
  on public.dispatch_reports (user_id, updated_at desc);

-- ---------------------------------------------------------------------
-- RLS 정책 재조정
--   * select : 본인 데이터만
--   * insert : PARAMEDIC 만
--   * update : PARAMEDIC 본인 데이터만
--   * delete : 본인 데이터만 (별도 권한 없이 본인이면 OK)
-- ---------------------------------------------------------------------
drop policy if exists "dispatch_select_own"  on public.dispatch_reports;
drop policy if exists "dispatch_insert_own"  on public.dispatch_reports;
drop policy if exists "dispatch_update_own"  on public.dispatch_reports;
drop policy if exists "dispatch_delete_own"  on public.dispatch_reports;

create policy "dispatch_select_own"
  on public.dispatch_reports for select
  using (auth.uid() = user_id);

create policy "dispatch_insert_own"
  on public.dispatch_reports for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'PARAMEDIC'
    )
  );

create policy "dispatch_update_own"
  on public.dispatch_reports for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'PARAMEDIC'
    )
  );

create policy "dispatch_delete_own"
  on public.dispatch_reports for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- END
-- =====================================================================
