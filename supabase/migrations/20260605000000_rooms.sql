-- Rooms feature: global room catalogue, project↔room bridge, task↔room junction.

create table rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_rooms (
  project_id uuid not null references projects (id) on delete cascade,
  room_id    uuid not null references rooms (id) on delete cascade,
  primary key (project_id, room_id)
);

create table task_rooms (
  task_id uuid not null references tasks (id) on delete cascade,
  room_id uuid not null references rooms (id) on delete cascade,
  primary key (task_id, room_id)
);

-- updated_at trigger for rooms
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rooms_set_updated_at
  before update on rooms
  for each row execute function set_updated_at();

-- RLS
alter table rooms         enable row level security;
alter table project_rooms enable row level security;
alter table task_rooms    enable row level security;

create policy "authenticated full access" on rooms
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on project_rooms
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on task_rooms
  for all to authenticated using (true) with check (true);
