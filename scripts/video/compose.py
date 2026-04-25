"""
Compose the BaroER 60-70s YouTube promo video.

Architecture
------------
- 1920x1080 @ 30 fps, H.264 / AAC via moviepy (imageio-ffmpeg binary bundled).
- Scene-based storyboard (see STORYBOARD below). Each scene is a list of
  layered clips (background gradient, app screenshot, title, subtitle, keyword
  chips, progress bar).
- Text rendering: PIL with Malgun Gothic so all Korean glyphs render crisply
  even without ImageMagick installed (moviepy's TextClip requires IM).

Run:
    python scripts/video/compose.py
Outputs:
    out/baroer_promo_1080p.mp4
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from moviepy.editor import (
    AudioFileClip,
    ColorClip,
    CompositeVideoClip,
    ImageClip,
    concatenate_videoclips,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]
CAP = ROOT / ".design-preview" / "video"
DP = ROOT / ".design-preview"
OUT = ROOT / "out"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
FPS = 30

FONT_BOLD = "C:/Windows/Fonts/malgunbd.ttf"
FONT_REG = "C:/Windows/Fonts/malgun.ttf"

# Brand palette (matches app)
BRAND = (220, 38, 38)         # primary red
BRAND_DARK = (127, 29, 29)
INK = (17, 24, 39)            # near-black
SUB = (107, 114, 128)
BG_TOP = (255, 245, 245)
BG_BOT = (250, 250, 252)
ACCENT = (245, 158, 11)

# ---------------------------------------------------------------------------
# PIL → ImageClip helpers
# ---------------------------------------------------------------------------

def _pil_to_clip(img: Image.Image, duration: float) -> ImageClip:
    return ImageClip(np.array(img.convert("RGBA"))).set_duration(duration)


def _load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REG
    return ImageFont.truetype(path, size=size)


def _text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    # Prefer textbbox (Pillow ≥ 8) to avoid deprecated textsize.
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def make_gradient_bg(size=(W, H), top=BG_TOP, bot=BG_BOT) -> Image.Image:
    img = Image.new("RGB", size, top)
    px = img.load()
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        for x in range(size[0]):
            px[x, y] = (r, g, b)
    return img


# Cached background so it's generated only once.
_BG_CACHE: Optional[Image.Image] = None


def bg_clip(duration: float) -> ImageClip:
    global _BG_CACHE
    if _BG_CACHE is None:
        _BG_CACHE = make_gradient_bg()
    return _pil_to_clip(_BG_CACHE, duration)


# ---------------------------------------------------------------------------
# Decorative elements
# ---------------------------------------------------------------------------

def rounded_rect_mask(size, radius):
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    return m


def phone_frame(screenshot_path: Path, height: int = 880) -> Image.Image:
    """Render a mobile screenshot inside a subtle phone bezel."""
    shot = Image.open(screenshot_path).convert("RGBA")
    sw, sh = shot.size
    target_h = height
    target_w = int(sw * target_h / sh)
    shot = shot.resize((target_w, target_h), Image.LANCZOS)

    pad = 14
    bezel_w = target_w + pad * 2
    bezel_h = target_h + pad * 2
    bezel = Image.new("RGBA", (bezel_w, bezel_h), (255, 255, 255, 0))

    # Drop shadow
    shadow = Image.new("RGBA", (bezel_w + 60, bezel_h + 60), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (30, 35, 30 + bezel_w, 35 + bezel_h),
        radius=58,
        fill=(20, 20, 30, 120),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))

    body = Image.new("RGBA", (bezel_w, bezel_h), (255, 255, 255, 255))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle((0, 0, bezel_w, bezel_h), radius=54, outline=(220, 220, 230, 255), width=2)

    # Inner mask for screenshot
    mask = rounded_rect_mask((target_w, target_h), 42)
    body.paste(shot, (pad, pad), mask)

    out = Image.new("RGBA", (bezel_w + 60, bezel_h + 60), (0, 0, 0, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(body, (30, 35))
    return out


def desktop_frame(screenshot_path: Path, width: int = 1180) -> Image.Image:
    shot = Image.open(screenshot_path).convert("RGBA")
    sw, sh = shot.size
    target_w = width
    target_h = int(sh * target_w / sw)
    shot = shot.resize((target_w, target_h), Image.LANCZOS)

    # Browser chrome
    chrome_h = 44
    full_w = target_w + 24
    full_h = target_h + chrome_h + 24
    body = Image.new("RGBA", (full_w, full_h), (255, 255, 255, 255))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle((0, 0, full_w, full_h), radius=22, outline=(220, 220, 230, 255), width=2)

    # Top bar
    bd.rounded_rectangle((2, 2, full_w - 2, chrome_h), radius=20, fill=(245, 246, 250, 255))
    for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        bd.ellipse((22 + i * 24, 14, 38 + i * 24, 30), fill=col + (255,))
    bd.rounded_rectangle((130, 10, full_w - 140, 34), radius=10, fill=(255, 255, 255, 255), outline=(226, 228, 235, 255))
    f = _load_font(16, bold=False)
    bd.text((146, 16), "baroer.app", fill=(100, 112, 130, 255), font=f)

    body.paste(shot, (12, chrome_h + 8), shot)

    shadow = Image.new("RGBA", (full_w + 80, full_h + 80), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (40, 50, 40 + full_w, 50 + full_h), radius=30, fill=(20, 20, 30, 110)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))

    out = Image.new("RGBA", (full_w + 80, full_h + 80), (0, 0, 0, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(body, (40, 50))
    return out


# ---------------------------------------------------------------------------
# Text layers
# ---------------------------------------------------------------------------

def text_image(
    text: str,
    size: int,
    color=INK,
    bold: bool = True,
    max_width: Optional[int] = None,
    align: str = "left",
    line_spacing: float = 1.22,
    stroke: Optional[tuple] = None,
    stroke_width: int = 0,
) -> Image.Image:
    font = _load_font(size, bold=bold)
    # Word wrap
    if max_width is None:
        lines = text.split("\n")
    else:
        lines = []
        dummy = Image.new("RGBA", (10, 10))
        dd = ImageDraw.Draw(dummy)
        for raw in text.split("\n"):
            words = raw.split(" ")
            cur = ""
            for w in words:
                trial = (cur + " " + w).strip()
                tw, _ = _text_size(dd, trial, font)
                if tw <= max_width or not cur:
                    cur = trial
                else:
                    lines.append(cur)
                    cur = w
            lines.append(cur)

    # Measure
    dummy = Image.new("RGBA", (10, 10))
    dd = ImageDraw.Draw(dummy)
    line_sizes = [_text_size(dd, ln, font) for ln in lines]
    line_h = max(h for _, h in line_sizes)
    total_w = max(w for w, _ in line_sizes) + (stroke_width * 2)
    total_h = int(line_h * line_spacing * len(lines)) + (stroke_width * 2)

    img = Image.new("RGBA", (total_w + 8, total_h + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 0
    for ln, (tw, _) in zip(lines, line_sizes):
        if align == "center":
            x = (total_w - tw) // 2
        elif align == "right":
            x = total_w - tw
        else:
            x = 0
        if stroke:
            d.text((x, y), ln, font=font, fill=color, stroke_width=stroke_width, stroke_fill=stroke)
        else:
            d.text((x, y), ln, font=font, fill=color)
        y += int(line_h * line_spacing)
    return img


def keyword_chip(text: str, color=BRAND, bg=(255, 255, 255, 245), size: int = 44) -> Image.Image:
    font = _load_font(size, bold=True)
    dummy = Image.new("RGBA", (10, 10))
    dd = ImageDraw.Draw(dummy)
    tw, th = _text_size(dd, text, font)
    pad_x, pad_y = 30, 18
    w = tw + pad_x * 2
    h = th + pad_y * 2 + 6
    img = Image.new("RGBA", (w + 30, h + 30), (0, 0, 0, 0))
    # Shadow
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle((0, 0, w, h), radius=h // 2, fill=(20, 20, 30, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    img.alpha_composite(sh, (10, 14))
    # Chip body
    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle((0, 0, w, h), radius=h // 2, fill=bg, outline=color + (255,), width=3)
    bd.text((pad_x, pad_y - 3), text, font=font, fill=color)
    img.alpha_composite(body, (0, 0))
    return img


# ---------------------------------------------------------------------------
# Motion helpers (moviepy position / fx lambdas)
# ---------------------------------------------------------------------------

def ease_out(t: float) -> float:
    return 1 - (1 - t) ** 3


def fade_in(clip, d: float = 0.5):
    return clip.crossfadein(d)


def slide_up(from_y: int, to_y: int, dur: float = 0.7):
    def pos(t):
        k = min(1.0, t / dur)
        y = from_y + (to_y - from_y) * ease_out(k)
        return ("center", y)
    return pos


def rise_in(x: int | str, from_y: int, to_y: int, dur: float = 0.7):
    def pos(t):
        k = min(1.0, t / dur)
        y = from_y + (to_y - from_y) * ease_out(k)
        return (x, y)
    return pos


# ---------------------------------------------------------------------------
# Scene builders
# ---------------------------------------------------------------------------

@dataclass
class Scene:
    name: str
    duration: float
    builder: Callable[[float], CompositeVideoClip]


def scene_intro(dur: float) -> CompositeVideoClip:
    bg = bg_clip(dur)

    # Logo mark (from public/logo.png if available)
    logo_src = ROOT / "public" / "logo.png"
    layers = [bg]

    if logo_src.exists():
        logo = Image.open(logo_src).convert("RGBA")
        lw, lh = logo.size
        target_h = 180
        logo = logo.resize((int(lw * target_h / lh), target_h), Image.LANCZOS)
        logo_clip = (
            _pil_to_clip(logo, dur)
            .set_position(("center", 330))
            .crossfadein(0.6)
        )
        layers.append(logo_clip)

    title = text_image("바로응급실", size=160, color=INK, bold=True)
    title_clip = (
        _pil_to_clip(title, dur)
        .set_position(lambda t: ("center", 540 + int(20 * (1 - ease_out(min(1, t / 0.8))))))
        .crossfadein(0.8)
    )
    layers.append(title_clip)

    sub = text_image(
        "골든타임을 지키는 현장 행동형 응급의료 PWA",
        size=54,
        color=SUB,
        bold=False,
        align="center",
    )
    sub_clip = (
        _pil_to_clip(sub, dur)
        .set_position(("center", 740))
        .crossfadein(1.1)
    )
    layers.append(sub_clip)

    tag = text_image("팀 AML · 이진영", size=32, color=SUB, bold=False, align="center")
    tag_clip = _pil_to_clip(tag, dur).set_position(("center", 830)).crossfadein(1.4)
    layers.append(tag_clip)

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp.crossfadeout(0.6)


def scene_problem(dur: float) -> CompositeVideoClip:
    bg = bg_clip(dur)
    layers = [bg]

    lines = [
        ("응급실 뺑뻉이", 0.0, BRAND),
        ("놓치는 골든타임", 1.6, INK),
        ("지금 필요한 건, 바로 행동하는 도구", 3.4, SUB),
    ]
    for text, start, color in lines:
        img = text_image(text, size=96 if color != SUB else 60, color=color, bold=True, align="center")
        sub_dur = max(0.6, dur - start)
        clip = (
            _pil_to_clip(img, sub_dur)
            .set_start(start)
            .set_position(("center", 380 + int(lines.index((text, start, color)) * 150)))
            .crossfadein(0.5)
        )
        layers.append(clip)

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp.crossfadeout(0.5)


def scene_pwa(dur: float) -> CompositeVideoClip:
    bg = bg_clip(dur)
    layers = [bg]

    # Title top
    title = text_image("설치 없이, 링크 한 번으로", size=88, color=INK, bold=True)
    layers.append(
        _pil_to_clip(title, dur)
        .set_position(("center", 90))
        .crossfadein(0.4)
    )
    sub = text_image(
        "모바일 · 데스크톱 · 태블릿에서 즉시 실행",
        size=42,
        color=SUB,
        bold=False,
    )
    layers.append(_pil_to_clip(sub, dur).set_position(("center", 220)).crossfadein(0.6))

    # Phone on left, desktop on right
    phone = phone_frame(CAP / "04_home.png", height=780)
    phone_clip = (
        _pil_to_clip(phone, dur)
        .set_position(lambda t: (380, 310 + int(40 * (1 - ease_out(min(1, t / 0.9))))))
        .crossfadein(0.6)
    )
    layers.append(phone_clip)

    desktop = desktop_frame(CAP / "12_home_desktop.png", width=980)
    desktop_clip = (
        _pil_to_clip(desktop, dur)
        .set_position(lambda t: (920, 360 + int(40 * (1 - ease_out(min(1, t / 1.0))))))
        .crossfadein(0.9)
    )
    layers.append(desktop_clip)

    # Keyword chips bottom
    chips = ["설치 X", "링크 한 번", "오프라인 폴백"]
    base_x = 560
    for i, c in enumerate(chips):
        chip = keyword_chip(c, color=BRAND, size=38)
        layers.append(
            _pil_to_clip(chip, dur)
            .set_position((base_x + i * 320, 980))
            .set_start(0.8 + i * 0.25)
            .crossfadein(0.4)
        )

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp.crossfadeout(0.5)


def scene_feature(
    dur: float,
    title: str,
    subtitle: str,
    screenshot: Path,
    keywords: list[str],
    accent=BRAND,
    phone_height: int = 880,
    align_phone_right: bool = False,
    use_phone_frame: bool = True,
    image_width: Optional[int] = None,
) -> CompositeVideoClip:
    bg = bg_clip(dur)
    layers = [bg]

    # Media on one side
    if use_phone_frame:
        media = phone_frame(screenshot, height=phone_height)
    else:
        raw = Image.open(screenshot).convert("RGBA")
        rw, rh = raw.size
        target_w = image_width or 880
        target_h = int(rh * target_w / rw)
        media = raw.resize((target_w, target_h), Image.LANCZOS)
        # Subtle rounded crop + drop shadow for polish
        mask = rounded_rect_mask((target_w, target_h), 26)
        framed = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        framed.paste(media, (0, 0), mask)
        shadow = Image.new("RGBA", (target_w + 60, target_h + 60), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle(
            (30, 35, 30 + target_w, 35 + target_h), radius=26, fill=(20, 20, 30, 110)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(20))
        out_img = Image.new("RGBA", (target_w + 60, target_h + 60), (0, 0, 0, 0))
        out_img.alpha_composite(shadow)
        out_img.alpha_composite(framed, (30, 35))
        media = out_img

    mw, mh = media.size
    if align_phone_right:
        ph_x = W - mw - 80
    else:
        ph_x = 80
    ph_y_target = (H - mh) // 2
    phone_clip = (
        _pil_to_clip(media, dur)
        .set_position(lambda t: (ph_x, ph_y_target + int(30 * (1 - ease_out(min(1, t / 0.8))))))
        .crossfadein(0.6)
    )
    layers.append(phone_clip)

    # Title + subtitle on the other side
    text_x = 140 if align_phone_right else 900
    text_max_w = 900
    t_img = text_image(title, size=82, color=INK, bold=True, max_width=text_max_w)
    t_h = t_img.size[1]
    layers.append(
        _pil_to_clip(t_img, dur)
        .set_position((text_x, 200))
        .crossfadein(0.5)
    )
    subtitle_y = 200 + t_h + 60
    s_img = text_image(subtitle, size=40, color=SUB, bold=False, max_width=text_max_w)
    s_h = s_img.size[1]
    layers.append(
        _pil_to_clip(s_img, dur)
        .set_position((text_x, subtitle_y))
        .crossfadein(0.9)
    )

    # Keywords stacked below subtitle
    chip_start_y = subtitle_y + s_h + 60
    for i, kw in enumerate(keywords):
        chip = keyword_chip(kw, color=accent, size=40)
        layers.append(
            _pil_to_clip(chip, dur)
            .set_position((text_x, chip_start_y + i * 100))
            .set_start(1.0 + i * 0.25)
            .crossfadein(0.4)
        )

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp.crossfadeout(0.5)


def scene_outro(dur: float) -> CompositeVideoClip:
    bg = bg_clip(dur)
    layers = [bg]

    logo_src = ROOT / "public" / "logo.png"
    if logo_src.exists():
        logo = Image.open(logo_src).convert("RGBA")
        lw, lh = logo.size
        target_h = 220
        logo = logo.resize((int(lw * target_h / lh), target_h), Image.LANCZOS)
        layers.append(
            _pil_to_clip(logo, dur)
            .set_position(("center", 260))
            .crossfadein(0.6)
        )

    cta = text_image("바로응급실 — BaroER", size=120, color=INK, bold=True, align="center")
    layers.append(_pil_to_clip(cta, dur).set_position(("center", 520)).crossfadein(0.6))

    line = text_image(
        "설치 없이 지금 바로 시작하세요",
        size=56,
        color=BRAND,
        bold=True,
        align="center",
    )
    layers.append(_pil_to_clip(line, dur).set_position(("center", 700)).crossfadein(1.0))

    credit = text_image(
        "2026 인공지능 챔피언 대회 · 팀 AML · 이진영 · 미스터슈어",
        size=30,
        color=SUB,
        bold=False,
        align="center",
    )
    layers.append(_pil_to_clip(credit, dur).set_position(("center", 860)).crossfadein(1.4))

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp.crossfadeout(0.8)


# ---------------------------------------------------------------------------
# Storyboard
# ---------------------------------------------------------------------------

STORYBOARD: list[Scene] = [
    Scene("intro", 5.5, lambda d: scene_intro(d)),
    Scene("problem", 7.5, lambda d: scene_problem(d)),
    Scene("pwa", 8.5, lambda d: scene_pwa(d)),
    Scene(
        "symptom_ktas",
        9.5,
        lambda d: scene_feature(
            d,
            title="증상 입력 → KTAS 자동 분류",
            subtitle="음성 · 이모지 · 메모 기반 증상 입력과\n레드플래그 규칙으로 중증도(Level 1~5)를 즉시 추정합니다.",
            screenshot=CAP / "05_search.png",
            keywords=["· 음성 입력 (STT)", "· KTAS 자동 추정", "· 레드플래그 경보"],
        ),
    ),
    Scene(
        "map_phone",
        9.5,
        lambda d: scene_feature(
            d,
            title="실시간 수용 가능 응급실",
            subtitle="공공 E-Gen 데이터 기반으로 수용 여부 · 병상 수 · 전문의를\n지도와 리스트에서 한눈에 확인 → 자동 전화까지 한 흐름.",
            screenshot=CAP / "map_list_cropped.png",
            keywords=["· 수용가능 · 혼잡 · 불가 색상 구분", "· 반경 5/10/20km 즉시 조정", "· 동시 3~5곳 자동 전화"],
            accent=BRAND,
            align_phone_right=True,
            use_phone_frame=False,
            image_width=560,
        ),
    ),
    Scene(
        "paramedic",
        8.5,
        lambda d: scene_feature(
            d,
            title="구급대원 전용 모드",
            subtitle="출동부터 이송 완료까지 타임스탬프 자동 기록.\nPDF · Excel 보고서를 원터치로 내보내 행정 부담을 줄입니다.",
            screenshot=CAP / "07_dispatch.png",
            keywords=["· 출동 자동 로그", "· PDF / Excel 내보내기", "· 119 · E-Gen 연계"],
            accent=BRAND_DARK,
        ),
    ),
    Scene(
        "safety",
        7.0,
        lambda d: scene_feature(
            d,
            title="믿고 쓸 수 있는 공공 데이터",
            subtitle="E-Gen · 국립중앙의료원 · 보건복지부 · KTAS\n응급의료 표준 데이터로 안전하게 연동합니다.",
            screenshot=CAP / "10_help.png",
            keywords=["· E-Gen 실시간 연동", "· KTAS 표준 적용", "· 개인정보 서버 보호"],
        ),
    ),
    Scene("outro", 6.0, lambda d: scene_outro(d)),
]


def build_video() -> Path:
    print("Composing scenes...")
    clips = []
    for sc in STORYBOARD:
        print(f"  · {sc.name}  ({sc.duration:.1f}s)")
        clips.append(sc.builder(sc.duration))
    final = concatenate_videoclips(clips, method="compose")

    # Attach BGM
    bgm_path = OUT / "bgm.wav"
    if bgm_path.exists():
        bgm = AudioFileClip(str(bgm_path)).volumex(0.55)
        if bgm.duration > final.duration:
            bgm = bgm.subclip(0, final.duration)
        final = final.set_audio(bgm.audio_fadeout(1.5))

    out_path = OUT / "baroer_promo_1080p.mp4"
    print(f"Rendering → {out_path}")
    final.write_videofile(
        str(out_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="7500k",
        audio_bitrate="192k",
        threads=4,
        preset="medium",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    )
    return out_path


if __name__ == "__main__":
    build_video()
