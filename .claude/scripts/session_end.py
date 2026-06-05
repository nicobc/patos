#!/usr/bin/env python3
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CLAUDE_BIN = shutil.which("claude") or str(Path.home() / ".local/bin/claude")
MAX_TRANSCRIPT_CHARS = 40_000


def has_meaningful_work(transcript_path: str, cwd: str) -> bool:
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True, text=True, cwd=cwd
    )
    if result.stdout.strip():
        return True

    with open(transcript_path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("type") != "assistant":
                    continue
                for block in entry.get("message", {}).get("content", []):
                    if (block.get("type") == "tool_use"
                            and block.get("name") == "Bash"
                            and {"git", "commit"}.issubset(
                                block.get("input", {}).get("command", "").split())):
                        return True
            except (json.JSONDecodeError, AttributeError):
                continue
    return False


def extract_transcript(transcript_path: str) -> str:
    parts = []
    with open(transcript_path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                t = entry.get("type")

                if t == "user":
                    content = entry.get("message", {}).get("content", "")
                    if isinstance(content, str):
                        # Drop injected system blocks before stripping tags
                        text = re.sub(r"<system-reminder>.*?</system-reminder>", "", content, flags=re.DOTALL)
                        text = re.sub(r"<[^>]+>", "", text).strip()
                        if text:
                            parts.append(f"USER: {text[:400]}")

                elif t == "assistant":
                    for block in entry.get("message", {}).get("content", []):
                        btype = block.get("type")
                        if btype == "text":
                            text = block.get("text", "").strip()
                            if text:
                                parts.append(f"ASSISTANT: {text[:600]}")
                        elif btype == "tool_use":
                            name = block.get("name")
                            inp = block.get("input", {})
                            if name == "Bash":
                                parts.append(f"BASH: {inp.get('command', '')[:300]}")
                            elif name in ("Edit", "Write"):
                                parts.append(f"{name.upper()}: {inp.get('file_path', '')}")

            except (json.JSONDecodeError, AttributeError):
                continue

    content = "\n".join(parts)
    return content[:MAX_TRANSCRIPT_CHARS]


def summarize(transcript: str) -> str:
    today = date.today().strftime("%Y-%m-%d")
    prompt = f"""You are a session summarizer. Produce a concise summary of the Claude Code session transcript below.
Output ONLY the summary in the exact format shown — no preamble, no echoing of the transcript.

Format (omit sections with nothing to report):
# Session summary — {today}
## Ticket
EPIC-XXX/TN — title  (or "none" if no ticket was worked)
## Done
- one bullet per meaningful action
## Decisions
- one bullet per non-obvious call made
## Open / next action
- one line

Dense bullets only. No prose.

<transcript>
{transcript}
</transcript>"""

    result = subprocess.run(
        [CLAUDE_BIN, "-p", "--output-format", "text"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=55,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def main() -> None:
    try:
        data = json.loads(sys.stdin.read())
        transcript_path = data.get("transcript_path", "")
        cwd = data.get("cwd", str(PROJECT_ROOT))

        if not transcript_path or not Path(transcript_path).exists():
            sys.exit(0)

        if not has_meaningful_work(transcript_path, cwd):
            sys.exit(0)

        transcript = extract_transcript(transcript_path)
        summary = summarize(transcript)

        out = PROJECT_ROOT / ".claude" / "session_summary.md"
        out.write_text(summary + "\n", encoding="utf-8")

    except Exception as e:
        print(f"session_end hook error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
