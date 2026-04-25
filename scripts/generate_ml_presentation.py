# -*- coding: utf-8 -*-
"""
바로응급실 · ML 관점 발표 덱 생성기
====================================

`docs/ML_관점_바로응급실.md` 의 핵심만 추려서 **간결한 10장짜리 발표 덱**을
생성한다. 포커스는 오직 네 가지 :

  1) y 는 무엇인가  (5층 출력)
  2) x 는 무엇인가  (21개 입력, 5그룹)
  3) 어떤 모델링을 참조했나
  4) 어떤 통계·기술이 실제로 쓰이고 있나

같은 폴더의 `generate_presentation.py` 에 정의된 디자인 토큰과 저수준
헬퍼를 그대로 재사용하므로, 두 덱의 비주얼 언어가 완벽히 일치한다.

실행
  python scripts/generate_ml_presentation.py
결과
  docs/BaroER_ML관점_발표자료.pptx
"""

from __future__ import annotations

import os
import sys

# 같은 폴더의 기본 덱 생성기에서 디자인 토큰 · 헬퍼를 재사용
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_presentation import (  # type: ignore
    # design tokens
    PRIMARY, PRIMARY_DARK, PRIMARY_SOFT, ACCENT, ACCENT_SOFT,
    TEXT, TEXT_MUTED, TEXT_SUBTLE, BORDER, BORDER_STRONG,
    SURFACE, SURFACE2, WHITE,
    STATUS_OK, STATUS_BUSY, STATUS_FULL,
    FONT_KR, FONT_EN, SLIDE_W, SLIDE_H,
    # helpers
    add_rect, add_text, add_rich_line, add_line, add_pill, add_circle,
    draw_shell, draw_title, draw_subtitle, new_slide,
    stat_block, info_card,
)

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR


TOTAL = 10


# ---------------------------------------------------------------------------
# Slide builders
# ---------------------------------------------------------------------------

def slide_cover(prs):
    slide = new_slide(prs)

    # 좌측 큰 색 블록
    add_rect(slide, Inches(0), Inches(0), Inches(4.6), SLIDE_H, fill=PRIMARY)
    add_rect(slide, Inches(0), Inches(0), Inches(4.6), Inches(0.3), fill=PRIMARY_DARK)

    # 좌 블록 내부 : 거대한 y = f(x)
    add_text(
        slide, Inches(0.6), Inches(2.2), Inches(4), Inches(1.0),
        "y  =  f ( x )",
        size=54, bold=True, color=WHITE, font=FONT_EN, line_spacing=1.0,
    )
    add_text(
        slide, Inches(0.6), Inches(3.35), Inches(4), Inches(0.6),
        "머신러닝의 가장 단순한 수식,",
        size=14, color=WHITE, line_spacing=1.35,
    )
    add_text(
        slide, Inches(0.6), Inches(3.68), Inches(4), Inches(0.6),
        "그 관점으로 바로응급실을 해부하다.",
        size=14, bold=True, color=WHITE, line_spacing=1.35,
    )

    # 우측 본문
    add_pill(
        slide, Inches(5.1), Inches(1.6), Inches(3.0), Inches(0.42),
        "ML PERSPECTIVE DECK",
        fill=PRIMARY_SOFT, color=PRIMARY, size=11, bold=True,
    )
    add_text(
        slide, Inches(5.1), Inches(2.2), Inches(8), Inches(1.2),
        "바로응급실을",
        size=44, bold=True, color=TEXT, line_spacing=1.05,
    )
    add_text(
        slide, Inches(5.1), Inches(2.9), Inches(8), Inches(1.2),
        "머신러닝 관점으로",
        size=44, bold=True, color=TEXT, line_spacing=1.05,
    )
    add_text(
        slide, Inches(5.1), Inches(3.6), Inches(8), Inches(1.2),
        "이해하기",
        size=44, bold=True, color=PRIMARY, line_spacing=1.05,
    )

    add_rect(slide, Inches(5.1), Inches(4.55), Inches(0.4), Inches(0.04), fill=PRIMARY_DARK)
    add_text(
        slide, Inches(5.1), Inches(4.7), Inches(8), Inches(0.4),
        "y · f · x 로 풀어보는 10분 요약",
        size=14, color=TEXT_MUTED, line_spacing=1.4,
    )

    # 핵심 지표 3개
    stat_block(slide, Inches(5.1), Inches(5.35), Inches(2.5), Inches(1.55),
               value="5", label="층(layer) 으로 쌓인  출력  y", suffix="")
    stat_block(slide, Inches(7.75), Inches(5.35), Inches(2.5), Inches(1.55),
               value="21", label="개의 입력 변수  x  (5 그룹)", suffix="")
    stat_block(slide, Inches(10.4), Inches(5.35), Inches(2.5), Inches(1.55),
               value="3", label="단계로 진화하는  f  (Rule → ML → Multi-task)", suffix="")

    # 하단 메타
    add_text(
        slide, Inches(5.1), SLIDE_H - Inches(0.85), Inches(8), Inches(0.3),
        "MrSure · 이진영     |     2026-04-23     |     BaroER Project Deck",
        size=10, color=TEXT_SUBTLE, font=FONT_EN,
    )


