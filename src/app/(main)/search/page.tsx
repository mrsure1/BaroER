"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Mic,
  MicOff,
  Search as SearchIcon,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { SYMPTOMS, useSearchStore, type Gender } from "@/stores/searchStore";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getCurrentCoords } from "@/hooks/useGeolocation";

const genderOptions = [
  { value: "M" as const, label: "남성" },
  { value: "F" as const, label: "여성" },
  { value: "U" as const, label: "선택안함" },
] satisfies ReadonlyArray<{ value: Gender; label: string }>;

export default function SearchPage() {
  const router = useRouter();
  const symptoms = useSearchStore((s) => s.symptoms);
  const toggleSymptom = useSearchStore((s) => s.toggleSymptom);
  const gender = useSearchStore((s) => s.gender);
  const setGender = useSearchStore((s) => s.setGender);
  const age = useSearchStore((s) => s.age);
  const setAge = useSearchStore((s) => s.setAge);
  const notes = useSearchStore((s) => s.notes);
  const setNotes = useSearchStore((s) => s.setNotes);
  const setCoords = useSearchStore((s) => s.setCoords);

  const [submitting, setSubmitting] = useState(false);

  const {
    supported: voiceSupported,
    listening,
    transcript,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
  } = useSpeechRecognition({
    lang: "ko-KR",
    onFinalResult: (text) => {
      setNotes(notes ? `${notes} ${text}`.trim() : text);
    },
  });

  // While listening, mirror interim transcript into the textarea so the user sees live feedback.
  useEffect(() => {
    if (listening && transcript) setNotes(transcript);
  }, [listening, transcript, setNotes]);

  const hasCritical = symptoms.some(
    (id) => SYMPTOMS.find((s) => s.id === id)?.critical,
  );
  const canSubmit = symptoms.length > 0;

  function handleVoice() {
    if (listening) stopVoice();
    else startVoice();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const coords = await getCurrentCoords();
      setCoords({ lat: coords.lat, lng: coords.lng, fallback: coords.fallback });
      router.push("/search/results");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScreenHeader title="응급실 검색" subtitle="환자 상태를 알려주세요" back />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-6">
        {/* Critical alert */}
        <AnimatePresence>
          {hasCritical && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <Card className="flex items-start gap-3 border-status-full/40 bg-status-full-soft p-3.5">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-status-full" />
                <div className="text-[13px] leading-relaxed text-text">
                  <span className="font-semibold text-status-full">즉시 119 신고를 권장합니다.</span>{" "}
                  생명이 위급한 증상이 선택되었어요.
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Symptom chips */}
        <Section title="증상 선택" subtitle="해당하는 항목을 모두 선택해 주세요 (복수 선택)">
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const active = symptoms.includes(s.id);
              return (
                <Chip
                  key={s.id}
                  active={active}
                  showCheckOnActive
                  onClick={() => toggleSymptom(s.id)}
                  aria-pressed={active}
                >
                  <span className="mr-1" aria-hidden>{s.emoji}</span>
                  {s.label}
                </Chip>
              );
            })}
          </div>
        </Section>

        {/* Gender */}
        <Section title="성별">
          <SegmentedControl
            options={genderOptions}
            value={gender ?? "U"}
            onChange={setGender}
            ariaLabel="성별 선택"
            fullWidth
          />
        </Section>

        {/* Age */}
        <Section title="나이">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="예: 35"
            value={age ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setAge(v === "" ? null : Math.max(0, Math.min(120, Number(v))));
            }}
            min={0}
            max={120}
            rightSlot={
              <span className="px-2 text-[13px] font-medium text-text-subtle">세</span>
            }
          />
        </Section>

        {/* Notes + Voice */}
        <Section
          title="추가 메모"
          subtitle="구체적인 증상이나 상황을 자유롭게 입력하세요"
        >
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 30분 전부터 가슴이 답답하고 식은땀이 납니다."
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-3 pr-14 text-[15px] text-text placeholder:text-text-subtle focus:border-primary focus:shadow-[var(--shadow-glow)] focus:outline-none"
            />
            <motion.button
              type="button"
              onClick={handleVoice}
              whileTap={{ scale: 0.92 }}
              disabled={!voiceSupported}
              aria-label={listening ? "음성 입력 중지" : "음성으로 입력"}
              aria-pressed={listening}
              title={voiceSupported ? undefined : "이 브라우저는 음성 인식을 지원하지 않습니다"}
              className={
                listening
                  ? "absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-primary text-primary-fg shadow-[var(--shadow-md)]"
                  : "absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-surface-2 text-text-muted ring-1 ring-border hover:text-text disabled:opacity-40"
              }
            >
              {listening && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              )}
              <span className="relative">
                {listening ? <MicOff className="size-[18px]" /> : <Mic className="size-[18px]" />}
              </span>
            </motion.button>
          </div>
          <p className="mt-2 px-0.5 text-[12px] text-text-subtle">
            {voiceError
              ? `음성 인식 오류: ${voiceError}`
              : listening
                ? "듣고 있어요… 다시 누르면 멈춥니다."
                : voiceSupported
                  ? "🎤 마이크 버튼을 눌러 음성으로 빠르게 입력할 수 있어요."
                  : "이 브라우저는 음성 인식을 지원하지 않아요."}
          </p>
        </Section>

        {/* Sticky submit */}
        <motion.div
          initial={false}
          animate={canSubmit ? { y: 0, opacity: 1 } : { y: 8, opacity: 0.85 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky bottom-[calc(72px+env(safe-area-inset-bottom)+12px)] z-10 mt-6"
        >
          <Button
            size="xl"
            fullWidth
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
            leftIcon={<SearchIcon className="size-5" />}
            rightIcon={<ArrowRight className="size-4" />}
          >
            가까운 응급실 찾기
          </Button>
          {!canSubmit && (
            <p className="mt-2 text-center text-[12.5px] text-text-subtle">
              증상을 1개 이상 선택하면 검색할 수 있어요
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <header className="mb-2.5 px-0.5">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px] text-text-muted">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}
