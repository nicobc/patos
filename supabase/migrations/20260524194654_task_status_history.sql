-- task_status_history: append-only log of every status transition on a task.
-- Populated exclusively by a trigger on tasks so both users' changes are recorded
-- regardless of which client initiated the update.

create table task_status_history (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references tasks(id) on delete cascade,
  status      text        not null
                check (status in ('ideation', 'planned', 'ready', 'in_progress', 'done', 'discarded')),
  changed_at  timestamptz not null default now()
);

create index task_status_history_task_id_idx on task_status_history(task_id);

create function record_task_status_change() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into task_status_history(task_id, status) values (new.id, new.status);
  elsif old.status is distinct from new.status then
    insert into task_status_history(task_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger task_status_change_trigger
  after insert or update on tasks
  for each row execute function record_task_status_change();
