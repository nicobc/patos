-- REPLICA IDENTITY FULL: ensures DELETE events include the full old row so
-- Supabase realtime can evaluate RLS policies and payload.old is complete.
alter table projects    replica identity full;
alter table spaces      replica identity full;
alter table contractors replica identity full;
alter table tasks       replica identity full;
alter table task_spaces replica identity full;
alter table task_deps   replica identity full;

-- Enable RLS on task_status_history (missed in initial RLS migration).
-- SELECT + INSERT for authenticated: trigger on tasks writes records as the
-- authenticated role, so INSERT must be allowed. No UPDATE/DELETE — immutable log.
alter table task_status_history enable row level security;

create policy "authenticated read" on task_status_history
  for select to authenticated using (true);

create policy "authenticated insert" on task_status_history
  for insert to authenticated with check (true);

-- Add all subscription-backed tables to the supabase_realtime publication.
-- The publication is created empty by Supabase; tables must be added explicitly
-- or no postgres_changes events will fire for any of them.
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table contractors;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_deps;
