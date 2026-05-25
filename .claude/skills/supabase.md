# Supabase

## MUST DO — enforce on every code change without exception

**NEVER EDIT `src/types/database.ts` MANUALLY.** It is fully generated — hand-edits will be overwritten on the next type generation run.

**REGENERATE TYPES AFTER EVERY MIGRATION.** Run `bash scripts/sync-local-types.sh` from the project root. Requires Docker Desktop running and `supabase start` already called. The script resets the local DB, applies all migrations, and writes `app/src/types/database.ts` via `supabase gen types --local`.

**NAME MIGRATION FILES WITH THE `YYYYMMDDHHmmss_description.sql` CONVENTION.** All migration files live in `supabase/migrations/`.

**APPLY MIGRATIONS VIA THE MIGRATE-DB GHA WORKFLOW OR `supabase db push`.** Running migrations locally without pushing to the linked dev project leaves the remote schema out of sync.
