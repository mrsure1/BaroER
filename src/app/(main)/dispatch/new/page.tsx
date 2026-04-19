"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Ambulance,
  HeartPulse,
  Lock,
  MapPin,
  Save,
  Stethoscope,
  User,
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
  type DispatchReport,
  type Consciousness,
  type DispatchReason,
  type KTAS,
  type TreatmentId,
} from "@/stores/dispatchReportsStore";
import { useAuthStore } from "@/stores/authStore";
import { createReport, getReport, updateReport } from "@/services/dispatchReports";
import { cn } from "@/lib/cn";

/**
 * 구급활동일지 작성 폼.
 * 구조는 국내 119 구급활동일지 + KTAS 분류 + 활력징후 표준 순서.
 *
 *   1) 출동 정보
 *   2) 환자 기본 정보
 *   3) 주 증상 + 의식상태 + KTAS
 *   4) 활력 징후 (BP, HR, RR, SpO2, Temp, Glucose)
 *   5) 처치 내역 (체크박스)
 *   6) 이송 정보
 *   7) 특이사항
 */
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

  // 수정 모드: supabase 에서 단건 fetch
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

  // 최초 작성 시 작성자 / 소속 프리필
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

  // 비-구급대원 가드 — 작성/수정 자체를 막아 안내한다.
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

  const onQuickNow = (key: keyof Pick<
    typeof form,
    "dispatchedAt" | "arrivedSceneAt" | "departSceneAt" | "arrivedHospitalAt"
  >) => {
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    set(key, iso);
  };

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

        {/* 4) 활력 징후 */}
        <Section Icon={HeartPulse} title="활력 징후">
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

        {/* 5) 처치 */}
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
              placeholder="투여 약물, 용량, 특이 반응 등"
              value={form.treatmentMemo}
              onChange={(e) => set("treatmentMemo", e.target.value)}
            />
          </div>
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-5 py-3 backdrop-blur">
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
