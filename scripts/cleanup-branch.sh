#!/usr/bin/env bash
# Switches to main, pulls, and deletes the local branch derived from TICKET.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

read -r TYPE SCOPE _ _ < <(bash "$SCRIPT_DIR/read-ticket.sh")
BRANCH="$TYPE/$SCOPE"

git switch main
git pull origin main
git branch -D "$BRANCH"
echo "Cleaned up: $BRANCH"
