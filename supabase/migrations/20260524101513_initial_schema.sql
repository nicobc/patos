-- Initial schema: projects, spaces, contractors, tasks, task_spaces, task_deps
-- test: trigger migration check CI

create table projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table spaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  zone       text check (zone in ('day', 'night')),
  created_at timestamptz not null default now()
);

create table contractors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  created_at timestamptz not null default now()
);

create table tasks (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  project_id            uuid references projects (id),
  owner_id              uuid references auth.users (id),
  contractor_id         uuid references contractors (id),
  expected_cost         numeric(10, 2),
  actual_cost           numeric(10, 2),
  expected_duration_days integer,
  actual_start          date,
  actual_end            date,
  status                text not null default 'ideation'
                          check (status in ('ideation', 'planned', 'ready', 'in_progress', 'done', 'discarded')),
  created_at            timestamptz not null default now()
);

create index tasks_project_id_idx    on tasks (project_id);
create index tasks_owner_id_idx      on tasks (owner_id);
create index tasks_contractor_id_idx on tasks (contractor_id);

create table task_spaces (
  task_id  uuid not null references tasks (id) on delete cascade,
  space_id uuid not null references spaces (id) on delete cascade,
  primary key (task_id, space_id)
);

create index task_spaces_space_id_idx on task_spaces (space_id);

create table task_deps (
  task_id            uuid not null references tasks (id) on delete cascade,
  depends_on_task_id uuid not null references tasks (id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

create index task_deps_depends_on_task_id_idx on task_deps (depends_on_task_id);
