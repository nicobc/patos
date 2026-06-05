#!/usr/bin/env bash
# Usage: push-pr.sh [--board|--agent] <title> <body>
# Pushes HEAD, opens a PR, and watches CI until all checks pass or fail.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

git push origin HEAD
PR_URL=$(bash "$SCRIPT_DIR/open-pr.sh" "$@")
echo "$PR_URL"
PR_NUM="${PR_URL##*/}"
bash "$SCRIPT_DIR/watch-ci.sh" "$PR_NUM"
