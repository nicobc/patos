#!/usr/bin/env bash
# Derives branch name from TICKET env var and cuts a branch from origin/main.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

read -r TYPE SCOPE _ _ < <(bash "$SCRIPT_DIR/read-ticket.sh")
BRANCH="$TYPE/$SCOPE"

git fetch origin
git switch -c "$BRANCH" origin/main
echo "Branch: $BRANCH"
