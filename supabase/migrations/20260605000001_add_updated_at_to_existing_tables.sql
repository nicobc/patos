-- Backfill updated_at on mutable tables for optimistic concurrency support.
-- Existing rows land on the migration timestamp — acceptable for a retrofit.
-- set_updated_at() is defined in 20260605000000_rooms.sql.

alter table projects    add column updated_at timestamptz not null default now();
alter table contractors add column updated_at timestamptz not null default now();
alter table tasks       add column updated_at timestamptz not null default now();

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

create trigger contractors_set_updated_at
  before update on contractors
  for each row execute function set_updated_at();

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();
