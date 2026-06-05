#!/usr/bin/env bash
# Usage: cleanup-branch.sh
# Switches to main, pulls, and deletes the branch you were just on.
set -euo pipefail

BRANCH=$(git branch --show-current)
git switch main
git pull origin main
git branch -D "$BRANCH"
echo "Cleaned up: $BRANCH"
