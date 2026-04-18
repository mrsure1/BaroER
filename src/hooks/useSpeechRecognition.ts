"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the browser's SpeechRecognition (Web Speech API).
 * Spec is non-standard but widely shipped under prefixed names.
 *
 * - Returns interim transcripts so the UI can stream text as the user speaks.
 * - Auto-stops on `onend` from the engine.
 * - Falls back gracefully via `supported = false` on browsers without the API.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: unknown, ev: Event) => void) | null;
  onresult: ((this: unknown, ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((this: unknown, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((this: unknown, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
    length: number;
  }>;
};

type SpeechRecognitionErrorEventLike = { error: string; message?: string };

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Options {
  lang?: string;
  onFinalResult?: (text: string) => void;
}

export function useSpeechRecognition({
  lang = "ko-KR",
  onFinalResult,
}: Options = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => {
      try {
        ref.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요.");
      return;
    }
    setError(null);
    setTranscript("");
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;

    let finalText = "";

    r.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const t = res[0].transcript;
        if (res.isFinal) finalText += t;
        else interim += t;
      }
      setTranscript((finalText + interim).trim());
    };
    r.onerror = (ev) => {
      setError(ev.error || "음성 인식 오류가 발생했어요.");
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      const text = finalText.trim();
      if (text) onFinalRef.current?.(text);
    };
    r.onstart = () => setListening(true);

    ref.current = r;
    try {
      r.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요.");
    }
  }, [lang]);

  const stop = useCallback(() => {
    try {
      ref.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  return { supported, listening, transcript, error, start, stop };
}