def slide_yfx_basics(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="01 · 워밍업")
    draw_title(slide, "y = f(x) 는 뭘까?",
               highlight="입력(x) → 규칙(f) → 결과(y), 그뿐.")

    y0 = Inches(4.0)
    # 3단 카드
    card_w = Inches(4.0)
    gap = Inches(0.25)
    x0 = Inches(0.8)

    def card(x, title, body, emoji, tone):
        add_rect(slide, x, y0, card_w, Inches(2.6), fill=SURFACE, line=BORDER, corner=0.06)
        add_text(slide, x + Inches(0.3), y0 + Inches(0.25), Inches(1), Inches(0.5),
                 emoji, size=28, color=tone)
        add_text(slide, x + Inches(0.3), y0 + Inches(0.85), card_w - Inches(0.6), Inches(0.4),
                 title, size=16, bold=True, color=TEXT)
        add_text(slide, x + Inches(0.3), y0 + Inches(1.3), card_w - Inches(0.6), Inches(1.3),
                 body, size=12, color=TEXT_MUTED, line_spacing=1.45)

    card(x0,
         "x  ·  입력 (Input)",
         "지금 이 순간 센서·사용자·외부에서 들어오는 모든 정보.\n예) 증상, 위치, 병원 상태…",
         "📥", PRIMARY)
    card(x0 + card_w + gap,
         "f  ·  규칙 (Model)",
         "x 로부터 y 를 뽑아내는 방법.\n사람이 짠 공식이면 Rule-Based,\n데이터로 학습하면 Machine Learning.",
         "⚙️", ACCENT)
    card(x0 + (card_w + gap) * 2,
         "y  ·  결과 (Output)",
         "앱이 사용자에게 돌려주는 답.\n예) KTAS 등급, 병원 순위, 도착 시간…",
         "🎯", PRIMARY)

    # 한 줄 결론
    add_rect(slide, Inches(0.8), Inches(6.7), Inches(11.7), Inches(0.6),
             fill=PRIMARY_SOFT, corner=0.08)
    add_text(slide, Inches(1.0), Inches(6.7), Inches(11.5), Inches(0.6),
             "바로응급실 = \"응급 상황(x) 을 받아서, 환자를 살릴 병원(y) 을 빠르게 찾아주는 f\" 를 만드는 프로젝트.",
             size=13, bold=True, color=PRIMARY, anchor=MSO_ANCHOR.MIDDLE)


