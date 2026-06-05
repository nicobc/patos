#!/usr/bin/env bash
# Validates TICKET is READY, marks it IN PROGRESS, and cuts the branch.
# Requires: export TICKET=EPIC-XX/TN
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "${TICKET:-}" ]]; then
  echo "Error: TICKET env var not set. Run: export TICKET=EPIC-XX/TN" >&2; exit 1
fi

read -r _TYPE _SCOPE EPIC_ID TID < <(bash "$SCRIPT_DIR/read-ticket.sh")

NUM="${EPIC_ID##*-}"
EPIC_FILE="$PROJECT_ROOT/.claude/board/epics/epic-$(printf '%02d' "$((10#$NUM))").yaml"

# Validate ticket is READY
STATUS_LINE=$(awk "/^  - id: ${TID}$/ {found=1;next} found && /^    status:/ {print; exit} found && /^  - id:/ {exit}" "$EPIC_FILE")
TICKET_STATUS="${STATUS_LINE#*status: }"
if [[ "$TICKET_STATUS" != "READY" ]]; then
  echo "Error: $TID is '$TICKET_STATUS', expected READY" >&2; exit 1
fi

# Update ticket → IN PROGRESS
python3 "$SCRIPT_DIR/update-board.py" ticket "$TICKET" "IN PROGRESS"

# Update epic and index if not already IN PROGRESS
EPIC_STATUS_LINE=$(grep -m1 '^status:' "$EPIC_FILE")
EPIC_STATUS="${EPIC_STATUS_LINE#status: }"
if [[ "$EPIC_STATUS" != "IN PROGRESS" ]]; then
  python3 "$SCRIPT_DIR/update-board.py" epic "$EPIC_ID" "IN PROGRESS"
  python3 "$SCRIPT_DIR/update-board.py" index "$EPIC_ID" "in_progress"
fi

bash "$SCRIPT_DIR/commit.sh" --board "mark $TICKET IN PROGRESS"
bash "$SCRIPT_DIR/cut-branch.sh"
