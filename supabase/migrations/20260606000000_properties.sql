-- Properties: physical container that owns rooms and projects.
-- Supersedes the global room catalogue and project_rooms bridge from the T1/T2 implementation.

create table properties (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger properties_set_updated_at
  before update on properties
  for each row execute function set_updated_at();

alter table properties enable row level security;

create policy "authenticated full access" on properties
  for all to authenticated using (true) with check (true);

-- Scope rooms to a property (cascade: deleting a property deletes its rooms)
alter table rooms
  add column property_id uuid not null references properties(id) on delete cascade;

-- Scope projects to a property (restrict: cannot delete a property with live projects)
alter table projects
  add column property_id uuid not null references properties(id) on delete restrict;

-- project_rooms is superseded by project → property → rooms
drop table project_rooms;
