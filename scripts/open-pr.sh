#!/usr/bin/env bash
# Usage: open-pr.sh [--board|--agent] <description> <body>
# Default: ticket PR — derives type/scope/ID from $TICKET.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODE="code"
DESCRIPTION=""
BODY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --board) MODE="board"; shift ;;
    --agent) MODE="agent"; shift ;;
    --) shift; break ;;
    -*) echo "Error: Unknown flag: $1" >&2; exit 1 ;;
    *)
      if [[ -z "$DESCRIPTION" ]]; then DESCRIPTION="$1"
      elif [[ -z "$BODY" ]]; then BODY="$1"
      fi
      shift ;;
  esac
done

if [[ -z "$DESCRIPTION" || -z "$BODY" ]]; then
  echo "Usage: open-pr.sh [--board|--agent] <description> <body>" >&2; exit 1
fi

case "$MODE" in
  board) TITLE="chore(board): $DESCRIPTION" ;;
  agent) TITLE="chore(agent): $DESCRIPTION" ;;
  code)
    if [[ -z "${TICKET:-}" ]]; then
      echo "Error: MODE is 'code' but TICKET is not set. Run: export TICKET=EPIC-XX/TN or use --board for grooming or --agent for harness/agent work" >&2; exit 1
    fi
    read -r TYPE SCOPE _ _ < <(bash "$SCRIPT_DIR/read-ticket.sh")
    DESCRIPTION="${DESCRIPTION% \[$TICKET\]}"
    TITLE="$TYPE($SCOPE): $DESCRIPTION [$TICKET]"
    ;;
esac

/opt/homebrew/bin/gh pr create \
  --base main \
  --title "$TITLE" \
  --body "$BODY" \
  --repo nicobc/patos
