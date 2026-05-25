# Supabase

## MUST DO — enforce on every code change without exception

**NEVER EDIT `src/types/database.ts` MANUALLY.** It is fully generated — hand-edits will be overwritten on the next type generation run.

**REGENERATE TYPES AFTER EVERY MIGRATION APPLIED TO DEV.** Run `supabase gen types --linked > app/src/types/database.ts`. The CLI must be linked to the dev project (`supabase link`). Docker/local Supabase is not required.

**NAME MIGRATION FILES WITH THE `YYYYMMDDHHmmss_description.sql` CONVENTION.** All migration files live in `supabase/migrations/`.

**APPLY MIGRATIONS VIA THE MIGRATE-DB GHA WORKFLOW OR `supabase db push`.** Running migrations locally without pushing to the linked dev project leaves the remote schema out of sync.
