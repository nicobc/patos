-- RLS policies: authenticated users have full CRUD; anon is denied.

alter table projects   enable row level security;
alter table spaces     enable row level security;
alter table contractors enable row level security;
alter table tasks      enable row level security;
alter table task_spaces enable row level security;
alter table task_deps  enable row level security;

-- projects
create policy "authenticated full access" on projects
  for all to authenticated using (true) with check (true);

-- spaces
create policy "authenticated full access" on spaces
  for all to authenticated using (true) with check (true);

-- contractors
create policy "authenticated full access" on contractors
  for all to authenticated using (true) with check (true);

-- tasks
create policy "authenticated full access" on tasks
  for all to authenticated using (true) with check (true);

-- task_spaces
create policy "authenticated full access" on task_spaces
  for all to authenticated using (true) with check (true);

-- task_deps
create policy "authenticated full access" on task_deps
  for all to authenticated using (true) with check (true);