def slide_y_overview(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="02 · 출력 y")
    draw_title(slide, "y 는 무엇인가?",
               highlight="하나가 아니라 5층으로 쌓여 있다.")

    # 5개 세로 스택 카드
    items = [
        ("Layer 1", "KTAS 1~5 등급",        "중증도 분류 · Multi-class",       PRIMARY),
        ("Layer 2", "병원 추천 순위",        "Learning-to-Rank · 앱의 핵심",    ACCENT),
        ("Layer 3", "수용 가능성 0~100%",   "이진 분류 · 🟢🟠🔴 마커",          STATUS_BUSY),
        ("Layer 4", "도착/대기 시간(분)",    "회귀 (Regression)",                ACCENT),
        ("Layer ★", "환자 예후 · 생존",     "의사결정 최적화 · 앱의 존재 이유", PRIMARY_DARK),
    ]
    y = Inches(3.9)
    row_h = Inches(0.55)
    for i, (lv, what, kind, tone) in enumerate(items):
        yy = y + row_h * i + Inches(0.08 * i)
        # 좌측 라벨 pill
        add_pill(slide, Inches(0.8), yy, Inches(1.3), Inches(0.45), lv,
                 fill=tone, color=WHITE, size=11, bold=True)
        # 본문 표
        add_rect(slide, Inches(2.3), yy, Inches(10.2), Inches(0.45),
                 fill=SURFACE, line=BORDER, corner=0.06)
        add_text(slide, Inches(2.55), yy, Inches(4.5), Inches(0.45),
                 what, size=13, bold=True, color=TEXT,
                 anchor=MSO_ANCHOR.MIDDLE)
        add_text(slide, Inches(7.2), yy, Inches(5.2), Inches(0.45),
                 kind, size=12, color=TEXT_MUTED,
                 anchor=MSO_ANCHOR.MIDDLE)


