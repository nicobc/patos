#!/usr/bin/env bash
# Marks TICKET DONE, closes the epic if all tickets are DONE/DISCARDED.
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

# Validate ticket is IN PROGRESS
STATUS_LINE=$(awk "/^  - id: ${TID}$/ {found=1;next} found && /^    status:/ {print; exit} found && /^  - id:/ {exit}" "$EPIC_FILE")
TICKET_STATUS="${STATUS_LINE#*status: }"
if [[ "$TICKET_STATUS" != "IN PROGRESS" ]]; then
  echo "Error: $TID is '$TICKET_STATUS', expected IN PROGRESS" >&2; exit 1
fi

python3 "$SCRIPT_DIR/update-board.py" ticket "$TICKET" "DONE"

if python3 "$SCRIPT_DIR/update-board.py" all-done "$EPIC_ID"; then
  echo "All tickets done — closing $EPIC_ID"
  python3 "$SCRIPT_DIR/update-board.py" epic "$EPIC_ID" "DONE"
  python3 "$SCRIPT_DIR/update-board.py" index "$EPIC_ID" "done"
fi

bash "$SCRIPT_DIR/commit.sh" --board "mark $TICKET DONE"
