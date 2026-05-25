update tasks set status = 'planned' where status = 'ready';
update task_status_history set status = 'planned' where status = 'ready';

alter table tasks
  drop constraint tasks_status_check,
  add constraint tasks_status_check
    check (status in ('ideation', 'planned', 'in_progress', 'on_hold', 'done', 'discarded'));

alter table task_status_history
  drop constraint task_status_history_status_check,
  add constraint task_status_history_status_check
    check (status in ('ideation', 'planned', 'in_progress', 'on_hold', 'done', 'discarded'));