def slide_x_overview(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="03 · 입력 x")
    draw_title(slide, "x 는 총 21개,",
               highlight="5 개 그룹으로 이루어진 상황 스냅샷.")

    # 상단 큰 숫자 강조
    add_rect(slide, Inches(0.8), Inches(3.9), Inches(3.2), Inches(3.1),
             fill=PRIMARY, corner=0.1)
    add_text(slide, Inches(0.8), Inches(4.0), Inches(3.2), Inches(1.2),
             "21", size=110, bold=True, color=WHITE, font=FONT_EN,
             align=PP_ALIGN.CENTER, line_spacing=1.0)
    add_text(slide, Inches(0.8), Inches(5.7), Inches(3.2), Inches(0.4),
             "개의 feature", size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(0.8), Inches(6.1), Inches(3.2), Inches(0.4),
             "(x₁ ~ x₂₁)", size=12, color=PRIMARY_SOFT, align=PP_ALIGN.CENTER, font=FONT_EN)

    # 우측 5개 그룹 리스트
    groups = [
        ("A", "환자 정보",           "6",  "증상·의식·연령 등",       PRIMARY),
        ("B", "상황·컨텍스트",        "4",  "위치·시각·반경·망",         ACCENT),
        ("C", "사용자 프로필",       "2",  "일반/구급대원·소속",       TEXT_MUTED),
        ("D", "병원 실시간 속성",     "5 × N", "병상·전문의·장비·수용", STATUS_BUSY),
        ("E", "경로·교통",           "4 × N", "거리·ETA·혼잡·전화 결과", ACCENT),
    ]
    gx = Inches(4.3)
    gw = Inches(8.2)
    gh = Inches(0.55)
    for i, (tag, name, count, hint, tone) in enumerate(groups):
        yy = Inches(3.9) + gh * i + Inches(0.06 * i)
        add_rect(slide, gx, yy, gw, gh, fill=SURFACE, line=BORDER, corner=0.06)
        # 그룹 배지
        add_circle(slide, gx + Inches(0.2), yy + Inches(0.12), Inches(0.32), tone)
        add_text(slide, gx + Inches(0.2), yy + Inches(0.12), Inches(0.32), Inches(0.32),
                 tag, size=11, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        # 그룹명
        add_text(slide, gx + Inches(0.7), yy, Inches(3.2), gh,
                 name, size=13, bold=True, color=TEXT, anchor=MSO_ANCHOR.MIDDLE)
        # 개수
        add_text(slide, gx + Inches(3.9), yy, Inches(1.3), gh,
                 count + " 개", size=13, bold=True, color=PRIMARY,
                 anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN, align=PP_ALIGN.CENTER)
        # 힌트
        add_text(slide, gx + Inches(5.3), yy, Inches(2.8), gh,
                 hint, size=11, color=TEXT_MUTED, anchor=MSO_ANCHOR.MIDDLE)


def _feature_table(slide, x, y, w, rows, header_tone):
    """(번호, 변수명, 예시) 행 리스트를 표로."""
    row_h = Inches(0.36)
    # header
    add_rect(slide, x, y, w, row_h, fill=header_tone, corner=0.06)
    add_text(slide, x + Inches(0.15), y, Inches(0.8), row_h,
             "#", size=10, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
    add_text(slide, x + Inches(0.9), y, Inches(2.5), row_h,
             "변수", size=10, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, x + Inches(3.4), y, w - Inches(3.5), row_h,
             "예시 값", size=10, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)

    for i, (num, name, example) in enumerate(rows):
        yy = y + row_h * (i + 1)
        fill = WHITE if i % 2 == 0 else SURFACE
        add_rect(slide, x, yy, w, row_h, fill=fill, line=BORDER, corner=0.0)
        add_text(slide, x + Inches(0.15), yy, Inches(0.8), row_h,
                 num, size=10, bold=True, color=PRIMARY,
                 anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
        add_text(slide, x + Inches(0.9), yy, Inches(2.5), row_h,
                 name, size=11, bold=True, color=TEXT, anchor=MSO_ANCHOR.MIDDLE)
        add_text(slide, x + Inches(3.4), yy, w - Inches(3.5), row_h,
                 example, size=10, color=TEXT_MUTED, anchor=MSO_ANCHOR.MIDDLE)


def slide_x_details_user(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="04 · x 상세 ①")
    draw_title(slide, "x 상세 ① — 사람과 상황",
               highlight="그룹 A·B·C : 총 12개")

    # 좌측 A (6개)
    add_text(slide, Inches(0.8), Inches(3.9), Inches(6), Inches(0.35),
             "A. 환자 정보 · 6개", size=13, bold=True, color=PRIMARY)
    _feature_table(slide, Inches(0.8), Inches(4.3), Inches(6.0), [
        ("x1", "증상 키워드",     "흉통, 호흡곤란, 외상, 두통, 복통, 의식저하"),
        ("x2", "상세 증상 텍스트","“가슴이 10분째 답답해요” (텍스트/음성)"),
        ("x3", "환자 성별",       "남 / 여"),
        ("x4", "환자 연령대",     "영유아 · 소아 · 성인 · 노인"),
        ("x5", "의식 상태",       "명료 / 기면 / 혼미 / 무반응"),
        ("x6", "발병 시점",       "30분 전부터 (수면 중 시작 등)"),
    ], header_tone=PRIMARY)

    # 우측 B (4개)
    add_text(slide, Inches(7.0), Inches(3.9), Inches(6), Inches(0.35),
             "B. 상황·컨텍스트 · 4개", size=13, bold=True, color=ACCENT)
    _feature_table(slide, Inches(7.0), Inches(4.3), Inches(5.5), [
        ("x7",  "현재 위치 (GPS)", "(37.5665, 126.9780)"),
        ("x8",  "현재 시각·요일",   "2026-04-23 03:12 (평일·새벽)"),
        ("x9",  "검색 반경",        "5 / 10 / 20 km"),
        ("x10", "네트워크 상태",    "온라인 / 오프라인 / 저속망"),
    ], header_tone=ACCENT)

    # 우측 하단 C (2개)
    add_text(slide, Inches(7.0), Inches(6.3), Inches(6), Inches(0.35),
             "C. 사용자 프로필 · 2개", size=13, bold=True, color=TEXT_MUTED)
    _feature_table(slide, Inches(7.0), Inches(6.7), Inches(5.5), [
        ("x11", "사용자 유형",      "일반 시민 / 구급대원"),
        ("x12", "소속기관 코드",    "119-Seoul-Jongno (구급대원만)"),
    ], header_tone=TEXT_MUTED)


def slide_x_details_hospital(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="05 · x 상세 ②")
    draw_title(slide, "x 상세 ② — 병원과 경로",
               highlight="그룹 D·E : (5 + 4) × 주변 병원 수 N")

    # 상단 설명
    add_rect(slide, Inches(0.8), Inches(3.9), Inches(11.7), Inches(0.55),
             fill=SURFACE, line=BORDER, corner=0.06)
    add_text(slide, Inches(1.0), Inches(3.9), Inches(11.3), Inches(0.55),
             "반경 내 응급실이 N 곳 있다면, 아래 9개 속성이 병원마다 반복되어 붙는 행렬 형태의 입력입니다.",
             size=11, color=TEXT_MUTED, anchor=MSO_ANCHOR.MIDDLE)

    # 좌측 D (5개)
    add_text(slide, Inches(0.8), Inches(4.7), Inches(6), Inches(0.35),
             "D. 병원 실시간 속성 · 5 × N개  (출처: 공공데이터)", size=13, bold=True, color=STATUS_BUSY)
    _feature_table(slide, Inches(0.8), Inches(5.1), Inches(6.0), [
        ("x13", "응급실 병상 수",   "일반 3 / 중환자 1 / 외상 0"),
        ("x14", "수용 가능 여부",   "Y (수용) / 혼잡 / N (불가)"),
        ("x15", "대응 전문의",      "응급 · 외과 · 소아 · 산부인과"),
        ("x16", "특수 장비",        "CT · MRI · 혈관조영 · ECMO"),
        ("x17", "병원 기본정보",    "명칭·주소·전화·좌표 (상수)"),
    ], header_tone=STATUS_BUSY)

    # 우측 E (4개)
    add_text(slide, Inches(7.0), Inches(4.7), Inches(6), Inches(0.35),
             "E. 경로·교통 · 4 × N개  (출처: 지도·내비 API)", size=13, bold=True, color=ACCENT)
    _feature_table(slide, Inches(7.0), Inches(5.1), Inches(5.5), [
        ("x18", "직선거리",           "3.4 km"),
        ("x19", "도로 기반 ETA",      "12분 (Naver Directions)"),
        ("x20", "실시간 교통",        "정체 / 원활"),
        ("x21", "자동 전화 결과",     "수용 ✅ / 불가 ❌ / 무응답 (Twilio)"),
    ], header_tone=ACCENT)


def slide_modeling_refs(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="06 · 모델링 참조")
    draw_title(slide, "어떤 모델링을 참고했나",
               highlight="의료 분류 × 추천 시스템 × 온라인 학습의 하이브리드")

    # 4장의 참조 카드
    refs = [
        {
            "title": "KTAS (Korean Triage & Acuity Scale)",
            "body": "대한응급의학회의 5단계 중증도 분류 표준.\n규칙 기반 체크리스트로 시작 → 향후 NLP 기반 분류기로 대체 가능.",
            "kind": "Rule → Multi-class Classifier",
            "tone": "primary",
        },
        {
            "title": "Learning-to-Rank (LTR)",
            "body": "Microsoft LambdaMART / XGBoost-Rank 계열.\n검색엔진·쇼핑몰의 \"N개 후보를 점수순 정렬\" 문제와 동형.",
            "kind": "Pairwise / Listwise Ranking",
            "tone": "accent",
        },
        {
            "title": "Contextual Bandit",
            "body": "Netflix·광고 추천에서 쓰는 온라인 의사결정 기법.\n\"이 병원에 보내 본 결과\" 로 모델을 실시간 업데이트.",
            "kind": "LinUCB · Thompson Sampling",
            "tone": "primary",
        },
        {
            "title": "Clinical Prediction Models",
            "body": "MIMIC-III, eICU 등 공개 응급실 데이터셋 연구.\n병원 수용 가능성 · 대기시간 예측에 로지스틱 회귀·부스팅 모델 사용.",
            "kind": "Binary Classification · Regression",
            "tone": "accent",
        },
    ]
    cw = Inches(5.85)
    ch = Inches(1.55)
    gap_x = Inches(0.2)
    gap_y = Inches(0.2)
    x0 = Inches(0.8)
    y0 = Inches(3.9)
    for i, r in enumerate(refs):
        col = i % 2
        row = i // 2
        x = x0 + (cw + gap_x) * col
        y = y0 + (ch + gap_y) * row
        tone = PRIMARY if r["tone"] == "primary" else ACCENT
        tone_soft = PRIMARY_SOFT if r["tone"] == "primary" else ACCENT_SOFT
        add_rect(slide, x, y, cw, ch, fill=SURFACE, line=BORDER, corner=0.06)
        add_rect(slide, x, y, Inches(0.1), ch, fill=tone)
        add_text(slide, x + Inches(0.3), y + Inches(0.2), cw - Inches(0.5), Inches(0.4),
                 r["title"], size=14, bold=True, color=TEXT)
        add_text(slide, x + Inches(0.3), y + Inches(0.6), cw - Inches(0.5), Inches(0.7),
                 r["body"], size=11, color=TEXT_MUTED, line_spacing=1.4)
        add_pill(slide, x + Inches(0.3), y + ch - Inches(0.4), Inches(3.2), Inches(0.3),
                 r["kind"], fill=tone_soft, color=tone, size=9, bold=True)

    # 하단 메모
    add_rect(slide, Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.35),
             fill=PRIMARY_SOFT, corner=0.06)
    add_text(slide, Inches(1.0), Inches(7.0), Inches(11.5), Inches(0.35),
             "※ 현재 MVP 는 위 기법들의 \"입력/출력 구조\" 만 먼저 맞춰 두고, 충분한 로그가 쌓이면 모델로 순차 교체하는 ML-Ready 설계.",
             size=10, bold=True, color=PRIMARY, anchor=MSO_ANCHOR.MIDDLE)


def slide_stats_tech(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="07 · 통계 · 기술")
    draw_title(slide, "실제로 쓰이는 통계와 기술",
               highlight="지금은 규칙, 내일은 학습.")

    # 좌측: 현재 쓰는 규칙/통계
    add_rect(slide, Inches(0.8), Inches(3.9), Inches(5.85), Inches(3.1),
             fill=SURFACE, line=BORDER, corner=0.08)
    add_pill(slide, Inches(1.0), Inches(4.05), Inches(1.7), Inches(0.35),
             "NOW · Rule-Based", fill=PRIMARY_SOFT, color=PRIMARY, size=10)
    add_text(slide, Inches(1.0), Inches(4.5), Inches(5.5), Inches(0.4),
             "현재 MVP 의 병원 점수 공식",
             size=14, bold=True, color=TEXT)
    add_rect(slide, Inches(1.0), Inches(4.95), Inches(5.5), Inches(0.55),
             fill=WHITE, line=BORDER, corner=0.06)
    add_text(slide, Inches(1.15), Inches(4.95), Inches(5.3), Inches(0.55),
             "점수 = 거리 × 0.4  +  수용가능 × 0.5  +  중증도매칭 × 0.1",
             size=12, bold=True, color=TEXT, anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
    bullets_now = [
        "• 거리 : Haversine 공식 (위·경도 → km)",
        "• 수용가능 : 공공데이터 Y/혼잡/N 을 {1.0, 0.5, 0} 으로 인코딩",
        "• 중증도매칭 : KTAS 등급 × 해당 병원 전문의 보유 가중",
        "• 이진 뱃지 🟢🟠🔴 : 수용가능 변수의 임계치 기반 히스토그램",
    ]
    for i, b in enumerate(bullets_now):
        add_text(slide, Inches(1.0), Inches(5.6) + Inches(0.3) * i, Inches(5.5), Inches(0.3),
                 b, size=11, color=TEXT_MUTED, line_spacing=1.4)

    # 우측: 쌓이는 데이터 / 앞으로 학습에 쓸 통계
    add_rect(slide, Inches(6.85), Inches(3.9), Inches(5.85), Inches(3.1),
             fill=SURFACE, line=BORDER, corner=0.08)
    add_pill(slide, Inches(7.05), Inches(4.05), Inches(1.9), Inches(0.35),
             "NEXT · ML-Ready", fill=ACCENT_SOFT, color=ACCENT, size=10)
    add_text(slide, Inches(7.05), Inches(4.5), Inches(5.5), Inches(0.4),
             "자동 기록되는 학습용 로그",
             size=14, bold=True, color=TEXT)
    add_rect(slide, Inches(7.05), Inches(4.95), Inches(5.5), Inches(0.55),
             fill=WHITE, line=BORDER, corner=0.06)
    add_text(slide, Inches(7.2), Inches(4.95), Inches(5.3), Inches(0.55),
             "( 환자 상태 x , 선택된 병원 h , 처리시간 t , 결과 o )",
             size=12, bold=True, color=ACCENT, anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
    bullets_next = [
        "• 출동 수집 : 구급대원 FR-LOG 기능 (타임스탬프 자동)",
        "• 분포 분석 : 시간대별 수용률, 지역별 뺑뻉이 빈도",
        "• 모델 후보 : Logistic Regression → GBDT → LTR 순차 업그레이드",
        "• 평가 지표 : NDCG@5, Precision@1, 골든타임 준수율",
    ]
    for i, b in enumerate(bullets_next):
        add_text(slide, Inches(7.05), Inches(5.6) + Inches(0.3) * i, Inches(5.5), Inches(0.3),
                 b, size=11, color=TEXT_MUTED, line_spacing=1.4)


def slide_pipeline(prs, idx):
    slide = new_slide(prs)
    draw_shell(slide, index=idx, total=TOTAL, kicker="08 · 파이프라인")
    draw_title(slide, "하나의 f 가 아니라, 작은 f 여러 개가 이어진다.",
               highlight="x → f_STT → f_KTAS → f_Rank → f_Call → y")

    # 5개 노드 파이프라인
    nodes = [
        ("입력 x",    "음성·증상·위치\n병원 실시간 상태", PRIMARY),
        ("f_STT",    "Web Speech API\n음성 → 텍스트",    ACCENT),
        ("f_KTAS",   "규칙 기반 분류\n→ 향후 NLP 모델",   PRIMARY),
        ("f_Rank",   "점수 공식\n→ 향후 LTR",            ACCENT),
        ("출력 y",    "지도·리스트 표시\n자동 전화",      PRIMARY),
    ]
    n = len(nodes)
    nw = Inches(2.2)
    nh = Inches(1.9)
    total_w = nw * n + Inches(0.35) * (n - 1)
    start_x = (SLIDE_W - total_w) / 2
    y = Inches(4.4)

    for i, (title, body, tone) in enumerate(nodes):
        x = start_x + (nw + Inches(0.35)) * i
        tone_soft = PRIMARY_SOFT if tone == PRIMARY else ACCENT_SOFT
        add_rect(slide, x, y, nw, nh, fill=tone_soft, line=tone, line_w=1.2, corner=0.1)
        add_text(slide, x, y + Inches(0.25), nw, Inches(0.45),
                 title, size=15, bold=True, color=tone,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
        add_text(slide, x + Inches(0.15), y + Inches(0.8), nw - Inches(0.3), Inches(1.0),
                 body, size=10.5, color=TEXT_MUTED, align=PP_ALIGN.CENTER,
                 line_spacing=1.4)
        # 화살표
        if i < n - 1:
            cx1 = x + nw
            cy = y + nh / 2
            cx2 = x + nw + Inches(0.35)
            add_line(slide, cx1, cy, cx2, cy, color=BORDER_STRONG, weight=1.8)
            # 화살촉
            add_text(slide, cx2 - Inches(0.35), cy - Inches(0.2), Inches(0.35), Inches(0.4),
                     "▶", size=14, bold=True, color=TEXT_SUBTLE,
                     align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # 하단 메모
    add_text(slide, Inches(0.8), Inches(6.6), Inches(11.7), Inches(0.5),
             "ML 관점의 핵심 : y 가 여러 층이므로 f 도 여러 개. 각 단계를 독립된 모델로 잘게 나누면 교체 · 실험 · 디버깅이 쉬워진다 (Multi-task / Pipeline).",
             size=12, color=TEXT_MUTED, line_spacing=1.5)


def slide_closing(prs, idx):
    slide = new_slide(prs)
    # 좌측 accent half
    add_rect(slide, Inches(0), Inches(0), Inches(5.3), SLIDE_H, fill=TEXT)
    add_rect(slide, Inches(0.6), Inches(1.2), Inches(0.1), Inches(0.7), fill=PRIMARY)
    add_text(slide, Inches(0.6), Inches(1.9), Inches(4.5), Inches(0.4),
             "ONE-LINE SUMMARY", size=11, bold=True, color=PRIMARY_SOFT, font=FONT_EN)

    add_text(slide, Inches(0.6), Inches(2.4), Inches(4.5), Inches(1.0),
             "21 개의 입력,", size=32, bold=True, color=WHITE, line_spacing=1.1)
    add_text(slide, Inches(0.6), Inches(3.05), Inches(4.5), Inches(1.0),
             "5 층의 출력,", size=32, bold=True, color=WHITE, line_spacing=1.1)
    add_text(slide, Inches(0.6), Inches(3.7), Inches(4.5), Inches(1.0),
             "하나의 사명.", size=32, bold=True, color=PRIMARY, line_spacing=1.1)

    add_text(slide, Inches(0.6), Inches(4.8), Inches(4.5), Inches(2.0),
             "골든 타임 안에 환자를\n가장 잘 살릴 수 있는 병원을\n빠르고 정확하게 찾는\n지능형 f 를 만드는 일.",
             size=14, color=WHITE, line_spacing=1.55)

    # 우측 흰 영역 — 핵심 수식
    add_text(slide, Inches(6.0), Inches(1.8), Inches(6.8), Inches(0.4),
             "요약 수식", size=11, bold=True, color=TEXT_SUBTLE, font=FONT_EN)
    add_text(slide, Inches(6.0), Inches(2.3), Inches(6.8), Inches(1.0),
             "f ( x_{환자}, x_{상황}, x_{프로필}, x_{병원}, x_{경로} )",
             size=18, bold=True, color=TEXT, font=FONT_EN, line_spacing=1.3)
    add_text(slide, Inches(6.0), Inches(3.1), Inches(6.8), Inches(1.0),
             "  =  ( y_{KTAS}, y_{수용확률}, y_{순위}, y_{시간}, y_{예후} )",
             size=18, bold=True, color=PRIMARY, font=FONT_EN, line_spacing=1.3)

    # 3 단계 진화
    add_text(slide, Inches(6.0), Inches(4.2), Inches(6.8), Inches(0.4),
             "f 의 진화 로드맵", size=11, bold=True, color=TEXT_SUBTLE, font=FONT_EN)

    stages = [
        ("1.", "Rule-Based",  "지금 · 가중 합계 공식",     PRIMARY),
        ("2.", "ML-Learned",  "로그 누적 후 · LTR · GBDT",  ACCENT),
        ("3.", "Multi-task",  "KTAS·Rank·Call 통합 학습",   PRIMARY_DARK),
    ]
    for i, (no, name, hint, tone) in enumerate(stages):
        yy = Inches(4.65) + Inches(0.55) * i
        add_circle(slide, Inches(6.0), yy + Inches(0.05), Inches(0.32), tone)
        add_text(slide, Inches(6.0), yy + Inches(0.05), Inches(0.32), Inches(0.32),
                 no, size=10, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=FONT_EN)
        add_text(slide, Inches(6.5), yy, Inches(2.2), Inches(0.4),
                 name, size=13, bold=True, color=TEXT, anchor=MSO_ANCHOR.MIDDLE)
        add_text(slide, Inches(8.8), yy, Inches(4.2), Inches(0.4),
                 hint, size=11, color=TEXT_MUTED, anchor=MSO_ANCHOR.MIDDLE)

    # 하단 감사/연락
    add_rect(slide, Inches(6.0), Inches(6.3), Inches(6.8), Inches(0.03), fill=BORDER)
    add_text(slide, Inches(6.0), Inches(6.4), Inches(6.8), Inches(0.4),
             "Thanks.",
             size=22, bold=True, color=TEXT, font=FONT_EN)
    add_text(slide, Inches(6.0), Inches(6.85), Inches(6.8), Inches(0.3),
             "MrSure · 이진영   ·   BaroER Project   ·   2026-04-23",
             size=10, color=TEXT_SUBTLE, font=FONT_EN)


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

def build(out_path):
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_cover(prs)
    slide_yfx_basics(prs,       idx=2)
    slide_y_overview(prs,       idx=3)
    slide_x_overview(prs,       idx=4)
    slide_x_details_user(prs,   idx=5)
    slide_x_details_hospital(prs, idx=6)
    slide_modeling_refs(prs,    idx=7)
    slide_stats_tech(prs,       idx=8)
    slide_pipeline(prs,         idx=9)
    slide_closing(prs,          idx=10)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    prs.save(out_path)
    print(f"[ok] saved: {out_path}")
    print(f"     slides: {len(prs.slides)}")


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "docs", "BaroER_ML관점_발표자료.pptx")
    build(out)
