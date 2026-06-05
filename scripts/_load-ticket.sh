#!/usr/bin/env bash
# Sourced helper — populates $TICKET from env or .current-ticket.
# Do not execute directly.
_LT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${TICKET:-}" ]]; then
  _LT_FILE="$(cd "$_LT_DIR/.." && pwd)/.claude/.current-ticket"
  if [[ -f "$_LT_FILE" ]]; then
    TICKET=$(cat "$_LT_FILE")
    export TICKET
  else
    echo "Error: TICKET not set. Run: export TICKET=EPIC-XX/TN, or run start-ticket.sh first." >&2
    exit 1
  fi
fi
unset _LT_DIR _LT_FILE
