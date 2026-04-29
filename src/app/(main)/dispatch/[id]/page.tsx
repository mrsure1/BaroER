"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { deleteReport, getReport } from "@/services/dispatchReports";
import {
  CONSCIOUSNESS_OPTIONS,
  KTAS_OPTIONS,
  TREATMENT_OPTIONS,
  type DispatchReport,
} from "@/stores/dispatchReportsStore";
import { cn } from "@/lib/cn";

const treatmentLabel = new Map(TREATMENT_OPTIONS.map((t) => [t.id, t.label]));

export default function DispatchReportViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const user = useAuthStore((s) => s.user);
  const isParamedic = user?.userType === "PARAMEDIC";

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["dispatch-report", id],
    queryFn: () => (id ? getReport(id) : Promise.resolve(null)),
    enabled: !!id && isParamedic,
  });

  const onPrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("이 리포트를 삭제할까요? 되돌릴 수 없어요.")) return;
    await deleteReport(id);
    router.push("/dispatch?tab=dispatch");
  };

  if (!isParamedic) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-5 py-10">
        <Card className="p-6 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-2 text-text-muted">
            <Lock className="size-6" />
          </div>
          <p className="mt-3 text-[15px] font-bold text-text">
            구급대원 전용 문서예요
          </p>
          <p className="mt-1.5 text-[12.5px] text-text-muted">
            구급대원 계정으로 로그인한 후 다시 접근해 주세요.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-5 py-10 text-center text-[13px] text-text-muted">
        불러오는 중…
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-5 py-10">
        <Card className="p-6 text-center text-[13px] text-text-muted">
          {error instanceof Error
            ? error.message
            : "리포트를 찾을 수 없어요."}
          <div className="mt-4">
            <Link
              href="/dispatch?tab=dispatch"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary"
            >
              <ArrowLeft className="size-4" /> 목록으로
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ReportDocumentLayout
      report={report}
      onBack={() => router.push("/dispatch?tab=dispatch")}
      onPrint={onPrint}
      onDelete={onDelete}
    />
  );
}

