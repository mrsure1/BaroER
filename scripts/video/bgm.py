"""
Generate a royalty-free ambient pad BGM for the BaroER promo video.

Pure-Python/NumPy synth:
  - slow evolving pad on a stable i-VI-III-VII progression (a minor)
  - soft noise bed, subtle filtered kick every 2 bars
  - gentle swell at the top, tail fade at the end

The track is written as a 44.1 kHz stereo WAV to out/bgm.wav.
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile

OUT = Path(__file__).resolve().parents[2] / "out"
OUT.mkdir(parents=True, exist_ok=True)

SR = 44100
DUR = 72.0  # seconds — leave slack for editing
BPM = 76


def _note(semitones_from_a4: float) -> float:
    return 440.0 * (2.0 ** (semitones_from_a4 / 12.0))


def _detuned_saw(freq: float, t: np.ndarray, detune: float = 0.012) -> np.ndarray:
    """Three-oscillator detuned saw-ish pad using summed sines (octave + fifth)."""
    o1 = np.sin(2 * np.pi * freq * t)
    o2 = np.sin(2 * np.pi * freq * (1 + detune) * t + 0.3)
    o3 = np.sin(2 * np.pi * freq * (1 - detune) * t - 0.2)
    o4 = 0.25 * np.sin(2 * np.pi * freq * 2 * t)  # soft octave
    o5 = 0.12 * np.sin(2 * np.pi * freq * 1.5 * t)  # perfect fifth
    x = (o1 + o2 + o3) / 3 + o4 + o5
    return x


def _adsr(n: int, a: float, d: float, s: float, r: float, sus: float = 0.7) -> np.ndarray:
    env = np.zeros(n)
    ai = max(1, int(a * SR))
    di = max(1, int(d * SR))
    ri = max(1, int(r * SR))
    env[:ai] = np.linspace(0, 1, ai)
    env[ai : ai + di] = np.linspace(1, sus, di)
    env[ai + di : n - ri] = sus
    env[n - ri :] = np.linspace(sus, 0, ri)
    return env


def _chord(root_semi: float, kind: str = "min") -> list[float]:
    intervals = {
        "min": [0, 3, 7, 12],
        "maj": [0, 4, 7, 12],
        "sus": [0, 5, 7, 12],
    }[kind]
    return [_note(root_semi + i) for i in intervals]


def _pink_noise(n: int) -> np.ndarray:
    white = np.random.normal(0, 1, n)
    fft = np.fft.rfft(white)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    freqs[0] = 1
    fft = fft / np.sqrt(freqs)
    x = np.fft.irfft(fft, n=n)
    x = x / (np.max(np.abs(x)) + 1e-9)
    return x


def synth() -> np.ndarray:
    total_n = int(DUR * SR)
    mix = np.zeros(total_n)

    # Progression: a minor — i (A), VI (F), III (C), VII (G)
    # Using A2 = -24 semitones from A4 as root reference for chord voicings
    root_sequence = [
        ("A", -12, "min"),
        ("F", -16, "maj"),
        ("C", -9, "maj"),
        ("G", -14, "maj"),
    ]

    bar_sec = 60.0 / BPM * 4  # one bar = 4 beats
    chord_sec = bar_sec * 2   # each chord lasts 2 bars

    cursor = 0.0
    idx = 0
    while cursor < DUR:
        _, root, kind = root_sequence[idx % len(root_sequence)]
        n = int(chord_sec * SR)
        if cursor + chord_sec > DUR:
            n = total_n - int(cursor * SR)
        t = np.arange(n) / SR
        chord_buf = np.zeros(n)
        for f in _chord(root, kind):
            chord_buf += _detuned_saw(f, t) * 0.18
        env = _adsr(n, a=0.9, d=0.6, s=chord_sec - 2.0, r=1.2, sus=0.85)
        chord_buf *= env[: len(chord_buf)]
        start = int(cursor * SR)
        mix[start : start + len(chord_buf)] += chord_buf
        cursor += chord_sec
        idx += 1

    # Soft noise bed (wind-like) with slow LFO
    noise = _pink_noise(total_n) * 0.08
    t_all = np.arange(total_n) / SR
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t_all)
    mix += noise * lfo

    # Subtle kick every 2 beats to give pulse, low-pass feel via sine thump
    beat_sec = 60.0 / BPM
    kick_times = np.arange(0, DUR, beat_sec * 2)
    for kt in kick_times:
        ki = int(kt * SR)
        klen = int(0.22 * SR)
        if ki + klen > total_n:
            break
        kt_arr = np.arange(klen) / SR
        pitch = 70 * np.exp(-kt_arr * 24) + 45  # pitch sweep
        kick = np.sin(2 * np.pi * np.cumsum(pitch) / SR)
        kick *= np.exp(-kt_arr * 6)
        mix[ki : ki + klen] += kick * 0.35

    # Global fade in / fade out
    fade_in_n = int(2.5 * SR)
    fade_out_n = int(3.5 * SR)
    mix[:fade_in_n] *= np.linspace(0, 1, fade_in_n)
    mix[-fade_out_n:] *= np.linspace(1, 0, fade_out_n)

    # Simple soft limiter
    peak = np.max(np.abs(mix)) + 1e-9
    mix = mix / peak * 0.82
    mix = np.tanh(mix * 1.1) * 0.9

    # Light stereo widening: left/right slightly phase-shifted noise layer
    shift = int(0.012 * SR)
    left = mix.copy()
    right = np.zeros_like(mix)
    right[shift:] = mix[:-shift]
    right[:shift] = mix[:shift]
    stereo = np.stack([left, right], axis=-1)
    return stereo


def main() -> None:
    print("Synthesizing BGM...")
    audio = synth()
    pcm = (audio * 32767).astype(np.int16)
    out_path = OUT / "bgm.wav"
    wavfile.write(str(out_path), SR, pcm)
    print(f"Wrote {out_path} ({out_path.stat().st_size // 1024} KB, {DUR:.1f}s)")


if __name__ == "__main__":
    main()
