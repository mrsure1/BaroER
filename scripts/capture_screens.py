"""
Capture key BaroER screens for the YouTube promo video.

Uses Playwright to visit a set of routes and saves full-page PNGs
into .design-preview/. Screens that require auth will redirect to
/login — which is fine, we capture the login page either way.

Usage:
    python scripts/capture_screens.py
"""

from __future__ import annotations

import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".design-preview" / "video"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:3000"

# (route, filename, viewport, wait_ms)
TARGETS = [
    ("/login",               "01_login.png",        (430, 932), 1200),
    ("/register",            "02_register.png",     (430, 932), 1200),
    ("/onboarding-preview",  "03_onboarding.png",   (430, 932), 1500),
    ("/home",                "04_home.png",         (430, 932), 1500),
    ("/search",              "05_search.png",       (430, 932), 1500),
    ("/search/results",      "06_results.png",      (430, 932), 1800),
    ("/dispatch",            "07_dispatch.png",     (430, 932), 1500),
    ("/dispatch/new",        "08_dispatch_new.png", (430, 932), 1500),
    ("/settings",            "09_settings.png",     (430, 932), 1200),
    ("/help",                "10_help.png",         (430, 932), 1200),
    ("/slides",              "11_slides.png",       (1600, 900), 2000),
    # desktop home as well
    ("/home",                "12_home_desktop.png", (1280, 800), 1500),
]


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for route, filename, viewport, wait_ms in TARGETS:
            ctx = browser.new_context(
                viewport={"width": viewport[0], "height": viewport[1]},
                device_scale_factor=2,
                is_mobile=viewport[0] < 600,
                has_touch=viewport[0] < 600,
                locale="ko-KR",
            )
            page = ctx.new_page()
            url = f"{BASE}{route}"
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
            except Exception as e:
                print(f"[warn] {url}: {e}")
            page.wait_for_timeout(wait_ms)
            out = OUT / filename
            page.screenshot(path=str(out), full_page=False)
            print(f"[ok] {route:30s} -> {out.name}  ({out.stat().st_size // 1024} KB)")
            ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
