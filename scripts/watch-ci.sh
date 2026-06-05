#!/usr/bin/env bash
# Usage: watch-ci.sh <pr-number>
set -euo pipefail

PR="${1:-}"
if [[ -z "$PR" ]]; then
  echo "Usage: watch-ci.sh <pr-number>" >&2; exit 1
fi

sleep 5
/opt/homebrew/bin/gh pr checks "$PR" --repo nicobc/patos --watch
