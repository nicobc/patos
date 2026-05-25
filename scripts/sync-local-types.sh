#!/usr/bin/env bash
set -euo pipefail

supabase db reset
supabase gen types --local 2>/dev/null > app/src/types/database.ts
