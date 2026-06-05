# /// script
# requires-python = ">=3.9"
# dependencies = ["pyyaml"]
# ///
import json
import subprocess
import sys
from pathlib import Path

import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BOARD_DIR = PROJECT_ROOT / ".claude" / "board"
EPICS_DIR = BOARD_DIR / "epics"


def read_file(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None


def get_active_epic_id(index: dict) -> str | None:
    for key in ("in_progress", "ready", "ideation"):
        epics = index.get(key) or []
        if epics:
            return epics[0]["id"]
    return None


def epic_path(epic_id: str) -> Path | None:
    num = int(epic_id.split("-")[1])
    for fmt in (f"epic-{num:02d}.yaml", f"epic-{num:03d}.yaml"):
        p = EPICS_DIR / fmt
        if p.exists():
            return p
    return None


def main() -> None:
    parts = []

    index_text = read_file(BOARD_DIR / "index.yaml")
    if index_text:
        parts.append(f"## Board index\n```yaml\n{index_text.strip()}\n```")
        index = yaml.safe_load(index_text)
        epic_id = get_active_epic_id(index)
        if epic_id:
            p = epic_path(epic_id)
            if p:
                epic_text = read_file(p)
                if epic_text:
                    parts.append(f"## Active epic ({epic_id})\n```yaml\n{epic_text.strip()}\n```")

    rules = read_file(BOARD_DIR / "rules.md")
    if rules:
        parts.append(f"## Board rules\n{rules.strip()}")

    releasing = read_file(PROJECT_ROOT / "RELEASING.md")
    if releasing:
        parts.append(f"## Release process\n{releasing.strip()}")

    git_parts = []
    for args, label in (
        (["git", "log", "--oneline", "-5"], "recent commits"),
        (["git", "status", "--short"], "working tree"),
        (["git", "log", "origin/main..HEAD", "--oneline"], "branch diff"),
    ):
        result = subprocess.run(args, capture_output=True, text=True, cwd=PROJECT_ROOT)
        if result.stdout.strip():
            git_parts.append(f"### {label}\n```\n{result.stdout.strip()}\n```")
    if git_parts:
        parts.append("## Git state\n" + "\n\n".join(git_parts))

    summary = read_file(PROJECT_ROOT / ".claude" / "session_summary.md")
    if summary:
        parts.append(f"## Previous session summary\n{summary.strip()}")

    if not parts:
        sys.exit(0)

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "\n\n---\n\n".join(parts)
        }
    }))


if __name__ == "__main__":
    main()
