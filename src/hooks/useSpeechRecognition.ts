"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 브라우저 SpeechRecognition (Web Speech API) 의 얇은 래퍼.
 *
 * 설계 메모 — 응급 입력 화면 특성상, 사용자가 한 번에 길게 (10~30초) 말하는
 * 시나리오가 빈번하다. 그러나 모바일 브라우저(Chrome on Android, Safari)의
 * 기본 동작은 짧은 침묵에서 onend 를 발사해버려 인식 세션이 조기 종료된다.
 * 이를 보완하기 위해 다음 두 가지 트릭을 적용했다.
 *
 *   1) `continuous = true` — 한 세션 안에서 침묵을 견디며 계속 인식
 *   2) onend 자동 재시작 — 그래도 엔진이 종료시키면, 사용자가 stop 을
 *      호출하지 않은 한 짧은 지연 후 r.start() 로 다시 켠다. 마치 끊김
 *      없는 단일 세션처럼 보이게 한다.
 *
 * 또한 finalText 누적은 ref 로 관리해 자동 재시작 사이에도 보존된다.
 * 결과 콜백(`onFinalResult`) 은 사용자가 명시적으로 stop 했을 때 한 번만
 * 호출되어, 클라이언트가 textarea 에 같은 내용을 두 번 적용하는 사고를
 * 방지한다.
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

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalResult);
  // 사용자가 명시적으로 stop 했는지 — 자동 재시작 분기점.
  const stopRequestedRef = useRef(false);
  // 자동 재시작 사이에도 누적되어야 하는 final 결과.
  const finalTextRef = useRef("");
  // setTimeout 핸들 (타입 호환을 위해 ReturnType 사용 — DOM/Node 모두에서 안전).
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onFinalRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => {
      stopRequestedRef.current = true;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.abort();
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
    finalTextRef.current = "";
    stopRequestedRef.current = false;

    const r = new Ctor();
    r.lang = lang;
    // 침묵을 견디며 한 세션 안에서 계속 듣는다 (긴 발화 지원).
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const t = res[0].transcript;
        if (res.isFinal) {
          // 자동 재시작 사이에도 누적되도록 ref 에 보관.
          finalTextRef.current += t;
        } else {
          interim += t;
        }
      }
      setTranscript((finalTextRef.current + interim).trim());
    };

    r.onerror = (ev) => {
      // no-speech / aborted 는 정상적인 침묵으로 — 자동 재시작이 처리하도록
      // 에러 표시를 띄우지 않는다.
      const code = ev.error;
      if (code === "no-speech" || code === "aborted" || code === "audio-capture") {
        return;
      }
      setError(code || "음성 인식 오류가 발생했어요.");
      // 권한·네트워크 등 회복 불가 에러는 자동 재시작 중단.
      stopRequestedRef.current = true;
      setListening(false);
    };

    r.onstart = () => setListening(true);

    r.onend = () => {
      // 사용자가 명시적으로 stop 한 경우에만 finalText 를 한 번 콜백.
      if (stopRequestedRef.current) {
        const text = finalTextRef.current.trim();
        setListening(false);
        if (text) onFinalRef.current?.(text);
        return;
      }
      // 그렇지 않으면 — 짧은 지연 후 자동 재시작하여 단일 세션처럼 보이게.
      restartTimerRef.current = setTimeout(() => {
        try {
          r.start();
        } catch {
          // 이미 시작 중이거나 abort 된 상태 — 무시.
        }
      }, 200);
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요.");
    }
  }, [lang]);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  return { supported, listening, transcript, error, start, stop };
}
