"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 브라우저 SpeechRecognition (Web Speech API) 의 얇은 래퍼.
 *
 * 응급 입력 화면 특성상 사용자가 한 번에 길게 (10~30초) 말하는 시나리오가
 * 빈번하다. 그러나 모바일 Chrome / iOS Safari 의 기본 동작은 짧은 침묵에서
 * `onend` 를 발사해 세션이 조기 종료되거나, 같은 발화를 isFinal 로 두 번
 * 이상 발사하기도 한다. 본 훅은 그 두 가지 모두를 흡수해 사용자에게는
 * "한 번 말 → 한 번 입력" 의 단일 인터랙션처럼 보이게 한다.
 *
 * 핵심 설계:
 *
 *   1) 자동 재시작 시 **항상 새 SpeechRecognition 인스턴스**를 생성한다.
 *      같은 인스턴스에서 r.start() 를 재호출하면 직전 results 풀을 그대로
 *      들고 와 같은 final 을 또 발사하는 브라우저가 있어 중복 누적이 난다.
 *      인스턴스를 새로 만들면 results 인덱스가 0 부터 깔끔히 리셋된다.
 *
 *   2) **Idempotency 가드** — 인스턴스 ID + 결과 인덱스를 키로 한 Set 으로
 *      "이미 누적한 final 결과" 를 추적한다. 동일 인스턴스에서 onresult 가
 *      같은 isFinal=true 결과를 두 번 이상 보내도 한 번만 finalText 에
 *      반영된다.
 *
 *   3) `continuous = false` — 짧은 세션 + 자동 재시작 조합이 모바일에서
 *      가장 안정적으로 final 을 끊어 보내준다. continuous=true 일 때보다
 *      재시작 빈도는 늘지만, 인스턴스 분리 덕분에 누적 충돌이 없다.
 *
 *   4) `onFinalResult` 콜백은 사용자가 명시적으로 stop 했을 때 **단 1회**
 *      호출. listening 중 실시간 미리보기는 `transcript` 상태를 구독하면
 *      되므로 콜백 중복 호출 위험을 원천 차단한다.
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
  const stopRequestedRef = useRef(false);
  // 자동 재시작 사이에도 보존되는 누적 final 텍스트.
  const finalTextRef = useRef("");
  // setTimeout 핸들 (DOM/Node 모두에서 안전한 ReturnType).
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // "처리 완료된 final 결과" 추적 — 동일 final 이 onresult 로 두 번 들어와도
  // 한 번만 누적시키는 idempotency 가드.
  const processedIdsRef = useRef<Set<string>>(new Set());
  // 디바운스 — final 누적 직후 짧은 시간 안에 같은 텍스트가 또 들어오면 무시.
  const lastFinalRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

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

  /**
   * 인스턴스 단위 result 처리 함수.
   * 자동 재시작에서 새 인스턴스를 만들 때마다 호출되어 인스턴스 고유 id 를
   * 클로저에 캡처하므로, 다른 인스턴스의 같은 인덱스가 충돌하지 않는다.
   */
  const buildHandlers = useCallback(() => {
    const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const onResult = (ev: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        const t = res[0].transcript;
        if (res.isFinal) {
          const key = `${instanceId}:${i}`;
          if (processedIdsRef.current.has(key)) continue;

          // 추가 가드: 직전 800ms 안에 정확히 같은 텍스트가 들어왔다면 엔진의
          // 중복 발사로 간주하고 무시. (여러 인스턴스에 걸친 중복도 흡수)
          const trimmed = t.trim();
          const now = Date.now();
          if (
            trimmed &&
            trimmed === lastFinalRef.current.text &&
            now - lastFinalRef.current.at < 800
          ) {
            processedIdsRef.current.add(key);
            continue;
          }

          processedIdsRef.current.add(key);
          finalTextRef.current = (
            finalTextRef.current
              ? `${finalTextRef.current} ${trimmed}`
              : trimmed
          ).trim();
          lastFinalRef.current = { text: trimmed, at: now };
        } else {
          interim += t;
        }
      }
      const next = `${finalTextRef.current}${interim ? ` ${interim}` : ""}`.trim();
      setTranscript(next);
    };

    return { instanceId, onResult };
  }, []);

  const startInstance = useCallback((): SpeechRecognitionLike | null => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요.");
      return null;
    }

    const r = new Ctor();
    r.lang = lang;
    // 짧은 세션 + 자동 재시작 조합이 모바일에서 가장 안정적.
    r.continuous = false;
    r.interimResults = true;

    const { onResult } = buildHandlers();

    r.onstart = () => setListening(true);
    r.onresult = onResult;

    r.onerror = (ev) => {
      const code = ev.error;
      // 침묵·세션 종료·일시적 캡처 실패는 자동 재시작이 처리. 사용자 표시 X.
      if (
        code === "no-speech" ||
        code === "aborted" ||
        code === "audio-capture"
      ) {
        return;
      }
      setError(code || "음성 인식 오류가 발생했어요.");
      stopRequestedRef.current = true;
      setListening(false);
    };

    r.onend = () => {
      if (stopRequestedRef.current) {
        setListening(false);
        const text = finalTextRef.current.trim();
        if (text) onFinalRef.current?.(text);
        return;
      }
      // 자동 재시작 — 항상 새 인스턴스로. 같은 인스턴스에 .start() 재호출하면
      // 직전 결과를 또 발사하는 브라우저가 있어 중복 누적의 원인이 된다.
      restartTimerRef.current = setTimeout(() => {
        const next = startInstance();
        if (next) recognitionRef.current = next;
      }, 250);
    };

    try {
      r.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요.");
      return null;
    }
    return r;
  }, [lang, buildHandlers]);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    finalTextRef.current = "";
    processedIdsRef.current.clear();
    lastFinalRef.current = { text: "", at: 0 };
    stopRequestedRef.current = false;

    const r = startInstance();
    if (r) recognitionRef.current = r;
  }, [startInstance]);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      // stop 보다 abort 가 즉각적이고 추가 onresult 발사를 차단한다.
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    // abort 시 onend 가 안 올 수도 있는 브라우저 대비 — 즉시 listening false +
    // final 콜백을 한 번만 직접 호출한다. 호출 직후 finalTextRef 를 비워
    // 뒤이어 들어오는 onend 의 동일 콜백이 무력화되도록 한다.
    setListening(false);
    const text = finalTextRef.current.trim();
    finalTextRef.current = "";
    if (text) onFinalRef.current?.(text);
  }, []);

  return { supported, listening, transcript, error, start, stop };
}