function ReportDocumentLayout({
  report,
  onBack,
  onPrint,
  onDelete,
}: {
  report: DispatchReport;
  onBack: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  const ktas = KTAS_OPTIONS.find((k) => k.value === report.ktas);
  const consciousness = CONSCIOUSNESS_OPTIONS.find(
    (c) => c.value === report.consciousness,
  );

  const fmtDt = (s: string) => (s ? formatDateTimeKR(s) : "-");
  const v = report.vitals;

  const crewMembers = report.crewMembers ?? [];
  const vitalSeries = report.vitalSeries ?? [];
  const medications = report.medications ?? [];
  const hospitalContacts = report.hospitalContacts ?? [];
  const cpr = report.cpr ?? null;

  return (
    <>
      {/* 화면 전용 액션 바 (인쇄 시 숨김) */}
      <div className="no-print sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="grid size-9 place-items-center rounded-full bg-surface-2 text-text"
            aria-label="뒤로"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
          <h1 className="flex-1 text-[15px] font-bold text-text">구급활동일지</h1>
          <Link href={`/dispatch/new?id=${report.id}`} prefetch={false}>
            <Button size="sm" variant="outline" leftIcon={<Pencil className="size-3.5" />}>
              수정
            </Button>
          </Link>
          <Button size="sm" onClick={onPrint} leftIcon={<Printer className="size-3.5" />}>
            인쇄 / PDF
          </Button>
          <button
            type="button"
            onClick={onDelete}
            className="grid size-9 place-items-center rounded-full text-status-full hover:bg-status-full-soft"
            aria-label="삭제"
          >
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      </div>

      <article className="report-doc mx-auto my-4 w-full max-w-[760px] bg-surface px-6 py-7 text-text shadow-[var(--shadow-sm)] print:my-0 print:max-w-none print:bg-white print:px-0 print:py-0 print:shadow-none">
        <header className="mb-5 flex items-end justify-between border-b-2 border-text pb-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              구급활동일지
            </h1>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Pre-hospital Emergency Care Report · BaroER
            </p>
          </div>
          <div className="text-right text-[11.5px] text-text-muted">
            <div>
              출동번호 ·{" "}
              <span className="font-mono text-text">
                {report.dispatchNo || "-"}
              </span>
            </div>
            <div>
              작성일시 ·{" "}
              <span className="font-mono">
                {formatDateTimeKR(new Date(report.updatedAt).toISOString())}
              </span>
            </div>
          </div>
        </header>

        {/* 출동 정보 */}
        <DocSection title="출동 정보">
          <DocGrid>
            <DocCell label="소속">{report.unitCode || "-"}</DocCell>
            <DocCell label="차량번호">{report.vehicleNo || "-"}</DocCell>
            <DocCell label="작성자">{report.crewName || "-"}</DocCell>
            <DocCell label="추가 대원">
              {crewMembers.length > 0 ? crewMembers.join(", ") : "-"}
            </DocCell>
            <DocCell label="현장 주소" wide>
              {report.sceneAddress || "-"}
            </DocCell>
          </DocGrid>
          <DocGrid>
            <DocCell label="출동 시각">{fmtDt(report.dispatchedAt)}</DocCell>
            <DocCell label="현장 도착">{fmtDt(report.arrivedSceneAt)}</DocCell>
            <DocCell label="현장 출발">{fmtDt(report.departSceneAt)}</DocCell>
            <DocCell label="병원 도착">{fmtDt(report.arrivedHospitalAt)}</DocCell>
          </DocGrid>
        </DocSection>

        {/* 환자 정보 */}
        <DocSection title="환자 정보">
          <DocGrid>
            <DocCell label="성명">{report.patientName || "신원 미상"}</DocCell>
            <DocCell label="성별">
              {report.patientGender === "M"
                ? "남"
                : report.patientGender === "F"
                  ? "여"
                  : "미상"}
            </DocCell>
            <DocCell label="나이">
              {report.patientAge ? `${report.patientAge}세` : "-"}
            </DocCell>
            <DocCell label="연락처">{report.patientContact || "-"}</DocCell>
            <DocCell label="자택 주소" wide>
              {report.patientAddress || "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        {/* 주 증상 · 분류 */}
        <DocSection title="주 증상 · 분류">
          <DocGrid>
            <DocCell label="발병/사고 유형">{report.reason || "-"}</DocCell>
            <DocCell label="의식 상태(AVPU)">
              {consciousness
                ? `${consciousness.value} · ${consciousness.label}`
                : "-"}
            </DocCell>
            <DocCell label="KTAS">
              {ktas ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full text-[11px] font-bold text-white print:!text-white",
                      ktas.tone === "critical" && "bg-status-full",
                      ktas.tone === "warn" && "bg-status-busy",
                      ktas.tone === "info" && "bg-primary",
                      ktas.tone === "ok" && "bg-status-available",
                    )}
                  >
                    {ktas.value}
                  </span>
                  {ktas.label}
                </span>
              ) : (
                "-"
              )}
            </DocCell>
            <DocCell label="주 증상" wide block>
              {report.chiefComplaint || "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        {/* 활력 징후 — 1차 측정 */}
        <DocSection title="활력 징후 (1차 측정)">
          <DocGrid>
            <DocCell label="혈압">
              {v.bpSystolic || v.bpDiastolic
                ? `${v.bpSystolic || "?"}/${v.bpDiastolic || "?"} mmHg`
                : "-"}
            </DocCell>
            <DocCell label="맥박">
              {v.pulse ? `${v.pulse} bpm` : "-"}
            </DocCell>
            <DocCell label="호흡">
              {v.resp ? `${v.resp} /분` : "-"}
            </DocCell>
            <DocCell label="SpO₂">
              {v.spo2 ? `${v.spo2} %` : "-"}
            </DocCell>
            <DocCell label="체온">
              {v.temp ? `${v.temp} ℃` : "-"}
            </DocCell>
            <DocCell label="혈당">
              {v.glucose ? `${v.glucose} mg/dL` : "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        {/* 시계열 활력징후 — 추가 측정이 있을 때만 표시 */}
        {vitalSeries.length > 0 && (
          <DocSection title="추가 활력징후 측정 (시계열)">
            {vitalSeries.map((vs, i) => (
              <div key={vs.id} className="border-b border-border last:border-0 print:break-inside-avoid">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  {i + 2}차 측정
                  {vs.measuredAt ? ` · ${fmtDt(vs.measuredAt)}` : ""}
                </p>
                <DocGrid>
                  <DocCell label="혈압">
                    {vs.bpSystolic || vs.bpDiastolic
                      ? `${vs.bpSystolic || "?"}/${vs.bpDiastolic || "?"} mmHg`
                      : "-"}
                  </DocCell>
                  <DocCell label="맥박">
                    {vs.pulse ? `${vs.pulse} bpm` : "-"}
                  </DocCell>
                  <DocCell label="호흡">
                    {vs.resp ? `${vs.resp} /분` : "-"}
                  </DocCell>
                  <DocCell label="SpO₂">
                    {vs.spo2 ? `${vs.spo2} %` : "-"}
                  </DocCell>
                  <DocCell label="체온">
                    {vs.temp ? `${vs.temp} ℃` : "-"}
                  </DocCell>
                  <DocCell label="혈당">
                    {vs.glucose ? `${vs.glucose} mg/dL` : "-"}
                  </DocCell>
                  {vs.note && (
                    <DocCell label="소견" wide>
                      {vs.note}
                    </DocCell>
                  )}
                </DocGrid>
              </div>
            ))}
          </DocSection>
        )}

        {/* 처치 내역 */}
        <DocSection title="처치 내역">
          <DocGrid>
            <DocCell label="시행 처치" wide>
              {report.treatments.length === 0
                ? "-"
                : report.treatments
                    .map((t) => treatmentLabel.get(t) ?? t)
                    .join(", ")}
            </DocCell>
            <DocCell label="처치 메모" wide block>
              {report.treatmentMemo || "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        {/* CPR 타임라인 */}
        {cpr && (
          <DocSection title="CPR 타임라인">
            <DocGrid>
              <DocCell label="CPR 시작">{fmtDt(cpr.startedAt)}</DocCell>
              <DocCell label="CPR 종료">{fmtDt(cpr.endedAt)}</DocCell>
              <DocCell label="AED 제세동">
                {cpr.aedCount > 0 ? `${cpr.aedCount}회` : "-"}
              </DocCell>
              <DocCell label="ROSC">
                {cpr.rosc
                  ? `있음${cpr.roscAt ? ` · ${fmtDt(cpr.roscAt)}` : ""}`
                  : "없음"}
              </DocCell>
            </DocGrid>
          </DocSection>
        )}

        {/* 약물 투여 상세 */}
        {medications.length > 0 && (
          <DocSection title="약물 투여 상세">
            {medications.map((med, i) => (
              <div key={med.id} className="border-b border-border last:border-0 print:break-inside-avoid">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  약물 {i + 1}
                </p>
                <DocGrid>
                  <DocCell label="약명">{med.name || "-"}</DocCell>
                  <DocCell label="용량">{med.dose || "-"}</DocCell>
                  <DocCell label="경로">
                    {med.route || "-"}
                  </DocCell>
                  <DocCell label="투여 시각">{fmtDt(med.administeredAt)}</DocCell>
                  {med.note && (
                    <DocCell label="특이 반응" wide>
                      {med.note}
                    </DocCell>
                  )}
                </DocGrid>
              </div>
            ))}
          </DocSection>
        )}

        {/* 병원 사전 연락 */}
        {hospitalContacts.length > 0 && (
          <DocSection title="병원 사전 연락">
            {hospitalContacts.map((c, i) => (
              <div key={c.id} className="border-b border-border last:border-0 print:break-inside-avoid">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  연락 {i + 1}
                </p>
                <DocGrid>
                  <DocCell label="병원명" wide>
                    {c.hospitalName || "-"}
                  </DocCell>
                  <DocCell label="연락 시각">{fmtDt(c.contactedAt)}</DocCell>
                  <DocCell label="수용 여부">
                    {c.accepted === true
                      ? "수용"
                      : c.accepted === false
                        ? "거부"
                        : "미확인"}
                  </DocCell>
                  {c.accepted === false && c.refusalReason && (
                    <DocCell label="거부 사유" wide>
                      {c.refusalReason}
                    </DocCell>
                  )}
                </DocGrid>
              </div>
            ))}
          </DocSection>
        )}

        {/* 이송 정보 */}
        <DocSection title="이송 정보">
          <DocGrid>
            <DocCell label="이송 병원" wide>
              {report.destinationHospital || "-"}
            </DocCell>
            <DocCell label="이송 거부">
              {report.transportRefused
                ? `거부${report.transportRefusalSigned ? " (서명 완료)" : " (서명 미완)"}`
                : "이송 완료"}
            </DocCell>
            {report.transportRefused && report.transportRefusalReason && (
              <DocCell label="거부 사유" wide>
                {report.transportRefusalReason}
              </DocCell>
            )}
            <DocCell label="이송 사유 / 인계 내용" wide block>
              {report.transportMemo || "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        {/* 특이사항 */}
        <DocSection title="특이사항">
          <DocGrid>
            <DocCell label="비고" wide block>
              {report.remarks || "-"}
            </DocCell>
          </DocGrid>
        </DocSection>

        <footer className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-4 text-[12px] text-text-muted">
          <div>
            <p className="mb-8">작성자 서명</p>
            <div className="border-t border-text/60 pt-1 text-center text-text">
              {report.crewName || "(서명)"}
            </div>
          </div>
          <div>
            <p className="mb-8">인계 의료진 서명</p>
            <div className="border-t border-text/60 pt-1 text-center text-text">
              ( 서명 )
            </div>
          </div>
        </footer>

        <p className="mt-4 text-center text-[10.5px] text-text-subtle">
          본 문서는 BaroER · 디지털 구급활동일지로 출력되었습니다 ·{" "}
          {new Date().getFullYear()}
        </p>
      </article>

      <style jsx global>{`
        @media print {
          html,
          body {
            background: #fff !important;
          }
          .no-print,
          nav[role="navigation"],
          [data-bottom-nav],
          [data-screen-header] {
            display: none !important;
          }
          .report-doc {
            color: #000 !important;
            font-size: 12pt;
          }
          .report-doc * {
            color: inherit;
          }
        }
        @page {
          size: A4;
          margin: 14mm;
        }
      `}</style>
    </>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 print:break-inside-avoid">
      <h2 className="mb-1.5 inline-block border-b border-text/70 pb-0.5 text-[13px] font-bold tracking-wide">
        {title}
      </h2>
      <div className="border border-border print:border-text/60">{children}</div>
    </section>
  );
}

function DocGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-4 divide-x divide-border print:divide-text/40">
      {children}
    </div>
  );
}

function DocCell({
  label,
  children,
  wide,
  block,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  block?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-border px-3 py-2 last:border-b-0 print:border-text/40",
        wide && "col-span-4 [grid-column:1/-1]",
        block && "min-h-[60px]",
      )}
    >
      <p className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <div className="text-[13px] leading-snug text-text">{children}</div>
    </div>
  );
}

function formatDateTimeKR(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
