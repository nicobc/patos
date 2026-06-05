#!/usr/bin/env bash
# Starts the Vite dev server. Run from anywhere in the repo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../app"
npm run dev
