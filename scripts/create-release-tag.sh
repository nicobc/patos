#!/usr/bin/env bash
set -euo pipefail

git fetch origin

YEAR=$(date +%Y)
MONTH=$(date +%m)
PREFIX="v${YEAR}.${MONTH}."

LAST=$(git tag --list "${PREFIX}*" | sed "s/${PREFIX}//" | sort -n | tail -1)
N=${LAST:+$((LAST + 1))}
N=${N:-1}

TAG="${PREFIX}${N}"

echo "Tagging origin/main as ${TAG}"
git tag "${TAG}" origin/main
git push origin "${TAG}"
echo "Done."
