#!/usr/bin/env bash
# Reads TICKET env var (e.g. EPIC-11/T1) and prints: TYPE SCOPE EPIC_ID TICKET_ID
# Usage: read -r TYPE SCOPE EPIC_ID TID < <(bash scripts/read-ticket.sh)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "${TICKET:-}" ]]; then
  echo "Error: TICKET env var not set. Run: export TICKET=EPIC-XX/TN" >&2
  exit 1
fi

EPIC_ID="${TICKET%%/*}"
TID="${TICKET##*/}"
NUM="${EPIC_ID##*-}"
EPIC_FILE="$PROJECT_ROOT/.claude/board/epics/epic-$(printf '%02d' "$((10#$NUM))").yaml"

if [[ ! -f "$EPIC_FILE" ]]; then
  echo "Error: Epic file not found: $EPIC_FILE" >&2
  exit 1
fi

SCOPE=$(grep -m1 '^scope:' "$EPIC_FILE" | awk '{print $2}')
TYPE=$(awk "/^  - id: ${TID}$/ { found=1; next } found && /^    type:/ { print \$2; exit } found && /^  - id:/ { exit }" "$EPIC_FILE")

if [[ -z "$SCOPE" ]]; then
  echo "Error: scope not found in $EPIC_FILE" >&2; exit 1
fi
if [[ -z "$TYPE" ]]; then
  echo "Error: type not found for $TID in $EPIC_FILE" >&2; exit 1
fi

echo "$TYPE $SCOPE $EPIC_ID $TID"
