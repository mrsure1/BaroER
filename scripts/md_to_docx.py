"""
Convert Markdown files to Word (.docx) using Pandoc (recommended).

Usage:
  python scripts/md_to_docx.py docs/Feature_Specification.md docs/PRD.md
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


def find_pandoc() -> str:
    exe = shutil.which("pandoc")
    if exe:
        return exe
    # winget 기본 설치 경로
    local = Path(os.environ.get("LOCALAPPDATA", "")) / "Pandoc" / "pandoc.exe"
    if local.is_file():
        return str(local)
    raise FileNotFoundError(
        "pandoc 을 찾을 수 없습니다. winget install JohnMacFarlane.Pandoc 후 다시 시도하세요."
    )


def convert_file(md_path: Path, docx_path: Path | None = None) -> Path:
    md_path = md_path.resolve()
    if not md_path.is_file():
        raise FileNotFoundError(md_path)

    if docx_path is None:
        docx_path = md_path.with_suffix(".docx")
    else:
        docx_path = docx_path.resolve()

    pandoc = find_pandoc()
    cmd = [
        pandoc,
        str(md_path),
        "-f",
        "markdown",
        "-t",
        "docx",
        "-o",
        str(docx_path),
        "--standalone",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise RuntimeError(f"pandoc failed:\n{r.stderr or r.stdout}")
    return docx_path


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("Usage: python md_to_docx.py <file.md> [file2.md ...]", file=sys.stderr)
        sys.exit(1)

    for arg in args:
        out = convert_file(Path(arg))
        print(f"[OK] {out}")


if __name__ == "__main__":
    main()
