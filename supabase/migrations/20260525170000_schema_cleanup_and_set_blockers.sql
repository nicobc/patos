-- Drop unused tables introduced in the initial schema but never used by the app.
-- task_spaces first (FK on spaces.id), then spaces.
drop table if exists task_spaces;
drop table if exists spaces;

-- Atomic set_blockers: delete all deps for a task then insert the new set in one
-- transaction, replacing the application-level best-effort restore from T5.
create or replace function set_blockers(p_task_id uuid, p_blocker_ids uuid[])
returns void
language plpgsql
as $$
begin
  delete from task_deps where task_id = p_task_id;
  if cardinality(p_blocker_ids) > 0 then
    insert into task_deps (task_id, depends_on_task_id)
    select p_task_id, unnest(p_blocker_ids);
  end if;
end;
$$;

revoke all on function set_blockers(uuid, uuid[]) from public;
grant execute on function set_blockers(uuid, uuid[]) to authenticated;
