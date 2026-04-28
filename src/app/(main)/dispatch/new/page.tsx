"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  HeartPulse,
  Lock,
  MapPin,
  Phone,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextareaField } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  CONSCIOUSNESS_OPTIONS,
  DISPATCH_REASONS,
  KTAS_OPTIONS,
  TREATMENT_OPTIONS,
  createEmptyReport,
  type CprTimeline,
  type DispatchReport,
  type DispatchReason,
  type HospitalContact,
  type Consciousness,
  type KTAS,
  type MedicationRecord,
  type TreatmentId,
  type VitalReading,
} from "@/stores/dispatchReportsStore";
import { useAuthStore } from "@/stores/authStore";
import { createReport, getReport, updateReport } from "@/services/dispatchReports";
import { cn } from "@/lib/cn";

const EMPTY_CPR: CprTimeline = {
  startedAt: "",
  endedAt: "",
  rosc: false,
  roscAt: "",
  aedCount: 0,
};

export default function NewDispatchReportPage() {
  return (
    <Suspense fallback={null}>
      <NewDispatchReportContent />
    </Suspense>
  );
}

function NewDispatchReportContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("id");
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";

  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ["dispatch-report", editId],
    queryFn: () => (editId ? getReport(editId) : Promise.resolve(null)),
    enabled: !!editId && isParamedic,
    staleTime: 0,
  });

  const [form, setForm] = useState<Omit<DispatchReport, "id" | "createdAt" | "updatedAt">>(
    () => createEmptyReport(),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  useEffect(() => {
    if (!existing && user) {
      setForm((prev) => ({
        ...prev,
        crewName: prev.crewName || user.nickname || "",
        unitCode: prev.unitCode || user.orgCode || "",
      }));
    }
  }, [existing, user]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTreatment = (id: TreatmentId) =>
    setForm((prev) => ({
      ...prev,
      treatments: prev.treatments.includes(id)
        ? prev.treatments.filter((t) => t !== id)
        : [...prev.treatments, id],
    }));

  // ── 추가 대원 핸들러 ──────────────────────────────────────────────────────
  const addCrewMember = () =>
    setForm((prev) => ({ ...prev, crewMembers: [...prev.crewMembers, ""] }));
  const updateCrewMember = (idx: number, value: string) =>
    setForm((prev) => ({
      ...prev,
      crewMembers: prev.crewMembers.map((m, i) => (i === idx ? value : m)),
    }));
  const removeCrewMember = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      crewMembers: prev.crewMembers.filter((_, i) => i !== idx),
    }));

  // ── 시계열 활력징후 핸들러 ────────────────────────────────────────────────
  const addVitalReading = () =>
    setForm((prev) => ({
      ...prev,
      vitalSeries: [
        ...prev.vitalSeries,
        {
          id: `v-${Date.now()}`,
          measuredAt: "",
          bpSystolic: "",
          bpDiastolic: "",
          pulse: "",
          resp: "",
          spo2: "",
          temp: "",
          glucose: "",
          note: "",
        },
      ],
    }));
  const updateVitalReading = (id: string, field: keyof VitalReading, value: string) =>
    setForm((prev) => ({
      ...prev,
      vitalSeries: prev.vitalSeries.map((v) =>
        v.id === id ? { ...v, [field]: value } : v,
      ),
    }));
  const removeVitalReading = (id: string) =>
    setForm((prev) => ({
      ...prev,
      vitalSeries: prev.vitalSeries.filter((v) => v.id !== id),
    }));

  // ── 약물 투여 핸들러 ──────────────────────────────────────────────────────
  const addMedication = () =>
    setForm((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          id: `m-${Date.now()}`,
          name: "",
          dose: "",
          route: "" as const,
          administeredAt: "",
          note: "",
        },
      ],
    }));
  const updateMedication = (id: string, field: keyof MedicationRecord, value: string) =>
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    }));
  const removeMedication = (id: string) =>
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m.id !== id),
    }));

  // ── 병원 사전 연락 핸들러 ─────────────────────────────────────────────────
  const addHospitalContact = () =>
    setForm((prev) => ({
      ...prev,
      hospitalContacts: [
        ...prev.hospitalContacts,
        {
          id: `hc-${Date.now()}`,
          hospitalName: "",
          contactedAt: "",
          accepted: null,
          refusalReason: "",
        },
      ],
    }));
  const updateHospitalContact = (
    id: string,
    field: keyof HospitalContact,
    value: string | boolean | null,
  ) =>
    setForm((prev) => ({
      ...prev,
      hospitalContacts: prev.hospitalContacts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  const removeHospitalContact = (id: string) =>
    setForm((prev) => ({
      ...prev,
      hospitalContacts: prev.hospitalContacts.filter((c) => c.id !== id),
    }));

  // ── CPR 핸들러 ────────────────────────────────────────────────────────────
  const setCpr = <K extends keyof CprTimeline>(key: K, value: CprTimeline[K]) =>
    setForm((prev) => ({
      ...prev,
      cpr: { ...(prev.cpr ?? EMPTY_CPR), [key]: value },
    }));

  const onSave = async () => {
    if (!isParamedic || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editId) {
        await updateReport(editId, form);
      } else {
        await createReport(form);
      }
      router.push("/dispatch?tab=dispatch");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (!isParamedic) {
    return (
      <>
        <ScreenHeader title="구급 리포트 작성" back />
        <div className="mx-auto w-full max-w-[520px] px-5">
          <Card className="mt-6 p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-2 text-text-muted">
              <Lock className="size-6" />
            </div>
            <h2 className="mt-3 text-[16px] font-bold text-text">
              구급대원 전용 기능이에요
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
              구급활동일지 작성은 구급대원 계정에서만 가능해요.
              <br />
              프로필에서 사용자 유형을 구급대원으로 변경해 주세요.
            </p>
            <Link
              href="/settings/profile"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-fg shadow-[var(--shadow-md)]"
            >
              프로필로 이동
            </Link>
          </Card>
        </div>
      </>
    );
  }

  if (editId && existingLoading) {
    return (
      <>
        <ScreenHeader title="리포트 수정" back />
        <div className="mx-auto w-full max-w-[520px] px-5 pt-10 text-center text-[13px] text-text-muted">
          불러오는 중…
        </div>
      </>
    );
  }

  const onQuickNow = (
    key: keyof Pick<
      typeof form,
      "dispatchedAt" | "arrivedSceneAt" | "departSceneAt" | "arrivedHospitalAt"
    >,
  ) => {
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    set(key, iso);
  };

  const nowIso = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  };

  const hasCpr = form.treatments.includes("cpr");
  const hasDrug = form.treatments.includes("drug");

  return (
    <>
      <ScreenHeader
        title={editId ? "리포트 수정" : "구급 리포트 작성"}
        subtitle="구급활동일지 기반"
        back
      />
      <form
        className="mx-auto w-full max-w-[640px] space-y-6 px-5 pb-32"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        {/* 1) 출동 정보 */}
        <Section Icon={Ambulance} title="출동 정보">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="출동 번호"
              placeholder="예: 2026-041901"
              value={form.dispatchNo}
              onChange={(e) => set("dispatchNo", e.target.value)}
            />
            <Field
              label="차량번호"
              placeholder="예: 119-1234"
              value={form.vehicleNo}
              onChange={(e) => set("vehicleNo", e.target.value)}
            />
            <Field
              label="소속"
              placeholder="예: 강남119안전센터"
              value={form.unitCode}
              onChange={(e) => set("unitCode", e.target.value)}
            />
            <Field
              label="작성자"
              placeholder="이름"
              value={form.crewName}
              onChange={(e) => set("crewName", e.target.value)}
            />
          </div>

          {/* 추가 대원 */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[12px] font-semibold text-text-muted">
                추가 대원
              </span>
              <button
                type="button"
                onClick={addCrewMember}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-muted hover:bg-border"
              >
                <Plus className="size-3" /> 추가
              </button>
            </div>
            {form.crewMembers.length === 0 ? (
              <p className="text-[12px] text-text-subtle">
                추가 대원이 없으면 건너뛰세요.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {form.crewMembers.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateCrewMember(idx, e.target.value)}
                      placeholder={`대원 ${idx + 1} 이름`}
                      className="h-10 flex-1 rounded-[var(--radius-md)] border border-border bg-bg px-3 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <button
                      type="button"
                      onClick={() => removeCrewMember(idx)}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-text-subtle hover:bg-surface-2"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <TimeField
              label="출동 시각"
              value={form.dispatchedAt}
              onChange={(v) => set("dispatchedAt", v)}
              onNow={() => onQuickNow("dispatchedAt")}
            />
            <TimeField
              label="현장 도착"
              value={form.arrivedSceneAt}
              onChange={(v) => set("arrivedSceneAt", v)}
              onNow={() => onQuickNow("arrivedSceneAt")}
            />
            <TimeField
              label="현장 출발"
              value={form.departSceneAt}
              onChange={(v) => set("departSceneAt", v)}
              onNow={() => onQuickNow("departSceneAt")}
            />
            <TimeField
              label="병원 도착"
              value={form.arrivedHospitalAt}
              onChange={(v) => set("arrivedHospitalAt", v)}
              onNow={() => onQuickNow("arrivedHospitalAt")}
            />
          </div>

          <div className="mt-3">
            <Field
              label="현장 주소"
              placeholder="예: 서울 강남구 테헤란로 123"
              value={form.sceneAddress}
              onChange={(e) => set("sceneAddress", e.target.value)}
            />
          </div>
        </Section>

        {/* 2) 환자 정보 */}
        <Section Icon={User} title="환자 정보">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="성명"
              placeholder="신원 미상은 빈칸"
              value={form.patientName}
              onChange={(e) => set("patientName", e.target.value)}
            />
            <div>
              <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
                성별
              </span>
              <Card className="grid grid-cols-3 gap-1 p-1">
                {(
                  [
                    { v: "M", label: "남" },
                    { v: "F", label: "여" },
                    { v: "", label: "미상" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => set("patientGender", o.v)}
                    className={cn(
                      "rounded-[calc(var(--radius-md)-4px)] py-2 text-[13px] font-medium transition-colors",
                      form.patientGender === o.v
                        ? "bg-primary text-primary-fg"
                        : "text-text-muted",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </Card>
            </div>
            <Field
              label="나이"
              placeholder="예: 45 또는 추정"
              value={form.patientAge}
              onChange={(e) => set("patientAge", e.target.value)}
            />
            <Field
              label="연락처"
              placeholder="보호자 연락처"
              value={form.patientContact}
              onChange={(e) => set("patientContact", e.target.value)}
            />
          </div>
          <div className="mt-3">
            <Field
              label="자택 주소"
              value={form.patientAddress}
              onChange={(e) => set("patientAddress", e.target.value)}
            />
          </div>
        </Section>

        {/* 3) 주 증상 + 의식 + KTAS */}
        <Section Icon={Stethoscope} title="주 증상 / 의식 상태 / 분류">
          <TextareaField
            label="주 증상 (Chief Complaint)"
            placeholder="예: 전흉부 쥐어짜는 통증 30분 지속"
            value={form.chiefComplaint}
            onChange={(e) => set("chiefComplaint", e.target.value)}
          />

          <div className="mt-3">
            <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
              사고/발병 유형
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DISPATCH_REASONS.map((r) => (
                <Chip
                  key={r}
                  active={form.reason === r}
                  onClick={() =>
                    set("reason", (form.reason === r ? "" : r) as DispatchReason | "")
                  }
                >
                  {r}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
              의식 상태 (AVPU)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {CONSCIOUSNESS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    set(
                      "consciousness",
                      (form.consciousness === o.value ? "" : o.value) as
                        | Consciousness
                        | "",
                    )
                  }
                  className={cn(
                    "rounded-[var(--radius-md)] border px-2 py-2.5 text-center transition-colors",
                    form.consciousness === o.value
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-bg",
                  )}
                  title={o.desc}
                >
                  <div className="text-[15px] font-bold text-text">{o.value}</div>
                  <div className="text-[10.5px] text-text-muted">{o.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
              KTAS 분류
            </span>
            <div className="flex flex-col gap-1.5">
              {KTAS_OPTIONS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() =>
                    set("ktas", (form.ktas === k.value ? 0 : k.value) as KTAS | 0)
                  }
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors",
                    form.ktas === k.value
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-bg",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full text-[13px] font-bold text-white",
                        k.tone === "critical" && "bg-status-full",
                        k.tone === "warn" && "bg-status-busy",
                        k.tone === "info" && "bg-primary",
                        k.tone === "ok" && "bg-status-available",
                      )}
                    >
                      {k.value}
                    </span>
                    <span className="text-[13.5px] font-medium text-text">
                      {k.label}
                    </span>
                  </span>
                  {form.ktas === k.value && (
                    <span className="text-[12px] text-primary">선택됨</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* 4) 활력 징후 — 1차 측정 */}
        <Section Icon={HeartPulse} title="활력 징후 (1차 측정)">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="수축기 혈압"
              inputMode="numeric"
              suffix="mmHg"
              value={form.vitals.bpSystolic}
              onChange={(e) =>
                set("vitals", { ...form.vitals, bpSystolic: e.target.value })
              }
            />
            <Field
              label="이완기 혈압"
              inputMode="numeric"
              suffix="mmHg"
              value={form.vitals.bpDiastolic}
              onChange={(e) =>
                set("vitals", { ...form.vitals, bpDiastolic: e.target.value })
              }
            />
            <Field
              label="맥박"
              inputMode="numeric"
              suffix="bpm"
              value={form.vitals.pulse}
              onChange={(e) =>
                set("vitals", { ...form.vitals, pulse: e.target.value })
              }
            />
            <Field
              label="호흡"
              inputMode="numeric"
              suffix="/분"
              value={form.vitals.resp}
              onChange={(e) =>
                set("vitals", { ...form.vitals, resp: e.target.value })
              }
            />
            <Field
              label="SpO₂"
              inputMode="numeric"
              suffix="%"
              value={form.vitals.spo2}
              onChange={(e) =>
                set("vitals", { ...form.vitals, spo2: e.target.value })
              }
            />
            <Field
              label="체온"
              inputMode="decimal"
              suffix="℃"
              value={form.vitals.temp}
              onChange={(e) =>
                set("vitals", { ...form.vitals, temp: e.target.value })
              }
            />
            <Field
              label="혈당"
              inputMode="numeric"
              suffix="mg/dL"
              value={form.vitals.glucose}
              onChange={(e) =>
                set("vitals", { ...form.vitals, glucose: e.target.value })
              }
            />
          </div>
        </Section>

        {/* 4-2) 시계열 활력징후 — 추가 측정 */}
        <Section Icon={HeartPulse} title="추가 활력징후 측정">
          <p className="mb-3 text-[12px] text-text-muted">
            이송 중 반복 측정한 활력징후를 추가하세요. (현장 도착 이후 매 5분 권장)
          </p>
          {form.vitalSeries.map((v, idx) => (
            <VitalReadingCard
              key={v.id}
              reading={v}
              index={idx}
              onNow={() =>
                updateVitalReading(v.id, "measuredAt", nowIso())
              }
              onChange={(field, value) => updateVitalReading(v.id, field, value)}
              onRemove={() => removeVitalReading(v.id)}
            />
          ))}
          <button
            type="button"
            onClick={addVitalReading}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border py-2.5 text-[13px] font-medium text-text-muted hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" />
            측정값 추가
          </button>
        </Section>

        {/* 5) 처치 내역 */}
        <Section Icon={Activity} title="처치 내역">
          <div className="flex flex-wrap gap-1.5">
            {TREATMENT_OPTIONS.map((t) => (
              <Chip
                key={t.id}
                active={form.treatments.includes(t.id)}
                onClick={() => toggleTreatment(t.id)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="mt-3">
            <TextareaField
              label="처치 메모"
              placeholder="특이 반응, 기타 처치 내용"
              value={form.treatmentMemo}
              onChange={(e) => set("treatmentMemo", e.target.value)}
            />
          </div>

          {/* CPR 타임라인 — 심폐소생술 선택 시 표시 */}
          {hasCpr && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-status-full/30 bg-status-full-soft p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-status-full">
                <AlertTriangle className="size-3.5" />
                CPR 타임라인
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TimeField
                  label="CPR 시작"
                  value={form.cpr?.startedAt ?? ""}
                  onChange={(v) => setCpr("startedAt", v)}
                  onNow={() => setCpr("startedAt", nowIso())}
                />
                <TimeField
                  label="CPR 종료"
                  value={form.cpr?.endedAt ?? ""}
                  onChange={(v) => setCpr("endedAt", v)}
                  onNow={() => setCpr("endedAt", nowIso())}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
                    AED 제세동 횟수
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.cpr?.aedCount ?? 0}
                    onChange={(e) => setCpr("aedCount", Number(e.target.value))}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </label>
                <div>
                  <span className="mb-1 block px-0.5 text-[12px] font-semibold text-text-muted">
                    ROSC (자발순환회복)
                  </span>
                  <Card className="grid grid-cols-2 gap-1 p-1">
                    {[
                      { v: true, label: "있음" },
                      { v: false, label: "없음" },
                    ].map((o) => (
                      <button
                        key={String(o.v)}
                        type="button"
                        onClick={() => setCpr("rosc", o.v)}
                        className={cn(
                          "rounded-[calc(var(--radius-md)-4px)] py-2 text-[13px] font-medium transition-colors",
                          (form.cpr?.rosc ?? false) === o.v
                            ? "bg-primary text-primary-fg"
                            : "text-text-muted",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </Card>
                </div>
              </div>
              {form.cpr?.rosc && (
                <div className="mt-2">
                  <TimeField
                    label="ROSC 시각"
                    value={form.cpr?.roscAt ?? ""}
                    onChange={(v) => setCpr("roscAt", v)}
                    onNow={() => setCpr("roscAt", nowIso())}
                  />
                </div>
              )}
            </div>
          )}

          {/* 약물 투여 상세 — 약물 투여 선택 시 표시 */}
          {hasDrug && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="text-[12px] font-bold text-text">
                  약물 투여 상세
                </span>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-fg"
                >
                  <Plus className="size-3" /> 약물 추가
                </button>
              </div>
              {form.medications.length === 0 ? (
                <p className="text-[12px] text-text-subtle">
                  약물 추가 버튼을 눌러 투여 내역을 기록하세요.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {form.medications.map((med) => (
                    <MedicationCard
                      key={med.id}
                      medication={med}
                      onNow={() =>
                        updateMedication(med.id, "administeredAt", nowIso())
                      }
                      onChange={(field, value) =>
                        updateMedication(med.id, field, value)
                      }
                      onRemove={() => removeMedication(med.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* 5-2) 병원 사전 연락 */}
        <Section Icon={Phone} title="병원 사전 연락">
          <p className="mb-3 text-[12px] text-text-muted">
            이송 전 병원에 연락한 내용을 기록하세요. 수용 거부 시 거부 사유도 남겨두세요.
          </p>
          {form.hospitalContacts.map((c) => (
            <HospitalContactCard
              key={c.id}
              contact={c}
              onNow={() => updateHospitalContact(c.id, "contactedAt", nowIso())}
              onChange={(field, value) => updateHospitalContact(c.id, field, value)}
              onRemove={() => removeHospitalContact(c.id)}
            />
          ))}
          <button
            type="button"
            onClick={addHospitalContact}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border py-2.5 text-[13px] font-medium text-text-muted hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" />
            연락 내역 추가
          </button>
        </Section>

        {/* 6) 이송 */}
        <Section Icon={MapPin} title="이송 정보">
          <Field
            label="이송 병원"
            placeholder="예: 서울대학교병원"
            value={form.destinationHospital}
            onChange={(e) => set("destinationHospital", e.target.value)}
          />
          <div className="mt-3">
            <TextareaField
              label="이송 사유 / 인계 내용"
              placeholder="이송 병원 선정 사유, 인계 사항"
              value={form.transportMemo}
              onChange={(e) => set("transportMemo", e.target.value)}
            />
          </div>

          {/* 이송 거부 */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between px-0.5">
              <span className="text-[12px] font-semibold text-text-muted">
                이송 거부 여부
              </span>
            </div>
            <Card className="grid grid-cols-2 gap-1 p-1">
              {[
                { v: false, label: "이송 완료" },
                { v: true, label: "이송 거부" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => set("transportRefused", o.v)}
                  className={cn(
                    "rounded-[calc(var(--radius-md)-4px)] py-2 text-[13px] font-medium transition-colors",
                    form.transportRefused === o.v
                      ? o.v
                        ? "bg-status-busy text-white"
                        : "bg-primary text-primary-fg"
                      : "text-text-muted",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </Card>
            {form.transportRefused && (
              <div className="mt-3 space-y-2">
                <TextareaField
                  label="거부 사유"
                  placeholder="환자 / 보호자가 이송을 거부한 사유"
                  value={form.transportRefusalReason}
                  onChange={(e) => set("transportRefusalReason", e.target.value)}
                />
                <label className="flex cursor-pointer items-center gap-2 px-0.5">
                  <input
                    type="checkbox"
                    checked={form.transportRefusalSigned}
                    onChange={(e) =>
                      set("transportRefusalSigned", e.target.checked)
                    }
                    className="size-4 accent-primary"
                  />
                  <span className="text-[13px] text-text-muted">
                    거부 서명 완료
                  </span>
                </label>
              </div>
            )}
          </div>
        </Section>

        {/* 7) 특이사항 */}
        <Section title="특이사항" Icon={Stethoscope}>
          <TextareaField
            label="특이사항 / 보호자 동행 / 기타"
            placeholder="자유 기술"
            rows={4}
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
          />
        </Section>

        {/* Sticky bottom actions */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
          <div className="mx-auto max-w-[640px]">
            {saveError && (
              <p className="mb-2 rounded-[var(--radius-sm)] bg-status-full-soft px-3 py-2 text-[12px] text-status-full">
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={saving}
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                fullWidth
                loading={saving}
                leftIcon={<Save className="size-4" />}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function Section({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon className="size-4 text-primary" />
        <h2 className="text-[14.5px] font-bold text-text">{title}</h2>
      </div>
      <Card className="p-4">{children}</Card>
    </section>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-bg text-text hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function TimeField({
  label,
  value,
  onChange,
  onNow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onNow: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between px-0.5 text-[12px] font-semibold text-text-muted">
        <span>{label}</span>
        <button
          type="button"
          onClick={onNow}
          className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-text hover:bg-surface"
        >
          지금
        </button>
      </span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
    </label>
  );
}

/** 추가 활력징후 측정 카드 */
function VitalReadingCard({
  reading,
  index,
  onNow,
  onChange,
  onRemove,
}: {
  reading: VitalReading;
  index: number;
  onNow: () => void;
  onChange: (field: keyof VitalReading, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 rounded-[var(--radius-md)] border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-text">
          {index + 2}차 측정
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-7 place-items-center rounded-full text-text-subtle hover:bg-surface-2"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="mb-2">
        <TimeField
          label="측정 시각"
          value={reading.measuredAt}
          onChange={(v) => onChange("measuredAt", v)}
          onNow={onNow}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { field: "bpSystolic" as const, label: "수축기", suffix: "mmHg" },
          { field: "bpDiastolic" as const, label: "이완기", suffix: "mmHg" },
          { field: "pulse" as const, label: "맥박", suffix: "bpm" },
          { field: "resp" as const, label: "호흡", suffix: "/분" },
          { field: "spo2" as const, label: "SpO₂", suffix: "%" },
          { field: "glucose" as const, label: "혈당", suffix: "mg/dL" },
        ].map((f) => (
          <label key={f.field} className="block">
            <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
              {f.label}
            </span>
            <div className="flex h-9 items-center rounded-[var(--radius-sm)] border border-border bg-bg px-2">
              <input
                type="text"
                inputMode="decimal"
                value={reading[f.field]}
                onChange={(e) => onChange(f.field, e.target.value)}
                className="w-full bg-transparent text-[13px] text-text focus:outline-none"
              />
              <span className="ml-1 shrink-0 text-[10px] text-text-subtle">
                {f.suffix}
              </span>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-2">
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
            메모
          </span>
          <input
            type="text"
            value={reading.note}
            onChange={(e) => onChange("note", e.target.value)}
            placeholder="특이 소견"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}

const ROUTE_OPTIONS: Array<{ value: MedicationRecord["route"]; label: string }> = [
  { value: "IV", label: "정맥(IV)" },
  { value: "IM", label: "근육(IM)" },
  { value: "SL", label: "설하(SL)" },
  { value: "PO", label: "경구(PO)" },
  { value: "INH", label: "흡입(INH)" },
];

/** 약물 투여 카드 */
function MedicationCard({
  medication,
  onNow,
  onChange,
  onRemove,
}: {
  medication: MedicationRecord;
  onNow: () => void;
  onChange: (field: keyof MedicationRecord, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-text">약물</span>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-7 place-items-center rounded-full text-text-subtle hover:bg-surface-2"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
            약명
          </span>
          <input
            type="text"
            value={medication.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="예: 에피네프린"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
            용량
          </span>
          <input
            type="text"
            value={medication.dose}
            onChange={(e) => onChange("dose", e.target.value)}
            placeholder="예: 1mg"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {ROUTE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange("route", opt.value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors",
              medication.route === opt.value
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-bg text-text-muted hover:bg-surface-2",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <TimeField
          label="투여 시각"
          value={medication.administeredAt}
          onChange={(v) => onChange("administeredAt", v)}
          onNow={onNow}
        />
      </div>
      <div className="mt-2">
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
            특이 반응
          </span>
          <input
            type="text"
            value={medication.note}
            onChange={(e) => onChange("note", e.target.value)}
            placeholder="이상 반응, 효과 등"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}

/** 병원 사전 연락 카드 */
function HospitalContactCard({
  contact,
  onNow,
  onChange,
  onRemove,
}: {
  contact: HospitalContact;
  onNow: () => void;
  onChange: (
    field: keyof HospitalContact,
    value: string | boolean | null,
  ) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 rounded-[var(--radius-md)] border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-text">연락 내역</span>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-7 place-items-center rounded-full text-text-subtle hover:bg-surface-2"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <label className="block">
        <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
          연락 병원
        </span>
        <input
          type="text"
          value={contact.hospitalName}
          onChange={(e) => onChange("hospitalName", e.target.value)}
          placeholder="예: 강남세브란스병원"
          className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
        />
      </label>
      <div className="mt-2">
        <TimeField
          label="연락 시각"
          value={contact.contactedAt}
          onChange={(v) => onChange("contactedAt", v)}
          onNow={onNow}
        />
      </div>
      <div className="mt-2">
        <span className="mb-1 block text-[11px] font-semibold text-text-muted">
          수용 여부
        </span>
        <Card className="grid grid-cols-3 gap-1 p-1">
          {[
            { v: true, label: "수용" },
            { v: false, label: "거부" },
            { v: null, label: "미확인" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => onChange("accepted", o.v)}
              className={cn(
                "rounded-[calc(var(--radius-md)-4px)] py-1.5 text-[12px] font-medium transition-colors",
                contact.accepted === o.v
                  ? o.v === true
                    ? "bg-status-available text-white"
                    : o.v === false
                      ? "bg-status-full text-white"
                      : "bg-surface-2 text-text"
                  : "text-text-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </Card>
      </div>
      {contact.accepted === false && (
        <div className="mt-2">
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-semibold text-text-muted">
              거부 사유
            </span>
            <input
              type="text"
              value={contact.refusalReason}
              onChange={(e) => onChange("refusalReason", e.target.value)}
              placeholder="예: 응급실 만실"
              className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-[13px] text-text focus:border-primary focus:outline-none"
            />
          </label>
        </div>
      )}
    </div>
  );
}
