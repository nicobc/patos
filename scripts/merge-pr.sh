#!/usr/bin/env bash
# Usage: merge-pr.sh <pr-number>
set -euo pipefail

PR="${1:-}"
if [[ -z "$PR" ]]; then
  echo "Usage: merge-pr.sh <pr-number>" >&2; exit 1
fi

/opt/homebrew/bin/gh pr merge "$PR" --squash --delete-branch --repo nicobc/patos
echo "Merged PR #$PR"
