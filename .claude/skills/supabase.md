# Supabase

## Type generation

NEVER edit `src/types/database.ts` manually. It is fully generated — hand-edits will be overwritten.

To regenerate after a migration is applied to the linked dev project:
```bash
supabase gen types --linked > app/src/types/database.ts
```

The local CLI must be linked to the dev project (`supabase link`). Docker/local Supabase is not required.

## Migrations

Migration files live in `supabase/migrations/`. Filenames follow the `YYYYMMDDHHmmss_description.sql` convention.

Apply a migration to dev by running the migrate-db GHA workflow (see `.github/workflows/migrate-db.yml`), or with `supabase db push` if authenticated.
