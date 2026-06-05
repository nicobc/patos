#!/usr/bin/env python3
"""
Board YAML mutation helper. No external dependencies.

Commands:
  ticket EPIC-XX/TN STATUS  — set ticket status in epic YAML
  epic   EPIC-XX STATUS     — set epic status in epic YAML
  index  EPIC-XX SECTION    — move epic to section in index.yaml
  all-done EPIC-XX          — exit 0 if all tickets DONE/DISCARDED, else exit 1
"""
import re, sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BOARD_DIR = PROJECT_ROOT / '.claude' / 'board'


def epic_file(epic_id: str) -> Path:
    num = int(epic_id.split('-')[1])
    return BOARD_DIR / 'epics' / f'epic-{num:02d}.yaml'


def set_ticket_status(ticket_ref: str, status: str) -> None:
    epic_id, tid = ticket_ref.split('/', 1)
    path = epic_file(epic_id)
    lines = path.read_text().splitlines(keepends=True)
    in_ticket = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == f'- id: {tid}':
            in_ticket = True
        elif in_ticket and stripped.startswith('- id:'):
            break
        elif in_ticket and re.match(r'\s+status:\s*', line):
            lines[i] = re.sub(r'(\s+status:\s*).*', rf'\g<1>{status}', line.rstrip()) + '\n'
            break
    path.write_text(''.join(lines))


def set_epic_status(epic_id: str, status: str) -> None:
    path = epic_file(epic_id)
    text = re.sub(r'^(status:\s*).*', rf'\g<1>{status}', path.read_text(), count=1, flags=re.MULTILINE)
    path.write_text(text)


def move_epic_in_index(epic_id: str, new_section: str) -> None:
    path = BOARD_DIR / 'index.yaml'
    text = path.read_text()
    m = re.search(rf'  - id: {re.escape(epic_id)}\n    title: [^\n]+\n', text)
    if not m:
        sys.stderr.write(f'Epic {epic_id} not found in index.yaml\n'); sys.exit(1)
    entry = m.group(0)
    text = text[:m.start()] + text[m.end():]
    sm = re.search(rf'^{re.escape(new_section)}:[^\n]*\n', text, re.MULTILINE)
    if not sm:
        sys.stderr.write(f'Section {new_section!r} not found in index.yaml\n'); sys.exit(1)
    text = text[:sm.end()] + entry + text[sm.end():]
    path.write_text(text)


def all_done(epic_id: str) -> None:
    in_ticket = False
    for line in epic_file(epic_id).read_text().splitlines():
        s = line.strip()
        if re.match(r'^- id: T\d+$', s):
            in_ticket = True
        elif in_ticket and re.match(r'^- id:', s):
            in_ticket = False
        elif in_ticket and s.startswith('status:'):
            if s.split(':', 1)[1].strip() not in ('DONE', 'DISCARDED'):
                sys.exit(1)
    sys.exit(0)


cmd = sys.argv[1]
if   cmd == 'ticket':   set_ticket_status(sys.argv[2], sys.argv[3])
elif cmd == 'epic':     set_epic_status(sys.argv[2], sys.argv[3])
elif cmd == 'index':    move_epic_in_index(sys.argv[2], sys.argv[3])
elif cmd == 'all-done': all_done(sys.argv[2])
else: sys.stderr.write(f'Unknown command: {cmd}\n'); sys.exit(1)
