#!/usr/bin/env bash
# Usage: cut-branch.sh [--board|--agent]
# Default: derives branch name from $TICKET (type/scope).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODE="code"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --board) MODE="board"; shift ;;
    --agent) MODE="agent"; shift ;;
    *) echo "Error: Unknown flag: $1" >&2; exit 1 ;;
  esac
done

case "$MODE" in
  board) BRANCH="chore/board" ;;
  agent) BRANCH="chore/agent" ;;
  code)
    read -r TYPE SCOPE _ _ < <(bash "$SCRIPT_DIR/read-ticket.sh")
    BRANCH="$TYPE/$SCOPE"
    ;;
esac

git fetch origin
git switch -c "$BRANCH" origin/main
echo "Branch: $BRANCH"
