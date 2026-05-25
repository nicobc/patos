-- The trigger function runs as SECURITY INVOKER by default, meaning it executes
-- as the calling role (authenticated). The authenticated role lacks INSERT on
-- task_status_history (no RLS policy, no explicit GRANT), so inserts fail with
-- 42501. SECURITY DEFINER makes it run as its owner (postgres) instead.
create or replace function record_task_status_change() returns trigger
  security definer
  set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into task_status_history(task_id, status) values (new.id, new.status);
  elsif old.status is distinct from new.status then
    insert into task_status_history(task_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$ language plpgsql;
