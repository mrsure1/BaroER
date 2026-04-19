"use client";

import { createClient } from "@/lib/supabase/client";
import {
  createEmptyReport,
  type DispatchReport,
} from "@/stores/dispatchReportsStore";

/**
 * dispatch_reports 테이블 client-side CRUD.
 *
 * 저장 전략:
 *   - 자주 검색·정렬에 쓰이는 필드(이름/나이/주증상/병원/KTAS/시각)는 별도 컬럼,
 *   - 그 외 모든 필드는 `payload` jsonb 에 통째로.
 *   - 클라이언트 fromRow / toRow 변환을 통해 컴포넌트는 도메인 타입(DispatchReport)
 *     하나만 알면 되도록 캡슐화.
 *
 * RLS 가 본인-PARAMEDIC 만 insert/update 를 허용하므로, 비-구급대원/비로그인
 * 호출은 PostgREST 가 권한 오류를 반환한다.
 */

const TABLE = "dispatch_reports";

export interface ListFilter {
  /** ISO 날짜(yyyy-mm-dd). dispatched_at >= from 00:00 (local). */
  from?: string;
  /** ISO 날짜(yyyy-mm-dd). dispatched_at <= to 23:59:59 (local). */
  to?: string;
  /** 자유 검색어 — 주증상/이송병원/환자명 ilike. */
  q?: string;
  /** limit (default 100, max 200) */
  limit?: number;
}

interface DbRow {
  id: string;
  user_id: string;
  payload: Record<string, unknown>;
  hospital_name: string | null;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: "M" | "F" | null;
  chief_complaint: string | null;
  destination_hospital: string | null;
  ktas: number | null;
  dispatch_no: string | null;
  dispatched_at: string;
  arrived_at: string | null;
  created_at: string;
  updated_at: string;
}

function toReport(row: DbRow): DispatchReport {
  // payload 가 클라이언트 모델 거의 전부를 가지고 있어 그것을 base 로 두고,
  // 별도 컬럼이 있다면 그 값을 우선시 (insert/update 시 두 군데 모두 채움).
  const base = createEmptyReport();
  const payload = (row.payload ?? {}) as Partial<typeof base>;
  const merged: DispatchReport = {
    ...base,
    ...payload,
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    dispatchNo: row.dispatch_no ?? payload.dispatchNo ?? "",
    patientName: row.patient_name ?? payload.patientName ?? "",
    patientAge: row.patient_age != null ? String(row.patient_age) : payload.patientAge ?? "",
    patientGender: row.patient_gender ?? payload.patientGender ?? "",
    chiefComplaint: row.chief_complaint ?? payload.chiefComplaint ?? "",
    destinationHospital:
      row.destination_hospital ?? payload.destinationHospital ?? "",
    ktas: ((row.ktas ?? payload.ktas) as DispatchReport["ktas"]) ?? 0,
    dispatchedAt: row.dispatched_at
      ? toLocalDatetimeInputValue(row.dispatched_at)
      : payload.dispatchedAt ?? "",
    arrivedHospitalAt: row.arrived_at
      ? toLocalDatetimeInputValue(row.arrived_at)
      : payload.arrivedHospitalAt ?? "",
  };
  return merged;
}

/** ISO -> "yyyy-MM-ddTHH:mm" (input[type=datetime-local]) */
function toLocalDatetimeInputValue(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 16);
}

function parseLocalDatetime(value: string): string | null {
  if (!value) return null;
  // datetime-local 은 시간대가 없는 wall-clock string. 사용자의 로컬 TZ 로 해석.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function ageNumberOrNull(age: string): number | null {
  const m = age.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

interface InsertPayload {
  user_id: string;
  payload: Record<string, unknown>;
  dispatch_no: string | null;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: "M" | "F" | null;
  chief_complaint: string | null;
  destination_hospital: string | null;
  hospital_name: string | null;
  ktas: number | null;
  dispatched_at: string;
  arrived_at: string | null;
}

function buildInsert(
  userId: string,
  form: Omit<DispatchReport, "id" | "createdAt" | "updatedAt">,
): InsertPayload {
  // dispatched_at 필수 (db not null) — 미입력 시 현재 시각으로.
  const dispatchedIso =
    parseLocalDatetime(form.dispatchedAt) ?? new Date().toISOString();
  return {
    user_id: userId,
    payload: form as unknown as Record<string, unknown>,
    dispatch_no: form.dispatchNo || null,
    patient_name: form.patientName || null,
    patient_age: ageNumberOrNull(form.patientAge),
    patient_gender: form.patientGender || null,
    chief_complaint: form.chiefComplaint || null,
    destination_hospital: form.destinationHospital || null,
    hospital_name: form.destinationHospital || null,
    ktas: form.ktas && form.ktas > 0 ? form.ktas : null,
    dispatched_at: dispatchedIso,
    arrived_at: parseLocalDatetime(form.arrivedHospitalAt),
  };
}

export async function createReport(
  form: Omit<DispatchReport, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("로그인이 필요해요.");
  const insert = buildInsert(user.id, form);
  const { data, error } = await supabase
    .from(TABLE)
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateReport(
  id: string,
  form: Omit<DispatchReport, "id" | "createdAt" | "updatedAt">,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("로그인이 필요해요.");
  const insert = buildInsert(user.id, form);
  // user_id 는 update 대상이 아님
  const { user_id: _u, ...rest } = insert;
  void _u;
  const { error } = await supabase.from(TABLE).update(rest).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getReport(id: string): Promise<DispatchReport | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toReport(data as DbRow);
}

export async function listReports(
  filter: ListFilter = {},
): Promise<DispatchReport[]> {
  const supabase = createClient();
  let q = supabase
    .from(TABLE)
    .select("*")
    .order("dispatched_at", { ascending: false })
    .limit(Math.min(filter.limit ?? 100, 200));

  if (filter.from) {
    const fromIso = new Date(`${filter.from}T00:00:00`).toISOString();
    q = q.gte("dispatched_at", fromIso);
  }
  if (filter.to) {
    const toIso = new Date(`${filter.to}T23:59:59.999`).toISOString();
    q = q.lte("dispatched_at", toIso);
  }
  if (filter.q && filter.q.trim()) {
    const term = `%${filter.q.trim().replace(/[%_]/g, (m) => `\\${m}`)}%`;
    // chief_complaint, patient_name, destination_hospital 중 하나라도 매칭
    q = q.or(
      [
        `chief_complaint.ilike.${term}`,
        `patient_name.ilike.${term}`,
        `destination_hospital.ilike.${term}`,
      ].join(","),
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbRow[]).map(toReport);
}
