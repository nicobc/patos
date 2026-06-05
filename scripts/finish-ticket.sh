#!/usr/bin/env bash
# Usage: finish-ticket.sh <pr-number>
# Merges PR and cleans up the local branch. Run after getting approval.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PR="${1:-}"
if [[ -z "$PR" ]]; then
  echo "Usage: finish-ticket.sh <pr-number>" >&2; exit 1
fi

bash "$SCRIPT_DIR/merge-pr.sh" "$PR"
bash "$SCRIPT_DIR/cleanup-branch.sh"
